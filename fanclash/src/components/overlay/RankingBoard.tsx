'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

interface RankEntry { nickname: string; total: number; }

export default function RankingBoard({ widget }: { widget: Widget }) {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      setRankings(data.rankings.map((r: any) => ({ nickname: r.nickname, total: r.total_donated || r.total })));
    };
    socket.on('ranking:update', handler);
    return () => { socket.off('ranking:update', handler); };
  }, [socketRef.current]);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {rankings.slice(0, 5).map((entry, i) => (
          <motion.div key={entry.nickname}
            layout
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`flex items-center gap-3 mb-2 p-3 rounded-lg ${theme.card} border ${
              i === 0 ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : theme.border
            }`}>
            <span className={`text-2xl font-bold w-8 text-center ${i === 0 ? 'text-yellow-400' : theme.text}`}>
              {i === 0 ? '👑' : i + 1}
            </span>
            <span className={`flex-1 font-bold ${i === 0 ? 'text-yellow-200' : theme.text}`}>
              {entry.nickname}
            </span>
            <span className={`font-bold ${theme.accent}`}>
              {entry.total.toLocaleString()}원
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
