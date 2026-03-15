'use client';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export default function DashboardNotifications() {
  const { toast } = useToast();
  const socketRef = useRef<Socket | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      if (!socketUrl) return;
      const socket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        // Subscribe to streamer room directly using streamer ID
        socket.emit('streamer:subscribe', user.id);
        setReady(true);
      });

      const notify = (type: string, message: string) => {
        window.dispatchEvent(new CustomEvent('fanclash:notification', { detail: { type, message } }));
      };

      socket.on('donation:new', (data: { fan_nickname: string; amount: number; message?: string }) => {
        const msg = `${data.fan_nickname}님이 ${data.amount.toLocaleString()}원 후원!${data.message ? ` "${data.message}"` : ''}`;
        toast(msg);
        notify('donation', msg);
      });

      socket.on('throne:change', (data: { fan_nickname: string }) => {
        const msg = `${data.fan_nickname}님이 새로운 왕좌를 차지했습니다!`;
        toast(msg);
        notify('donation', msg);
      });

      socket.on('battle:finished', (data: { winner?: string }) => {
        const msg = `배틀 종료! ${data.winner ? `승자: ${data.winner}` : '무승부'}`;
        toast(msg);
        notify('battle', msg);
      });

      socket.on('affinity:levelup', (data: { fan_nickname: string; level: number; title: string }) => {
        const msg = `${data.fan_nickname}님이 ${data.title}(Lv.${data.level})로 레벨업!`;
        toast(msg);
        notify('rpg', msg);
      });

      socket.on('goal:complete', (data: { title?: string }) => {
        const msg = `도네이션 목표 달성! ${data.title || ''}`;
        toast(msg);
        notify('goal', msg);
      });

      socket.on('integration:error', (data: { platform: string; message: string }) => {
        const msg = `${data.platform} 연동 오류: ${data.message}`;
        toast(msg, 'error');
        notify('error', msg);
      });
    })();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return null; // No UI, just toast notifications
}
