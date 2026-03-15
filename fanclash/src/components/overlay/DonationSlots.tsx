'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const SYMBOLS = ['\uD83C\uDF52', '\uD83D\uDC8E', '\u2B50', '\u2764\uFE0F', '\uD83D\uDC51', '7\uFE0F\u20E3', '\uD83C\uDFB0'];

interface DonationSlotsProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

export default function DonationSlots({ widgetId, config }: DonationSlotsProps) {
  const minAmount = (config?.minAmount as number) || 1000;
  const missions = (config?.missions as string[]) || ['\uB178\uB798 \uD55C \uACE1', '\uC2A4\uCFFC\uD2B8 10\uAC1C', '\uAD11\uACE0 \uC77D\uAE30'];
  const spinDuration = (config?.spinDuration as number) || 2;

  const [reels, setReels] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState([false, false, false]);
  const [result, setResult] = useState<'big' | 'small' | null>(null);
  const [mission, setMission] = useState<string | null>(null);
  const [lastDonor, setLastDonor] = useState<string | null>(null);
  const spinningRef = useRef(false);
  const reelIntervals = useRef<ReturnType<typeof setInterval>[]>([]);

  const triggerSpin = useCallback((amount: number, nickname: string) => {
    if (amount < minAmount || spinningRef.current) return;
    spinningRef.current = true;
    setResult(null);
    setMission(null);
    setLastDonor(nickname);

    // Higher donation = higher match chance
    const matchChance = Math.min(0.1 + (amount / 1000) * 0.02, 0.8);
    const shouldMatch3 = Math.random() < matchChance * 0.3;
    const shouldMatch2 = !shouldMatch3 && Math.random() < matchChance;

    let finalReels: number[];
    if (shouldMatch3) {
      const sym = Math.floor(Math.random() * SYMBOLS.length);
      finalReels = [sym, sym, sym];
    } else if (shouldMatch2) {
      const sym = Math.floor(Math.random() * SYMBOLS.length);
      const pos = Math.floor(Math.random() * 3);
      finalReels = Array.from({ length: 3 }, (_, i) =>
        i === pos ? (sym + 1 + Math.floor(Math.random() * (SYMBOLS.length - 1))) % SYMBOLS.length : sym
      );
      // Ensure exactly 2 match
      const nonMatchIdx = pos;
      finalReels[nonMatchIdx] = (sym + 1 + Math.floor(Math.random() * (SYMBOLS.length - 1))) % SYMBOLS.length;
    } else {
      // All different
      finalReels = [];
      const used = new Set<number>();
      for (let i = 0; i < 3; i++) {
        let s: number;
        do { s = Math.floor(Math.random() * SYMBOLS.length); } while (used.has(s) && used.size < SYMBOLS.length);
        used.add(s);
        finalReels.push(s);
      }
    }

    // Start spinning all reels
    setSpinning([true, true, true]);

    reelIntervals.current.forEach(clearInterval);
    reelIntervals.current = [];

    // Rapid cycling for each reel
    for (let i = 0; i < 3; i++) {
      const interval = setInterval(() => {
        setReels(prev => {
          const next = [...prev];
          next[i] = (next[i] + 1) % SYMBOLS.length;
          return next;
        });
      }, 80);
      reelIntervals.current.push(interval);
    }

    // Stop reels with stagger
    const baseStop = spinDuration * 500;
    for (let i = 0; i < 3; i++) {
      const stopTime = baseStop + i * baseStop * 0.5;
      setTimeout(() => {
        clearInterval(reelIntervals.current[i]);
        setReels(prev => {
          const next = [...prev];
          next[i] = finalReels[i];
          return next;
        });
        setSpinning(prev => {
          const next = [...prev];
          next[i] = false;
          return next;
        });

        // After last reel stops, show result
        if (i === 2) {
          setTimeout(() => {
            if (shouldMatch3) {
              setResult('big');
              const m = missions[Math.floor(Math.random() * missions.length)];
              setMission(m);
            } else if (shouldMatch2) {
              setResult('small');
            }
            spinningRef.current = false;
          }, 300);
        }
      }, stopTime);
    }
  }, [minAmount, missions, spinDuration]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationSlots = { triggerSpin };
    return () => { delete (window as unknown as Record<string, unknown>).__donationSlots; };
  }, [triggerSpin]);

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
        triggerSpin(data.amount, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, triggerSpin]);

  // Clear result after delay
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => {
      setResult(null);
      setMission(null);
      setLastDonor(null);
    }, 5000);
    return () => clearTimeout(t);
  }, [result]);

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
      {/* Big win flash */}
      {result === 'big' && <div className="absolute inset-0 big-win-flash pointer-events-none z-0" />}

      <div className="relative z-10 text-center">
        {/* Donor name */}
        {lastDonor && (
          <div className="text-gray-300 text-sm mb-2">{lastDonor}</div>
        )}

        {/* Slot machine frame */}
        <div className={`inline-flex gap-2 p-4 rounded-2xl border-2 ${
          result === 'big' ? 'border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.5)]'
            : result === 'small' ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)]'
            : 'border-gray-600'
        } bg-black/70 backdrop-blur-sm`}>
          {reels.map((symbolIdx, i) => (
            <div
              key={i}
              className={`w-20 h-20 flex items-center justify-center text-5xl rounded-xl bg-gray-900 border ${
                spinning[i] ? 'border-purple-500 reel-spin' : 'border-gray-700'
              } ${result === 'big' ? 'reel-win' : result === 'small' && !spinning.some(Boolean) && reels.filter(r => r === symbolIdx).length >= 2 ? 'reel-small-win' : ''}`}
            >
              {SYMBOLS[symbolIdx]}
            </div>
          ))}
        </div>

        {/* Result text */}
        {result === 'big' && (
          <div className="mt-4">
            <div className="text-3xl font-black text-yellow-400 big-win-text"
              style={{ textShadow: '0 0 20px rgba(250,204,21,0.8)' }}>
              JACKPOT!
            </div>
            {mission && (
              <div className="mt-2 text-xl font-bold text-white mission-reveal">
                {mission}
              </div>
            )}
          </div>
        )}
        {result === 'small' && (
          <div className="mt-3 text-xl font-bold text-purple-300" style={{ textShadow: '0 0 10px rgba(168,85,247,0.5)' }}>
            NICE!
          </div>
        )}
      </div>

      <style>{`
        .reel-spin {
          animation: reelCycle 0.1s linear infinite;
        }
        @keyframes reelCycle {
          0% { transform: translateY(-2px); }
          50% { transform: translateY(2px); }
          100% { transform: translateY(-2px); }
        }
        .reel-win {
          animation: reelBounce 0.5s ease-out;
          border-color: #facc15;
          box-shadow: 0 0 15px rgba(250,204,21,0.4);
        }
        @keyframes reelBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.15); }
          60% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        .reel-small-win {
          border-color: #a855f7;
          box-shadow: 0 0 10px rgba(168,85,247,0.3);
        }
        .big-win-flash {
          animation: winFlash 0.6s ease-out;
        }
        @keyframes winFlash {
          0% { background: rgba(250,204,21,0.4); }
          100% { background: transparent; }
        }
        .big-win-text {
          animation: winTextPop 0.5s ease-out;
        }
        @keyframes winTextPop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        .mission-reveal {
          animation: missionReveal 0.6s ease-out 0.3s both;
        }
        @keyframes missionReveal {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
