'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

/* ── Gauge skin stages ── */
const GAUGE_STAGES = [
  { min: 0, max: 0.2, name: 'ICE', emoji: '\uD83E\uDDCA', gradient: 'from-blue-800 to-blue-600', textColor: 'text-blue-300' },
  { min: 0.2, max: 0.4, name: 'COLD', emoji: '\u2744\uFE0F', gradient: 'from-blue-500 to-cyan-400', textColor: 'text-cyan-300' },
  { min: 0.4, max: 0.6, name: 'NORMAL', emoji: '\uD83D\uDE10', gradient: 'from-gray-500 to-gray-300', textColor: 'text-gray-300' },
  { min: 0.6, max: 0.8, name: 'HOT', emoji: '\uD83D\uDD25', gradient: 'from-orange-500 to-orange-400', textColor: 'text-orange-300' },
  { min: 0.8, max: Infinity, name: 'MAX', emoji: '\uD83D\uDCA5', gradient: 'from-red-600 to-red-400', textColor: 'text-red-300' },
] as const;

/* ── Weather skin levels ── */
const WEATHER_LEVELS = [
  { min: 0, name: '\uB9D1\uC74C', emoji: '\u2600\uFE0F', particles: 0, type: 'none' as const },
  { min: 5000, name: '\uD750\uB9BC', emoji: '\u26C5', particles: 5, type: 'cloud' as const },
  { min: 20000, name: '\uBE44', emoji: '\uD83C\uDF27\uFE0F', particles: 40, type: 'rain' as const },
  { min: 50000, name: '\uD3ED\uD48D', emoji: '\u26C8\uFE0F', particles: 80, type: 'storm' as const },
  { min: 100000, name: '\uBE14\uB9AC\uC790\uB4DC', emoji: '\uD83C\uDF28\uFE0F', particles: 100, type: 'blizzard' as const },
] as const;

type WeatherType = typeof WEATHER_LEVELS[number]['type'];

interface Particle {
  id: number;
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
}

interface DonationMeterProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

