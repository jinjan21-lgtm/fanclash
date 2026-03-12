import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { TeamBattleManager, activeTeamBattles } from '../services/team-battle-store';

export function handleTeamBattle(io: Server, socket: Socket, supabase: SupabaseClient) {
  socket.on('team_battle:create' as any, async (data: {
    streamer_id: string;
    team_count: number;
    team_names: string[];
    time_limit: number;
  }) => {
    const { streamer_id, team_count, team_names, time_limit } = data;
    const { data: battle } = await supabase.from('team_battles')
      .insert({ streamer_id, team_count, team_names, time_limit, status: 'recruiting' })
      .select().single();

    if (battle) {
      const tbm = new TeamBattleManager(battle.id, team_count, time_limit);
      activeTeamBattles.set(battle.id, tbm);
      io.to(`streamer:${streamer_id}`).emit('team_battle:update', {
        battle,
        teams: tbm.getTeamsData(),
      });
    }
  });

  socket.on('team_battle:start' as any, async (battle_id: string) => {
    const tbm = activeTeamBattles.get(battle_id);
    if (!tbm) return;

    tbm.start();
    await supabase.from('team_battles').update({ status: 'active' }).eq('id', battle_id);

    const { data: battle } = await supabase.from('team_battles').select().eq('id', battle_id).single();
    if (battle) {
      io.to(`streamer:${battle.streamer_id}`).emit('team_battle:update', {
        battle,
        teams: tbm.getTeamsData(),
      });

      // Auto-finish timer
      setTimeout(async () => {
        if (tbm.getStatus() !== 'active') return;
        const winningTeam = tbm.finish();
        await supabase.from('team_battles')
          .update({ status: 'finished', winning_team: winningTeam })
          .eq('id', battle_id);
        io.to(`streamer:${battle.streamer_id}`).emit('team_battle:finished', {
          winning_team: winningTeam,
          team_names: battle.team_names,
        });
        activeTeamBattles.delete(battle_id);
      }, tbm.getTimeLimit() * 1000);
    }
  });

  socket.on('team_battle:cancel' as any, async (battle_id: string) => {
    const tbm = activeTeamBattles.get(battle_id);
    if (!tbm) return;

    tbm.cancel();
    await supabase.from('team_battles').update({ status: 'cancelled' }).eq('id', battle_id);
    activeTeamBattles.delete(battle_id);

    const { data: battle } = await supabase.from('team_battles').select().eq('id', battle_id).single();
    if (battle) {
      io.to(`streamer:${battle.streamer_id}`).emit('team_battle:update', {
        battle,
        teams: {},
      });
    }
  });
}
