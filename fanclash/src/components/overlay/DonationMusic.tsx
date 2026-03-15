'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import * as Tone from 'tone';

// 음계 매핑
const PENTATONIC_NOTES = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'];
const MAJOR_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];
const MINOR_NOTES = ['C4', 'D4', 'Eb4', 'F4', 'G4', 'Ab4', 'Bb4', 'C5', 'D5', 'Eb5'];

function getScaleNotes(scaleType: string): string[] {
  switch (scaleType) {
    case 'major': return MAJOR_NOTES;
    case 'minor': return MINOR_NOTES;
    default: return PENTATONIC_NOTES;
  }
}

// 금액 구간별 설정
const TIERS = [
  { min: 0,      max: 1000,   notes: ['C4', 'D4'],           synth: 'triangle', duration: '8n', color: '#6b7280', label: '♪', size: 'text-2xl' },
  { min: 1000,   max: 3000,   notes: ['E4', 'G4'],           synth: 'sine',     duration: '8n', color: '#a78bfa', label: '♫', size: 'text-3xl' },
  { min: 3000,   max: 5000,   notes: ['G4', 'A4', 'C5'],     synth: 'sine',     duration: '4n', color: '#818cf8', label: '♬', size: 'text-4xl' },
  { min: 5000,   max: 10000,  notes: ['C5', 'D5', 'E5'],     synth: 'square',   duration: '4n', color: '#c084fc', label: '🎵', size: 'text-5xl' },
  { min: 10000,  max: 30000,  notes: ['E5', 'G5', 'A5'],     synth: 'sawtooth', duration: '2n', color: '#e879f9', label: '🎶', size: 'text-6xl' },
  { min: 30000,  max: Infinity, notes: PENTATONIC_NOTES,      synth: 'fatsawtooth' as OscillatorType, duration: '1n', color: '#f472b6', label: '🎼', size: 'text-7xl' },
] as const;

type OscillatorType = 'triangle' | 'sine' | 'square' | 'sawtooth' | 'fatsawtooth';

interface NoteParticle {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  size: string;
  nickname: string;
  amount: number;
}

interface DonationMusicProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

export default function DonationMusic({ widgetId, config }: DonationMusicProps) {
  const [particles, setParticles] = useState<NoteParticle[]>([]);
  const [recentNotes, setRecentNotes] = useState<string[]>([]);
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const reverbRef = useRef<Tone.Reverb | null>(null);
  const particleId = useRef(0);
  const audioStarted = useRef(false);

  const volume = (config?.volume as number) ?? 70;
  const showVisual = (config?.showVisual as boolean) ?? true;
  const scaleType = (config?.scaleType as string) ?? 'pentatonic';
  const scaleNotes = getScaleNotes(scaleType);

  // Initialize audio
  useEffect(() => {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.3 }).toDestination();
    reverbRef.current = reverb;

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.2,
        release: 1.5,
      },
      volume: Tone.gainToDb(volume / 100),
    }).connect(reverb);

    synthRef.current = synth;

    return () => {
      synth.dispose();
      reverb.dispose();
    };
  }, [volume]);

  // Play note based on donation amount
  const playDonation = useCallback(async (amount: number, nickname: string) => {
    if (!synthRef.current) return;

    // Start audio context on first interaction
    if (!audioStarted.current) {
      await Tone.start();
      audioStarted.current = true;
    }

    // Find tier
    const tier = TIERS.find(t => amount >= t.min && amount < t.max) || TIERS[TIERS.length - 1];

    // Pick random notes from tier (mapped to current scale) and play as arpeggio
    const tierStartIdx = TIERS.indexOf(tier);
    const notesForTier = tierStartIdx >= 0
      ? scaleNotes.slice(tierStartIdx * 2, tierStartIdx * 2 + tier.notes.length)
      : scaleNotes;
    const availableNotes = notesForTier.length > 0 ? notesForTier : tier.notes;
    const noteCount = Math.min(Math.ceil(amount / 5000) + 1, availableNotes.length);
    const selectedNotes = [...availableNotes].sort(() => Math.random() - 0.5).slice(0, noteCount);

    // Change oscillator type based on tier
    synthRef.current.set({ oscillator: { type: tier.synth as OscillatorType } });

    // Play arpeggio
    const now = Tone.now();
    selectedNotes.forEach((note, i) => {
      synthRef.current!.triggerAttackRelease(note, tier.duration, now + i * 0.15);
    });

    // Update recent notes display (use scaleNotes for piano vis)
    setRecentNotes(prev => [...prev.slice(-7), ...selectedNotes].slice(-8));

    // Add visual particle
    if (showVisual) {
      const newParticle: NoteParticle = {
        id: particleId.current++,
        x: 10 + Math.random() * 80,
        y: 70 + Math.random() * 20,
        label: tier.label,
        color: tier.color,
        size: tier.size,
        nickname,
        amount,
      };
      setParticles(prev => [...prev, newParticle]);

      // Remove particle after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 3000);
    }
  }, [showVisual, scaleNotes]);

  // Expose to parent/socket (for demo page)
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationMusic = { playDonation };
    return () => { delete (window as unknown as Record<string, unknown>).__donationMusic; };
  }, [playDonation]);

  // Socket.IO: listen for real donations
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socket.on('connect', () => {
        socket.emit('widget:subscribe', widgetId);
      });
      socket.on('donation:new', (data: { fan_nickname: string; amount: number }) => {
        playDonation(data.amount, data.fan_nickname);
      });
    });

    return () => { socket?.disconnect(); };
  }, [widgetId, playDonation]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Note particles */}
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute animate-float-up pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animation: 'floatUp 3s ease-out forwards',
          }}
        >
          <div className="flex flex-col items-center">
            <span className={`${p.size} drop-shadow-lg`} style={{ color: p.color }}>
              {p.label}
            </span>
            <span className="text-white text-xs font-bold mt-1 bg-black/50 px-2 py-0.5 rounded-full whitespace-nowrap">
              {p.nickname} {p.amount.toLocaleString()}원
            </span>
          </div>
        </div>
      ))}

      {/* Piano visualization at bottom */}
      {showVisual && recentNotes.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
          {recentNotes.map((note, i) => {
            const noteIndex = scaleNotes.indexOf(note);
            const hue = noteIndex >= 0 ? noteIndex * 36 : 0;
            return (
              <div
                key={`${note}-${i}`}
                className="w-8 h-12 rounded-b-lg flex items-end justify-center pb-1 text-[10px] font-bold transition-all"
                style={{
                  background: `hsla(${hue}, 80%, 60%, 0.8)`,
                  animation: 'notePress 0.5s ease-out',
                  boxShadow: `0 0 15px hsla(${hue}, 80%, 60%, 0.5)`,
                }}
              >
                {note.replace(/[0-9]/g, '')}
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(0) scale(0.5); }
          20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          40% { opacity: 1; transform: translateY(-60px) scale(1); }
          100% { opacity: 0; transform: translateY(-200px) scale(0.8); }
        }
        @keyframes notePress {
          0% { transform: scaleY(0.7); opacity: 0.5; }
          50% { transform: scaleY(1.1); opacity: 1; }
          100% { transform: scaleY(1); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}
