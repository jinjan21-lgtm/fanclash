'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget, Battle, BattleParticipant } from '@/types';

export default function BattleArena({ widget }: { widget: Widget }) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [winner, setWinner] = useState<{ winner: string; benefit: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const updateHandler = (data: any) => {
      setBattle(data.battle);
      setParticipants(data.participants);
      if (data.battle.status === 'active' && data.battle.time_limit) {
        setTimeLeft(data.battle.time_limit);
      }
    };
    const finishHandler = (data: any) => {
      setWinner(data);
      setTimeout(() => { setWinner(null); setBattle(null); setParticipants([]); }, 8000);
    };
    socket.on('battle:update', updateHandler);
    socket.on('battle:finished', finishHandler);
    return () => { socket.off('battle:update', updateHandler); socket.off('battle:finished', finishHandler); };
  }, [socketRef.current]);

  useEffect(() => {
    if (battle?.status !== 'active' || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [battle?.status, timeLeft]);

  if (winner) {
    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="fixed inset-0 flex items-center justify-center">
        <div className={`text-center p-12 rounded-2xl ${theme.card} border-2 border-yellow-500`}>
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-yellow-400 text-2xl font-bold">승자!</p>
          <p className={`text-4xl font-bold mt-2 ${theme.text}`}>{winner.winner}</p>
          <p className={`text-lg mt-3 ${theme.accent}`}>베네핏: {winner.benefit}</p>
        </div>
      </motion.div>
    );
  }

  if (!battle) return null;

  if (battle.status === 'recruiting') {
    return (
      <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className={`p-6 rounded-2xl ${theme.card} border-2 ${theme.border} text-center`}>
          <p className={`text-2xl font-bold ${theme.accent}`}>⚔️ 배틀 모집 중!</p>
          <p className={`text-lg mt-2 ${theme.text}`}>도네로 참가하세요!</p>
          <p className="text-yellow-400 mt-2 font-bold">베네핏: {battle.benefit}</p>
          <p className="text-gray-400 mt-1">최소 {battle.min_amount.toLocaleString()}원</p>
          <div className="mt-4 space-y-1">
            {participants.map((p, i) => (
              <div key={i} className={`${theme.text} font-bold`}>✅ {p.nickname} 참가!</div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  const maxAmount = Math.max(...participants.map(p => p.amount || 1), 1);

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <div className={`p-6 rounded-2xl ${theme.card} border-2 border-red-500`}>
        <div className="flex justify-between items-center mb-4">
          <span className="text-red-400 font-bold text-xl">⚔️ 배틀 진행 중!</span>
          <span className="text-2xl font-mono font-bold text-white">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        <div className="space-y-3">
          {participants.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold ${theme.text}`}>{p.nickname}</span>
                <span className={`font-bold ${theme.accent}`}>{(p.amount || 0).toLocaleString()}원</span>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                  animate={{ width: `${((p.amount || 0) / maxAmount) * 100}%` }}
                  transition={{ type: 'spring' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
