'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

const WEATHER_LEVELS = [
  { min: 0, name: '맑음', emoji: '☀️', particles: 0, type: 'none' as const },
  { min: 5000, name: '흐림', emoji: '⛅', particles: 5, type: 'cloud' as const },
  { min: 20000, name: '비', emoji: '🌧️', particles: 40, type: 'rain' as const },
  { min: 50000, name: '폭풍', emoji: '⛈️', particles: 80, type: 'storm' as const },
  { min: 100000, name: '블리자드', emoji: '🌨️', particles: 100, type: 'blizzard' as const },
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

const DENSITY_MAP: Record<string, number> = { low: 30, medium: 60, high: 100 };

interface DonationWeatherProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

export default function DonationWeather({ widgetId, config }: DonationWeatherProps) {
  const particleDensity = (config?.particleDensity as string) ?? 'medium';
  const weatherWindow = (config?.weatherWindow as number) ?? 5;
  const screenShakeEnabled = (config?.screenShake as boolean) ?? true;
  const densityMultiplier = (DENSITY_MAP[particleDensity] ?? 60) / 60;
  const [totalAmount, setTotalAmount] = useState(0);
  const [weatherType, setWeatherType] = useState<WeatherType>('none');
  const [weatherEmoji, setWeatherEmoji] = useState('☀️');
  const [weatherName, setWeatherName] = useState('맑음');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lightning, setLightning] = useState(false);
  const [shake, setShake] = useState(false);
  const donationsRef = useRef<{ amount: number; time: number }[]>([]);
  const particleId = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Update weather based on rolling window total
  const updateWeather = useCallback(() => {
    const now = Date.now();
    const windowAgo = now - weatherWindow * 60 * 1000;
    donationsRef.current = donationsRef.current.filter(d => d.time > windowAgo);
    const total = donationsRef.current.reduce((sum, d) => sum + d.amount, 0);
    setTotalAmount(total);

    // Find weather level
    let level: typeof WEATHER_LEVELS[number] = WEATHER_LEVELS[0];
    for (const l of WEATHER_LEVELS) {
      if (total >= l.min) level = l;
    }
    setWeatherType(level.type);
    setWeatherEmoji(level.emoji);
    setWeatherName(level.name);

    // Generate particles (adjusted by density config)
    const adjustedParticleCount = Math.round(level.particles * densityMultiplier);
    const newParticles: Particle[] = [];
    for (let i = 0; i < Math.min(adjustedParticleCount, 150); i++) {
      newParticles.push({
        id: particleId.current++,
        x: Math.random() * 100,
        y: -10 - Math.random() * 20,
        speed: 2 + Math.random() * 4,
        size: level.type === 'blizzard' ? 3 + Math.random() * 5 : 1 + Math.random() * 2,
        opacity: 0.3 + Math.random() * 0.7,
      });
    }
    setParticles(newParticles);

    // Lightning for storm/blizzard
    if (level.type === 'storm' || level.type === 'blizzard') {
      if (Math.random() < 0.1) {
        setLightning(true);
        setTimeout(() => setLightning(false), 150);
      }
    }

    // Screen shake for blizzard (if enabled)
    if (screenShakeEnabled && level.type === 'blizzard') {
      setShake(true);
      setTimeout(() => setShake(false), 200);
    }
  }, [weatherWindow, densityMultiplier, screenShakeEnabled]);

  // Periodic update
  useEffect(() => {
    intervalRef.current = setInterval(updateWeather, 1000);
    return () => clearInterval(intervalRef.current);
  }, [updateWeather]);

  const addDonation = useCallback((amount: number, _nickname: string) => {
    donationsRef.current.push({ amount, time: Date.now() });
    updateWeather();
  }, [updateWeather]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationWeather = { addDonation };
    return () => { delete (window as unknown as Record<string, unknown>).__donationWeather; };
  }, [addDonation]);

  const forceBlizzard = useCallback(() => {
    // Force blizzard stage for 30 seconds by injecting a large synthetic donation
    donationsRef.current.push({ amount: 200000, time: Date.now() });
    updateWeather();
  }, [updateWeather]);

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
        addDonation(data.amount, data.fan_nickname);
      });
      // Listen for chain actions
      socket.on('widget:chain-action' as any, (event: { action: string; data: Record<string, unknown> }) => {
        if (event.action === 'weather:blizzard') {
          forceBlizzard();
        }
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, addDonation, forceBlizzard]);

  return (
    <div
      className={`relative w-full h-full overflow-hidden ${shake ? 'animate-shake' : ''}`}
      style={{ background: 'transparent' }}
    >
      {/* Lightning flash */}
      {lightning && (
        <div className="absolute inset-0 bg-white/30 z-50 pointer-events-none" />
      )}

      {/* Weather particles */}
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
            animation: `fall ${p.speed}s linear infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}

      {/* Clouds for cloudy+ */}
      {(weatherType === 'cloud' || weatherType === 'rain' || weatherType === 'storm' || weatherType === 'blizzard') && (
        <>
          <div className="absolute top-[5%] left-[10%] text-6xl opacity-40 pointer-events-none" style={{ animation: 'drift 20s linear infinite' }}>☁️</div>
          <div className="absolute top-[8%] left-[50%] text-5xl opacity-30 pointer-events-none" style={{ animation: 'drift 25s linear infinite', animationDelay: '5s' }}>☁️</div>
          <div className="absolute top-[2%] left-[75%] text-7xl opacity-35 pointer-events-none" style={{ animation: 'drift 18s linear infinite', animationDelay: '10s' }}>☁️</div>
        </>
      )}

      {/* Weather indicator */}
      <div className="absolute bottom-4 left-4 bg-black/60 rounded-xl px-4 py-2 backdrop-blur-sm flex items-center gap-2">
        <span className="text-2xl">{weatherEmoji}</span>
        <div>
          <p className="text-white font-bold text-sm">{weatherName}</p>
          <p className="text-gray-400 text-[10px]">{totalAmount.toLocaleString()}원 / {weatherWindow}분</p>
        </div>
      </div>

      <style>{`
        @keyframes fall {
          0% { transform: translateY(-10vh) translateX(0); }
          100% { transform: translateY(110vh) translateX(${weatherType === 'blizzard' ? '30px' : '5px'}); }
        }
        @keyframes drift {
          0% { transform: translateX(-20%); }
          100% { transform: translateX(120vw); }
        }
        .animate-shake {
          animation: weatherShake 0.2s ease-in-out;
        }
        @keyframes weatherShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-3px); }
          75% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