export default function DonationMeter({ widgetId, config }: DonationMeterProps) {
  const skin = (config?.skin as string) || 'gauge';
  const windowMinutes = (config?.windowMinutes as number) || 5;
  const maxAmount = (config?.maxAmount as number) || 50000;
  const showParticles = (config?.showParticles ?? true) as boolean;

  const [totalAmount, setTotalAmount] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [shake, setShake] = useState(false);
  const donationsRef = useRef<{ amount: number; time: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const timeoutIdsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const socketRef = useRef<ReturnType<typeof import('socket.io-client').io> | null>(null);
  const maxEmittedRef = useRef(false);

  // Cleanup tracked timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(id => clearTimeout(id));
      timeoutIdsRef.current.clear();
    };
  }, []);

  // Weather skin state
  const [weatherType, setWeatherType] = useState<WeatherType>('none');
  const [weatherEmoji, setWeatherEmoji] = useState('\u2600\uFE0F');
  const [weatherName, setWeatherName] = useState('\uB9D1\uC74C');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lightning, setLightning] = useState(false);
  const particleIdRef = useRef(0);
  const densityMultiplier = 1;

  const updateMeter = useCallback(() => {
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    donationsRef.current = donationsRef.current.filter(d => d.time > now - windowMs);
    const total = donationsRef.current.reduce((sum, d) => sum + d.amount, 0);
    setTotalAmount(total);

    if (skin === 'weather') {
      // Weather skin logic
      let level: typeof WEATHER_LEVELS[number] = WEATHER_LEVELS[0];
      for (const l of WEATHER_LEVELS) {
        if (total >= l.min) level = l;
      }
      setWeatherType(level.type);
      setWeatherEmoji(level.emoji);
      setWeatherName(level.name);

      const adjustedParticleCount = Math.round(level.particles * densityMultiplier);
      const newParticles: Particle[] = [];
      for (let i = 0; i < Math.min(adjustedParticleCount, 150); i++) {
        newParticles.push({
          id: particleIdRef.current++,
          x: Math.random() * 100,
          y: -10 - Math.random() * 20,
          speed: 2 + Math.random() * 4,
          size: level.type === 'blizzard' ? 3 + Math.random() * 5 : 1 + Math.random() * 2,
          opacity: 0.3 + Math.random() * 0.7,
        });
      }
      setParticles(newParticles);

      if (level.type === 'storm' || level.type === 'blizzard') {
        if (Math.random() < 0.1) {
          setLightning(true);
          const tId = setTimeout(() => { timeoutIdsRef.current.delete(tId); setLightning(false); }, 150);
          timeoutIdsRef.current.add(tId);
        }
      }

      if (level.type === 'blizzard') {
        setShake(true);
        const tId = setTimeout(() => { timeoutIdsRef.current.delete(tId); setShake(false); }, 200);
        timeoutIdsRef.current.add(tId);
      }
    } else {
      // Gauge skin logic
      const pct = Math.min(maxAmount > 0 ? total / maxAmount : 0, 1.2);
      setPercentage(pct);

      if (pct >= 0.8) {
        setShake(true);
        const tId = setTimeout(() => { timeoutIdsRef.current.delete(tId); setShake(false); }, 200);
        timeoutIdsRef.current.add(tId);
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
    }
  }, [windowMinutes, maxAmount, skin, densityMultiplier]);

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
    let socket: ReturnType<typeof import('socket.io-client').io> | null = null;
    let unmounted = false;
    import('socket.io-client').then(({ io }) => {
      if (unmounted) return;
      socket = io(socketUrl);
      socketRef.current = socket;
      socket.on('connect', () => socket!.emit('widget:subscribe', widgetId));
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        addDonation(data.amount, data.fan_nickname);
      });
      // Listen for chain actions (weather blizzard)
      socket.on('widget:chain-action' as any, (event: { action: string; data: Record<string, unknown> }) => {
        if (event.action === 'weather:blizzard') {
          donationsRef.current.push({ amount: 200000, time: Date.now() });
          updateMeter();
        }
      });
    }).catch(err => console.error('Socket init failed:', err));
    return () => { unmounted = true; socket?.disconnect(); socketRef.current = null; };
  }, [widgetId, addDonation, updateMeter]);

  // ── Weather skin render ──
  if (skin === 'weather') {
    return (
      <div
        className={`relative w-full h-full overflow-hidden ${shake ? 'animate-meter-shake' : ''}`}
        style={{ background: 'transparent' }}
      >
        {lightning && (
          <div className="absolute inset-0 bg-white/30 z-50 pointer-events-none" />
        )}

        {particles.map(p => (
          <div
            key={p.id}
            className="absolute pointer-events-none"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: weatherType === 'rain' || weatherType === 'storm' ? `${p.size * 5}px` : `${p.size}px`,
              background: weatherType === 'blizzard' ? `rgba(200,220,255,${p.opacity})` : `rgba(180,200,255,${p.opacity})`,
              borderRadius: weatherType === 'blizzard' ? '50%' : '0',
              animation: `meterFall ${p.speed}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}

        {(weatherType === 'cloud' || weatherType === 'rain' || weatherType === 'storm' || weatherType === 'blizzard') && (
          <>
            <div className="absolute top-[5%] left-[10%] text-6xl opacity-40 pointer-events-none" style={{ animation: 'meterDrift 20s linear infinite' }}>{'\u2601\uFE0F'}</div>
            <div className="absolute top-[8%] left-[50%] text-5xl opacity-30 pointer-events-none" style={{ animation: 'meterDrift 25s linear infinite', animationDelay: '5s' }}>{'\u2601\uFE0F'}</div>
            <div className="absolute top-[2%] left-[75%] text-7xl opacity-35 pointer-events-none" style={{ animation: 'meterDrift 18s linear infinite', animationDelay: '10s' }}>{'\u2601\uFE0F'}</div>
          </>
        )}

        <div className="absolute bottom-4 left-4 bg-black/60 rounded-xl px-4 py-2 backdrop-blur-sm flex items-center gap-2">
          <span className="text-2xl">{weatherEmoji}</span>
          <div>
            <p className="text-white font-bold text-sm">{weatherName}</p>
            <p className="text-gray-400 text-[10px]">{totalAmount.toLocaleString()}원 / {windowMinutes}분</p>
          </div>
        </div>

        <style>{`
          @keyframes meterFall {
            0% { transform: translateY(-10vh) translateX(0); }
            100% { transform: translateY(110vh) translateX(${weatherType === 'blizzard' ? '30px' : '5px'}); }
          }
          @keyframes meterDrift {
            0% { transform: translateX(-20%); }
            100% { transform: translateX(120vw); }
          }
          .animate-meter-shake {
            animation: meterShake 0.2s ease-in-out;
          }
          @keyframes meterShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
          }
        `}</style>
      </div>
    );
  }

  // ── Gauge skin render (default) ──
  const currentStage = GAUGE_STAGES.find(s => percentage >= s.min && percentage < s.max) || GAUGE_STAGES[GAUGE_STAGES.length - 1];
  const fillHeight = Math.min(percentage * 100, 100);
  const isMax = percentage >= 0.8;
  const particleCount = isMax && showParticles ? 15 : 0;

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center ${shake ? 'meter-shake' : ''}`}
      style={{ background: 'transparent' }}
    >
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
        <div className="relative w-16 h-full rounded-full border-2 border-gray-600 bg-gray-900/80 overflow-hidden backdrop-blur-sm">
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${currentStage.gradient} transition-all duration-700 ease-out`}
            style={{ height: `${fillHeight}%` }}
          >
            <div className="absolute inset-0 meter-shimmer" />
          </div>
          {[20, 40, 60, 80].map(pct => (
            <div key={pct} className="absolute left-0 right-0 border-t border-gray-600/50"
              style={{ bottom: `${pct}%` }} />
          ))}
        </div>

        <div className="text-center">
          <div className={`text-4xl mb-1 ${isMax ? 'meter-pulse' : ''}`}>
            {currentStage.emoji}
          </div>
          <div className={`text-2xl font-black ${currentStage.textColor} ${isMax ? 'meter-pulse' : ''}`}
            style={{ textShadow: isMax ? '0 0 20px rgba(239,68,68,0.6)' : 'none' }}>
            {currentStage.name}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            {totalAmount.toLocaleString()}원 / {windowMinutes}분
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
          animation: meterShimmerAnim 2s linear infinite;
        }
        @keyframes meterShimmerAnim {
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
