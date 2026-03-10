'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

interface Message {
  nickname: string;
  amount: number;
  message: string;
  id: number;
}

let msgId = 0;

export default function MessageBoard({ widget }: { widget: Widget }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];
  const maxMessages = ((widget.config as any)?.maxMessages as number) || 5;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    const handler = (data: any) => {
      if (!data.message) return; // Skip donations without messages
      setMessages(prev => [
        { nickname: data.fan_nickname, amount: data.amount, message: data.message, id: msgId++ },
        ...prev,
      ].slice(0, maxMessages));
    };
    socket.on('donation:new', handler);
    return () => { socket.off('donation:new', handler); };
  }, [socketRef.current, maxMessages]);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: -40, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`mb-2 p-3 rounded-xl ${theme.card} border ${theme.border} backdrop-blur-sm`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-bold text-sm ${theme.accent}`}>{msg.nickname}</span>
              <span className="text-xs text-gray-500">{msg.amount.toLocaleString()}원</span>
            </div>
            <p className={`text-sm ${theme.text}`}>{msg.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {messages.length === 0 && (
        <div className={`text-center py-4 text-sm text-gray-600 ${theme.fontClass}`}>
          메시지를 기다리는 중...
        </div>
      )}
    </div>
  );
}
