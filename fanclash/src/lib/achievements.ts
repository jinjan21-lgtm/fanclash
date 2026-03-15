export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'donation' | 'battle' | 'gacha' | 'rpg' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  // Donation
  { id: 'first_donation', name: '첫 후원', description: '처음으로 후원했습니다', icon: '🎉', category: 'donation', rarity: 'common' },
  { id: 'donation_10', name: '단골', description: '10회 후원 달성', icon: '⭐', category: 'donation', rarity: 'common' },
  { id: 'donation_50', name: '서포터', description: '50회 후원 달성', icon: '💜', category: 'donation', rarity: 'rare' },
  { id: 'donation_100', name: '슈퍼 서포터', description: '100회 후원 달성', icon: '👑', category: 'donation', rarity: 'epic' },
  { id: 'big_spender', name: '큰 손', description: '1회 50,000원 이상 후원', icon: '💎', category: 'donation', rarity: 'rare' },

  // Battle
  { id: 'battle_winner', name: '첫 승리', description: '배틀에서 처음 승리', icon: '🏆', category: 'battle', rarity: 'common' },
  { id: 'battle_streak_3', name: '3연승', description: '배틀 3연속 승리', icon: '🔥', category: 'battle', rarity: 'rare' },
  { id: 'tournament_champion', name: '토너먼트 챔피언', description: '토너먼트 우승', icon: '🎖️', category: 'battle', rarity: 'epic' },

  // Gacha
  { id: 'gacha_sr', name: 'SR 수집가', description: 'SR 등급 획득', icon: '🌟', category: 'gacha', rarity: 'common' },
  { id: 'gacha_ssr', name: 'SSR 헌터', description: 'SSR 등급 획득', icon: '✨', category: 'gacha', rarity: 'rare' },
  { id: 'gacha_ur', name: 'UR 전설', description: 'UR 등급 획득', icon: '🌈', category: 'gacha', rarity: 'legendary' },
  { id: 'gacha_complete', name: '도감 완성', description: '모든 등급 수집 완료', icon: '📚', category: 'gacha', rarity: 'legendary' },

  // RPG
  { id: 'rpg_level_5', name: '숙련 전사', description: 'RPG 레벨 5 달성', icon: '⚔️', category: 'rpg', rarity: 'common' },
  { id: 'rpg_level_10', name: '엘리트', description: 'RPG 레벨 10 달성', icon: '🛡️', category: 'rpg', rarity: 'rare' },
  { id: 'rpg_level_20', name: '전설의 영웅', description: 'RPG 레벨 20 달성', icon: '👑', category: 'rpg', rarity: 'epic' },

  // Special
  { id: 'combo_10', name: '콤보 마스터', description: '10콤보 트레인에 기여', icon: '🚂', category: 'special', rarity: 'rare' },
  { id: 'jackpot', name: '잭팟!', description: '슬롯 잭팟 당첨', icon: '🎰', category: 'special', rarity: 'epic' },
  { id: 'meter_max', name: '불꽃 점화', description: '분위기 미터 MAX 기여', icon: '💥', category: 'special', rarity: 'rare' },
  { id: 'mission_contributor', name: '미션 기여자', description: '팬 미션 달성에 기여', icon: '🎯', category: 'special', rarity: 'common' },
  { id: 'night_owl', name: '올빼미', description: '새벽 2-5시에 후원', icon: '🦉', category: 'special', rarity: 'rare' },
];

export const RARITY_COLORS: Record<string, { border: string; bg: string; text: string; glow?: string }> = {
  common: { border: 'border-gray-500', bg: 'bg-gray-800', text: 'text-gray-300' },
  rare: { border: 'border-blue-500', bg: 'bg-blue-900/30', text: 'text-blue-300' },
  epic: { border: 'border-purple-500', bg: 'bg-purple-900/30', text: 'text-purple-300' },
  legendary: { border: 'border-yellow-500', bg: 'bg-yellow-900/30', text: 'text-yellow-300', glow: 'shadow-yellow-500/20 shadow-lg' },
};

export const RARITY_LABELS: Record<string, string> = {
  common: '일반',
  rare: '레어',
  epic: '에픽',
  legendary: '전설',
};

export const CATEGORY_LABELS: Record<string, string> = {
  donation: '후원',
  battle: '배틀',
  gacha: '가챠',
  rpg: 'RPG',
  social: '소셜',
  special: '특별',
};

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}
