'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { createClient } from '@/lib/supabase/client';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

interface RankEntry { nickname: string; total: number; }

const RANK_MEDALS = ['👑', '🥈', '🥉'];

const DEMO_RANKINGS: RankEntry[] = [
  { nickname: '별빛소나기', total: 152000 },
  { nickname: '치즈덕후', total: 98000 },
  { nickname: '밤하늘구름', total: 75000 },
  { nickname: '해피바이러스', total: 42000 },
  { nickname: '꿈꾸는고양이', total: 15000 },
];

/* ── Golden particle orbit for #1 rank ── */
function GoldenParticles() {
  const particles = [0, 1, 2, 3, 4, 5];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map((p) => (
        <motion.div
          key={p}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: 'radial-gradient(circle, #fde68a, #f59e0b)',
            boxShadow: '0 0 6px 2px rgba(251, 191, 36, 0.6)',
            top: '50%',
            left: '50%',
          }}
          animate={{
            x: [
              Math.cos((p / 6) * Math.PI * 2) * 48,
              Math.cos((p / 6) * Math.PI * 2 + Math.PI) * 48,
              Math.cos((p / 6) * Math.PI * 2) * 48,
            ],
            y: [
              Math.sin((p / 6) * Math.PI * 2) * 18,
              Math.sin((p / 6) * Math.PI * 2 + Math.PI) * 18,
              Math.sin((p / 6) * Math.PI * 2) * 18,
            ],
            opacity: [0.4, 1, 0.4],
            scale: [0.8, 1.3, 0.8],
          }}
          transition={{
            duration: 3 + p * 0.3,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: p * 0.5,
          }}
        />
      ))}
    </div>
  );
}

/* ── Sparkle burst for crown (#1) ── */
function CrownSparkles() {
  const sparkles = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <span className="relative inline-block">
      {sparkles.map((s) => (
        <motion.span
          key={s}
          className="absolute"
          style={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            background: '#fbbf24',
            boxShadow: '0 0 4px 1px rgba(251, 191, 36, 0.8)',
            top: '50%',
            left: '50%',
          }}
          animate={{
            x: [0, Math.cos((s / 8) * Math.PI * 2) * 14, 0],
            y: [0, Math.sin((s / 8) * Math.PI * 2) * 14, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            delay: s * 0.22,
            ease: 'easeOut',
          }}
        />
      ))}
    </span>
  );
}

/* ── Medal shine for #2 and #3 ── */
function MedalShine() {
  return (
    <motion.span
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)',
        borderRadius: '50%',
      }}
      animate={{ x: [-20, 20, -20] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ── Shimmer wipe light streak ── */
function ShimmerWipe() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.25) 55%, transparent 70%)',
        zIndex: 10,
      }}
      initial={{ x: '-100%' }}
      animate={{ x: '200%' }}
      transition={{ duration: 0.7, ease: 'easeInOut' }}
    />
  );
}

/* ── Glow burst for new entries ── */
function GlowBurst() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none rounded-lg"
      style={{ boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)' }}
      initial={{
        boxShadow: '0 0 40px 20px rgba(251, 191, 36, 0.6), inset 0 0 30px rgba(251, 191, 36, 0.3)',
        opacity: 1,
      }}
      animate={{
        boxShadow: '0 0 0 0 rgba(251, 191, 36, 0), inset 0 0 0 rgba(251, 191, 36, 0)',
        opacity: 0,
      }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
  );
}

/* ── Animated counter display ── */
function AnimatedAmount({ value, isFlash, accentClass, large }: { value: number; isFlash: boolean; accentClass: string; large: boolean }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) {
      setDisplayValue(value);
      return;
    }
    const start = prevValue.current;
    const diff = value - start;
    const duration = 600;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prevValue.current = value;
  }, [value]);

  return (
    <motion.span
      className={`relative font-bold tabular-nums ${accentClass} ${large ? 'text-lg' : ''}`}
      animate={
        isFlash
          ? {
              scale: [1, 1.4, 1],
              color: ['', '#facc15', '#fb923c', ''],
              textShadow: [
                '0 0 0px transparent',
                '0 0 20px rgba(251,191,36,0.8)',
                '0 0 0px transparent',
              ],
            }
          : {}
      }
      transition={{ duration: 0.6 }}
    >
      <motion.span
        key={displayValue}
        initial={isFlash ? { scaleY: 0.3, opacity: 0.5 } : false}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        style={{ display: 'inline-block' }}
      >
        {displayValue.toLocaleString()}원
      </motion.span>
    </motion.span>
  );
}

