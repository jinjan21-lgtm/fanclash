'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const STAGES = [
  { min: 0, max: 0.2, name: 'ICE', emoji: '\uD83E\uDDCA', gradient: 'from-blue-800 to-blue-600', textColor: 'text-blue-300' },
  { min: 0.2, max: 0.4, name: 'COLD', emoji: '\u2744\uFE0F', gradient: 'from-blue-500 to-cyan-400', textColor: 'text-cyan-300' },
  { min: 0.4, max: 0.6, name: 'NORMAL', emoji: '\uD83D\uDE10', gradient: 'from-gray-500 to-gray-300', textColor: 'text-gray-300' },
  { min: 0.6, max: 0.8, name: 'HOT', emoji: '\uD83D\uDD25', gradient: 'from-orange-500 to-orange-400', textColor: 'text-orange-300' },
  { min: 0.8, max: Infinity, name: 'MAX', emoji: '\uD83D\uDCA5', gradient: 'from-red-600 to-red-400', textColor: 'text-red-300' },
] as const;

interface DonationMeterProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

export default function DonationMeter({ widgetId, config }: DonationMeterProps) {
  const windowMinutes = (config?.windowMinutes as number) || 5;
  const maxAmount = (config?.maxAmount as number) || 50000;
  const showParticles = (config?.showParticles ?? true) as boolean;

  const [totalAmount, setTotalAmount] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [shake, setShake] = useState(false);
  const donationsRef = useRef<{ amount: number; time: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const socketRef = useRef<ReturnType<typeof import('socket.io-client').io> | null>(null);
  const maxEmittedRef = useRef(false);

  const updateMeter = useCallback(() => {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    donationsRef.current = donationsRef.current.filter(d => d.time > now - windowMs);
    const total = donationsRef.current.reduce((sum, d) => sum + d.amount, 0);
    setTotalAmount(total);
    const pct = Math.min(total / maxAmount, 1.2);
    setPercentage(pct);

    if (pct >= 0.8) {
      setShake(true);
      setTimeout(() => setShake(false), 200);
      // Emit meter:max event once when crossing threshold
      if (!maxEmittedRef.current) {
        maxEmittedRef.current = true;
        socketRef.current?.emit('widget:event' as any, {
          type: 'meter:max',
          data: { totalAmount: total, percentage: pct },
        });
      }
    } else {
      maxEmittedRef.current = false;
    }
  }, [windowMinutes, maxAmount]);

  useEffect(() => {
    intervalRef.current = setInterval(updateMeter, 1000);
    return () => clearInterval(intervalRef.current);
  }, [updateMeter]);

  const addDonation = useCallback((amount: number, _nickname: string) => {
    donationsRef.current.push({ amount, time: Date.now() });
    updateMeter();
  }, [updateMeter]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationMeter = { addDonation };
    return () => { delete (window as unknown as Record<string, unknown>).__donationMeter; };
  }, [addDonation]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;
    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socketRef.current = socket;
      socket.on('connect', () => socket.emit('widget:subscribe', widgetId));
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        addDonation(data.amount, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); socketRef.current = null; };
  }, [widgetId, addDonation]);

  const currentStage = STAGES.find(s => percentage >= s.min && percentage < s.max) || STAGES[STAGES.length - 1];
  const fillHeight = Math.min(percentage * 100, 100);
  const isMax = percentage >= 0.8;

  const particleCount = isMax && showParticles ? 15 : 0;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${shake ? 'meter-shake' : ''}`}
      style={{ background: 'transparent' }}
    >
      {/* Fire particles at MAX */}
      {particleCount > 0 && Array.from({ length: particleCount }).map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none meter-fire-particle"
          style={{
            left: `${40 + Math.random() * 20}%`,
            bottom: '10%',
            width: `${3 + Math.random() * 6}px`,
            height: `${3 + Math.random() * 6}px`,
            background: `hsl(${Math.random() * 40}, 100%, ${50 + Math.random() * 30}%)`,
            borderRadius: '50%',
            animationDuration: `${0.6 + Math.random() * 1}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}

      <div className="flex items-end gap-4 h-[80%]">
        {/* Vertical gauge bar */}
        <div className="relative w-16 h-full rounded-full border-2 border-gray-600 bg-gray-900/80 overflow-hidden backdrop-blur-sm">
          {/* Fill */}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${currentStage.gradient} transition-all duration-700 ease-out`}
            style={{ height: `${fillHeight}%` }}
          >
            {/* Shimmer on fill */}
            <div className="absolute inset-0 meter-shimmer" />
          </div>

          {/* Stage markers */}
          {[20, 40, 60, 80].map(pct => (
            <div key={pct} className="absolute left-0 right-0 border-t border-gray-600/50"
              style={{ bottom: `${pct}%` }} />
          ))}
        </div>

        {/* Stage label */}
        <div className="text-center">
          <div className={`text-4xl mb-1 ${isMax ? 'meter-pulse' : ''}`}>
            {currentStage.emoji}
          </div>
          <div className={`text-2xl font-black ${currentStage.textColor} ${isMax ? 'meter-pulse' : ''}`}
            style={{ textShadow: isMax ? '0 0 20px rgba(239,68,68,0.6)' : 'none' }}>
            {currentStage.name}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {totalAmount.toLocaleString()}\uC6D0 / {windowMinutes}\uBD84
          </div>
        </div>
      </div>

      <style>{`
        .meter-shake {
          animation: meterShake 0.2s ease-in-out;
        }
        @keyframes meterShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
        .meter-pulse {
          animation: meterPulse 1s ease-in-out infinite;
        }
        @keyframes meterPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        .meter-shimmer {
          background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
          animation: meterShimmer 2s linear infinite;
        }
        @keyframes meterShimmer {
          0% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        .meter-fire-particle {
          animation: meterFireRise 1s ease-out infinite;
        }
        @keyframes meterFireRise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-150px) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
