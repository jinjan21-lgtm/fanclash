'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

interface RankEntry { nickname: string; total: number; }

const RANK_MEDALS = ['👑', '🥈', '🥉'];

export default function RankingBoard({ widget }: { widget: Widget }) {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [flashNick, setFlashNick] = useState<string | null>(null);
  const prevRef = useRef<RankEntry[]>([]);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      const newRankings = data.rankings.map((r: any) => ({
        nickname: r.nickname,
        total: r.total_donated || r.total,
      }));
      // Detect who just donated (amount changed)
      for (const entry of newRankings) {
        const prev = prevRef.current.find(p => p.nickname === entry.nickname);
        if (!prev || entry.total > prev.total) {
          setFlashNick(entry.nickname);
          setTimeout(() => setFlashNick(null), 1200);
          break;
        }
      }
      prevRef.current = newRankings;
      setRankings(newRankings);
    };
    socket.on('ranking:update', handler);
    return () => { socket.off('ranking:update', handler); };
  }, [socketRef.current]);

  const maxDisplay = ((widget.config as any)?.maxDisplay as number) || 5;
  const topAmount = rankings[0]?.total || 1;

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence mode="popLayout">
        {rankings.slice(0, maxDisplay).map((entry, i) => {
          const barWidth = (entry.total / topAmount) * 100;
          const isFlash = flashNick === entry.nickname;

          return (
            <motion.div
              key={entry.nickname}
              layout
              initial={{ opacity: 0, x: -60, scale: 0.8 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: isFlash ? [1, 1.05, 1] : 1,
              }}
              exit={{ opacity: 0, x: 60, scale: 0.8 }}
              transition={{
                layout: { type: 'spring', stiffness: 200, damping: 25 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 },
              }}
              className={`relative flex items-center gap-3 mb-2 p-3 rounded-lg overflow-hidden ${theme.card} border ${
                i === 0
                  ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                  : theme.border
              }`}
            >
              {/* Background bar */}
              <motion.div
                className={`absolute inset-0 opacity-10 ${i === 0 ? 'bg-yellow-400' : theme.highlight}`}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              />

              {/* Rank */}
              <motion.span
                className={`relative text-2xl font-bold w-10 text-center ${i === 0 ? 'text-yellow-400' : theme.text}`}
                animate={i === 0 ? { rotate: [0, -5, 5, 0] } : {}}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              >
                {RANK_MEDALS[i] || i + 1}
              </motion.span>

              {/* Name */}
              <span className={`relative flex-1 font-bold truncate ${
                i === 0 ? 'text-yellow-200 text-lg' : theme.text
              }`}>
                {entry.nickname}
              </span>

              {/* Amount with count-up feel */}
              <motion.span
                className={`relative font-bold tabular-nums ${theme.accent} ${i === 0 ? 'text-lg' : ''}`}
                animate={isFlash ? { scale: [1, 1.3, 1], color: ['', '#facc15', ''] } : {}}
                transition={{ duration: 0.5 }}
              >
                {entry.total.toLocaleString()}원
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
