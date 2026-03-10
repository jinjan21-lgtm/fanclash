'use client';
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

export default function DonationGoal({ widget }: { widget: Widget }) {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [milestones, setMilestones] = useState<{ amount: number; mission: string }[]>([]);
  const [justReached, setJustReached] = useState<number | null>(null);
  const prevAmountRef = useRef(0);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      const prev = prevAmountRef.current;
      setCurrentAmount(data.current_amount);
      setMilestones(data.milestones);
      prevAmountRef.current = data.current_amount;
      for (const m of data.milestones) {
        if (prev < m.amount && data.current_amount >= m.amount) {
          setJustReached(m.amount);
          setTimeout(() => setJustReached(null), 4000);
        }
      }
    };
    socket.on('goal:update', handler);
    return () => { socket.off('goal:update', handler); };
  }, [socketRef.current]);

  const maxMilestone = milestones.length > 0 ? milestones[milestones.length - 1].amount : 100000;
  const percentage = Math.min((currentAmount / maxMilestone) * 100, 100);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <div className={`p-4 rounded-xl ${theme.card} border ${theme.border}`}>
        <div className="flex justify-between mb-2">
          <span className={`font-bold ${theme.text}`}>도네 목표</span>
          <span className={`font-bold ${theme.accent}`}>{currentAmount.toLocaleString()}원</span>
        </div>
        <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${theme.highlight} rounded-full`}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
          {milestones.map((m) => (
            <div key={m.amount}
              className="absolute top-0 h-full w-0.5 bg-white/30"
              style={{ left: `${(m.amount / maxMilestone) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-3 space-y-1">
          {milestones.map((m) => (
            <div key={m.amount} className={`flex justify-between text-sm ${
              currentAmount >= m.amount ? 'text-green-400' : 'text-gray-500'
            }`}>
              <span>{currentAmount >= m.amount ? '✅' : '⬜'} {m.mission}</span>
              <span>{m.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      </div>
      {justReached && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          className="fixed inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-2xl font-bold text-yellow-400">목표 달성!</p>
            <p className={`text-xl ${theme.text}`}>
              {milestones.find(m => m.amount === justReached)?.mission}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
