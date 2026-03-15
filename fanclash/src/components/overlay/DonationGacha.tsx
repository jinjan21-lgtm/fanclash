'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

// 등급별 확률 및 이펙트
const GRADES = [
  { grade: 'N', label: 'Normal', color: '#6b7280', bgGlow: '', chance: 0.40, emoji: '⬜', screenEffect: false },
  { grade: 'R', label: 'Rare', color: '#3b82f6', bgGlow: 'shadow-blue-500/30', chance: 0.30, emoji: '🟦', screenEffect: false },
  { grade: 'SR', label: 'Super Rare', color: '#a855f7', bgGlow: 'shadow-purple-500/40', chance: 0.20, emoji: '🟪', screenEffect: true },
  { grade: 'SSR', label: 'Super Super Rare', color: '#f59e0b', bgGlow: 'shadow-yellow-500/50', chance: 0.08, emoji: '🟨', screenEffect: true },
  { grade: 'UR', label: 'Ultra Rare', color: '#ef4444', bgGlow: 'shadow-red-500/60', chance: 0.02, emoji: '❤️‍🔥', screenEffect: true },
] as const;

// 금액이 높을수록 높은 등급 확률 증가
function rollGrade(amount: number): typeof GRADES[number] {
  // 금액 보너스: 10000원당 SR+ 확률 1% 추가 (최대 20%)
  const bonus = Math.min(amount / 10000 * 0.01, 0.20);

  const adjusted = GRADES.map((g, i) => ({
    ...g,
    chance: i >= 2 ? g.chance + bonus / 3 : g.chance - bonus / 2,
  }));

  const total = adjusted.reduce((sum, g) => sum + Math.max(g.chance, 0.01), 0);
  let roll = Math.random() * total;

  for (const g of adjusted) {
    roll -= Math.max(g.chance, 0.01);
    if (roll <= 0) return GRADES.find(orig => orig.grade === g.grade)!;
  }
  return GRADES[0];
}

interface GachaResult {
  id: number;
  nickname: string;
  amount: number;
  grade: typeof GRADES[number];
  timestamp: number;
}

interface CollectionCounts {
  N: number;
  R: number;
  SR: number;
  SSR: number;
  UR: number;
}

interface DonationGachaProps {
  widgetId?: string;
  streamerId?: string;
  config?: {
    showHistory?: boolean;
    maxHistory?: number;
    showCollection?: boolean;
  };
}

