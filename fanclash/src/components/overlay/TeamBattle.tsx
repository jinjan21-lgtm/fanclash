'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { createClient } from '@/lib/supabase/client';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const TEAM_COLORS = [
  { bar: 'bg-gradient-to-r from-red-600 to-red-400', glow: 'shadow-red-500/40', hex: '#ef4444', hexLight: '#fca5a5' },
  { bar: 'bg-gradient-to-r from-blue-600 to-blue-400', glow: 'shadow-blue-500/40', hex: '#3b82f6', hexLight: '#93c5fd' },
  { bar: 'bg-gradient-to-r from-green-600 to-green-400', glow: 'shadow-green-500/40', hex: '#22c55e', hexLight: '#86efac' },
  { bar: 'bg-gradient-to-r from-yellow-600 to-yellow-400', glow: 'shadow-yellow-500/40', hex: '#eab308', hexLight: '#fde047' },
];

const TEAM_EMOJIS = ['🔴', '🔵', '🟢', '🟡'];

/* ── Shimmer overlay for progress bars ── */
function BarShimmer() {
  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 35%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 65%, transparent 100%)',
        borderRadius: 'inherit',
      }}
      animate={{ x: ['-100%', '200%'] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
    />
  );
}

/* ── Crown with golden sparkles for leading team ── */
function LeaderCrown() {
  const sparkles = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <motion.span
      className="relative inline-block"
      animate={{ scale: [1, 1.15, 1] }}
      transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
    >
      <motion.span
        className="inline-block text-yellow-400"
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
      >
        👑
      </motion.span>
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
            x: [0, Math.cos((s / 8) * Math.PI * 2) * 12, 0],
            y: [0, Math.sin((s / 8) * Math.PI * 2) * 12, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.4, 0],
          }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            delay: s * 0.2,
            ease: 'easeOut',
          }}
        />
      ))}
    </motion.span>
  );
}

