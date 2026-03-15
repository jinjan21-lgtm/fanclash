'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface Mission {
  id: string;
  title: string;
  description?: string;
  goal_type: 'donation_count' | 'unique_donors' | 'total_amount';
  goal_value: number;
  current_value: number;
  reward: string;
  time_limit_minutes?: number;
  started_at: string;
  status: string;
}

interface DonationMissionProps {
  widgetId?: string;
  config?: {
    defaultTimeLimit?: string;
    showReward?: boolean;
    maxVisible?: number;
  };
}

export default function DonationMission({ widgetId, config }: DonationMissionProps) {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completedMission, setCompletedMission] = useState<Mission | null>(null);
  const donorsRef = useRef<Set<string>>(new Set());
  const showReward = config?.showReward ?? true;
  const maxVisible = config?.maxVisible ?? 3;

  const updateMissionProgress = useCallback((mission: Mission, amount: number, nickname: string) => {
    let newValue = mission.current_value;
    switch (mission.goal_type) {
      case 'donation_count':
        newValue += 1;
        break;
      case 'unique_donors':
        if (!donorsRef.current.has(`${mission.id}:${nickname}`)) {
          donorsRef.current.add(`${mission.id}:${nickname}`);
          newValue += 1;
        }
        break;
      case 'total_amount':
        newValue += amount;
        break;
    }
    return newValue;
  }, []);

  const handleDonation = useCallback((amount: number, nickname: string) => {
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.status !== 'active') return m;
        const newValue = updateMissionProgress(m, amount, nickname);
        if (newValue >= m.goal_value && m.current_value < m.goal_value) {
          const completed = { ...m, current_value: m.goal_value, status: 'completed' };
          setTimeout(() => {
            setCompletedMission(completed);
            setTimeout(() => setCompletedMission(null), 5000);
          }, 300);
          return completed;
        }
        return { ...m, current_value: Math.min(newValue, m.goal_value) };
      });
      return updated;
    });
  }, [updateMissionProgress]);

  const addMission = useCallback((mission: Mission) => {
    setMissions(prev => {
      if (prev.some(m => m.id === mission.id)) return prev;
      return [...prev, mission];
    });
  }, []);

  const removeMission = useCallback((missionId: string) => {
    setMissions(prev => prev.filter(m => m.id !== missionId));
  }, []);

  // Expose for demo/socket
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationMission = {
      handleDonation, addMission, removeMission,
    };
    return () => { delete (window as unknown as Record<string, unknown>).__donationMission; };
  }, [handleDonation, addMission, removeMission]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socket.on('connect', () => socket.emit('widget:subscribe', widgetId));
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        handleDonation(data.amount, data.fan_nickname);
      });
      socket.on('mission:update' as any, (data: { mission: Mission }) => {
        setMissions(prev => prev.map(m => m.id === data.mission.id ? data.mission : m));
      });
      socket.on('mission:create' as any, (data: { mission: Mission }) => {
        addMission(data.mission);
      });
      socket.on('mission:cancel' as any, (data: { missionId: string }) => {
        removeMission(data.missionId);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, handleDonation, addMission, removeMission]);

  // Timer countdown for time-limited missions
  useEffect(() => {
    const interval = setInterval(() => {
      setMissions(prev => prev.map(m => {
        if (m.status !== 'active' || !m.time_limit_minutes) return m;
        const elapsed = (Date.now() - new Date(m.started_at).getTime()) / 1000 / 60;
        if (elapsed >= m.time_limit_minutes) {
          return { ...m, status: 'expired' };
        }
        return m;
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeMissions = missions.filter(m => m.status === 'active').slice(0, maxVisible);

  const getGoalLabel = (type: string) => {
    switch (type) {
      case 'donation_count': return '후원';
      case 'unique_donors': return '명';
      case 'total_amount': return '원';
      default: return '';
    }
  };

  const formatTimeRemaining = (mission: Mission) => {
    if (!mission.time_limit_minutes) return null;
    const endTime = new Date(mission.started_at).getTime() + mission.time_limit_minutes * 60 * 1000;
    const remaining = Math.max(0, endTime - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Completion celebration
  if (completedMission) {
    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="absolute text-2xl"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animation: `confettiFall ${2 + Math.random() * 2}s ease-in ${Math.random() * 0.5}s forwards`,
              }}>
              {['🎉', '🎊', '✨', '⭐', '🏆'][i % 5]}
            </div>
          ))}
        </div>
        <div className="text-center p-8 rounded-2xl bg-gray-900/95 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30 max-w-md w-full mx-4"
          style={{ animation: 'missionComplete 0.6s ease-out' }}>
          <div className="text-6xl mb-3" style={{ animation: 'bounceIn 0.5s ease-out 0.3s both' }}>🏆</div>
          <p className="text-3xl font-black text-yellow-400 mb-2" style={{ animation: 'fadeSlideUp 0.5s ease-out 0.4s both' }}>
            미션 달성!
          </p>
          <p className="text-xl font-bold text-white mb-4">{completedMission.title}</p>
          {showReward && (
            <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-500/30">
              <p className="text-sm text-yellow-400 mb-1">보상</p>
              <p className="text-lg font-bold text-white">{completedMission.reward}</p>
            </div>
          )}
        </div>
        <style>{`
          @keyframes missionComplete { 0% { opacity: 0; transform: scale(0.5); } 100% { opacity: 1; transform: scale(1); } }
          @keyframes bounceIn { 0% { opacity: 0; transform: scale(0) rotate(-20deg); } 60% { transform: scale(1.3) rotate(10deg); } 100% { opacity: 1; transform: scale(1) rotate(0); } }
          @keyframes fadeSlideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
          @keyframes confettiFall { 0% { transform: translateY(0) rotate(0); opacity: 1; } 100% { transform: translateY(120vh) rotate(720deg); opacity: 0; } }
        `}</style>
      </div>
    );
  }

  if (activeMissions.length === 0) {
    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="text-center p-6 rounded-2xl bg-gray-900/80 border border-gray-700">
          <div className="text-4xl mb-2" style={{ animation: 'missionPulse 2s ease-in-out infinite' }}>🎯</div>
          <p className="text-lg font-bold text-white">팬 미션</p>
          <p className="text-gray-500 text-sm">활성 미션 없음</p>
        </div>
        <style>{`
          @keyframes missionPulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-end p-4 gap-3" style={{ background: 'transparent' }}>
      {activeMissions.map((mission, i) => {
        const progress = Math.min(100, (mission.current_value / mission.goal_value) * 100);
        const timeRemaining = formatTimeRemaining(mission);
        const isAlmostDone = progress >= 80;

        return (
          <div key={mission.id}
            className="bg-gray-900/90 rounded-xl p-4 border border-purple-500/40 shadow-lg"
            style={{ animation: `slideUp 0.4s ease-out ${i * 0.1}s both` }}>
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎯</span>
                  <h3 className="font-bold text-white text-sm">{mission.title}</h3>
                </div>
                {showReward && (
                  <p className="text-xs text-yellow-400 mt-0.5 ml-7">
                    보상: {mission.reward}
                  </p>
                )}
              </div>
              {timeRemaining && (
                <span className={`text-xs font-mono font-bold px-2 py-1 rounded ${
                  parseInt(timeRemaining) <= 5 ? 'text-red-400 bg-red-900/30' : 'text-gray-400 bg-gray-800'
                }`}>
                  {timeRemaining}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progress}%`,
                  background: isAlmostDone
                    ? 'linear-gradient(to right, #f59e0b, #ef4444)'
                    : 'linear-gradient(to right, #8b5cf6, #a855f7)',
                  animation: isAlmostDone ? 'progressPulse 1s ease-in-out infinite' : undefined,
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90">
                {mission.goal_type === 'total_amount'
                  ? `${mission.current_value.toLocaleString()} / ${mission.goal_value.toLocaleString()}${getGoalLabel(mission.goal_type)}`
                  : `${mission.current_value} / ${mission.goal_value}${getGoalLabel(mission.goal_type)}`}
              </span>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes progressPulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.3); } }
      `}</style>
    </div>
  );
}
