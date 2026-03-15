'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSocket } from '@/lib/socket/client';
import { useToast } from '@/components/ui/Toast';
import type { Widget } from '@/types';

interface Mission {
  id: string;
  title: string;
  description: string;
  goal_type: string;
  goal_value: number;
  current_value: number;
  reward: string;
  time_limit_minutes: number | null;
  status: string;
  started_at: string;
  completed_at: string | null;
}

interface MissionControlProps {
  widget: Widget;
  onUpdate: () => void;
}

const GOAL_TYPE_LABELS: Record<string, string> = {
  donation_count: '후원 횟수',
  unique_donors: '고유 후원자 수',
  total_amount: '총 후원 금액',
};

export default function MissionControl({ widget, onUpdate }: MissionControlProps) {
  const supabase = createClient();
  const { toast } = useToast();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'history'>('active');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalType, setGoalType] = useState('donation_count');
  const [goalValue, setGoalValue] = useState('');
  const [reward, setReward] = useState('');
  const [timeLimit, setTimeLimit] = useState('');

  const fetchMissions = async () => {
    const { data } = await supabase
      .from('fan_missions')
      .select('*')
      .eq('streamer_id', widget.streamer_id)
      .order('created_at', { ascending: false });
    setMissions(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMissions();
  }, [widget.streamer_id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('streamer:subscribe' as any, widget.streamer_id);
  }, [widget.streamer_id]);

  const createMission = async () => {
    if (!title.trim() || !goalValue || !reward.trim()) {
      toast('제목, 목표, 보상을 모두 입력해주세요');
      return;
    }

    const missionData = {
      streamer_id: widget.streamer_id,
      title: title.trim(),
      description: description.trim() || null,
      goal_type: goalType,
      goal_value: parseInt(goalValue),
      reward: reward.trim(),
      time_limit_minutes: timeLimit ? parseInt(timeLimit) : null,
      status: 'active',
    };

    const { data, error } = await supabase
      .from('fan_missions')
      .insert(missionData)
      .select()
      .single();

    if (error) {
      toast('미션 생성 실패: ' + error.message);
      return;
    }

    // Emit socket event
    const socket = getSocket();
    socket.emit('mission:create' as any, {
      streamer_id: widget.streamer_id,
      mission: data,
    });

    setTitle('');
    setDescription('');
    setGoalValue('');
    setReward('');
    setTimeLimit('');
    toast('미션이 생성되었습니다!');
    fetchMissions();
  };

  const cancelMission = async (missionId: string) => {
    await supabase
      .from('fan_missions')
      .update({ status: 'cancelled' })
      .eq('id', missionId);

    const socket = getSocket();
    socket.emit('mission:cancel' as any, {
      streamer_id: widget.streamer_id,
      missionId,
    });

    toast('미션이 취소되었습니다');
    fetchMissions();
  };

  const activeMissions = missions.filter(m => m.status === 'active');
  const completedMissions = missions.filter(m => m.status !== 'active');

  const getProgressPercent = (m: Mission) => Math.min(100, (m.current_value / m.goal_value) * 100);

  const formatValue = (m: Mission) => {
    if (m.goal_type === 'total_amount') {
      return `${m.current_value.toLocaleString()} / ${m.goal_value.toLocaleString()}원`;
    }
    return `${m.current_value} / ${m.goal_value}`;
  };

  if (loading) {
    return <div className="animate-pulse space-y-3">
      <div className="h-8 bg-gray-800 rounded" />
      <div className="h-32 bg-gray-800 rounded" />
    </div>;
  }

  return (
    <div className="space-y-5">
      {/* Create new mission */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">새 미션 만들기</h4>
        <div>
          <label className="block text-sm text-gray-400 mb-1">미션 제목</label>
          <input type="text" placeholder="예: 100명의 후원자 모으기"
            value={title} onChange={e => setTitle(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">설명 (선택)</label>
          <input type="text" placeholder="미션에 대한 추가 설명"
            value={description} onChange={e => setDescription(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">목표 유형</label>
            <select value={goalType} onChange={e => setGoalType(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-800 text-white">
              <option value="donation_count">후원 횟수</option>
              <option value="unique_donors">고유 후원자 수</option>
              <option value="total_amount">총 후원 금액</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">목표 값</label>
            <input type="number" placeholder={goalType === 'total_amount' ? '100000' : '50'}
              value={goalValue} onChange={e => setGoalValue(e.target.value)}
              min={1}
              className="w-full p-3 rounded-lg bg-gray-800 text-white" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">보상</label>
          <input type="text" placeholder="예: 노래 한 곡, 게임 한 판"
            value={reward} onChange={e => setReward(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">시간 제한</label>
          <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white">
            <option value="">없음</option>
            <option value="30">30분</option>
            <option value="60">1시간</option>
            <option value="120">2시간</option>
          </select>
        </div>
        <button onClick={createMission}
          disabled={!title.trim() || !goalValue || !reward.trim()}
          className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
          🎯 미션 시작
        </button>
      </div>

      <div className="border-t border-gray-700" />

      {/* Tab switch */}
      <div className="flex gap-2">
        <button onClick={() => setTab('active')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'active' ? 'bg-purple-600' : 'bg-gray-800 text-gray-400'}`}>
          진행 중 ({activeMissions.length})
        </button>
        <button onClick={() => setTab('history')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === 'history' ? 'bg-purple-600' : 'bg-gray-800 text-gray-400'}`}>
          히스토리 ({completedMissions.length})
        </button>
      </div>

      {/* Active missions */}
      {tab === 'active' && (
        <div className="space-y-3">
          {activeMissions.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">활성 미션이 없습니다</p>
          )}
          {activeMissions.map(mission => (
            <div key={mission.id} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-white font-bold">{mission.title}</p>
                  <p className="text-xs text-gray-500">{GOAL_TYPE_LABELS[mission.goal_type]}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-600">진행 중</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-purple-500 rounded-full transition-all"
                  style={{ width: `${getProgressPercent(mission)}%` }} />
              </div>
              <div className="flex justify-between items-center text-xs text-gray-400">
                <span>{formatValue(mission)}</span>
                <span>보상: {mission.reward}</span>
              </div>
              <button onClick={() => cancelMission(mission.id)}
                className="w-full mt-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs hover:bg-red-600/30">
                미션 취소
              </button>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="space-y-3">
          {completedMissions.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-4">미션 히스토리가 없습니다</p>
          )}
          {completedMissions.map(mission => (
            <div key={mission.id} className="bg-gray-800/30 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <p className="text-white text-sm font-medium">{mission.title}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  mission.status === 'completed' ? 'bg-green-600/30 text-green-400' :
                  mission.status === 'expired' ? 'bg-yellow-600/30 text-yellow-400' :
                  'bg-red-600/30 text-red-400'
                }`}>
                  {mission.status === 'completed' ? '달성' :
                   mission.status === 'expired' ? '만료' : '취소'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formatValue(mission)} | 보상: {mission.reward}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
