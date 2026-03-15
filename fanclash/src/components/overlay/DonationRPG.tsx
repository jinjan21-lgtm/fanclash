'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

interface RPGCharacter {
  fan_nickname: string;
  level: number;
  xp: number;
  xp_to_next: number;
  title: string;
  equipment: { weapon: string; armor: string; pet: string };
}

interface DonationRPGProps {
  widgetId?: string;
  config?: Record<string, unknown>;
}

const RPG_TITLES: { level: number; title: string }[] = [
  { level: 1, title: '초보 모험가' },
  { level: 5, title: '숙련 전사' },
  { level: 10, title: '엘리트 기사' },
  { level: 15, title: '영웅' },
  { level: 20, title: '전설' },
  { level: 25, title: '신화' },
];

function getTitle(level: number): string {
  let title = '초보 모험가';
  for (const t of RPG_TITLES) {
    if (level >= t.level) title = t.title;
  }
  return title;
}

function getEquipment(level: number) {
  if (level >= 21) return { weapon: 'legendary_sword', armor: 'legendary', pet: 'dragon' };
  if (level >= 11) return { weapon: 'steel_sword', armor: 'steel', pet: 'wolf' };
  if (level >= 6) return { weapon: 'iron_sword', armor: 'iron', pet: 'cat' };
  return { weapon: 'wooden_sword', armor: 'cloth', pet: 'none' };
}

function getCharacterEmoji(level: number): string {
  if (level >= 21) return '👑';
  if (level >= 11) return '🛡️';
  if (level >= 6) return '⚔️';
  return '🗡️';
}

function getWeaponLabel(weapon: string): string {
  const map: Record<string, string> = {
    wooden_sword: '나무검',
    iron_sword: '철검',
    steel_sword: '강철검',
    legendary_sword: '전설의 검',
  };
  return map[weapon] || weapon;
}

function getArmorLabel(armor: string): string {
  const map: Record<string, string> = {
    cloth: '천 갑옷',
    iron: '철 갑옷',
    steel: '강철 갑옷',
    legendary: '전설의 갑옷',
  };
  return map[armor] || armor;
}

function getPetLabel(pet: string): string {
  const map: Record<string, string> = {
    none: '없음',
    cat: '🐱 고양이',
    wolf: '🐺 늑대',
    dragon: '🐉 드래곤',
  };
  return map[pet] || pet;
}

function getTierColor(level: number): string {
  if (level >= 21) return 'from-yellow-400 via-amber-500 to-orange-500';
  if (level >= 11) return 'from-blue-400 via-cyan-400 to-teal-400';
  if (level >= 6) return 'from-gray-300 via-gray-400 to-gray-500';
  return 'from-amber-700 via-amber-800 to-amber-900';
}

