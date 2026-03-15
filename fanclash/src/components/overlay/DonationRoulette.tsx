'use client';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget, Donation } from '@/types';
import { playSound } from '@/lib/sound';

// ── Types ──────────────────────────────────────────────────────────────────
interface RouletteConfig {
  segments?: string[];
  minAmount?: number;
  soundUrl?: string;
}

type SpinRequest = {
  fan_nickname: string;
  amount: number;
  message?: string;
};

// ── Constants ──────────────────────────────────────────────────────────────
const DEFAULT_SEGMENTS = [
  '노래 한 곡',
  '스쿼트 10개',
  '광고 읽기',
  '팬 선택곡',
  '꽁치킨 약속',
  '2배속 게임',
];

const SEGMENT_COLORS = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#a855f7', // purple-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

const DEMO_SPIN: SpinRequest = {
  fan_nickname: '별빛소나기',
  amount: 10000,
  message: '룰렛 돌려주세요!',
};

const SPIN_DURATION = 5000; // ms
const RESULT_DISPLAY = 6000; // ms
const TOTAL_SPIN_DEG = 360 * 8; // 8 full rotations base

// ── Particle presets ───────────────────────────────────────────────────────
const CONFETTI_COUNT = 28;
const CONFETTI = Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
  id: i,
  angle: (i / CONFETTI_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3,
  radius: 160 + Math.random() * 140,
  size: 5 + Math.random() * 8,
  color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
  delay: Math.random() * 0.3,
  rotation: Math.random() * 720 - 360,
}));

const SPARKLE_STARS = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  angle: (i / 16) * Math.PI * 2,
  radius: 120 + Math.random() * 80,
  delay: Math.random() * 0.5,
  scale: 0.6 + Math.random() * 1.0,
}));

const RING_PARTICLES = Array.from({ length: 36 }, (_, i) => ({
  id: i,
  angle: (i / 36) * Math.PI * 2,
  delay: i * 0.015,
}));

