'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';
import { playSound } from '@/lib/sound';

export default function ThroneAlert({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [alert, setAlert] = useState<{ previous: string; current: string } | null>(null);
  const [throneCount, setThroneCount] = useState(0);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];
  const duration = ((widget.config as any)?.alertDuration as number) || 5;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      setAlert({ previous: data.previous, current: data.current });
      setThroneCount(prev => prev + 1);
      playSound((widget.config as any)?.soundUrl);
      setTimeout(() => setAlert(null), duration * 1000);
    };
    socket.on('throne:change', handler);
    return () => { socket.off('throne:change', handler); };
  }, [socketRef.current, duration]);

  // Show demo alert in preview mode
  useEffect(() => {
    if (preview) {
      setAlert({ previous: '밤하늘구름', current: '별빛소나기' });
      setThroneCount(3);
    }
  }, [preview]);

  return (
    <div className={`${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ scale: 0, opacity: 0, rotateY: 90 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0, opacity: 0, rotateY: -90 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="fixed inset-0 flex items-center justify-center"
          >
            {/* Background burst effect */}
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.5 }}
            >
              <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 to-transparent" />
            </motion.div>

            {/* Particle ring */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full bg-yellow-400"
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1, 0],
                  x: Math.cos((i * Math.PI * 2) / 8) * 180,
                  y: Math.sin((i * Math.PI * 2) / 8) * 180,
                  opacity: [1, 1, 0],
                }}
                transition={{ duration: 1.2, delay: 0.1 }}
              />
            ))}

            <div className={`relative text-center p-10 rounded-2xl ${theme.card} border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30`}>
              {/* Crown animation */}
              <motion.div
                animate={{
                  y: [0, -15, 0],
                  rotate: [0, -10, 10, -5, 0],
                  scale: [1, 1.2, 1],
                }}
                transition={{ duration: 1.5, ease: 'easeInOut' }}
                className="text-7xl mb-4"
              >
                👑
              </motion.div>

              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-yellow-400 text-2xl font-bold mb-3"
              >
                왕좌 쟁탈!
              </motion.p>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-3"
              >
                <motion.span
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="text-2xl text-red-400 line-through"
                >
                  {alert.previous}
                </motion.span>
                <motion.span
                  animate={{ x: [0, 5, -5, 0] }}
                  transition={{ repeat: 2, duration: 0.3 }}
                  className="text-3xl"
                >
                  ⚡
                </motion.span>
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-3xl font-bold text-yellow-300"
                >
                  {alert.current}
                </motion.span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="text-gray-400 text-sm mt-4"
              >
                오늘 쟁탈 횟수: {throneCount}회
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