export default function DonationGacha({ widgetId, streamerId, config }: DonationGachaProps) {
  const [results, setResults] = useState<GachaResult[]>([]);
  const [currentPull, setCurrentPull] = useState<GachaResult | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [screenFlash, setScreenFlash] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionCounts>({ N: 0, R: 0, SR: 0, SSR: 0, UR: 0 });
  const resultId = useRef(0);
  const showHistory = config?.showHistory ?? true;
  const maxHistory = config?.maxHistory ?? 5;
  const showCollection = config?.showCollection ?? true;

  const triggerGacha = useCallback((amount: number, nickname: string) => {
    if (isAnimating) return;

    const grade = rollGrade(amount);
    const result: GachaResult = {
      id: resultId.current++,
      nickname,
      amount,
      grade,
      timestamp: Date.now(),
    };

    setIsAnimating(true);
    setCurrentPull(result);

    // Screen flash for SR+
    if (grade.screenEffect) {
      setScreenFlash(grade.color);
      setTimeout(() => setScreenFlash(null), 500);
    }

    // Update local collection count
    setCollection(prev => ({
      ...prev,
      [grade.grade]: prev[grade.grade as keyof CollectionCounts] + 1,
    }));

    // Save to server if streamerId available
    if (streamerId || widgetId) {
      fetch('/api/gacha/collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamer_id: streamerId || widgetId,
          fan_nickname: nickname,
          grade: grade.grade,
        }),
      }).catch(() => { /* silently ignore save errors */ });
    }

    // Add to history after animation
    setTimeout(() => {
      setResults(prev => [result, ...prev].slice(0, maxHistory));
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentPull(null);
      }, 2000);
    }, 1500);
  }, [isAnimating, maxHistory, streamerId, widgetId]);

  // Expose for demo/socket
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationGacha = { triggerGacha };
    return () => { delete (window as unknown as Record<string, unknown>).__donationGacha; };
  }, [triggerGacha]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socket.on('connect', () => socket.emit('widget:subscribe', widgetId));
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        triggerGacha(data.amount, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, triggerGacha]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Screen flash for SR+ */}
      {screenFlash && (
        <div
          className="absolute inset-0 z-50 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${screenFlash}40 0%, transparent 70%)`,
            animation: 'flashPulse 0.5s ease-out',
          }}
        />
      )}

      {/* Current pull animation */}
      {currentPull && (
        <div className="absolute inset-0 flex items-center justify-center z-40">
          <div
            className="flex flex-col items-center"
            style={{ animation: 'gachaPull 1.5s ease-out forwards' }}
          >
            {/* Grade card */}
            <div
              className="relative rounded-2xl p-8 flex flex-col items-center gap-3"
              style={{
                background: `linear-gradient(135deg, ${currentPull.grade.color}20, ${currentPull.grade.color}40)`,
                border: `3px solid ${currentPull.grade.color}`,
                boxShadow: `0 0 40px ${currentPull.grade.color}60, 0 0 80px ${currentPull.grade.color}30`,
                animation: currentPull.grade.screenEffect ? 'gradeShake 0.5s ease-in-out 1s' : undefined,
              }}
            >
              {/* Grade badge */}
              <div
                className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-black text-sm tracking-wider"
                style={{
                  background: currentPull.grade.color,
                  color: currentPull.grade.grade === 'N' ? '#fff' : '#000',
                  boxShadow: `0 0 20px ${currentPull.grade.color}80`,
                }}
              >
                {currentPull.grade.grade}
              </div>

              <span className="text-6xl mt-2">{currentPull.grade.emoji}</span>
              <span className="text-2xl font-black text-white" style={{ textShadow: `0 0 10px ${currentPull.grade.color}` }}>
                {currentPull.grade.label}
              </span>
              <div className="text-center mt-1">
                <span className="text-white font-bold text-lg">{currentPull.nickname}</span>
                <span className="text-gray-400 text-sm ml-2">{currentPull.amount.toLocaleString()}원</span>
              </div>
            </div>

            {/* Sparkles for SSR+ */}
            {(currentPull.grade.grade === 'SSR' || currentPull.grade.grade === 'UR') && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-2xl"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                      animation: `sparkle 1s ease-out ${i * 0.1}s forwards`,
                      opacity: 0,
                    }}
                  >
                    ✦
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && results.length > 0 && !currentPull && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm"
              style={{
                background: `${r.grade.color}15`,
                border: `1px solid ${r.grade.color}40`,
              }}
            >
              <span
                className="px-1.5 py-0.5 rounded text-xs font-black"
                style={{ background: r.grade.color, color: r.grade.grade === 'N' ? '#fff' : '#000' }}
              >
                {r.grade.grade}
              </span>
              <span className="text-white font-medium">{r.nickname}</span>
              <span className="text-gray-500 text-xs">{r.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      )}

      {/* Collection bar */}
      {showCollection && !currentPull && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          {GRADES.map(g => (
            <div key={g.grade} className="flex items-center gap-1 px-2 py-1 rounded text-xs"
              style={{ background: `${g.color}20`, border: `1px solid ${g.color}40` }}>
              <span className="font-black" style={{ color: g.color }}>{g.grade}</span>
              <span className="text-white font-mono">{collection[g.grade as keyof CollectionCounts]}</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes gachaPull {
          0% { opacity: 0; transform: scale(0.3) rotateY(180deg); }
          40% { opacity: 1; transform: scale(1.15) rotateY(0deg); }
          60% { transform: scale(0.95); }
          80% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes flashPulse {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes gradeShake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        @keyframes sparkle {
          0% { opacity: 0; transform: scale(0) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.5) rotate(180deg); }
          100% { opacity: 0; transform: scale(0) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
