import type { Server } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAffinity } from './affinity';
import { activeBattles } from './battle-store';

/**
 * Unified donation processor — called by both socket handler and integration manager.
 * One donation triggers ALL widget updates.
 */
export async function processDonation(
  io: Server,
  supabase: SupabaseClient,
  streamer_id: string,
  fan_nickname: string,
  amount: number,
  message?: string,
) {
  const room = `streamer:${streamer_id}`;

  // 1. Save donation
  await supabase.from('donations').insert({
    streamer_id,
    fan_nickname,
    amount,
    message: message || '',
  });

  // 2. Update fan profile + affinity
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
      .update({
        total_donated: newTotal,
        affinity_level: affinity.level,
        title: affinity.title,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('fan_profiles')
      .insert({
        streamer_id,
        nickname: fan_nickname,
        total_donated: newTotal,
        affinity_level: affinity.level,
        title: affinity.title,
      });
  }

  // 3. Emit donation:new (alert, messages, roulette, timer listen to this)
  io.to(room).emit('donation:new', {
    id: '',
    streamer_id,
    fan_nickname,
    amount,
    message: message || '',
    created_at: new Date().toISOString(),
  });

  // 4. Emit ranking:update
  const { data: allProfiles } = await supabase
    .from('fan_profiles')
    .select('nickname, total_donated')
    .eq('streamer_id', streamer_id)
    .order('total_donated', { ascending: false })
    .limit(10);

  const rankings = (allProfiles || []).map(d => ({
    nickname: d.nickname,
    total: d.total_donated,
  }));
  io.to(room).emit('ranking:update', { rankings, period: 'total' });

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
        io.to(room).emit('throne:change', {
          previous: secondPlace,
          current: fan_nickname,
          count: 0,
        });
      }
    }
  }

  // 6. Check affinity level up
  if (affinity.level > oldLevel) {
    io.to(room).emit('affinity:levelup', {
      nickname: fan_nickname,
      level: affinity.level,
      title: affinity.title,
    });
  }

  // 7. Update donation goal
  const { data: goal } = await supabase
    .from('donation_goals')
    .select('*')
    .eq('streamer_id', streamer_id)
    .eq('active', true)
    .single();

  if (goal) {
    const newAmount = goal.current_amount + amount;
    await supabase.from('donation_goals').update({ current_amount: newAmount }).eq('id', goal.id);
    io.to(room).emit('goal:update', {
      current_amount: newAmount,
      milestones: goal.milestones,
    });
  }

  // 8. Battle integration — auto-join or add donation to active battle
  await processBattleDonation(io, supabase, streamer_id, fan_nickname, amount);

  console.log(`[Donation] ${fan_nickname} -> ${amount}원 (streamer: ${streamer_id.substring(0, 8)})`);
}

/**
 * If there's an active battle for this streamer, automatically integrate the donation.
 * - recruiting: auto-join as participant (or update existing)
 * - active: add donation to existing participant
 */
async function processBattleDonation(
  io: Server,
  supabase: SupabaseClient,
  streamer_id: string,
  fan_nickname: string,
  amount: number,
) {
  // Find active battle for this streamer
  const { data: battle } = await supabase
    .from('battles')
    .select('*')
    .eq('streamer_id', streamer_id)
    .in('status', ['recruiting', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!battle) return;

  const bm = activeBattles.get(battle.id);
  if (!bm) return;

  const room = `streamer:${streamer_id}`;

  try {
    if (battle.status === 'recruiting') {
      // Check min_amount
      if (amount < battle.min_amount) return;

      // Check if already a participant
      const existingParticipant = bm.getParticipants().find(p => p.nickname === fan_nickname);
      if (existingParticipant) {
        // Already joined — skip (recruiting doesn't allow adding more)
        return;
      }

      bm.addParticipant(fan_nickname, amount);
      await supabase.from('battle_participants').insert({
        battle_id: battle.id,
        nickname: fan_nickname,
        amount,
      });
    } else if (battle.status === 'active') {
      // Only existing participants can add during active battle
      const existingParticipant = bm.getParticipants().find(p => p.nickname === fan_nickname);
      if (!existingParticipant) return;

      bm.addDonation(fan_nickname, amount);
      await supabase.from('battle_participants')
        .update({ amount: existingParticipant.amount })
        .eq('battle_id', battle.id)
        .eq('nickname', fan_nickname);
    }

    // Emit updated battle state
    io.to(room).emit('battle:update', {
      battle,
      participants: bm.getParticipants(),
    });
  } catch (err) {
    console.error('[Donation] Battle integration error:', err);
  }
}
