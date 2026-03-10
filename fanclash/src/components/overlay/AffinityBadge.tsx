'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];
const LEVEL_COLORS = [
  'from-gray-500 to-gray-400',
  'from-yellow-600 to-yellow-400',
  'from-orange-600 to-red-400',
  'from-pink-600 to-pink-400',
  'from-purple-600 to-blue-400',
];

export default function AffinityBadge({ widget }: { widget: Widget }) {
  const [levelUp, setLevelUp] = useState<{ nickname: string; level: number; title: string } | null>(null);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      setLevelUp(data);
      setTimeout(() => setLevelUp(null), 5000);
    };
    socket.on('affinity:levelup', handler);
    return () => { socket.off('affinity:levelup', handler); };
  }, [socketRef.current]);

  return (
    <div className={`${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ y: 120, opacity: 0, scale: 0.5 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -120, opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2"
          >
            {/* Glow ring behind card */}
            <motion.div
              className={`absolute -inset-3 rounded-3xl bg-gradient-to-r ${LEVEL_COLORS[levelUp.level] || LEVEL_COLORS[4]} opacity-30 blur-xl`}
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />

            <div className={`relative px-10 py-6 rounded-2xl ${theme.card} border ${theme.border} text-center shadow-2xl`}>
              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1.5 h-1.5 rounded-full bg-yellow-300"
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: [0, 1, 0],
                    x: (Math.random() - 0.5) * 120,
                    y: (Math.random() - 0.5) * 80,
                    scale: [0, 1.5, 0],
                  }}
                  transition={{ duration: 1.5, delay: i * 0.2, repeat: 1 }}
                />
              ))}

              {/* Level emoji with entrance */}
              <motion.div
                initial={{ rotateY: 180, scale: 0 }}
                animate={{ rotateY: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
                className="text-5xl mb-3"
              >
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, -10, 10, 0] }}
                  transition={{ repeat: 2, duration: 0.8 }}
                  className="inline-block"
                >
                  {LEVEL_EMOJIS[levelUp.level] || '💎'}
                </motion.span>
              </motion.div>

              {/* Level up text */}
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`font-bold text-lg bg-gradient-to-r ${LEVEL_COLORS[levelUp.level] || LEVEL_COLORS[4]} bg-clip-text text-transparent`}
              >
                레벨 업!
              </motion.p>

              {/* Nickname */}
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.45 }}
                className={`text-2xl font-bold mt-1 ${theme.text}`}
              >
                {levelUp.nickname}
              </motion.p>

              {/* Title with badge style */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, delay: 0.6 }}
                className={`inline-block mt-2 px-4 py-1 rounded-full bg-gradient-to-r ${LEVEL_COLORS[levelUp.level] || LEVEL_COLORS[4]}`}
              >
                <span className="text-white font-bold text-sm">{levelUp.title}</span>
              </motion.div>

              {/* Level indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-3 flex justify-center gap-1"
              >
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full ${
                    i <= levelUp.level ? 'bg-yellow-400' : 'bg-gray-600'
                  }`} />
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
