'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { themes } from '@/lib/themes';
import { playSound } from '@/lib/sound';
import type { Widget } from '@/types';

export default function EventTimer({ widget }: { widget: Widget }) {
  const config = widget.config as Record<string, unknown>;
  const totalSeconds = (config.duration as number) || 600;
  const eventTitle = (config.eventTitle as string) || '이벤트';
  const penalty = (config.penalty as string) || '';
  const theme = themes[widget.theme];

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    // Listen for timer control via BroadcastChannel (dashboard sends commands)
    const bc = new BroadcastChannel('fanclash-timer');
    bc.onmessage = (e) => {
      if (e.data.widgetId !== widget.id) return;
      if (e.data.action === 'start') {
        setTimeLeft(e.data.duration || totalSeconds);
        setRunning(true);
        setFinished(false);
      }
      if (e.data.action === 'stop') {
        setRunning(false);
      }
      if (e.data.action === 'reset') {
        setRunning(false);
        setFinished(false);
        setTimeLeft(e.data.duration || totalSeconds);
      }
    };
    return () => bc.close();
  }, [widget.id, totalSeconds]);

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setRunning(false);
          setFinished(true);
          playSound((config.soundUrl as string) || undefined);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running, timeLeft, config.soundUrl]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;
  const isUrgent = running && timeLeft <= 30;

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-2xl ${theme.card} border-2 ${
          finished ? 'border-red-500' : isUrgent ? 'border-orange-500' : theme.border
        } text-center relative overflow-hidden`}
      >
        {/* Progress background */}
        <motion.div
          className={`absolute inset-0 opacity-10 ${finished ? 'bg-red-500' : theme.highlight}`}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
          style={{ originX: 0 }}
        />

        {/* Urgent pulse */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 bg-red-500/10"
            animate={{ opacity: [0, 0.2, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}

        <div className="relative">
          <p className={`text-lg font-bold mb-2 ${theme.accent}`}>{eventTitle}</p>

          {/* Timer display */}
          <motion.div
            className={`text-6xl font-mono font-bold tabular-nums ${
              finished ? 'text-red-400' : isUrgent ? 'text-orange-400' : theme.text
            }`}
            animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </motion.div>

          {/* Penalty text */}
          {penalty && (
            <motion.p
              animate={running ? { opacity: [0.5, 1, 0.5] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              className={`mt-3 text-sm ${theme.accent}`}
            >
              🎯 {penalty}
            </motion.p>
          )}

          {/* Finished */}
          <AnimatePresence>
            {finished && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="mt-4"
              >
                <motion.span
                  animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-4xl inline-block"
                >
                  ⏰
                </motion.span>
                <p className="text-red-400 font-bold text-xl mt-2">시간 종료!</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
