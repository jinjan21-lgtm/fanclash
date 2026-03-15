'use client';
import { useState } from 'react';
import { AFFINITY_LEVELS } from '@/types';
import { getAchievementById, RARITY_COLORS, RARITY_LABELS, CATEGORY_LABELS } from '@/lib/achievements';

interface Props {
  streamer: { id: string; display_name: string };
  nickname: string;
  fanProfile: {
    total_donated: number;
    affinity_level: number;
    title: string;
  } | null;
  donationCount: number;
  rank: number;
  totalFans: number;
  rpgCharacter: {
    level: number;
    xp: number;
    xp_to_next: number;
    title: string;
    equipment: { weapon: string; armor: string; pet: string };
  } | null;
  gachaCollection: { grade: string; count: number }[];
  battleWins: number;
  battleLosses: number;
  achievements: { achievement_id: string; unlocked_at: string }[];
}

const GACHA_GRADES = ['N', 'R', 'SR', 'SSR', 'UR'];
const GRADE_COLORS: Record<string, string> = {
  N: 'text-gray-400 border-gray-600',
  R: 'text-blue-400 border-blue-600',
  SR: 'text-purple-400 border-purple-600',
  SSR: 'text-yellow-400 border-yellow-600',
  UR: 'text-red-400 border-red-600',
};

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];

function getCharacterEmoji(level: number): string {
  if (level >= 21) return '👑';
  if (level >= 11) return '🛡️';
  if (level >= 6) return '⚔️';
  return '🗡️';
}

function getWeaponLabel(weapon: string): string {
  const map: Record<string, string> = {
    wooden_sword: '나무검', iron_sword: '철검',
    steel_sword: '강철검', legendary_sword: '전설의 검',
  };
  return map[weapon] || weapon;
}

function getArmorLabel(armor: string): string {
  const map: Record<string, string> = {
    cloth: '천 갑옷', iron: '철 갑옷',
    steel: '강철 갑옷', legendary: '전설의 갑옷',
  };
  return map[armor] || armor;
}

function getPetLabel(pet: string): string {
  const map: Record<string, string> = {
    none: '없음', cat: '🐱 고양이',
    wolf: '🐺 늑대', dragon: '🐉 드래곤',
  };
  return map[pet] || pet;
}

