'use client';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket/client';
import type { Battle, BattleParticipant } from '@/types';

export default function BattleControl({ streamerId }: { streamerId: string }) {
  const [benefit, setBenefit] = useState('');
  const [minAmount, setMinAmount] = useState('5000');
  const [timeLimit, setTimeLimit] = useState('180');
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('battle:update', (data) => {
      setActiveBattle(data.battle);
      setParticipants(data.participants);
    });
    socket.on('battle:finished', (data) => {
      setActiveBattle(null);
      setParticipants([]);
      alert(`배틀 종료! 승자: ${data.winner} / 베네핏: ${data.benefit}`);
    });
    return () => { socket.off('battle:update'); socket.off('battle:finished'); };
  }, []);

  const createBattle = () => {
    const socket = getSocket();
    socket.emit('battle:create', {
      streamer_id: streamerId,
      benefit,
      min_amount: parseInt(minAmount),
      time_limit: parseInt(timeLimit),
    });
  };

  const startBattle = () => {
    if (!activeBattle) return;
    const socket = getSocket();
    socket.emit('battle:start', activeBattle.id);
  };

  if (activeBattle) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">
            {activeBattle.status === 'recruiting' ? '모집 중' : '배틀 진행 중!'}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            activeBattle.status === 'recruiting' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            {activeBattle.status}
          </span>
        </div>
        <p className="text-purple-400 mb-4">베네핏: {activeBattle.benefit}</p>
        <div className="space-y-2 mb-4">
          {participants.map((p, i) => (
            <div key={i} className="flex justify-between bg-gray-800 rounded-lg p-3">
              <span className="font-bold">{p.nickname}</span>
              <span className="text-purple-400">{(p.amount || 0).toLocaleString()}원</span>
            </div>
          ))}
        </div>
        {activeBattle.status === 'recruiting' && participants.length >= 2 && (
          <button onClick={startBattle} className="w-full py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700">
            배틀 시작!
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <h3 className="font-bold text-lg">새 배틀 개설</h3>
      <input type="text" placeholder="베네핏 (예: 듀오 한판!)" value={benefit} onChange={e => setBenefit(e.target.value)}
        className="w-full p-3 rounded-lg bg-gray-800 text-white" />
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-gray-400">최소 참가 금액</label>
          <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white mt-1" />
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-400">제한 시간 (초)</label>
          <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white mt-1" />
        </div>
      </div>
      <button onClick={createBattle} disabled={!benefit}
        className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50">
        배틀 개설
      </button>
    </div>
  );
}
