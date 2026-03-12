'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const DEMO_MILESTONES = [
  { amount: 50000, mission: '치킨 먹방' },
  { amount: 100000, mission: '노래 3곡' },
  { amount: 200000, mission: '코스프레' },
];

export default function DonationGoal({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [milestones, setMilestones] = useState<{ amount: number; mission: string }[]>([]);
  const [justReached, setJustReached] = useState<{ amount: number; mission: string } | null>(null);
  const [amountBump, setAmountBump] = useState(false);
  const prevAmountRef = useRef(0);
  const { socketRef, on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const handler = (data: any) => {
      const prev = prevAmountRef.current;
      setCurrentAmount(data.current_amount);
      setMilestones(data.milestones);
      prevAmountRef.current = data.current_amount;
      setHasData(true);

      // Amount changed — trigger bump
      if (data.current_amount > prev) {
        setAmountBump(true);
        setTimeout(() => setAmountBump(false), 600);
      }

      // Milestone reached
      for (const m of data.milestones) {
        if (prev < m.amount && data.current_amount >= m.amount) {
          setJustReached(m);
          setTimeout(() => setJustReached(null), 5000);
        }
      }
    };
    on('goal:update', handler);
  }, [ready]);

  // Show demo data in preview mode
  useEffect(() => {
    if (preview && !hasData) {
      setCurrentAmount(73000);
      setMilestones(DEMO_MILESTONES);
    }
  }, [preview, hasData]);

  const maxMilestone = milestones.length > 0 ? milestones[milestones.length - 1].amount : 100000;
  const percentage = Math.min((currentAmount / maxMilestone) * 100, 100);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-xl ${theme.card} border ${theme.border} backdrop-blur-sm`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <span className={`font-bold text-lg ${theme.text}`}>
            {(widget.config as any)?.title || '도네 목표'}
          </span>
          <motion.span
            className={`font-bold text-xl ${theme.accent} tabular-nums`}
            animate={amountBump ? { scale: [1, 1.4, 1], y: [0, -5, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            {currentAmount.toLocaleString()}원
          </motion.span>
        </div>

        {/* Progress bar */}
        <div className="relative h-8 bg-gray-800/60 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${theme.highlight} rounded-full relative`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 50, damping: 15 }}
          >
            {/* Shimmer effect on the bar */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'linear' }}
            />
          </motion.div>

          {/* Milestone markers */}
          {milestones.map((m) => (
            <div key={m.amount} className="absolute top-0 h-full flex flex-col items-center"
              style={{ left: `${(m.amount / maxMilestone) * 100}%` }}>
              <div className={`h-full w-0.5 ${currentAmount >= m.amount ? 'bg-green-400/60' : 'bg-white/20'}`} />
            </div>
          ))}

          {/* Percentage text on bar */}
          {percentage > 10 && (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/80">
              {percentage.toFixed(0)}%
            </span>
          )}
        </div>

        {/* Milestones list */}
        <div className="mt-4 space-y-1.5">
          {milestones.map((m, i) => {
            const reached = currentAmount >= m.amount;
            return (
              <motion.div
                key={m.amount}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex justify-between text-sm rounded-lg px-2 py-1 ${
                  reached ? 'bg-green-900/30' : ''
                }`}
              >
                <span className={reached ? 'text-green-400' : 'text-gray-500'}>
                  <motion.span
                    animate={reached ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.3 }}
                    className="inline-block mr-1"
                  >
                    {reached ? '✅' : '⬜'}
                  </motion.span>
                  {m.mission}
                </span>
                <span className={reached ? 'text-green-400 font-bold' : 'text-gray-500'}>
                  {m.amount.toLocaleString()}원
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Milestone celebration popup */}
      <AnimatePresence>
        {justReached && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0, y: -50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
          >
            {/* Confetti particles */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-2 h-2 rounded-full ${
                  ['bg-yellow-400', 'bg-pink-400', 'bg-green-400', 'bg-blue-400'][i % 4]
                }`}
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 300,
                  y: (Math.random() - 0.5) * 300,
                  opacity: 0,
                  scale: [1, 1.5, 0],
                }}
                transition={{ duration: 1.5, delay: Math.random() * 0.3 }}
              />
            ))}

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: 2, duration: 0.6 }}
              className="text-center"
            >
              <motion.div
                animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8 }}
                className="text-7xl mb-3"
              >
                🎉
              </motion.div>
              <p className="text-3xl font-bold text-yellow-400 drop-shadow-lg">목표 달성!</p>
              <p className={`text-2xl mt-2 font-bold ${theme.text} drop-shadow-lg`}>
                {justReached.mission}
              </p>
              <p className={`text-lg mt-1 ${theme.accent}`}>
                {justReached.amount.toLocaleString()}원 돌파!
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
