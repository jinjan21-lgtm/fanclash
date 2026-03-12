const AFFINITY_LEVELS = [
  { level: 0, title: '지나가는 팬', minAmount: 0 },
  { level: 1, title: '단골', minAmount: 10000 },
  { level: 2, title: '열혈팬', minAmount: 50000 },
  { level: 3, title: '첫사랑', minAmount: 200000 },
  { level: 4, title: '소울메이트', minAmount: 500000 },
] as const;

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
