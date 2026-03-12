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

      socket.on('donation:new', (data: { fan_nickname: string; amount: number; message?: string }) => {
        toast(`${data.fan_nickname}님이 ${data.amount.toLocaleString()}원 후원!${data.message ? ` "${data.message}"` : ''}`);
      });
    })();

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return null; // No UI, just toast notifications
}
