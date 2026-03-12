'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { themes } from '@/lib/themes';
import { playSound } from '@/lib/sound';
import { getSocket } from '@/lib/socket/client';
import type { Widget } from '@/types';

/* ── Flip Digit Component ── */
function FlipDigit({ digit, color }: { digit: string; color: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={digit}
        initial={{ rotateX: -90, opacity: 0, scaleY: 0.5 }}
        animate={{ rotateX: 0, opacity: 1, scaleY: 1 }}
        exit={{ rotateX: 90, opacity: 0, scaleY: 0.5 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, duration: 0.4 }}
        className={`inline-block ${color}`}
        style={{ perspective: '200px', transformStyle: 'preserve-3d', display: 'inline-block', minWidth: '0.65em', textAlign: 'center' }}
      >
        {digit}
      </motion.span>
    </AnimatePresence>
  );
}

/* ── Confetti Particle ── */
function ConfettiParticle({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * 360;
  const distance = 80 + Math.random() * 120;
  const rad = (angle * Math.PI) / 180;
  const x = Math.cos(rad) * distance;
  const y = Math.sin(rad) * distance;
  const colors = ['#ff0000', '#ff6600', '#ffcc00', '#00ff88', '#00aaff', '#ff00ff', '#ff3399', '#ffff00'];
  const color = colors[index % colors.length];
  const size = 4 + Math.random() * 6;
  const rotation = Math.random() * 720 - 360;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{ x, y, opacity: 0, scale: 0, rotate: rotation }}
      transition={{ duration: 1.2 + Math.random() * 0.8, ease: 'easeOut' }}
      className="absolute left-1/2 top-1/2 rounded-sm"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
    />
  );
}

/* ── Spark Particle (urgent mode) ── */
function SparkParticle({ index }: { index: number }) {
  const angle = Math.random() * 360;
  const rad = (angle * Math.PI) / 180;
  const distance = 40 + Math.random() * 80;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: Math.cos(rad) * distance,
        y: Math.sin(rad) * distance,
        opacity: 0,
        scale: 0,
      }}
      transition={{ duration: 0.6 + Math.random() * 0.4, ease: 'easeOut' }}
      className="absolute left-1/2 top-1/2 rounded-full"
      style={{
        width: 3,
        height: 3,
        backgroundColor: index % 2 === 0 ? '#ff4444' : '#ff8800',
        marginLeft: -1.5,
        marginTop: -1.5,
      }}
    />
  );
}

/* ── Progress Ring (SVG) ── */
function ProgressRing({ progress, isUrgent, finished }: { progress: number; isUrgent: boolean; finished: boolean }) {
  const radius = 90;
  const stroke = 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const strokeColor = finished ? '#ef4444' : isUrgent ? '#f97316' : undefined;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <svg width="200" height="200" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          stroke="currentColor"
          className="text-white/10"
          strokeWidth={stroke}
          fill="none"
        />
        {/* Progress ring */}
        <motion.circle
          cx="100"
          cy="100"
          r={radius}
          stroke={strokeColor || '#a855f7'}
          strokeWidth={stroke + 1}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
        {/* Glow effect on progress head */}
        {progress > 0 && !finished && (
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke={strokeColor || '#a855f7'}
            strokeWidth={stroke + 3}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{
              strokeDashoffset: dashOffset,
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              strokeDashoffset: { duration: 0.5, ease: 'easeInOut' },
              opacity: { repeat: Infinity, duration: 1.5 },
            }}
            style={{ filter: 'blur(3px)' }}
          />
        )}
      </svg>
    </div>
  );
}