// ── Helpers ────────────────────────────────────────────────────────────────
function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return Number.isInteger(man) ? `${man}만원` : `${man.toFixed(1)}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function DonationRoulette({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const theme = themes[widget.theme];
  const { socketRef, on, ready } = useSocket(widget.id);

  const cfg = widget.config as RouletteConfig;
  const segments = cfg.segments?.length ? cfg.segments : DEFAULT_SEGMENTS;
  const minAmount = cfg.minAmount ?? 5000;
  const segCount = segments.length;

  // State
  const [phase, setPhase] = useState<'idle' | 'spinning' | 'result'>('idle');
  const [rotation, setRotation] = useState(0);
  const [winnerIndex, setWinnerIndex] = useState(-1);
  const [donor, setDonor] = useState<SpinRequest | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [idleAngle, setIdleAngle] = useState(0);

  const queueRef = useRef<SpinRequest[]>([]);
  const busyRef = useRef(false);
  const baseRotRef = useRef(0);

  // Conic-gradient for the wheel
  const conicGradient = useMemo(() => {
    const sliceAngle = 360 / segCount;
    const stops = segments.map((_, i) => {
      const color = SEGMENT_COLORS[i % SEGMENT_COLORS.length];
      const start = i * sliceAngle;
      const end = (i + 1) * sliceAngle;
      return `${color} ${start}deg ${end}deg`;
    });
    return `conic-gradient(from 0deg, ${stops.join(', ')})`;
  }, [segments, segCount]);

  // ── Idle rotation ────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'idle') return;
    let raf: number;
    let start: number | null = null;
    const animate = (ts: number) => {
      if (!start) start = ts;
      setIdleAngle(((ts - start) / 1000) * 8); // 8 deg/sec
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // ── Spin logic ───────────────────────────────────────────────────────────
  const doSpin = useCallback((req: SpinRequest) => {
    busyRef.current = true;
    setDonor(req);
    setShowConfetti(false);

    // Pick random winner
    const idx = Math.floor(Math.random() * segCount);
    setWinnerIndex(idx);

    // Calculate target rotation so winner lands at top (pointer)
    // Pointer is at top → 0deg. Wheel rotates clockwise.
    // Segment center at: idx * sliceAngle + sliceAngle/2
    // We need that segment at the top (0°/360°), rotating clockwise means
    // finalAngle = TOTAL_SPIN_DEG + (360 - (idx * sliceAngle + sliceAngle / 2))
    const sliceAngle = 360 / segCount;
    const targetSegCenter = idx * sliceAngle + sliceAngle / 2;
    const finalDeg = baseRotRef.current + TOTAL_SPIN_DEG + (360 - targetSegCenter);

    setRotation(finalDeg);
    setPhase('spinning');

    // Sound
    playSound(cfg.soundUrl);

    // After spin completes → show result
    setTimeout(() => {
      baseRotRef.current = finalDeg % 360;
      setPhase('result');
      setShowConfetti(true);
      playSound(cfg.soundUrl);

      // Auto-hide result
      setTimeout(() => {
        setPhase('idle');
        setShowConfetti(false);
        setDonor(null);
        setWinnerIndex(-1);

        // Process next in queue
        setTimeout(() => {
          if (queueRef.current.length > 0) {
            const next = queueRef.current.shift()!;
            doSpin(next);
          } else {
            busyRef.current = false;
          }
        }, 500);
      }, RESULT_DISPLAY);
    }, SPIN_DURATION + 200);
  }, [segCount, cfg.soundUrl]);

  const enqueue = useCallback((data: SpinRequest) => {
    if (data.amount < minAmount) return;
    queueRef.current.push(data);
    if (!busyRef.current) {
      const next = queueRef.current.shift()!;
      doSpin(next);
    }
  }, [minAmount, doSpin]);

  // ── Socket listener ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const handler = (data: Donation) => {
      enqueue({ fan_nickname: data.fan_nickname, amount: data.amount, message: data.message });
    };
    on('donation:new', handler);
    // Listen for chain actions
    on('widget:chain-action' as any, (event: { action: string; data: Record<string, unknown> }) => {
      if (event.action === 'roulette:spin') {
        enqueue({
          fan_nickname: (event.data?.winner as string) || '이벤트 체인',
          amount: minAmount,
          message: '자동 룰렛!',
        });
      }
    });
  }, [ready, enqueue, minAmount]);

  // ── Preview mode ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!preview) return;
    enqueue(DEMO_SPIN);
  }, [preview]);

  // ── Render ───────────────────────────────────────────────────────────────
  const wheelSize = 320;
  const halfWheel = wheelSize / 2;
  const sliceAngle = 360 / segCount;

  return (
    <div className={`${theme.bg} ${theme.fontClass} w-full h-full`}>
      <div className="fixed inset-0 flex items-center justify-center">

        {/* ── Idle glow pulse ─────────────────────────────────── */}
        {phase === 'idle' && (
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ width: wheelSize + 60, height: wheelSize + 60 }}
            animate={{
              boxShadow: [
                '0 0 30px 5px rgba(168,85,247,0.15)',
                '0 0 60px 15px rgba(168,85,247,0.3)',
                '0 0 30px 5px rgba(168,85,247,0.15)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* ── Spinning sparkle trail ──────────────────────────── */}
        <AnimatePresence>
          {phase === 'spinning' && (
            <>
              {RING_PARTICLES.map((p) => (
                <motion.div
                  key={`trail-${p.id}`}
                  className="absolute rounded-full pointer-events-none"
                  style={{
                    width: 4,
                    height: 4,
                    background: SEGMENT_COLORS[p.id % SEGMENT_COLORS.length],
                  }}
                  initial={{
                    x: Math.cos(p.angle) * (halfWheel + 20),
                    y: Math.sin(p.angle) * (halfWheel + 20),
                    opacity: 0,
                    scale: 0,
                  }}
                  animate={{
                    x: [
                      Math.cos(p.angle) * (halfWheel + 20),
                      Math.cos(p.angle + Math.PI) * (halfWheel + 40),
                      Math.cos(p.angle + Math.PI * 2) * (halfWheel + 20),
                    ],
                    y: [
                      Math.sin(p.angle) * (halfWheel + 20),
                      Math.sin(p.angle + Math.PI) * (halfWheel + 40),
                      Math.sin(p.angle + Math.PI * 2) * (halfWheel + 20),
                    ],
                    opacity: [0, 1, 0.6, 0],
                    scale: [0, 1.5, 1, 0],
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 2.5,
                    delay: p.delay,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* ── Radial glow burst on result ─────────────────────── */}
        <AnimatePresence>
          {phase === 'result' && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(250,204,21,0.35)_0%,_rgba(168,85,247,0.15)_40%,_transparent_70%)]" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Confetti explosion ───────────────────────────────── */}
        <AnimatePresence>
          {showConfetti && (
            <>
              {CONFETTI.map((c) => (
                <motion.div
                  key={`confetti-${c.id}`}
                  className="absolute rounded-sm pointer-events-none"
                  style={{
                    width: c.size,
                    height: c.size * 1.6,
                    background: c.color,
                  }}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                  animate={{
                    x: Math.cos(c.angle) * c.radius,
                    y: Math.sin(c.angle) * c.radius + 60,
                    opacity: [1, 1, 0],
                    scale: [0, 1.8, 0.5],
                    rotate: c.rotation,
                  }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 1.8,
                    delay: c.delay,
                    ease: 'easeOut',
                  }}
                />
              ))}

              {/* Sparkle stars */}
              {SPARKLE_STARS.map((s) => (
                <motion.div
                  key={`star-${s.id}`}
                  className="absolute text-yellow-300 pointer-events-none select-none"
                  style={{ fontSize: 14 + s.scale * 10 }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 0,
                    scale: 0,
                    rotate: 0,
                  }}
                  animate={{
                    x: Math.cos(s.angle) * s.radius,
                    y: Math.sin(s.angle) * s.radius,
                    opacity: [0, 1, 1, 0],
                    scale: [0, s.scale * 1.5, s.scale, 0],
                    rotate: [0, 360],
                  }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{
                    duration: 1.6,
                    delay: s.delay,
                    ease: 'easeOut',
                  }}
                >
                  ✦
                </motion.div>
              ))}

              {/* Expanding ring */}
              <motion.div
                className="absolute rounded-full border-2 border-yellow-400/60 pointer-events-none"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{
                  width: [0, 500],
                  height: [0, 500],
                  opacity: [1, 0],
                }}
                transition={{ duration: 1.0, ease: 'easeOut' }}
                style={{ marginLeft: -250, marginTop: -250 }}
              />
              <motion.div
                className="absolute rounded-full border-2 border-purple-400/50 pointer-events-none"
                initial={{ width: 0, height: 0, opacity: 1 }}
                animate={{
                  width: [0, 600],
                  height: [0, 600],
                  opacity: [1, 0],
                }}
                transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
                style={{ marginLeft: -300, marginTop: -300 }}
              />
            </>
          )}
        </AnimatePresence>

        {/* ── Wheel container ─────────────────────────────────── */}
        <div className="relative" style={{ width: wheelSize, height: wheelSize }}>

          {/* Outer glow ring */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: wheelSize + 16,
              height: wheelSize + 16,
              top: -8,
              left: -8,
            }}
            animate={
              phase === 'spinning'
                ? {
                    boxShadow: [
                      '0 0 20px 4px rgba(250,204,21,0.4), 0 0 60px 10px rgba(168,85,247,0.3)',
                      '0 0 40px 8px rgba(236,72,153,0.5), 0 0 80px 20px rgba(6,182,212,0.3)',
                      '0 0 20px 4px rgba(250,204,21,0.4), 0 0 60px 10px rgba(168,85,247,0.3)',
                    ],
                  }
                : phase === 'result'
                  ? {
                      boxShadow: [
                        '0 0 40px 10px rgba(250,204,21,0.6), 0 0 100px 30px rgba(250,204,21,0.2)',
                        '0 0 60px 15px rgba(250,204,21,0.4), 0 0 120px 40px rgba(168,85,247,0.2)',
                        '0 0 40px 10px rgba(250,204,21,0.6), 0 0 100px 30px rgba(250,204,21,0.2)',
                      ],
                    }
                  : {}
            }
            transition={{ duration: 0.6, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Wheel */}
          <motion.div
            className="absolute inset-0 rounded-full shadow-2xl"
            style={{
              background: conicGradient,
              border: '4px solid rgba(255,255,255,0.2)',
            }}
            animate={
              phase === 'spinning'
                ? { rotate: rotation }
                : phase === 'result'
                  ? { rotate: rotation }
                  : { rotate: idleAngle }
            }
            transition={
              phase === 'spinning'
                ? {
                    duration: SPIN_DURATION / 1000,
                    ease: [0.15, 0.6, 0.25, 1], // custom deceleration curve
                  }
                : phase === 'idle'
                  ? { duration: 0, ease: 'linear' }
                  : { duration: 0.3 }
            }
          >
            {/* Segment labels */}
            {segments.map((label, i) => {
              const midAngle = (i * sliceAngle + sliceAngle / 2) * (Math.PI / 180);
              const labelRadius = halfWheel * 0.62;
              const lx = Math.sin(midAngle) * labelRadius;
              const ly = -Math.cos(midAngle) * labelRadius;
              const textRotation = i * sliceAngle + sliceAngle / 2;

              return (
                <div
                  key={i}
                  className="absolute pointer-events-none"
                  style={{
                    left: halfWheel + lx,
                    top: halfWheel + ly,
                    transform: `translate(-50%, -50%) rotate(${textRotation}deg)`,
                  }}
                >
                  <span
                    className="text-white font-bold text-xs drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap"
                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.5)' }}
                  >
                    {label.length > 7 ? label.slice(0, 6) + '…' : label}
                  </span>
                </div>
              );
            })}

            {/* Segment divider lines */}
            {segments.map((_, i) => (
              <div
                key={`line-${i}`}
                className="absolute pointer-events-none"
                style={{
                  width: 2,
                  height: halfWheel,
                  background: 'rgba(255,255,255,0.3)',
                  left: halfWheel - 1,
                  top: 0,
                  transformOrigin: `1px ${halfWheel}px`,
                  transform: `rotate(${i * sliceAngle}deg)`,
                }}
              />
            ))}
          </motion.div>

          {/* Center hub */}
          <div
            className="absolute rounded-full bg-gray-900 border-4 border-white/30 shadow-xl flex items-center justify-center z-10"
            style={{
              width: 56,
              height: 56,
              top: halfWheel - 28,
              left: halfWheel - 28,
            }}
          >
            <motion.span
              className="text-2xl"
              animate={
                phase === 'spinning'
                  ? { rotate: [0, 360], scale: [1, 1.2, 1] }
                  : phase === 'result'
                    ? { scale: [1, 1.4, 1], rotate: [0, 20, -20, 0] }
                    : {}
              }
              transition={
                phase === 'spinning'
                  ? { duration: 1, repeat: Infinity, ease: 'linear' }
                  : { duration: 0.6 }
              }
            >
              🎰
            </motion.span>
          </div>

          {/* Pointer / Arrow (fixed at top) */}
          <motion.div
            className="absolute z-20"
            style={{
              top: -18,
              left: halfWheel - 14,
              width: 0,
              height: 0,
              borderLeft: '14px solid transparent',
              borderRight: '14px solid transparent',
              borderTop: '24px solid #facc15',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
            }}
            animate={
              phase === 'result'
                ? { y: [0, 6, -2, 4, 0], scale: [1, 1.2, 0.9, 1.1, 1] }
                : phase === 'spinning'
                  ? { y: [0, 2, 0] }
                  : {}
            }
            transition={
              phase === 'result'
                ? { duration: 0.5, ease: 'easeOut' }
                : { duration: 0.15, repeat: Infinity }
            }
          />

          {/* Pointer glow */}
          <motion.div
            className="absolute z-19 pointer-events-none"
            style={{
              top: -24,
              left: halfWheel - 20,
              width: 40,
              height: 30,
            }}
            animate={
              phase === 'spinning'
                ? { opacity: [0.4, 0.8, 0.4] }
                : phase === 'result'
                  ? { opacity: [0.6, 1, 0.6] }
                  : { opacity: 0.3 }
            }
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            <div className="w-full h-full bg-yellow-400/40 rounded-full blur-md" />
          </motion.div>
        </div>

        {/* ── Donor info (during spin & result) ────────────────── */}
        <AnimatePresence>
          {donor && (phase === 'spinning' || phase === 'result') && (
            <motion.div
              className="absolute flex flex-col items-center"
              style={{ bottom: '8%' }}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            >
              <motion.div
                className={`px-6 py-3 rounded-2xl ${theme.card} border ${theme.border} shadow-2xl backdrop-blur-sm`}
              >
                <motion.p
                  className={`text-sm font-semibold ${theme.accent} tracking-wider uppercase mb-1 text-center`}
                  animate={phase === 'spinning' ? { opacity: [1, 0.5, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  🎲 룰렛 후원
                </motion.p>
                <p className={`text-lg font-extrabold ${theme.text} text-center`}>
                  {donor.fan_nickname}
                </p>
                <motion.p
                  className="text-2xl font-black text-yellow-400 text-center drop-shadow-lg"
                  animate={phase === 'spinning' ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  {formatAmount(donor.amount)}
                </motion.p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Result reveal ────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'result' && winnerIndex >= 0 && (
            <motion.div
              className="absolute flex flex-col items-center"
              style={{ top: '6%' }}
              initial={{ scale: 0, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15, mass: 0.8 }}
            >
              {/* Background glow */}
              <motion.div
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                animate={{
                  boxShadow: [
                    `0 0 40px 10px ${SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length]}66`,
                    `0 0 80px 25px ${SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length]}44`,
                    `0 0 40px 10px ${SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length]}66`,
                  ],
                }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
              />

              <motion.div
                className={`relative px-10 py-6 rounded-3xl border-2 shadow-2xl ${theme.card}`}
                style={{
                  borderColor: SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length],
                }}
                animate={{
                  borderColor: [
                    SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length],
                    '#facc15',
                    SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length],
                  ],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.p
                  className="text-sm font-bold text-yellow-400 tracking-widest uppercase text-center mb-2"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  🎉 결과 🎉
                </motion.p>

                <motion.h2
                  className={`text-3xl md:text-4xl font-black text-center drop-shadow-lg ${theme.text}`}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{
                    scale: [0.3, 1.3, 0.9, 1.1, 1],
                    opacity: 1,
                  }}
                  transition={{
                    delay: 0.15,
                    duration: 0.8,
                    ease: 'easeOut',
                  }}
                >
                  {segments[winnerIndex]}
                </motion.h2>

                {/* Pulsing highlight bar */}
                <motion.div
                  className="mt-3 h-1 rounded-full mx-auto"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${SEGMENT_COLORS[winnerIndex % SEGMENT_COLORS.length]}, transparent)`,
                    width: '80%',
                  }}
                  animate={{ opacity: [0.4, 1, 0.4], scaleX: [0.8, 1, 0.8] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Idle label ──────────────────────────────────────── */}
        <AnimatePresence>
          {phase === 'idle' && !donor && (
            <motion.div
              className="absolute flex flex-col items-center"
              style={{ bottom: '10%' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.p
                className={`text-sm font-semibold ${theme.accent} tracking-wider`}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                후원하면 룰렛이 돌아갑니다!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
