import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { processDonation } from '../services/donation-processor';

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
