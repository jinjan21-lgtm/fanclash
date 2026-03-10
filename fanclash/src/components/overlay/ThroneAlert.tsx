'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

export default function ThroneAlert({ widget }: { widget: Widget }) {
  const [alert, setAlert] = useState<{ previous: string; current: string } | null>(null);
  const [throneCount, setThroneCount] = useState(0);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      setAlert({ previous: data.previous, current: data.current });
      setThroneCount(prev => prev + 1);
      setTimeout(() => setAlert(null), 5000);
    };
    socket.on('throne:change', handler);
    return () => { socket.off('throne:change', handler); };
  }, [socketRef.current]);

  return (
    <div className={`${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center">
            <div className={`text-center p-8 rounded-2xl ${theme.card} border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30`}>
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4">👑</motion.div>
              <p className="text-yellow-400 text-xl font-bold mb-2">왕좌 쟁탈!</p>
              <p className={`text-3xl font-bold ${theme.text}`}>
                <span className="text-red-400 line-through">{alert.previous}</span>
                <span className="mx-3">→</span>
                <span className="text-yellow-300">{alert.current}</span>
              </p>
              <p className="text-gray-400 text-sm mt-3">오늘 쟁탈 횟수: {throneCount}회</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
