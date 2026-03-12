'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { createClient } from '@/lib/supabase/client';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

interface Message {
  nickname: string;
  amount: number;
  message: string;
  id: number;
}

let msgId = 0;

/* ── theme-aware glow colors for box-shadow effects ── */
const glowColors: Record<string, { border: string; flash: string; breathe: string; shimmer: string }> = {
  modern: {
    border: 'rgba(168,85,247,0.6)',
    flash: 'rgba(168,85,247,0.45)',
    breathe: 'rgba(168,85,247,0.35)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.5) 50%, transparent 100%)',
  },
  game: {
    border: 'rgba(34,211,238,0.6)',
    flash: 'rgba(234,179,8,0.45)',
    breathe: 'rgba(34,211,238,0.35)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(234,179,8,0.5) 50%, transparent 100%)',
  },
  girlcam: {
    border: 'rgba(244,114,182,0.6)',
    flash: 'rgba(244,114,182,0.45)',
    breathe: 'rgba(244,114,182,0.35)',
    shimmer: 'linear-gradient(90deg, transparent 0%, rgba(244,114,182,0.5) 50%, transparent 100%)',
  },
};

export default function MessageBoard({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { socketRef, on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];
  const maxMessages = ((widget.config as any)?.maxMessages as number) || 5;
  const glow = glowColors[widget.theme] || glowColors.modern;

  /* track the newest message id so we can flash it */
  const newestIdRef = useRef<number | null>(null);
  const [flashId, setFlashId] = useState<number | null>(null);

  // Load recent messages from DB
  useEffect(() => {
    if (preview) return;
    const supabase = createClient();
    supabase
      .from('donations')
      .select('fan_nickname, amount, message')
      .eq('streamer_id', widget.streamer_id)
      .not('message', 'eq', '')
      .order('created_at', { ascending: false })
      .limit(maxMessages)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setMessages(data.map(d => ({
            nickname: d.fan_nickname,
            amount: d.amount,
            message: d.message || '',
            id: msgId++,
          })));
        }
      });
  }, [widget.streamer_id, maxMessages, preview]);

  useEffect(() => {
    if (!ready) return;
    const handler = (data: any) => {
      if (!data.message) return; // Skip donations without messages
      const newId = msgId++;
      newestIdRef.current = newId;
      setFlashId(newId);
      setMessages(prev => [
        { nickname: data.fan_nickname, amount: data.amount, message: data.message, id: newId },
        ...prev,
      ].slice(0, maxMessages));
      // Clear flash after animation
      setTimeout(() => setFlashId(null), 600);
    };
    on('donation:new', handler);
  }, [ready, maxMessages]);

  // Show demo messages in preview mode
  useEffect(() => {
    if (preview && messages.length === 0) {
      setMessages([
        { nickname: '별빛소나기', amount: 10000, message: '오늘 방송 너무 재밌어요! 화이팅!', id: msgId++ },
        { nickname: '치즈덕후', amount: 5000, message: '노래 한 곡 불러주세요~', id: msgId++ },
        { nickname: '밤하늘구름', amount: 3000, message: '첫 후원입니다 ㅎㅎ', id: msgId++ },
      ]);
    }
  }, [preview]);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      {/* Shimmer keyframes + breathing glow injected once */}
      <style>{`
        @keyframes mb-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes mb-breathe {
          0%, 100% { box-shadow: 0 0 6px ${glow.breathe}; }
          50%      { box-shadow: 0 0 18px ${glow.breathe}, 0 0 30px ${glow.breathe}; }
        }
        @keyframes mb-border-glow {
          0%   { opacity: 0; box-shadow: inset 3px 0 6px -2px ${glow.border}; }
          100% { opacity: 1; box-shadow: inset 3px 0 8px -2px ${glow.border}; }
        }
      `}</style>

      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          const isLatest = index === 0;
          const isFlashing = flashId === msg.id;

          return (
            <motion.div
              key={msg.id}
              layout
              /* ── Entry: slide from left + rotation + scale bounce ── */
              initial={{ opacity: 0, x: -60, scale: 0.85, rotate: -2, filter: 'blur(4px)' }}
              animate={{
                opacity: 1,
                x: 0,
                scale: [0.85, 1.05, 1],
                rotate: 0,
                filter: 'blur(0px)',
              }}
              /* ── Exit: fade up and shrink ── */
              exit={{ opacity: 0, y: -20, scale: 0.8, filter: 'blur(3px)' }}
              transition={{
                type: 'spring',
                stiffness: 340,
                damping: 22,
                delay: index * 0.08, // staggered children
                scale: { type: 'spring', stiffness: 400, damping: 15, delay: index * 0.08 },
              }}
              className={`mb-2 p-3 rounded-xl ${theme.card} border ${theme.border} backdrop-blur-sm relative overflow-hidden`}
              style={{
                /* glowing left border that fades in */
                borderLeft: `3px solid transparent`,
                animation: isLatest
                  ? `mb-border-glow 0.6s ease forwards, mb-breathe 2.4s ease-in-out infinite 0.6s`
                  : `mb-border-glow 0.6s ease forwards`,
                /* new-message flash */
                boxShadow: isFlashing
                  ? `0 0 24px ${glow.flash}, 0 0 48px ${glow.flash}`
                  : undefined,
                transition: 'box-shadow 0.4s ease',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                {/* Nickname with continuous shimmer */}
                <span
                  className={`font-bold text-sm ${theme.accent}`}
                  style={{
                    backgroundImage: glow.shimmer,
                    backgroundSize: '200% 100%',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'mb-shimmer 3s linear infinite',
                  }}
                >
                  {msg.nickname}
                </span>

                {/* Amount badge with delayed pop-in */}
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 500,
                    damping: 18,
                    delay: index * 0.08 + 0.25,
                  }}
                  className="text-xs text-gray-500 inline-block"
                >
                  {msg.amount.toLocaleString()}원
                </motion.span>
              </div>
              <p className={`text-sm ${theme.text}`}>{msg.message}</p>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {messages.length === 0 && (
        <div className={`text-center py-4 text-sm text-gray-600 ${theme.fontClass}`}>
          메시지를 기다리는 중...
        </div>
      )}
    </div>
  );
}
