'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { createClient } from '@/lib/supabase/client';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

interface WallCard {
  nickname: string;
  amount: number;
  message: string;
  id: number;
}

let cardId = 0;

function getAmountTier(amount: number): { bg: string; border: string; nicknameColor: string } {
  if (amount >= 30000) return { bg: 'bg-yellow-900/40', border: 'border-yellow-500/60', nicknameColor: 'text-yellow-400' };
  if (amount >= 10000) return { bg: 'bg-purple-900/40', border: 'border-purple-500/60', nicknameColor: 'text-purple-400' };
  if (amount >= 3000) return { bg: 'bg-blue-900/40', border: 'border-blue-500/60', nicknameColor: 'text-blue-400' };
  return { bg: 'bg-gray-800/40', border: 'border-gray-600/60', nicknameColor: 'text-gray-400' };
}

export default function MessageBoard({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [cards, setCards] = useState<WallCard[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const { on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];
  const config = widget.config as Record<string, unknown>;
  const maxVisible = (config?.maxVisible as number) || 30;
  const showAmount = (config?.showAmount ?? true) as boolean;

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
      .limit(maxVisible)
      .then(({ data, error }) => {
        if (error) { console.error('MessageBoard query failed:', error); return; }
        if (data && data.length > 0) {
          const loaded = data.reverse().map(d => ({
            nickname: d.fan_nickname,
            amount: d.amount,
            message: d.message || '',
            id: cardId++,
          }));
          setCards(loaded);
          setTotalCount(loaded.length);
        }
      });
  }, [widget.streamer_id, maxVisible, preview]);

  // Socket: listen for new donations
  useEffect(() => {
    if (!ready) return;
    const handler = (data: { fan_nickname: string; amount: number; message?: string }) => {
      if (!data.message) return;
      const newCard: WallCard = {
        nickname: data.fan_nickname,
        amount: data.amount,
        message: data.message,
        id: cardId++,
      };
      setTotalCount(prev => prev + 1);
      setCards(prev => [...prev, newCard].slice(-maxVisible));
    };
    on('donation:new', handler);
  }, [ready, maxVisible, on]);

  // Demo messages in preview mode
  useEffect(() => {
    if (preview && cards.length === 0) {
      const demoCards: WallCard[] = [
        { nickname: '별빛팬', amount: 5000, message: '화이팅!', id: cardId++ },
        { nickname: '후원왕', amount: 10000, message: '대박!!', id: cardId++ },
        { nickname: '치킨러버', amount: 3000, message: '최고!', id: cardId++ },
        { nickname: '고래밥', amount: 1000, message: '응원!', id: cardId++ },
        { nickname: '불꽃소녀', amount: 50000, message: '사랑해', id: cardId++ },
        { nickname: '달빛기사', amount: 2000, message: '멋져요~', id: cardId++ },
        { nickname: '새벽감성', amount: 30000, message: '오늘도 파이팅', id: cardId++ },
        { nickname: '꿈나무', amount: 1000, message: '첫 후원!', id: cardId++ },
      ];
      setCards(demoCards);
      setTotalCount(demoCards.length);
    }
  }, [preview, cards.length]);

  return (
    <div className={`p-4 h-full ${theme.bg} ${theme.fontClass}`}>
      {/* Header counter */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">💬</span>
        <span className={`text-sm font-bold ${theme.accent}`}>
          오늘의 응원 ({totalCount}건)
        </span>
      </div>

      {/* Fan wall grid */}
      <div className="flex flex-wrap gap-2 content-start overflow-hidden" style={{ maxHeight: 'calc(100% - 40px)' }}>
        <AnimatePresence mode="popLayout">
          {cards.map(card => {
            const tier = getAmountTier(card.amount);
            return (
              <motion.div
                key={card.id}
                layout
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className={`${tier.bg} ${tier.border} border rounded-lg px-3 py-2 backdrop-blur-sm`}
                style={{ minWidth: '80px', maxWidth: '140px' }}
              >
                <p className={`text-[11px] font-bold truncate ${tier.nicknameColor}`}>
                  {card.nickname}
                </p>
                <p className={`text-sm leading-tight mt-0.5 ${theme.text}`}>
                  {card.message}
                </p>
                {showAmount && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {card.amount.toLocaleString()}원
                  </p>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {cards.length === 0 && (
        <div className={`text-center py-8 text-sm text-gray-600 ${theme.fontClass}`}>
          응원 메시지를 기다리는 중...
        </div>
      )}
    </div>
  );
}
