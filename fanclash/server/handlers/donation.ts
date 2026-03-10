import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateAffinity } from '../services/affinity';

export function handleDonation(io: Server, socket: Socket, supabase: SupabaseClient) {
  socket.on('donation:add' as any, async (data: { streamer_id: string; fan_nickname: string; amount: number }) => {
    const { streamer_id, fan_nickname, amount } = data;
    const room = `streamer:${streamer_id}`;

    // 1. Save donation
    await supabase.from('donations').insert({ streamer_id, fan_nickname, amount });

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
    io.to(room).emit('donation:new', { id: '', streamer_id, fan_nickname, amount, created_at: new Date().toISOString() });

    // 4. Get updated rankings
    const { data: allProfiles } = await supabase
      .from('fan_profiles')
      .select('nickname, total_donated')
      .eq('streamer_id', streamer_id)
      .order('total_donated', { ascending: false })
      .limit(10);

    const rankings = (allProfiles || []).map(d => ({ nickname: d.nickname, total: d.total_donated }));

    // 5. Check throne change (was someone else #1 before?)
    if (rankings.length >= 1 && rankings[0].nickname === fan_nickname && existing) {
      // This fan is now #1 - check if they were already #1
      const { data: prevTop } = await supabase
        .from('fan_profiles')
        .select('nickname')
        .eq('streamer_id', streamer_id)
        .order('total_donated', { ascending: false })
        .limit(2);

      if (prevTop && prevTop.length >= 2) {
        // The previous ranking might have had someone else on top
        // Since we already updated, check if #2 was previously #1
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
  });
}
