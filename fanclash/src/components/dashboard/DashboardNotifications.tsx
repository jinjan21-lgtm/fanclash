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

      // Get any widget to subscribe (we need the streamer room)
      const { data: widgets } = await supabase.from('widgets').select('id').eq('streamer_id', user.id).limit(1);
      if (!widgets?.length) return;

      const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('widget:subscribe', widgets[0].id);
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
