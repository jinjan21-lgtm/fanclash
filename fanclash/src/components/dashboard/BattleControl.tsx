'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSocket } from '@/lib/socket/client';
import type { Battle, BattleParticipant } from '@/types';

interface BattleControlProps {
  streamerId: string;
  config?: Record<string, unknown>;
}

export default function BattleControl({ streamerId, config }: BattleControlProps) {
  const configMinAmount = config?.defaultMinAmount as number | undefined;
  const configTimeLimit = config?.defaultTimeLimit as number | undefined;
  const configBenefit = config?.defaultBenefit as string | undefined;

  const [benefit, setBenefit] = useState(configBenefit || '');
  const [minAmount, setMinAmount] = useState(String(configMinAmount ?? 5000));
  const [timeLimit, setTimeLimit] = useState(String(configTimeLimit ?? 180));
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  // Load existing active battle from DB, sync recruiting battles with config
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('battles')
      .select('*')
      .eq('streamer_id', streamerId)
      .in('status', ['recruiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (data) {
          // Sync recruiting battle with current widget config
          if (data.status === 'recruiting') {
            const updates: Record<string, unknown> = {};
            if (configMinAmount != null && data.min_amount !== configMinAmount) updates.min_amount = configMinAmount;
            if (configTimeLimit != null && data.time_limit !== configTimeLimit) updates.time_limit = configTimeLimit;
            if (configBenefit && data.benefit !== configBenefit) updates.benefit = configBenefit;
            if (Object.keys(updates).length > 0) {
              await supabase.from('battles').update(updates).eq('id', data.id);
              Object.assign(data, updates);
            }
          }
          setActiveBattle(data);
          const { data: parts } = await supabase
            .from('battle_participants')
            .select('*')
            .eq('battle_id', data.id)
            .order('amount', { ascending: false });
          if (parts) setParticipants(parts);
        }
        setLoading(false);
      });
  }, [streamerId, configMinAmount, configTimeLimit, configBenefit]);

  // Socket events
  useEffect(() => {
    const socket = getSocket();
    socket.emit('streamer:subscribe' as any, streamerId);

    const updateHandler = (data: any) => {
      setActiveBattle(data.battle);
      setParticipants(data.participants);
    };
    const finishHandler = (data: any) => {
      setActiveBattle(null);
      setParticipants([]);
      alert(`배틀 종료! 승자: ${data.winner} / 베네핏: ${data.benefit}`);
    };

    socket.on('battle:update', updateHandler);
    socket.on('battle:finished', finishHandler);

    return () => {
      socket.off('battle:update', updateHandler);
      socket.off('battle:finished', finishHandler);
    };
  }, [streamerId]);

  const createBattle = () => {
    if (!benefit) return;
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

  const cancelBattle = () => {
    if (!activeBattle) return;
    const socket = getSocket();
    socket.emit('battle:cancel' as any, activeBattle.id);
    setActiveBattle(null);
    setParticipants([]);
  };

  if (loading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  if (activeBattle) {
    const isRecruiting = activeBattle.status === 'recruiting';
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">
            {isRecruiting ? '⚔️ 모집 중' : '🔥 배틀 진행 중!'}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isRecruiting ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            {activeBattle.status}
          </span>
        </div>
        <p className="text-purple-400 mb-2">🎁 베네핏: {activeBattle.benefit}</p>
        <p className="text-gray-400 text-sm mb-4">
          최소 {activeBattle.min_amount.toLocaleString()}원 / 제한시간 {activeBattle.time_limit}초
        </p>

        <div className="space-y-2 mb-4">
          {participants.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-4">참가자를 기다리는 중...</p>
          )}
          {participants.map((p, i) => (
            <div key={i} className="flex justify-between bg-gray-800 rounded-lg p-3">
              <span className="font-bold">
                {i === 0 && participants.length > 1 ? '👑 ' : ''}{p.nickname}
              </span>
              <span className="text-purple-400 font-bold">{(p.amount || 0).toLocaleString()}원</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {isRecruiting && (
            <>
              <button onClick={startBattle} disabled={participants.length < 2}
                className="flex-1 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {participants.length < 2 ? `배틀 시작 (${participants.length}/2명)` : '배틀 시작!'}
              </button>
              <button onClick={cancelBattle}
                className="px-4 py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600">
                취소
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <h3 className="font-bold text-lg">⚔️ 새 배틀 개설</h3>
      <p className="text-gray-400 text-sm">베네핏을 걸고 배틀을 개설하세요. 시청자가 도네로 참가합니다.</p>
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
        className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
        배틀 개설
      </button>
    </div>
  );
}
