import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAffinity } from '../services/affinity';

// Rate limiting: max 30 donations per minute per streamer
const rateLimits = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60_000; // 1 minute

function checkRateLimit(streamerId: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(streamerId);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(streamerId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimits) {
    if (now > val.resetAt) rateLimits.delete(key);
  }
}, 300_000);

// Direct handler for HTTP-triggered donations (no socket context)
export async function handleDonationDirect(
  io: Server,
  supabase: SupabaseClient,
  data: { streamer_id: string; fan_nickname: string; amount: number; message?: string }
) {
  const { streamer_id, fan_nickname, amount, message } = data;
  if (!streamer_id || !fan_nickname || typeof amount !== 'number' || amount <= 0 || amount > 100_000_000) return;
  if (fan_nickname.length > 50 || (message && message.length > 500)) return;
  if (!checkRateLimit(streamer_id)) return;
  await processDonation(io, supabase, streamer_id, fan_nickname, amount, message);
}

async function processDonation(
  io: Server,
  supabase: SupabaseClient,
  streamer_id: string,
  fan_nickname: string,
  amount: number,
  message?: string
) {
  const room = `streamer:${streamer_id}`;

  // 1. Save donation
  await supabase.from('donations').insert({ streamer_id, fan_nickname, amount, message: message || '' });

  // 2. Update fan profile
  const { data: existing } = await supabase
    .from('fan_profiles')
    .select('*')
    .eq('streamer_id', streamer_id)
    .eq('nickname', fan_nickname)
    .single();

  const newTotal = (existing?.total_donated || 0) + amount;
  const oldLevel = existing?.affinity_level || 0;
  const affinity = calculateAffinity(newTotal);

  if (existing) {
    await supabase.from('fan_profiles')
      .update({ total_donated: newTotal, affinity_level: affinity.level, title: affinity.title, updated_at: new Date().toISOString() })
      .eq('id', existing.id);
  } else {
    await supabase.from('fan_profiles')
      .insert({ streamer_id, nickname: fan_nickname, total_donated: newTotal, affinity_level: affinity.level, title: affinity.title });
  }

  // 3. Emit new donation
  io.to(room).emit('donation:new', { id: '', streamer_id, fan_nickname, amount, message: message || '', created_at: new Date().toISOString() });

  // 4. Get updated rankings
  const { data: allProfiles } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated')
    .eq('streamer_id', streamer_id)
    .order('total_donated', { ascending: false })
    .limit(10);

  const rankings = (allProfiles || []).map(d => ({ nickname: d.nickname, total: d.total_donated }));

  // 5. Check throne change
  if (rankings.length >= 1 && rankings[0].nickname === fan_nickname && existing) {
    const { data: prevTop } = await supabase
      .from('fan_profiles')
      .select('nickname')
      .eq('streamer_id', streamer_id)
      .order('total_donated', { ascending: false })
      .limit(2);

    if (prevTop && prevTop.length >= 2) {
      const secondPlace = prevTop[1]?.nickname;
      if (secondPlace && secondPlace !== fan_nickname) {
        io.to(room).emit('throne:change', { previous: secondPlace, current: fan_nickname, count: 0 });
      }
    }
  }

  // 6. Emit ranking update
  io.to(room).emit('ranking:update', { rankings: rankings as any, period: 'total' });

  // 7. Check affinity level up
  if (affinity.level > oldLevel) {
    io.to(room).emit('affinity:levelup', { nickname: fan_nickname, level: affinity.level, title: affinity.title });
  }

  // 8. Update donation goal
  const { data: goal } = await supabase
    .from('donation_goals')
    .select('*')
    .eq('streamer_id', streamer_id)
    .eq('active', true)
    .single();

  if (goal) {
    const newAmount = goal.current_amount + amount;
    await supabase.from('donation_goals').update({ current_amount: newAmount }).eq('id', goal.id);
    io.to(room).emit('goal:update', { current_amount: newAmount, milestones: goal.milestones });
  }
}

export function handleDonation(io: Server, socket: Socket, supabase: SupabaseClient) {
  socket.on('donation:add' as any, async (data: { streamer_id: string; fan_nickname: string; amount: number; message?: string }) => {
    const { streamer_id, fan_nickname, amount, message } = data;

    if (!streamer_id || !fan_nickname || typeof amount !== 'number' || amount <= 0 || amount > 100_000_000) {
      socket.emit('error', { message: 'Invalid donation data' });
      return;
    }
    if (fan_nickname.length > 50 || (message && message.length > 500)) {
      socket.emit('error', { message: 'Input too long' });
      return;
    }
    if (!checkRateLimit(streamer_id)) {
      socket.emit('error', { message: 'Too many donations. Please slow down.' });
      return;
    }

    await processDonation(io, supabase, streamer_id, fan_nickname, amount, message);
  });
}
