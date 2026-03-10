import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BattleManager } from '../services/battle';

const activeBattles = new Map<string, BattleManager>();

export function handleBattle(io: Server, socket: Socket, supabase: SupabaseClient) {
  socket.on('battle:create' as any, async (data: { streamer_id: string; benefit: string; min_amount: number; time_limit: number }) => {
    const { streamer_id, benefit, min_amount, time_limit } = data;
    const { data: battle } = await supabase.from('battles')
      .insert({ streamer_id, benefit, min_amount, time_limit, status: 'recruiting' })
      .select().single();

    if (battle) {
      activeBattles.set(battle.id, new BattleManager(battle.id, time_limit));
      io.to(`streamer:${streamer_id}`).emit('battle:update', { battle, participants: [] });
    }
  });

  socket.on('battle:join' as any, async (data: { battle_id: string; nickname: string; amount: number }) => {
    const { battle_id, nickname, amount } = data;
    const bm = activeBattles.get(battle_id);
    if (!bm) return;

    bm.addParticipant(nickname, amount);
    await supabase.from('battle_participants').insert({ battle_id, nickname, amount });

    const { data: battle } = await supabase.from('battles').select().eq('id', battle_id).single();
    if (battle) {
      io.to(`streamer:${battle.streamer_id}`).emit('battle:update', { battle, participants: bm.getParticipants() as any });
    }
  });

  socket.on('battle:start' as any, async (battle_id: string) => {
    const bm = activeBattles.get(battle_id);
    if (!bm) return;

    bm.start();
    await supabase.from('battles').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', battle_id);

    const { data: battle } = await supabase.from('battles').select().eq('id', battle_id).single();
    if (battle) {
      io.to(`streamer:${battle.streamer_id}`).emit('battle:update', { battle, participants: bm.getParticipants() as any });

      // Auto-finish timer
      setTimeout(async () => {
        if (bm.getStatus() !== 'active') return;
        const winner = bm.finish();
        await supabase.from('battles')
          .update({ status: 'finished', winner_nickname: winner, finished_at: new Date().toISOString() })
          .eq('id', battle_id);
        io.to(`streamer:${battle.streamer_id}`).emit('battle:finished', { winner, benefit: battle.benefit || '' });
        activeBattles.delete(battle_id);
      }, bm.getTimeLimit() * 1000);
    }
  });

  socket.on('battle:donate' as any, async (data: { battle_id: string; nickname: string; amount: number }) => {
    const { battle_id, nickname, amount } = data;
    const bm = activeBattles.get(battle_id);
    if (!bm) return;

    bm.addDonation(nickname, amount);
    const participant = bm.getParticipants().find(p => p.nickname === nickname);
    if (participant) {
      await supabase.from('battle_participants')
        .update({ amount: participant.amount })
        .eq('battle_id', battle_id)
        .eq('nickname', nickname);
    }

    const { data: battle } = await supabase.from('battles').select().eq('id', battle_id).single();
    if (battle) {
      io.to(`streamer:${battle.streamer_id}`).emit('battle:update', { battle, participants: bm.getParticipants() as any });
    }
  });
}