export default function EventTimer({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const config = widget.config as Record<string, unknown>;
  const totalSeconds = (config.duration as number) || 600;
  const eventTitle = (config.eventTitle as string) || '이벤트';
  const penalty = (config.penalty as string) || '';
  const theme = themes[widget.theme];

  // Donation integration config
  const donationMode = (config.donationMode as string) || 'none';
  const donationAmountPer = (config.donationAmountPer as number) || 1000;
  const donationTimeChange = (config.donationTimeChange as number) || 30;
  const autoStartGoal = (config.autoStartGoal as number) || 50000;

  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sparkKeys, setSparkKeys] = useState<number[]>([]);
  const sparkCounter = useRef(0);
  const [accumulated, setAccumulated] = useState(0); // For auto_start mode

  useEffect(() => {
    // Listen for timer control via BroadcastChannel (dashboard sends commands)
    const bc = new BroadcastChannel('fanclash-timer');
    bc.onmessage = (e) => {
      if (e.data.widgetId !== widget.id) return;
      if (e.data.action === 'start') {
        setTimeLeft(e.data.duration || totalSeconds);
        setRunning(true);
        setFinished(false);
        setAccumulated(0);
      }
      if (e.data.action === 'stop') {
        setRunning(false);
      }
      if (e.data.action === 'reset') {
        setRunning(false);
        setFinished(false);
        setTimeLeft(e.data.duration || totalSeconds);
        setAccumulated(0);
      }
    };
    return () => bc.close();
  }, [widget.id, totalSeconds]);

  // Donation integration via Socket.IO
  useEffect(() => {
    if (donationMode === 'none' || preview) return;

    const socket = getSocket();
    socket.emit('widget:subscribe' as any, widget.id);

    const handler = (data: { amount: number }) => {
      const amount = data.amount;

      if (donationMode === 'add') {
        const units = Math.floor(amount / donationAmountPer);
        if (units > 0) {
          setTimeLeft(t => t + units * donationTimeChange);
          // Auto-start if not running
          setRunning(true);
          setFinished(false);
        }
      } else if (donationMode === 'subtract') {
        const units = Math.floor(amount / donationAmountPer);
        if (units > 0) {
          setTimeLeft(t => Math.max(0, t - units * donationTimeChange));
        }
      } else if (donationMode === 'auto_start') {
        setAccumulated(prev => {
          const newVal = prev + amount;
          if (newVal >= autoStartGoal) {
            setTimeLeft(totalSeconds);
            setRunning(true);
            setFinished(false);
            return 0;
          }
          return newVal;
        });
      }
    };

    socket.on('donation:new', handler);
    return () => {
      socket.off('donation:new', handler);
    };
  }, [widget.id, donationMode, donationAmountPer, donationTimeChange, autoStartGoal, totalSeconds, preview]);

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
  const isIdle = !running && !finished && timeLeft === totalSeconds;

  // Spawn spark particles in urgent mode
  useEffect(() => {
    if (!isUrgent) return;
    const interval = setInterval(() => {
      sparkCounter.current += 1;
      setSparkKeys(prev => [...prev.slice(-10), sparkCounter.current]);
    }, 300);
    return () => clearInterval(interval);
  }, [isUrgent]);

  const minStr = String(minutes).padStart(2, '0');
  const secStr = String(seconds).padStart(2, '0');

  const digitColor = finished ? 'text-red-400' : isUrgent ? 'text-orange-400' : theme.text;

  // Confetti particles array for finished state
  const confettiParticles = useMemo(() => Array.from({ length: 20 }, (_, i) => i), []);

  // Urgent pulse frequency increases as time runs out
  const urgentPulseDuration = isUrgent ? Math.max(0.2, timeLeft / 30 * 0.8) : 0.8;

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      {/* Idle breathing wrapper */}
      <motion.div
        animate={
          isIdle
            ? { scale: [1, 1.015, 1], opacity: [0.85, 1, 0.85] }
            : { scale: 1, opacity: 1 }
        }
        transition={isIdle ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : {}}
      >
        {/* Running glow ring */}
        <div className="relative">
          {running && !isUrgent && (
            <motion.div
              className="absolute -inset-1 rounded-2xl opacity-40"
              style={{
                background: `conic-gradient(from 0deg, transparent, ${
                  widget.theme === 'girlcam' ? '#ec4899' : widget.theme === 'game' ? '#06b6d4' : '#a855f7'
                }, transparent)`,
              }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
            />
          )}

          {/* Urgent glow ring - faster, red */}
          {isUrgent && (
            <motion.div
              className="absolute -inset-1 rounded-2xl"
              style={{
                background: `conic-gradient(from 0deg, transparent, #ef4444, #ff6600, transparent)`,
              }}
              animate={{ rotate: 360, opacity: [0.4, 0.8, 0.4] }}
              transition={{
                rotate: { repeat: Infinity, duration: 1, ease: 'linear' },
                opacity: { repeat: Infinity, duration: urgentPulseDuration },
              }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 rounded-2xl ${theme.card} border-2 ${
              finished ? 'border-red-500' : isUrgent ? 'border-orange-500' : theme.border
            } text-center relative overflow-hidden`}
          >
            {/* Progress background fill */}
            <motion.div
              className={`absolute inset-0 opacity-10 ${finished ? 'bg-red-500' : theme.highlight}`}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              style={{ originX: 0 }}
            />

            {/* Urgent heartbeat pulse overlay */}
            {isUrgent && (
              <motion.div
                className="absolute inset-0 bg-red-500/10"
                animate={{ opacity: [0, 0.3, 0] }}
                transition={{ repeat: Infinity, duration: urgentPulseDuration }}
              />
            )}

            {/* Urgent red pulsing border overlay */}
            {isUrgent && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-red-500 pointer-events-none"
                animate={{ opacity: [0, 1, 0], scale: [1, 1.02, 1] }}
                transition={{ repeat: Infinity, duration: urgentPulseDuration }}
              />
            )}

            {/* Screen flash on finish */}
            <AnimatePresence>
              {finished && (
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                  className="absolute inset-0 bg-white z-10 pointer-events-none"
                />
              )}
            </AnimatePresence>

            {/* Progress Ring */}
            <ProgressRing progress={progress} isUrgent={isUrgent} finished={finished} />

            <div className="relative z-20">
              <p className={`text-lg font-bold mb-2 ${theme.accent}`}>{eventTitle}</p>

              {/* Timer display with flip digits */}
              <motion.div
                className="text-6xl font-mono font-bold tabular-nums inline-flex items-center justify-center"
                animate={
                  isUrgent
                    ? { x: [0, -2, 2, -1, 1, 0], y: [0, 1, -1, 0] }
                    : {}
                }
                transition={
                  isUrgent
                    ? { repeat: Infinity, duration: 0.3, ease: 'easeInOut' }
                    : {}
                }
              >
                {/* Minutes */}
                <FlipDigit digit={minStr[0]} color={digitColor} />
                <FlipDigit digit={minStr[1]} color={digitColor} />

                {/* Colon separator with blink */}
                <motion.span
                  className={`mx-1 ${digitColor}`}
                  animate={
                    running
                      ? { opacity: [1, 0.2, 1] }
                      : { opacity: 1 }
                  }
                  transition={
                    running
                      ? { repeat: Infinity, duration: 1, ease: 'linear' }
                      : {}
                  }
                >
                  :
                </motion.span>

                {/* Seconds */}
                <FlipDigit digit={secStr[0]} color={digitColor} />
                <FlipDigit digit={secStr[1]} color={digitColor} />
              </motion.div>

              {/* Spark particles in urgent mode */}
              {isUrgent && (
                <div className="relative h-0">
                  <AnimatePresence>
                    {sparkKeys.map((key) => (
                      <SparkParticle key={key} index={key} />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Donation mode indicator */}
              {donationMode !== 'none' && (
                <p className="mt-2 text-xs text-gray-500">
                  {donationMode === 'add' && `💰 ${donationAmountPer.toLocaleString()}원당 +${donationTimeChange}초`}
                  {donationMode === 'subtract' && `💰 ${donationAmountPer.toLocaleString()}원당 -${donationTimeChange}초`}
                  {donationMode === 'auto_start' && (
                    running
                      ? '⏱️ 타이머 진행 중'
                      : `💰 ${autoStartGoal.toLocaleString()}원 모이면 시작 (${accumulated.toLocaleString()}원)`
                  )}
                </p>
              )}

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

              {/* Finished state - explosive */}
              <AnimatePresence>
                {finished && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="mt-4 relative"
                  >
                    {/* Confetti burst */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {confettiParticles.map((i) => (
                        <ConfettiParticle key={i} index={i} total={confettiParticles.length} />
                      ))}
                    </div>

                    {/* Spinning clock emoji */}
                    <motion.span
                      initial={{ rotate: 0, scale: 0 }}
                      animate={{ rotate: [0, 1080], scale: [0, 1.5, 1] }}
                      transition={{
                        rotate: { duration: 1.2, ease: 'easeOut' },
                        scale: { duration: 1.2, ease: 'easeOut' },
                      }}
                      className="text-4xl inline-block"
                    >
                      ⏰
                    </motion.span>

                    {/* Dramatic slam text */}
                    <motion.p
                      initial={{ scale: 3, opacity: 0, y: -20 }}
                      animate={{ scale: [3, 0.9, 1.1, 1], opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.6,
                        delay: 0.3,
                        scale: { type: 'spring', stiffness: 400, damping: 10, duration: 0.8 },
                      }}
                      className="text-red-400 font-bold text-xl mt-2"
                    >
                      시간 종료!
                    </motion.p>

                    {/* Expanding ring burst */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ scale: 3, opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-red-400 pointer-events-none"
                    />
                    <motion.div
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 4, opacity: 0 }}
                      transition={{ duration: 1.2, delay: 0.15 }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-orange-400 pointer-events-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
