'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget, Donation } from '@/types';
import { playSound } from '@/lib/sound';

interface DonationAlertConfig {
  alertDuration?: number;
  soundUrl?: string;
  minAmount?: number;
  showMessage?: boolean;
  ttsEnabled?: boolean;
  ttsVoice?: string;
}

type AlertData = Pick<Donation, 'fan_nickname' | 'amount' | 'message'>;

const DEMO_ALERT: AlertData = {
  fan_nickname: '별빛소나기',
  amount: 10000,
  message: '스트리머님 화이팅! 오늘 방송 너무 재밌어요 ㅎㅎ',
};

function formatAmount(amount: number): string {
  if (amount >= 10000) {
    const man = amount / 10000;
    return Number.isInteger(man) ? `${man}만원` : `${man.toFixed(1)}만원`;
  }
  return `${amount.toLocaleString('ko-KR')}원`;
}

function speakTTS(text: string, voice: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice;
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.volume = 0.9;

    // Try to pick a voice matching the language
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find((v) => v.lang.startsWith(voice.split('-')[0]));
    if (matched) utterance.voice = matched;

    window.speechSynthesis.speak(utterance);
  } catch {
    // Silent fail
  }
}

// Particle definitions
const PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  angle: (i * Math.PI * 2) / 12,
  radius: 220 + Math.random() * 60,
  size: 6 + Math.floor(Math.random() * 8),
  color: ['bg-yellow-400', 'bg-pink-400', 'bg-purple-400', 'bg-cyan-400', 'bg-green-400'][i % 5],
  delay: 0.05 + (i % 4) * 0.04,
}));

const SPARKLES = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  x: [-80, -60, -40, 40, 60, 80][i],
  y: [-60, -80, -40, -40, -80, -60][i],
  delay: 0.2 + i * 0.07,
}));

