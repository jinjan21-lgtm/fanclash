'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface Notification {
  id: string;
  type: 'donation' | 'battle' | 'rpg' | 'goal' | 'error';
  message: string;
  timestamp: number;
  read: boolean;
}

const TYPE_CONFIG: Record<Notification['type'], { icon: string; color: string }> = {
  donation: { icon: '💰', color: 'text-purple-400' },
  battle: { icon: '⚔️', color: 'text-orange-400' },
  rpg: { icon: '🎮', color: 'text-green-400' },
  goal: { icon: '🎯', color: 'text-blue-400' },
  error: { icon: '⚠️', color: 'text-red-400' },
};

const STORAGE_KEY = 'fanclash_notifications';
const MAX_NOTIFICATIONS = 20;

function loadNotifications(): Notification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveNotifications(items: Notification[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS)));
  } catch {
    // ignore quota errors
  }
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return '방금 전';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

// Global function to push a notification from outside
let pushNotificationFn: ((type: Notification['type'], message: string) => void) | null = null;

export function pushNotification(type: Notification['type'], message: string) {
  if (pushNotificationFn) {
    pushNotificationFn(type, message);
  }
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(loadNotifications());
  }, []);

  const addNotification = useCallback((type: Notification['type'], message: string) => {
    setNotifications(prev => {
      const next: Notification[] = [
        {
          id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          type,
          message,
          timestamp: Date.now(),
          read: false,
        },
        ...prev,
      ].slice(0, MAX_NOTIFICATIONS);
      saveNotifications(next);
      return next;
    });
  }, []);

  // Register global push function
  useEffect(() => {
    pushNotificationFn = addNotification;
    return () => { pushNotificationFn = null; };
  }, [addNotification]);

  // Listen to custom events from DashboardNotifications
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.type && detail?.message) {
        addNotification(detail.type, detail.message);
      }
    };
    window.addEventListener('fanclash:notification', handler);
    return () => window.removeEventListener('fanclash:notification', handler);
  }, [addNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => {
      const next = prev.map(n => ({ ...n, read: true }));
      saveNotifications(next);
      return next;
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
        aria-label="알림"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-bold">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                모두 읽음
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                알림이 없습니다
              </div>
            ) : (
              notifications.map(n => {
                const config = TYPE_CONFIG[n.type];
                return (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-gray-800/50 last:border-0 ${
                      !n.read ? 'bg-gray-800/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-base mt-0.5">{config.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.read ? 'font-medium' : 'text-gray-400'}`}>
                          {n.message}
                        </p>
                        <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.timestamp)}</p>
                      </div>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
