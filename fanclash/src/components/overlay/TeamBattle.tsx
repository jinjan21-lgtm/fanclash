'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const TEAM_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

export default function TeamBattle({ widget }: { widget: Widget }) {
  const [teams, setTeams] = useState<Record<number, { total: number; members: any[] }>>({});
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      setTeams(data.teams);
      setTeamNames(data.battle.team_names || []);
    };
    socket.on('team_battle:update', handler);
    return () => { socket.off('team_battle:update', handler); };
  }, [socketRef.current]);

  const maxTotal = Math.max(...Object.values(teams).map(t => t.total || 1), 1);

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <div className={`p-6 rounded-2xl ${theme.card} border ${theme.border}`}>
        <p className={`text-xl font-bold mb-4 ${theme.text}`}>⚔️ 팀 대결</p>
        <div className="space-y-3">
          {Object.entries(teams).map(([idx, team]) => (
            <div key={idx}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold ${theme.text}`}>
                  {teamNames[Number(idx)] || `팀 ${Number(idx) + 1}`}
                </span>
                <span className={`font-bold ${theme.accent}`}>{(team.total || 0).toLocaleString()}원</span>
              </div>
              <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${TEAM_COLORS[Number(idx)] || 'bg-gray-500'}`}
                  animate={{ width: `${((team.total || 0) / maxTotal) * 100}%` }}
                  transition={{ type: 'spring' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
