'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket/client';

export function useSocket(widgetId: string) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);
  const listenersRef = useRef<Array<{ event: string; handler: (...args: any[]) => void }>>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    const onConnect = () => {
      socket.emit('widget:subscribe' as any, widgetId);
      setReady(true);
    };

    if (socket.connected) {
      onConnect();
    } else {
      socket.on('connect', onConnect);
    }

    return () => {
      socket.off('connect', onConnect);
      for (const { event, handler } of listenersRef.current) {
        socket.off(event as any, handler);
      }
      listenersRef.current = [];
    };
  }, [widgetId]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    const socket = socketRef.current;
    if (socket) {
      socket.on(event as any, handler);
      listenersRef.current.push({ event, handler });
    }
  }, []);

  return { socketRef, on, ready };
}