export default function FanProfileClient({
  streamer, nickname, fanProfile, donationCount, rank, totalFans,
  rpgCharacter, gachaCollection, battleWins, battleLosses, achievements,
}: Props) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/fan/${streamer.id}/${encodeURIComponent(nickname)}`
    : '';

  const copyUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const affinityLevel = fanProfile?.affinity_level ?? 0;
  const affinityTitle = AFFINITY_LEVELS[affinityLevel]?.title || '지나가는 팬';
  const nextLevel = AFFINITY_LEVELS[affinityLevel + 1];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{LEVEL_EMOJIS[affinityLevel] || '👤'}</div>
          <h1 className="text-3xl font-bold">{nickname}</h1>
          <p className="text-gray-400 mt-1">{streamer.display_name}의 팬</p>
          <div className="inline-block mt-2 px-3 py-1 bg-purple-600/30 border border-purple-500/40 rounded-full text-sm text-purple-300">
            {affinityTitle}
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
            <p className="text-2xl font-bold text-purple-400">
              {(fanProfile?.total_donated || 0).toLocaleString()}원
            </p>
            <p className="text-xs text-gray-500 mt-1">총 후원</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
            <p className="text-2xl font-bold text-green-400">{donationCount}회</p>
            <p className="text-xs text-gray-500 mt-1">후원 횟수</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
            <p className="text-2xl font-bold text-yellow-400">
              {rank > 0 ? `#${rank}` : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{totalFans}명 중 순위</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-4 text-center border border-gray-800">
            <p className="text-2xl font-bold text-blue-400">Lv.{affinityLevel}</p>
            <p className="text-xs text-gray-500 mt-1">호감도</p>
          </div>
        </div>

        {/* Affinity progress */}
        {nextLevel && (
          <div className="bg-gray-900 rounded-xl p-4 mb-6 border border-gray-800">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{affinityTitle}</span>
              <span>{nextLevel.title}</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, ((fanProfile?.total_donated || 0) / nextLevel.minAmount) * 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1 text-right">
              {(fanProfile?.total_donated || 0).toLocaleString()} / {nextLevel.minAmount.toLocaleString()}원
            </p>
          </div>
        )}

        {/* RPG Character */}
        {rpgCharacter && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              {getCharacterEmoji(rpgCharacter.level)} RPG 캐릭터
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="text-5xl">{getCharacterEmoji(rpgCharacter.level)}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-purple-600 rounded px-2 py-0.5 text-xs font-bold">Lv.{rpgCharacter.level}</span>
                  <span className="text-sm text-gray-300">{rpgCharacter.title}</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${(rpgCharacter.xp / rpgCharacter.xp_to_next) * 100}%` }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80">
                    {rpgCharacter.xp} / {rpgCharacter.xp_to_next} XP
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-gray-400">
              <div className="bg-gray-800 rounded-lg p-2">
                <div className="text-lg mb-0.5">{rpgCharacter.level >= 21 ? '⚡' : rpgCharacter.level >= 11 ? '🗡️' : rpgCharacter.level >= 6 ? '🔪' : '🪵'}</div>
                <div>{getWeaponLabel(rpgCharacter.equipment.weapon)}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <div className="text-lg mb-0.5">{rpgCharacter.level >= 21 ? '✨' : rpgCharacter.level >= 11 ? '🛡️' : rpgCharacter.level >= 6 ? '🔩' : '👕'}</div>
                <div>{getArmorLabel(rpgCharacter.equipment.armor)}</div>
              </div>
              <div className="bg-gray-800 rounded-lg p-2">
                <div className="text-lg mb-0.5">{rpgCharacter.equipment.pet === 'none' ? '❌' : rpgCharacter.equipment.pet === 'cat' ? '🐱' : rpgCharacter.equipment.pet === 'wolf' ? '🐺' : '🐉'}</div>
                <div>{getPetLabel(rpgCharacter.equipment.pet)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Gacha collection */}
        {gachaCollection.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4">🎰 가챠 컬렉션</h3>
            <div className="flex gap-3 justify-center">
              {GACHA_GRADES.map(grade => {
                const found = gachaCollection.find(g => g.grade === grade);
                const count = found?.count || 0;
                return (
                  <div key={grade} className={`text-center px-4 py-3 rounded-xl border-2 ${GRADE_COLORS[grade]} ${count > 0 ? 'bg-gray-800' : 'bg-gray-900 opacity-40'}`}>
                    <div className="text-xl font-black">{grade}</div>
                    <div className="text-sm mt-1">{count > 0 ? `x${count}` : '-'}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Battle history */}
        {(battleWins > 0 || battleLosses > 0) && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4">⚔️ 배틀 전적</h3>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-400">{battleWins}</p>
                <p className="text-xs text-gray-500">승리</p>
              </div>
              <div className="text-2xl text-gray-600">vs</div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-400">{battleLosses}</p>
                <p className="text-xs text-gray-500">패배</p>
              </div>
            </div>
            {(battleWins + battleLosses) > 0 && (
              <div className="mt-3 text-center text-sm text-gray-400">
                승률 {Math.round((battleWins / (battleWins + battleLosses)) * 100)}%
              </div>
            )}
          </div>
        )}

        {/* Achievements */}
        {achievements.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-5 mb-6 border border-gray-800">
            <h3 className="font-bold text-lg mb-4">🏅 업적 ({achievements.length}개)</h3>
            <div className="grid grid-cols-4 gap-2">
              {achievements.map(a => {
                const def = getAchievementById(a.achievement_id);
                if (!def) return null;
                const style = RARITY_COLORS[def.rarity];
                return (
                  <div key={a.achievement_id}
                    className={`text-center p-2 rounded-xl border ${style.border} ${style.bg} ${style.glow || ''}`}
                    title={`${def.name} - ${def.description}`}>
                    <div className="text-2xl mb-0.5">{def.icon}</div>
                    <div className="text-[10px] font-medium text-white truncate">{def.name}</div>
                    <div className={`text-[9px] ${style.text}`}>{RARITY_LABELS[def.rarity]}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="text-center">
          <button onClick={copyUrl}
            className="px-6 py-2.5 bg-purple-600 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
            {copied ? '복사됨!' : '내 프로필 공유'}
          </button>
        </div>

        <div className="mt-8 text-center">
          <a href={`/fan/${streamer.id}`} className="text-gray-500 text-sm hover:text-gray-400 transition-colors">
            ← {streamer.display_name} 리더보드로
          </a>
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-700 text-xs">Powered by FanClash</p>
        </div>
      </div>
    </div>
  );
}
