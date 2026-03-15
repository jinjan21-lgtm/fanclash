import { ACHIEVEMENTS } from './achievements';

interface CheckContext {
  fan_nickname: string;
  streamer_id: string;
  amount: number;
  donation_count: number;
  // Optional context from other widgets
  combo_count?: number;
  gacha_grade?: string;
  rpg_level?: number;
  battle_wins?: number;
  battle_streak?: number;
  is_jackpot?: boolean;
  is_meter_max?: boolean;
  is_mission_complete?: boolean;
  existing_achievements: string[];
}

/**
 * Check which achievements should be unlocked based on the current context.
 * Returns a list of achievement IDs that are newly unlocked.
 */
export function checkAchievements(ctx: CheckContext): string[] {
  const newAchievements: string[] = [];
  const has = (id: string) => ctx.existing_achievements.includes(id);

  // Donation count achievements
  if (ctx.donation_count >= 1 && !has('first_donation')) {
    newAchievements.push('first_donation');
  }
  if (ctx.donation_count >= 10 && !has('donation_10')) {
    newAchievements.push('donation_10');
  }
  if (ctx.donation_count >= 50 && !has('donation_50')) {
    newAchievements.push('donation_50');
  }
  if (ctx.donation_count >= 100 && !has('donation_100')) {
    newAchievements.push('donation_100');
  }

  // Big spender
  if (ctx.amount >= 50000 && !has('big_spender')) {
    newAchievements.push('big_spender');
  }

  // Night owl (2-5 AM KST)
  const now = new Date();
  const kstHour = (now.getUTCHours() + 9) % 24;
  if (kstHour >= 2 && kstHour < 5 && !has('night_owl')) {
    newAchievements.push('night_owl');
  }

  // Battle achievements
  if (ctx.battle_wins !== undefined) {
    if (ctx.battle_wins >= 1 && !has('battle_winner')) {
      newAchievements.push('battle_winner');
    }
  }
  if (ctx.battle_streak !== undefined) {
    if (ctx.battle_streak >= 3 && !has('battle_streak_3')) {
      newAchievements.push('battle_streak_3');
    }
  }

  // Gacha achievements
  if (ctx.gacha_grade) {
    if (ctx.gacha_grade === 'SR' && !has('gacha_sr')) newAchievements.push('gacha_sr');
    if (ctx.gacha_grade === 'SSR' && !has('gacha_ssr')) newAchievements.push('gacha_ssr');
    if (ctx.gacha_grade === 'UR' && !has('gacha_ur')) newAchievements.push('gacha_ur');
  }

  // RPG level achievements
  if (ctx.rpg_level !== undefined) {
    if (ctx.rpg_level >= 5 && !has('rpg_level_5')) newAchievements.push('rpg_level_5');
    if (ctx.rpg_level >= 10 && !has('rpg_level_10')) newAchievements.push('rpg_level_10');
    if (ctx.rpg_level >= 20 && !has('rpg_level_20')) newAchievements.push('rpg_level_20');
  }

  // Combo achievements
  if (ctx.combo_count !== undefined && ctx.combo_count >= 10 && !has('combo_10')) {
    newAchievements.push('combo_10');
  }

  // Jackpot
  if (ctx.is_jackpot && !has('jackpot')) {
    newAchievements.push('jackpot');
  }

  // Meter max
  if (ctx.is_meter_max && !has('meter_max')) {
    newAchievements.push('meter_max');
  }

  // Mission contributor
  if (ctx.is_mission_complete && !has('mission_contributor')) {
    newAchievements.push('mission_contributor');
  }

  return newAchievements;
}
