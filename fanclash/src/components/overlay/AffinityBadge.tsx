'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];

export default function AffinityBadge({ widget }: { widget: Widget }) {
  const [levelUp, setLevelUp] = useState<{ nickname: string; level: number; title: string } | null>(null);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      setLevelUp(data);
      setTimeout(() => setLevelUp(null), 4000);
    };
    socket.on('affinity:levelup', handler);
    return () => { socket.off('affinity:levelup', handler); };
  }, [socketRef.current]);

  return (
    <div className={`${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2">
            <div className={`px-8 py-4 rounded-2xl ${theme.card} border ${theme.border} text-center shadow-xl`}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: 2 }} className="text-4xl mb-2">
                {LEVEL_EMOJIS[levelUp.level] || '💎'}
              </motion.div>
              <p className={`font-bold text-lg ${theme.accent}`}>레벨 업!</p>
              <p className={`text-xl font-bold ${theme.text}`}>{levelUp.nickname}</p>
              <p className={`text-lg ${theme.accent}`}>{levelUp.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