/* ── Expanding ring flash on donation ── */
function DonationRing({ color }: { color: string }) {
  return (
    <>
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{ border: `2px solid ${color}` }}
        initial={{ opacity: 0.8, scale: 1 }}
        animate={{ opacity: 0, scale: 1.6 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{ border: `1px solid ${color}` }}
        initial={{ opacity: 0.5, scale: 1 }}
        animate={{ opacity: 0, scale: 2 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
      />
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-full"
        initial={{
          boxShadow: `0 0 30px 10px ${color}60`,
          opacity: 1,
        }}
        animate={{
          boxShadow: `0 0 0 0 ${color}00`,
          opacity: 0,
        }}
        transition={{ duration: 0.6 }}
      />
    </>
  );
}

/* ── Animated amount counter ── */
function AnimatedScore({ value, isFlash, accentClass }: { value: number; isFlash: boolean; accentClass: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (value === prev.current) { setDisplay(value); return; }
    const start = prev.current;
    const diff = value - start;
    const duration = 500;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    prev.current = value;
  }, [value]);

  return (
    <motion.span
      className={`font-bold ${accentClass}`}
      animate={
        isFlash
          ? {
              scale: [1, 1.35, 1],
              color: ['', '#facc15', '#fb923c', ''],
              textShadow: ['0 0 0px transparent', '0 0 16px rgba(251,191,36,0.7)', '0 0 0px transparent'],
            }
          : {}
      }
      transition={{ duration: 0.5 }}
    >
      {display.toLocaleString()}원
    </motion.span>
  );
}

/* ── VS Divider with pulsing intensity ── */
function VsDivider({ closeness }: { closeness: number }) {
  // closeness 0..1, 1 = perfectly tied
  const intensity = 0.3 + closeness * 0.7;
  return (
    <motion.div className="flex items-center justify-center py-2">
      <motion.div className="flex items-center gap-1">
        {/* Left bolt */}
        <motion.span
          className="text-yellow-400 text-lg"
          animate={{ opacity: [0.3, intensity, 0.3], x: [-2, 0, -2] }}
          transition={{ duration: 0.8 + (1 - closeness) * 1.2, repeat: Infinity }}
        >
          ⚡
        </motion.span>
        <motion.span
          className="font-black text-2xl"
          style={{
            background: 'linear-gradient(to right, #ef4444, #f59e0b, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          animate={{
            scale: [1, 1 + closeness * 0.15, 1],
            textShadow: [
              '0 0 0px transparent',
              `0 0 ${closeness * 20}px rgba(251,191,36,${closeness * 0.6})`,
              '0 0 0px transparent',
            ],
          }}
          transition={{ duration: 1.2 - closeness * 0.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          VS
        </motion.span>
        {/* Right bolt */}
        <motion.span
          className="text-yellow-400 text-lg"
          animate={{ opacity: [0.3, intensity, 0.3], x: [2, 0, 2] }}
          transition={{ duration: 0.8 + (1 - closeness) * 1.2, repeat: Infinity, delay: 0.4 }}
        >
          ⚡
        </motion.span>
      </motion.div>
    </motion.div>
  );
}

/* ── Animated donut/pie ratio ── */
function RatioDonut({ percentages, colors }: { percentages: number[]; colors: string[] }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center justify-center py-1">
      <svg width={48} height={48} viewBox="0 0 48 48">
        {percentages.map((pct, i) => {
          const dashLen = (pct / 100) * circumference;
          const dashOff = -offset;
          offset += dashLen;
          return (
            <motion.circle
              key={i}
              cx={24}
              cy={24}
              r={r}
              fill="none"
              stroke={colors[i] || '#666'}
              strokeWidth={6}
              strokeDasharray={`${dashLen} ${circumference - dashLen}`}
              strokeDashoffset={dashOff}
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${dashLen} ${circumference - dashLen}` }}
              transition={{ type: 'spring', stiffness: 80, damping: 15 }}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '24px 24px' }}
            />
          );
        })}
        {/* Center text */}
        <text x={24} y={26} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold" opacity={0.7}>
          {percentages[0]?.toFixed(0) || 0}:{percentages[1]?.toFixed(0) || 0}
        </text>
      </svg>
    </div>
  );
}

export default function TeamBattle({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [teams, setTeams] = useState<Record<number, { total: number; members: any[] }>>({});
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [prevTotals, setPrevTotals] = useState<Record<number, number>>({});
  const [flashIdx, setFlashIdx] = useState<number | null>(null);
  const [hasData, setHasData] = useState(false);
  const { socketRef, on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];

  // Load active team battle from DB
  useEffect(() => {
    if (preview) return;
    const supabase = createClient();
    supabase
      .from('team_battles')
      .select('*')
      .eq('streamer_id', widget.streamer_id)
      .in('status', ['recruiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data: battleData }) => {
        if (!battleData) return;
        setTeamNames(battleData.team_names || []);
        const { data: members } = await supabase
          .from('team_battle_members')
          .select('*')
          .eq('team_battle_id', battleData.id);
        if (members) {
          const teamsMap: Record<number, { total: number; members: any[] }> = {};
          for (let i = 0; i < (battleData.team_count || 2); i++) {
            const teamMembers = members.filter(m => m.team_index === i);
            teamsMap[i] = {
              total: teamMembers.reduce((sum, m) => sum + (m.amount || 0), 0),
              members: teamMembers,
            };
          }
          setTeams(teamsMap);
          const totals: Record<number, number> = {};
          Object.entries(teamsMap).forEach(([idx, t]) => { totals[Number(idx)] = t.total; });
          setPrevTotals(totals);
          setHasData(true);
        }
      });
  }, [widget.streamer_id, preview]);

  useEffect(() => {
    if (!ready) return;
    const handler = (data: any) => {
      // Detect which team just got a donation
      const newTeams = data.teams as Record<number, { total: number; members: any[] }>;
      for (const [idx, team] of Object.entries(newTeams)) {
        const prev = prevTotals[Number(idx)] || 0;
        if (team.total > prev) {
          setFlashIdx(Number(idx));
          setTimeout(() => setFlashIdx(null), 1200);
        }
      }
      const totals: Record<number, number> = {};
      for (const [idx, team] of Object.entries(newTeams)) {
        totals[Number(idx)] = team.total;
      }
      setPrevTotals(totals);
      setTeams(newTeams);
      setTeamNames(data.battle.team_names || []);
      setHasData(true);
    };
    on('team_battle:update', handler);
  }, [ready, prevTotals]);

  // Show demo data in preview mode
  useEffect(() => {
    if (preview && !hasData) {
      setTeams({
        0: { total: 85000, members: [{}, {}, {}] },
        1: { total: 62000, members: [{}, {}] },
      });
      setTeamNames((widget.config as any)?.teamNames || ['레드팀', '블루팀']);
    }
  }, [preview, hasData, widget.config]);

  const maxTotal = Math.max(...Object.values(teams).map(t => t.total || 1), 1);
  const totalAll = Object.values(teams).reduce((sum, t) => sum + (t.total || 0), 0);

  // Compute closeness for VS intensity (0 = one-sided, 1 = perfectly tied)
  const teamEntries = Object.entries(teams);
  const closeness = teamEntries.length >= 2
    ? 1 - Math.abs((teamEntries[0][1].total || 0) - (teamEntries[1][1].total || 0)) / Math.max(maxTotal, 1)
    : 0;

  // Percentages for donut
  const percentages = teamEntries.map(([, t]) => totalAll > 0 ? ((t.total || 0) / totalAll) * 100 : 0);
  const donutColors = teamEntries.map(([idx]) => (TEAM_COLORS[Number(idx)] || TEAM_COLORS[0]).hex);

  if (Object.keys(teams).length === 0 && !preview) {
    return (
      <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`p-6 rounded-2xl ${theme.card} border ${theme.border} text-center`}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="text-5xl mb-3"
          >
            🗳️
          </motion.div>
          <p className={`text-xl font-bold ${theme.text}`}>팀 배틀</p>
          <p className="text-gray-500 text-sm mt-1">배틀 대기 중...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-6 rounded-2xl ${theme.card} border ${theme.border} backdrop-blur-sm`}
      >
        <div className="flex items-center justify-between mb-5">
          <motion.p
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className={`text-xl font-bold ${theme.text}`}
          >
            🗳️ 팬 투표
          </motion.p>
          {totalAll > 0 && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-sm ${theme.accent}`}
            >
              총 {totalAll.toLocaleString()}원
            </motion.span>
          )}
        </div>

        <AnimatePresence>
          <div className="space-y-1">
            {teamEntries.map(([idx, team], arrIdx) => {
              const i = Number(idx);
              const pct = totalAll > 0 ? ((team.total || 0) / totalAll * 100) : 0;
              const isLeading = team.total === maxTotal && team.total > 0;
              const isFlash = flashIdx === i;
              const color = TEAM_COLORS[i] || TEAM_COLORS[0];

              return (
                <div key={idx}>
                  <motion.div
                    layout
                    initial={{ opacity: 0, x: -30 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      scale: isFlash ? [1, 1.04, 1] : 1,
                    }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`relative ${isLeading ? 'z-10' : ''}`}
                    style={isLeading ? {
                      borderRadius: 12,
                      boxShadow: `0 0 20px 4px ${color.hex}30`,
                    } : {}}
                  >
                    {/* Pulsing glow border for leading team */}
                    {isLeading && (
                      <motion.div
                        className="absolute -inset-[2px] rounded-xl pointer-events-none"
                        style={{ border: `2px solid ${color.hex}` }}
                        animate={{
                          boxShadow: [
                            `0 0 8px 2px ${color.hex}40`,
                            `0 0 18px 6px ${color.hex}60`,
                            `0 0 8px 2px ${color.hex}40`,
                          ],
                          opacity: [0.6, 1, 0.6],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    <div className="p-2 rounded-xl">
                      <div className="flex justify-between mb-1.5">
                        <span className={`font-bold ${isLeading ? theme.accent : theme.text} flex items-center gap-2`}>
                          {TEAM_EMOJIS[i] || '⚪'} {teamNames[i] || `팀 ${i + 1}`}
                          {isLeading && <LeaderCrown />}
                        </span>
                        <span className="flex items-center gap-2">
                          <AnimatedScore value={team.total || 0} isFlash={isFlash} accentClass={theme.accent} />
                          <motion.span
                            className="text-xs opacity-60"
                            animate={isFlash ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : {}}
                            transition={{ duration: 0.4 }}
                          >
                            ({pct.toFixed(1)}%)
                          </motion.span>
                        </span>
                      </div>

                      {/* Progress bar with shimmer and donation ring */}
                      <div className={`relative h-8 bg-gray-800/60 rounded-full overflow-hidden ${isLeading ? `shadow-lg ${color.glow}` : ''}`}>
                        <motion.div
                          className={`h-full rounded-full relative overflow-hidden ${color.bar}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${((team.total || 0) / maxTotal) * 100}%` }}
                          transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                        >
                          <BarShimmer />
                        </motion.div>

                        {/* Donation flash ring */}
                        {isFlash && <DonationRing color={color.hex} />}
                      </div>

                      {/* Member count */}
                      <div className="mt-1 text-xs text-gray-500">
                        참여 {team.members?.length || 0}명
                      </div>
                    </div>
                  </motion.div>

                  {/* VS Divider between teams (not after last) */}
                  {arrIdx < teamEntries.length - 1 && (
                    <VsDivider closeness={closeness} />
                  )}
                </div>
              );
            })}
          </div>
        </AnimatePresence>

        {/* Ratio donut chart */}
        {totalAll > 0 && percentages.length >= 2 && (
          <RatioDonut percentages={percentages} colors={donutColors} />
        )}
      </motion.div>
    </div>
  );
}
