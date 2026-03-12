'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { createClient } from '@/lib/supabase/client';
import { themes } from '@/lib/themes';
import type { Widget, Battle, BattleParticipant } from '@/types';
import { playSound } from '@/lib/sound';

export default function BattleArena({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [winner, setWinner] = useState<{ winner: string; benefit: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [flashNick, setFlashNick] = useState<string | null>(null);
  const prevAmounts = useRef<Record<string, number>>({});
  const { socketRef, on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];

  // Load active battle from DB
  useEffect(() => {
    if (preview) return;
    const supabase = createClient();
    supabase
      .from('battles')
      .select('*')
      .eq('streamer_id', widget.streamer_id)
      .in('status', ['recruiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data: battleData }) => {
        if (!battleData) return;
        setBattle(battleData);
        if (battleData.status === 'active' && battleData.started_at) {
          const elapsed = Math.floor((Date.now() - new Date(battleData.started_at).getTime()) / 1000);
          setTimeLeft(Math.max(0, battleData.time_limit - elapsed));
        }
        const { data: parts } = await supabase
          .from('battle_participants')
          .select('*')
          .eq('battle_id', battleData.id)
          .order('amount', { ascending: false });
        if (parts) {
          setParticipants(parts);
          const amounts: Record<string, number> = {};
          parts.forEach(p => { amounts[p.nickname] = p.amount || 0; });
          prevAmounts.current = amounts;
        }
      });
  }, [widget.streamer_id, preview]);

  useEffect(() => {
    if (!ready) return;
    const updateHandler = (data: any) => {
      setBattle(data.battle);
      setParticipants(data.participants);
      if (data.battle.status === 'active' && data.battle.time_limit) {
        setTimeLeft(data.battle.time_limit);
      }
      // Detect donation flash
      for (const p of data.participants) {
        const prev = prevAmounts.current[p.nickname] || 0;
        if ((p.amount || 0) > prev) {
          setFlashNick(p.nickname);
          setTimeout(() => setFlashNick(null), 800);
        }
        prevAmounts.current[p.nickname] = p.amount || 0;
      }
    };
    const finishHandler = (data: any) => {
      setWinner(data);
      playSound((widget.config as any)?.soundUrl);
      setTimeout(() => { setWinner(null); setBattle(null); setParticipants([]); prevAmounts.current = {}; }, 8000);
    };
    on('battle:update', updateHandler);
    on('battle:finished', finishHandler);
  }, [ready]);

  useEffect(() => {
    if (battle?.status !== 'active' || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [battle?.status, timeLeft]);

  // Show demo data in preview mode
  useEffect(() => {
    if (preview && !battle) {
      setBattle({
        id: 'demo', streamer_id: 'demo', status: 'active',
        benefit: '치킨 기프티콘', min_amount: 1000, time_limit: 180,
        winner_nickname: null, started_at: new Date().toISOString(),
        finished_at: null, created_at: new Date().toISOString(),
      });
      setParticipants([
        { id: '1', battle_id: 'demo', nickname: '별빛소나기', amount: 25000, joined_at: '' },
        { id: '2', battle_id: 'demo', nickname: '치즈덕후', amount: 18000, joined_at: '' },
        { id: '3', battle_id: 'demo', nickname: '밤하늘구름', amount: 12000, joined_at: '' },
      ]);
      setTimeLeft(127);
    }
  }, [preview, battle]);

  // Winner screen
  if (winner) {
    return (
      <motion.div
        initial={{ scale: 0, rotateZ: -10 }}
        animate={{ scale: 1, rotateZ: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="fixed inset-0 flex items-center justify-center"
      >
        {/* Victory rays */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-32 bg-gradient-to-t from-yellow-400/40 to-transparent origin-bottom"
            style={{ rotate: `${i * 45}deg` }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: [0, 1.5, 1], opacity: [0, 0.6, 0.3] }}
            transition={{ duration: 1, delay: 0.3 + i * 0.05 }}
          />
        ))}

        <div className={`relative text-center p-12 rounded-2xl ${theme.card} border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30`}>
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, -5, 5, 0] }}
            transition={{ duration: 1.5, repeat: 1 }}
            className="text-7xl mb-4"
          >
            🏆
          </motion.div>
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="text-yellow-400 text-2xl font-bold"
          >
            승자!
          </motion.p>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`text-4xl font-bold mt-3 ${theme.text}`}
          >
            {winner.winner}
          </motion.p>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: 'spring' }}
            className="mt-4 inline-block px-5 py-2 rounded-full bg-gradient-to-r from-yellow-600 to-yellow-400"
          >
            <span className="text-black font-bold">🎁 {winner.benefit}</span>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  if (!battle) {
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
            ⚔️
          </motion.div>
          <p className={`text-xl font-bold ${theme.text}`}>후원 배틀</p>
          <p className="text-gray-500 text-sm mt-1">배틀 대기 중...</p>
        </motion.div>
      </div>
    );
  }

  // Recruiting
  if (battle.status === 'recruiting') {
    return (
      <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-6 rounded-2xl ${theme.card} border-2 ${theme.border} text-center overflow-hidden relative`}
        >
          {/* Pulsing border glow */}
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-red-500/50"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />

          <motion.p
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className={`text-3xl font-bold ${theme.accent}`}
          >
            ⚔️ 배틀 모집 중!
          </motion.p>
          <p className={`text-lg mt-2 ${theme.text}`}>도네로 참가하세요!</p>
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
            className="mt-3 inline-block px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/50"
          >
            <span className="text-yellow-400 font-bold">🎁 {battle.benefit}</span>
          </motion.div>
          <p className="text-gray-400 mt-2">최소 {battle.min_amount.toLocaleString()}원</p>

          <AnimatePresence>
            <div className="mt-4 space-y-2">
              {participants.map((p, i) => (
                <motion.div
                  key={p.nickname}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ type: 'spring', delay: i * 0.1 }}
                  className={`${theme.text} font-bold py-1`}
                >
                  ✅ {p.nickname} 참가!
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // Active battle
  const maxAmount = Math.max(...participants.map(p => p.amount || 1), 1);
  const isUrgent = timeLeft <= 30;
  const sortedParticipants = [...participants].sort((a, b) => (b.amount || 0) - (a.amount || 0));

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`p-6 rounded-2xl ${theme.card} border-2 ${isUrgent ? 'border-red-500' : 'border-orange-500'} relative overflow-hidden`}
      >
        {/* Urgent pulse overlay */}
        {isUrgent && (
          <motion.div
            className="absolute inset-0 bg-red-500/5"
            animate={{ opacity: [0, 0.15, 0] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          />
        )}

        <div className="flex justify-between items-center mb-5">
          <motion.span
            animate={isUrgent ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 0.5 }}
            className={`font-bold text-xl ${isUrgent ? 'text-red-400' : 'text-orange-400'}`}
          >
            ⚔️ 배틀 진행 중!
          </motion.span>
          <motion.span
            className={`text-3xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}
            animate={isUrgent ? { scale: [1, 1.15, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </motion.span>
        </div>

        <div className="space-y-4">
          {sortedParticipants.map((p, i) => {
            const isLeading = i === 0 && (p.amount || 0) > 0;
            const isFlash = flashNick === p.nickname;
            const barColor = i === 0 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-blue-600 to-blue-400';

            return (
              <motion.div
                key={p.nickname}
                layout
                animate={{ scale: isFlash ? [1, 1.04, 1] : 1 }}
                transition={{ layout: { type: 'spring', stiffness: 200, damping: 25 } }}
              >
                <div className="flex justify-between mb-1.5">
                  <span className={`font-bold text-lg flex items-center gap-2 ${isLeading ? 'text-yellow-300' : theme.text}`}>
                    {isLeading && (
                      <motion.span animate={{ rotate: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                        👑
                      </motion.span>
                    )}
                    {p.nickname}
                  </span>
                  <motion.span
                    className={`font-bold text-lg ${theme.accent} tabular-nums`}
                    animate={isFlash ? { scale: [1, 1.3, 1] } : {}}
                  >
                    {(p.amount || 0).toLocaleString()}원
                  </motion.span>
                </div>
                <div className={`h-5 bg-gray-800/60 rounded-full overflow-hidden ${isLeading ? 'shadow-lg shadow-red-500/30' : ''}`}>
                  <motion.div
                    className={`h-full rounded-full ${barColor} relative`}
                    animate={{ width: `${((p.amount || 0) / maxAmount) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 80, damping: 15 }}
                  >
                    {isLeading && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
