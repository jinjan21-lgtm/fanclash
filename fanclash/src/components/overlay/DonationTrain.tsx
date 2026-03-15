'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface DonationTrainProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

export default function DonationTrain({ widgetId, config }: DonationTrainProps) {
  const comboWindow = ((config?.comboWindow as number) || 30) * 1000;
  const minAmount = (config?.minAmount as number) || 1000;
  const effectIntensity = (config?.effectIntensity as string) || 'medium';

  const [comboCount, setComboCount] = useState(0);
  const [lastDonor, setLastDonor] = useState<string | null>(null);
  const [showDonor, setShowDonor] = useState(false);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const donorTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const intensityScale = effectIntensity === 'low' ? 0.5 : effectIntensity === 'high' ? 1.5 : 1;

  const triggerDonation = useCallback((amount: number, nickname: string) => {
    if (amount < minAmount) return;

    setComboCount(prev => prev + 1);
    setLastDonor(nickname);
    setShowDonor(true);

    // Reset donor display
    clearTimeout(donorTimerRef.current);
    donorTimerRef.current = setTimeout(() => setShowDonor(false), 2000);

    // Reset combo timer
    clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setComboCount(0);
      setLastDonor(null);
    }, comboWindow);
  }, [comboWindow, minAmount]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationTrain = { triggerDonation };
    return () => { delete (window as unknown as Record<string, unknown>).__donationTrain; };
  }, [triggerDonation]);

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
        triggerDonation(data.amount, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, triggerDonation]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearTimeout(comboTimerRef.current);
      clearTimeout(donorTimerRef.current);
    };
  }, []);

  const stage = comboCount >= 20 ? 'rainbow' : comboCount >= 10 ? 'intense' : comboCount >= 5 ? 'fire' : 'simple';

  const particleCount = stage === 'rainbow' ? 30 : stage === 'intense' ? 20 : stage === 'fire' ? 10 : 0;

  return (
    <div
      className={`relative w-full h-full overflow-hidden flex items-center justify-center ${
        stage === 'fire' || stage === 'intense' || stage === 'rainbow' ? 'train-shake' : ''
      }`}
      style={{ background: 'transparent' }}
    >
      {/* Rainbow background for 20+ */}
      {stage === 'rainbow' && (
        <div className="absolute inset-0 rainbow-bg opacity-30 pointer-events-none" />
      )}

      {/* Fire particles */}
      {particleCount > 0 && Array.from({ length: Math.round(particleCount * intensityScale) }).map((_, i) => (
        <div
          key={i}
          className="absolute pointer-events-none fire-particle"
          style={{
            left: `${Math.random() * 100}%`,
            bottom: '-10px',
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            background: stage === 'rainbow'
              ? `hsl(${Math.random() * 360}, 100%, 60%)`
              : `hsl(${20 + Math.random() * 30}, 100%, ${50 + Math.random() * 30}%)`,
            borderRadius: '50%',
            animationDuration: `${0.8 + Math.random() * 1.2}s`,
            animationDelay: `${Math.random() * 0.5}s`,
          }}
        />
      ))}

      {/* Combo display */}
      {comboCount > 0 && (
        <div className="relative z-10 text-center">
          {stage === 'intense' || stage === 'rainbow' ? (
            <div className={`text-6xl font-black combo-pulse ${stage === 'rainbow' ? 'rainbow-text' : 'text-orange-400'}`}
              style={{ textShadow: '0 0 40px rgba(255,165,0,0.8), 0 0 80px rgba(255,100,0,0.4)' }}>
              COMBO x{comboCount}!
            </div>
          ) : (
            <div className={`text-4xl font-bold combo-pulse ${stage === 'fire' ? 'text-orange-400' : 'text-white'}`}
              style={{ textShadow: stage === 'fire' ? '0 0 20px rgba(255,165,0,0.6)' : '0 0 10px rgba(255,255,255,0.3)' }}>
              {comboCount} COMBO
            </div>
          )}

          {/* Last donor */}
          {showDonor && lastDonor && (
            <div className="mt-3 text-lg text-gray-300 donor-fade">
              {lastDonor}
            </div>
          )}
        </div>
      )}

      <style>{`
        .combo-pulse {
          animation: comboPulse 0.6s ease-out;
        }
        @keyframes comboPulse {
          0% { transform: scale(1.3); opacity: 0.7; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .fire-particle {
          animation: fireRise 1s ease-out infinite;
        }
        @keyframes fireRise {
          0% { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-200px) scale(0); opacity: 0; }
        }
        .train-shake {
          animation: trainShake 0.3s ease-in-out;
        }
        @keyframes trainShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-${3 * intensityScale}px); }
          75% { transform: translateX(${3 * intensityScale}px); }
        }
        .rainbow-bg {
          background: linear-gradient(135deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff, #ff0000);
          background-size: 400% 400%;
          animation: rainbowCycle 2s linear infinite;
        }
        @keyframes rainbowCycle {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .rainbow-text {
          background: linear-gradient(90deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: rainbowCycle 2s linear infinite;
        }
        .donor-fade {
          animation: donorFade 2s ease-out forwards;
        }
        @keyframes donorFade {
          0% { opacity: 0; transform: translateY(10px); }
          20% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
