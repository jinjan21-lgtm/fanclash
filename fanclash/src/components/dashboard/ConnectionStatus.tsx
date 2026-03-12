'use client';
import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket/client';

type Status = 'connected' | 'disconnected' | 'reconnecting';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('disconnected');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let s: ReturnType<typeof getSocket>;
    try {
      s = getSocket();
    } catch {
      return;
    }

    if (s.connected) setStatus('connected');

    s.on('connect', () => { setStatus('connected'); setAttempt(0); });
    s.on('disconnect', () => setStatus('disconnected'));
    s.io.on('reconnect_attempt', (n) => { setStatus('reconnecting'); setAttempt(n); });
    s.io.on('reconnect_failed', () => setStatus('disconnected'));

    return () => {
      s.off('connect');
      s.off('disconnect');
      s.io.off('reconnect_attempt');
      s.io.off('reconnect_failed');
    };
  }, []);

  const handleReconnect = () => {
    try {
      const s = getSocket();
      s.connect();
      setStatus('reconnecting');
    } catch {
      // socket URL not configured
    }
  };

  const config: Record<Status, { color: string; bg: string; border: string; label: string }> = {
    connected: { color: 'text-green-400', bg: 'bg-green-400', border: 'border-green-800', label: '서버 연결됨' },
    reconnecting: { color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-800', label: `재연결 중... (${attempt}/10)` },
    disconnected: { color: 'text-red-400', bg: 'bg-red-400', border: 'border-red-800', label: '연결 끊김' },
  };

  const c = config[status];

  return (
    <div className={`flex items-center gap-3 bg-gray-900 rounded-xl px-5 py-3 border ${c.border}`}>
      <span className="relative flex h-3 w-3">
        {status === 'connected' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${c.bg} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-3 w-3 ${c.bg}`} />
      </span>
      <span className={`text-sm font-medium ${c.color}`}>{c.label}</span>
      {status === 'disconnected' && (
        <button
          onClick={handleReconnect}
          className="ml-auto px-3 py-1 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium transition-colors"
        >
          재연결
        </button>
      )}
      {status === 'reconnecting' && (
        <span className="ml-auto text-xs text-yellow-500">자동 재연결 시도 중...</span>
      )}
    </div>
  );
}