export default function RankingBoard({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [flashNick, setFlashNick] = useState<string | null>(null);
  const [newNick, setNewNick] = useState<string | null>(null);
  const prevRef = useRef<RankEntry[]>([]);
  const { socketRef, on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];
  const [hasData, setHasData] = useState(false);

  // Load initial rankings from DB
  useEffect(() => {
    if (preview) return;
    const supabase = createClient();
    supabase
      .from('fan_profiles')
      .select('nickname, total_donated')
      .eq('streamer_id', widget.streamer_id)
      .order('total_donated', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const initial = data.map(d => ({ nickname: d.nickname, total: d.total_donated }));
          setRankings(initial);
          prevRef.current = initial;
          setHasData(true);
        }
      });
  }, [widget.streamer_id, preview]);

  useEffect(() => {
    if (!ready) return;
    const handler = (data: any) => {
      const newRankings = data.rankings.map((r: any) => ({
        nickname: r.nickname,
        total: r.total_donated || r.total,
      }));
      for (const entry of newRankings) {
        const prev = prevRef.current.find(p => p.nickname === entry.nickname);
        if (!prev) {
          // Brand new entry
          setNewNick(entry.nickname);
          setTimeout(() => setNewNick(null), 1500);
          setFlashNick(entry.nickname);
          setTimeout(() => setFlashNick(null), 1200);
          break;
        } else if (entry.total > prev.total) {
          setFlashNick(entry.nickname);
          setTimeout(() => setFlashNick(null), 1200);
          break;
        }
      }
      prevRef.current = newRankings;
      setRankings(newRankings);
      setHasData(true);
    };
    on('ranking:update', handler);
  }, [ready]);

  // Show demo data in preview mode when no real data
  useEffect(() => {
    if (preview && !hasData) {
      setRankings(DEMO_RANKINGS);
    }
  }, [preview, hasData]);

  const maxDisplay = ((widget.config as any)?.maxDisplay as number) || 5;
  const topAmount = rankings[0]?.total || 1;

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence mode="popLayout">
        {rankings.slice(0, maxDisplay).map((entry, i) => {
          const barWidth = (entry.total / topAmount) * 100;
          const isFlash = flashNick === entry.nickname;
          const isNew = newNick === entry.nickname;

          return (
            <motion.div
              key={entry.nickname}
              layout
              initial={{ opacity: 0, x: -80, scale: 0.7, rotate: -3 }}
              animate={{
                opacity: 1,
                x: 0,
                scale: isFlash ? [1, 1.06, 1] : 1,
                rotate: 0,
              }}
              exit={{ opacity: 0, x: 80, scale: 0.7, rotate: 3, filter: 'blur(4px)' }}
              transition={{
                layout: {
                  type: 'spring',
                  stiffness: 180,
                  damping: 22,
                },
                opacity: { duration: 0.35 },
                scale: { duration: 0.5 },
                rotate: { duration: 0.4 },
              }}
              className={`relative flex items-center gap-3 mb-2 p-3 rounded-lg overflow-hidden ${theme.card} border ${
                i === 0
                  ? 'border-yellow-500 shadow-lg shadow-yellow-500/30'
                  : i === 1
                  ? 'border-gray-400/30 shadow-md shadow-gray-400/10'
                  : i === 2
                  ? 'border-amber-700/30 shadow-md shadow-amber-700/10'
                  : theme.border
              }`}
            >
              {/* Golden particles orbiting #1 */}
              {i === 0 && <GoldenParticles />}

              {/* Glow burst for new entries */}
              {isNew && <GlowBurst />}

              {/* Shimmer wipe on flash */}
              {isFlash && <ShimmerWipe />}

              {/* Background bar with continuous shimmer */}
              <motion.div
                className={`absolute inset-0 ${i === 0 ? 'bg-yellow-400' : theme.highlight}`}
                style={{ opacity: 0.1 }}
                initial={{ width: 0 }}
                animate={{ width: `${barWidth}%` }}
                transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              >
                {/* Gradient shimmer sweep on progress bar */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 40%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.2) 60%, transparent 100%)',
                  }}
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'linear',
                    repeatDelay: 1,
                  }}
                />
              </motion.div>

              {/* Rank medal with sparkle effects */}
              <span className={`relative text-2xl font-bold w-10 text-center ${i === 0 ? 'text-yellow-400' : theme.text}`}>
                {i === 0 ? (
                  <motion.span
                    className="relative inline-block"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, -5, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    {RANK_MEDALS[0]}
                    <CrownSparkles />
                  </motion.span>
                ) : i <= 2 ? (
                  <span className="relative inline-block">
                    {RANK_MEDALS[i]}
                    <MedalShine />
                  </span>
                ) : (
                  i + 1
                )}
              </span>

              {/* Name */}
              <span className={`relative flex-1 font-bold truncate ${
                i === 0 ? 'text-yellow-200 text-lg' : theme.text
              }`}>
                {entry.nickname}
                {isNew && (
                  <motion.span
                    className="ml-2 text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.2, 1, 0.8] }}
                    transition={{ duration: 1.5 }}
                  >
                    NEW
                  </motion.span>
                )}
              </span>

              {/* Amount with animated counter */}
              <AnimatedAmount
                value={entry.total}
                isFlash={isFlash}
                accentClass={theme.accent}
                large={i === 0}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
