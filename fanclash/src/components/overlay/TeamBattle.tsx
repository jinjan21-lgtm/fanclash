'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const TEAM_COLORS = [
  { bar: 'bg-gradient-to-r from-red-600 to-red-400', glow: 'shadow-red-500/40' },
  { bar: 'bg-gradient-to-r from-blue-600 to-blue-400', glow: 'shadow-blue-500/40' },
  { bar: 'bg-gradient-to-r from-green-600 to-green-400', glow: 'shadow-green-500/40' },
  { bar: 'bg-gradient-to-r from-yellow-600 to-yellow-400', glow: 'shadow-yellow-500/40' },
];

const TEAM_EMOJIS = ['🔴', '🔵', '🟢', '🟡'];

export default function TeamBattle({ widget }: { widget: Widget }) {
  const [teams, setTeams] = useState<Record<number, { total: number; members: any[] }>>({});
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [prevTotals, setPrevTotals] = useState<Record<number, number>>({});
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      // Detect which team just got a donation
      const newTeams = data.teams as Record<number, { total: number; members: any[] }>;
      for (const [idx, team] of Object.entries(newTeams)) {
        const prev = prevTotals[Number(idx)] || 0;
        if (team.total > prev) {
          setFlashIdx(Number(idx));
          setTimeout(() => setFlashIdx(null), 800);
        }
      }
      const totals: Record<number, number> = {};
      for (const [idx, team] of Object.entries(newTeams)) {
        totals[Number(idx)] = team.total;
      }
      setPrevTotals(totals);
      setTeams(newTeams);
      setTeamNames(data.battle.team_names || []);
    };
    socket.on('team_battle:update', handler);
    return () => { socket.off('team_battle:update', handler); };
  }, [socketRef.current, prevTotals]);

  const maxTotal = Math.max(...Object.values(teams).map(t => t.total || 1), 1);
  const totalAll = Object.values(teams).reduce((sum, t) => sum + (t.total || 0), 0);

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl ${theme.card} border ${theme.border} backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-5">
          <motion.p
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={`text-xl font-bold ${theme.text}`}
          >
            🗳️ 팬 투표
          </motion.p>
          {totalAll > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm ${theme.accent}`}
            >
              총 {totalAll.toLocaleString()}원
            </motion.span>
          )}
        </div>

        <AnimatePresence>
          <div className="space-y-4">
            {Object.entries(teams).map(([idx, team]) => {
              const i = Number(idx);
              const pct = totalAll > 0 ? ((team.total || 0) / totalAll * 100).toFixed(1) : '0';
              const isLeading = team.total === maxTotal && team.total > 0;
              const color = TEAM_COLORS[i] || TEAM_COLORS[0];

              return (
                <motion.div
                  key={idx}
                  layout
                  initial={{ opacity: 0, x: -30 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    scale: flashIdx === i ? [1, 1.03, 1] : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                >
                  <div className="flex justify-between mb-1.5">
                    <span className={`font-bold ${isLeading ? theme.accent : theme.text} flex items-center gap-2`}>
                      {TEAM_EMOJIS[i] || '⚪'} {teamNames[i] || `팀 ${i + 1}`}
                      {isLeading && (
                        <motion.span
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="text-yellow-400"
                        >
                          👑
                        </motion.span>
                      )}
                    </span>
                    <span className={`font-bold ${theme.accent}`}>
                      {(team.total || 0).toLocaleString()}원
                      <span className="text-xs ml-1 opacity-60">({pct}%)</span>
                    </span>
                  </div>
                  <div className={`h-8 bg-gray-800/60 rounded-full overflow-hidden ${isLeading ? `shadow-lg ${color.glow}` : ''}`}>
                    <motion.div
                      className={`h-full rounded-full ${color.bar}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${((team.total || 0) / maxTotal) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                    />
                  </div>
                  {/* Member count */}
                  <div className="mt-1 text-xs text-gray-500">
                    참여 {team.members?.length || 0}명
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
