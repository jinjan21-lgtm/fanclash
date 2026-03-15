'use client';
import { useEffect, useState, useCallback } from 'react';
import { getAchievementById, RARITY_COLORS } from '@/lib/achievements';

interface AchievementNotification {
  id: string;
  achievementId: string;
  nickname: string;
  timestamp: number;
}

interface AchievementPopupProps {
  widgetId?: string;
}

/**
 * AchievementPopup is a shared overlay component, not a standalone widget.
 * It listens for `achievement:unlocked` socket events and displays a popup.
 */
export default function AchievementPopup({ widgetId }: AchievementPopupProps) {
  const [notification, setNotification] = useState<AchievementNotification | null>(null);

  const showAchievement = useCallback((achievementId: string, nickname: string) => {
    const achievement = getAchievementById(achievementId);
    if (!achievement) return;

    setNotification({
      id: `${achievementId}-${Date.now()}`,
      achievementId,
      nickname,
      timestamp: Date.now(),
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  }, []);

  // Expose for external use
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__achievementPopup = { showAchievement };
    return () => { delete (window as unknown as Record<string, unknown>).__achievementPopup; };
  }, [showAchievement]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socket.on('connect', () => socket.emit('widget:subscribe', widgetId));
      socket.on('achievement:unlocked' as any, (data: { achievement_id: string; fan_nickname: string }) => {
        showAchievement(data.achievement_id, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, showAchievement]);

  if (!notification) return null;

  const achievement = getAchievementById(notification.achievementId);
  if (!achievement) return null;

  const rarityStyle = RARITY_COLORS[achievement.rarity];

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none"
      style={{ animation: 'achievementSlideIn 0.5s ease-out' }}>
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border-2 ${rarityStyle.border} ${rarityStyle.bg} ${rarityStyle.glow || ''} backdrop-blur-sm`}>
        <span className="text-3xl" style={{ animation: 'achievementBounce 0.5s ease-out 0.2s both' }}>
          {achievement.icon}
        </span>
        <div>
          <p className="text-xs text-gray-400">{notification.nickname}</p>
          <p className={`font-bold ${rarityStyle.text}`}>{achievement.name}</p>
          <p className="text-xs text-gray-500">{achievement.description}</p>
        </div>
      </div>
      <style>{`
        @keyframes achievementSlideIn { 0% { opacity: 0; transform: translateX(100px); } 100% { opacity: 1; transform: translateX(0); } }
        @keyframes achievementBounce { 0% { transform: scale(0); } 60% { transform: scale(1.3); } 100% { transform: scale(1); } }
      `}</style>
    </div>
  );
}
