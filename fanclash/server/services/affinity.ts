import { AFFINITY_LEVELS } from '../../src/types';

interface AffinityLevel { level: number; title: string; minAmount: number; }

export function calculateAffinity(
  totalDonated: number,
  levels: readonly AffinityLevel[] = AFFINITY_LEVELS
): { level: number; title: string } {
  let result = { level: levels[0].level, title: levels[0].title };
  for (const l of levels) {
    if (totalDonated >= l.minAmount) {
      result = { level: l.level, title: l.title };
    }
  }
  return result;
}