export default function DonationAlert({ widget, preview }: { widget: Widget; preview?: boolean }) {
  const [current, setCurrent] = useState<AlertData | null>(null);
  const queueRef = useRef<AlertData[]>([]);
  const busyRef = useRef(false);
  const { socketRef, on, ready } = useSocket(widget.id);
  const theme = themes[widget.theme];

  const cfg = widget.config as DonationAlertConfig;
  const alertDuration = (cfg.alertDuration ?? 5) * 1000;
  const minAmount = cfg.minAmount ?? 0;
  const showMessage = cfg.showMessage !== false;
  const ttsEnabled = cfg.ttsEnabled ?? false;
  const ttsVoice = cfg.ttsVoice ?? 'ko-KR';

  const showNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      busyRef.current = false;
      setCurrent(null);
      return;
    }
    busyRef.current = true;
    const next = queueRef.current.shift()!;
    setCurrent(next);

    // Sound
    playSound(cfg.soundUrl);

    // TTS
    if (ttsEnabled) {
      const ttsText = `${next.fan_nickname}님이 ${formatAmount(next.amount)} 후원하셨습니다.${next.message ? ` ${next.message}` : ''}`;
      speakTTS(ttsText, ttsVoice);
    }

    // Auto-dismiss
    setTimeout(() => {
      setCurrent(null);
      // Small gap between queued alerts
      setTimeout(showNext, 400);
    }, alertDuration);
  }, [alertDuration, cfg.soundUrl, ttsEnabled, ttsVoice]);

  const enqueue = useCallback(
    (data: AlertData) => {
      if (data.amount < minAmount) return;
      queueRef.current.push(data);
      if (!busyRef.current) showNext();
    },
    [minAmount, showNext],
  );

  // Socket listener
  useEffect(() => {
    if (!ready) return;
    const handler = (data: Donation) => {
      enqueue({ fan_nickname: data.fan_nickname, amount: data.amount, message: data.message });
    };
    on('donation:new', handler);
  }, [ready, enqueue]);

  // Preview mode
  useEffect(() => {
    if (!preview) return;
    enqueue(DEMO_ALERT);
  }, [preview]);

  // Theme-aware accent colours
  const accentRing =
    widget.theme === 'girlcam'
      ? 'border-pink-400 shadow-pink-500/30'
      : widget.theme === 'game'
        ? 'border-cyan-400 shadow-cyan-500/30'
        : 'border-purple-500 shadow-purple-500/30';

  const amountColor =
    widget.theme === 'girlcam'
      ? 'text-pink-300'
      : widget.theme === 'game'
        ? 'text-yellow-300'
        : 'text-purple-300';

  const heartEmoji = widget.theme === 'girlcam' ? '💗' : widget.theme === 'game' ? '⚡' : '💜';

  return (
    <div className={`${theme.bg} ${theme.fontClass} w-full h-full`}>
      <AnimatePresence mode="wait">
        {current && (
          <motion.div
            key={`${current.fan_nickname}-${current.amount}`}
            className="fixed inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Radial glow backdrop */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0] }}
              transition={{ duration: alertDuration / 1000, ease: 'easeOut' }}
            >
              <div
                className={`absolute inset-0 ${
                  widget.theme === 'girlcam'
                    ? 'bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.25)_0%,_transparent_70%)]'
                    : widget.theme === 'game'
                      ? 'bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.25)_0%,_transparent_70%)]'
                      : 'bg-[radial-gradient(ellipse_at_center,_rgba(168,85,247,0.25)_0%,_transparent_70%)]'
                }`}
              />
            </motion.div>

            {/* Burst particles */}
            {PARTICLES.map((p) => (
              <motion.div
                key={p.id}
                className={`absolute rounded-full ${p.color} pointer-events-none`}
                style={{ width: p.size, height: p.size }}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{
                  scale: [0, 1.4, 0],
                  x: Math.cos(p.angle) * p.radius,
                  y: Math.sin(p.angle) * p.radius,
                  opacity: [1, 0.8, 0],
                }}
                transition={{ duration: 1.1, delay: p.delay, ease: 'easeOut' }}
              />
            ))}

            {/* Sparkle stars */}
            {SPARKLES.map((s) => (
              <motion.div
                key={s.id}
                className="absolute text-yellow-300 text-xl pointer-events-none select-none"
                initial={{ scale: 0, x: s.x, y: s.y, opacity: 0, rotate: 0 }}
                animate={{
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0],
                  rotate: [0, 180],
                  y: [s.y, s.y - 30],
                }}
                transition={{ duration: 1.0, delay: s.delay, ease: 'easeOut' }}
              >
                ✦
              </motion.div>
            ))}

            {/* Main card */}
            <motion.div
              className={`relative text-center px-12 py-10 rounded-3xl ${theme.card} border-2 ${accentRing} shadow-2xl max-w-lg w-full mx-6`}
              initial={{ scale: 0.3, opacity: 0, rotate: -8, y: 40 }}
              animate={{ scale: 1, opacity: 1, rotate: 0, y: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 6, y: -30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20, mass: 0.9 }}
            >
              {/* Heart / icon */}
              <motion.div
                className="text-6xl mb-3 leading-none"
                animate={{
                  scale: [1, 1.25, 0.95, 1.1, 1],
                  rotate: [0, -12, 12, -6, 0],
                }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              >
                {heartEmoji}
              </motion.div>

              {/* Label */}
              <motion.p
                className={`text-sm font-semibold tracking-widest uppercase mb-2 ${theme.accent}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                후원 알림
              </motion.p>

              {/* Nickname */}
              <motion.h2
                className={`text-3xl font-extrabold mb-1 ${theme.text} drop-shadow-md`}
                initial={{ y: 16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 22 }}
              >
                {current.fan_nickname}
              </motion.h2>

              {/* Amount */}
              <motion.div
                className={`text-5xl font-black mt-1 mb-4 ${amountColor} drop-shadow-lg`}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{
                  scale: [0.4, 1.2, 0.92, 1.05, 1],
                  opacity: 1,
                }}
                transition={{ delay: 0.5, duration: 0.7, ease: 'easeOut' }}
              >
                {formatAmount(current.amount)}
              </motion.div>

              {/* Divider */}
              <motion.div
                className={`h-px w-3/4 mx-auto mb-4 ${
                  widget.theme === 'girlcam'
                    ? 'bg-gradient-to-r from-transparent via-pink-400 to-transparent'
                    : widget.theme === 'game'
                      ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-purple-400 to-transparent'
                }`}
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              />

              {/* Message */}
              {showMessage && current.message && (
                <motion.p
                  className={`text-base leading-relaxed ${theme.text} opacity-80 break-words`}
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.75, type: 'spring', stiffness: 200, damping: 18 }}
                >
                  &ldquo;{current.message}&rdquo;
                </motion.p>
              )}

              {/* Progress bar (auto-dismiss timer) */}
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl overflow-hidden"
              >
                <motion.div
                  className={`h-full ${
                    widget.theme === 'girlcam'
                      ? 'bg-pink-400'
                      : widget.theme === 'game'
                        ? 'bg-cyan-400'
                        : 'bg-purple-400'
                  }`}
                  initial={{ scaleX: 1, originX: 0 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: alertDuration / 1000, ease: 'linear', delay: 0.15 }}
                />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