export default function DonationRPG({ widgetId, config }: DonationRPGProps) {
  const xpRate = (config?.xpRate as number) || 1;
  const showEquipment = config?.showEquipment !== false;

  const [character, setCharacter] = useState<RPGCharacter | null>(null);
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  const [xpGainAnim, setXpGainAnim] = useState(false);
  const [gainedXP, setGainedXP] = useState(0);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingXPRef = useRef(0);
  const streamerIdRef = useRef<string | null>(null);

  const processXPGain = useCallback((amount: number, nickname: string) => {
    const xpGained = Math.floor((amount / 100) * xpRate);
    if (xpGained <= 0) return;

    setGainedXP(xpGained);
    setXpGainAnim(true);
    setTimeout(() => setXpGainAnim(false), 2000);

    setCharacter(prev => {
      const base = prev && prev.fan_nickname === nickname
        ? prev
        : { fan_nickname: nickname, level: 1, xp: 0, xp_to_next: 100, title: '초보 모험가', equipment: getEquipment(1) };

      let newXP = base.xp + xpGained;
      let newLevel = base.level;
      let newXpToNext = base.xp_to_next;
      let didLevelUp = false;

      while (newXP >= newXpToNext) {
        newXP -= newXpToNext;
        newLevel += 1;
        newXpToNext = newLevel * 100;
        didLevelUp = true;
      }

      if (didLevelUp) {
        setLevelUpAnim(true);
        setTimeout(() => setLevelUpAnim(false), 3000);
      }

      return {
        fan_nickname: nickname,
        level: newLevel,
        xp: newXP,
        xp_to_next: newXpToNext,
        title: getTitle(newLevel),
        equipment: getEquipment(newLevel),
      };
    });

    // Debounced save to API
    pendingXPRef.current += xpGained;
    clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const sid = streamerIdRef.current;
      if (sid) {
        fetch('/api/rpg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            streamer_id: sid,
            fan_nickname: nickname,
            xp_gained: pendingXPRef.current,
          }),
        }).catch(() => {});
        pendingXPRef.current = 0;
      }
    }, 2000);
  }, [xpRate]);

  // Expose for demo
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationRPG = { processXPGain };
    return () => { delete (window as unknown as Record<string, unknown>).__donationRPG; };
  }, [processXPGain]);

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
        processXPGain(data.amount, data.fan_nickname);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, processXPGain]);

  // Load streamer_id from widget
  useEffect(() => {
    if (!widgetId) return;
    fetch(`/api/widgets?id=${widgetId}`)
      .then(r => r.json())
      .then(d => { if (d?.streamer_id) streamerIdRef.current = d.streamer_id; })
      .catch(() => {});
  }, [widgetId]);

  const xpPercent = character ? Math.min(100, (character.xp / character.xp_to_next) * 100) : 0;
  const tierColor = character ? getTierColor(character.level) : 'from-amber-700 via-amber-800 to-amber-900';

  return (
    <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
      {/* Level up flash */}
      {levelUpAnim && (
        <div className="absolute inset-0 pointer-events-none rpg-flash z-20">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl font-black text-yellow-300 rpg-levelup-text"
              style={{ textShadow: '0 0 40px rgba(255,215,0,0.9), 0 0 80px rgba(255,165,0,0.5)' }}>
              LEVEL UP!
            </div>
          </div>
          {/* Sparkle particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="absolute rpg-sparkle" style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 0.5}s`,
            }}>✨</div>
          ))}
        </div>
      )}

      {/* Character card */}
      {character ? (
        <div className="relative z-10 w-80">
          {/* Character avatar area */}
          <div className={`bg-gradient-to-br ${tierColor} rounded-t-2xl p-6 text-center relative overflow-hidden`}>
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
            <div className={`text-7xl mb-2 ${xpGainAnim ? 'rpg-bounce' : ''}`}>
              {getCharacterEmoji(character.level)}
            </div>
            <div className="text-2xl font-black text-white" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
              {character.fan_nickname}
            </div>
            <div className="text-sm font-medium text-white/80 mt-1">
              {character.title}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gray-900/95 rounded-b-2xl p-4 border border-gray-700 border-t-0">
            {/* Level + XP bar */}
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-600 rounded-lg px-3 py-1 text-sm font-black text-white">
                Lv.{character.level}
              </div>
              <div className="flex-1">
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 rpg-xp-bar"
                    style={{ width: `${xpPercent}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white/90">
                    {character.xp} / {character.xp_to_next} XP
                  </span>
                </div>
              </div>
            </div>

            {/* XP gain popup */}
            {xpGainAnim && gainedXP > 0 && (
              <div className="text-center mb-2 rpg-xp-gain text-green-400 font-bold text-sm">
                +{gainedXP} XP
              </div>
            )}

            {/* Equipment */}
            {showEquipment && (
              <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-lg mb-0.5">
                    {character.level >= 21 ? '⚡' : character.level >= 11 ? '🗡️' : character.level >= 6 ? '🔪' : '🪵'}
                  </div>
                  <div>{getWeaponLabel(character.equipment.weapon)}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-lg mb-0.5">
                    {character.level >= 21 ? '✨' : character.level >= 11 ? '🛡️' : character.level >= 6 ? '🔩' : '👕'}
                  </div>
                  <div>{getArmorLabel(character.equipment.armor)}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-2">
                  <div className="text-lg mb-0.5">
                    {character.equipment.pet === 'none' ? '❌' : character.equipment.pet === 'cat' ? '🐱' : character.equipment.pet === 'wolf' ? '🐺' : '🐉'}
                  </div>
                  <div>{getPetLabel(character.equipment.pet)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-gray-500 text-center">
          <div className="text-6xl mb-4">🗡️</div>
          <p className="text-lg font-bold">팬 RPG</p>
          <p className="text-sm mt-1">후원하면 캐릭터가 레벨업합니다!</p>
        </div>
      )}

      <style>{`
        .rpg-flash {
          animation: rpgFlash 3s ease-out forwards;
        }
        @keyframes rpgFlash {
          0% { background: rgba(255,215,0,0.4); }
          30% { background: rgba(255,215,0,0.1); }
          100% { background: transparent; }
        }
        .rpg-levelup-text {
          animation: rpgLevelUp 3s ease-out forwards;
        }
        @keyframes rpgLevelUp {
          0% { transform: scale(0.5); opacity: 0; }
          20% { transform: scale(1.3); opacity: 1; }
          40% { transform: scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-30px); }
        }
        .rpg-sparkle {
          animation: rpgSparkle 1.5s ease-out forwards;
          font-size: 20px;
        }
        @keyframes rpgSparkle {
          0% { transform: scale(0) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg); opacity: 0; }
        }
        .rpg-bounce {
          animation: rpgBounce 0.6s ease-out;
        }
        @keyframes rpgBounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.3); }
          60% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        .rpg-xp-gain {
          animation: rpgXPGain 2s ease-out forwards;
        }
        @keyframes rpgXPGain {
          0% { transform: translateY(10px); opacity: 0; }
          20% { transform: translateY(0); opacity: 1; }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .rpg-xp-bar {
          background-size: 200% 100%;
          animation: rpgXPShimmer 2s linear infinite;
        }
        @keyframes rpgXPShimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
