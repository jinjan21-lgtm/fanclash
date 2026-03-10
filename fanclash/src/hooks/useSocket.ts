'use client';
import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket/client';

export function useSocket(widgetId: string) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('widget:subscribe' as any, widgetId);
    socketRef.current = socket;
    return () => { socket.off(); };
  }, [widgetId]);

  return socketRef;
}
