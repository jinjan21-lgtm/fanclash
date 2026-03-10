interface RankEntry { nickname: string; total: number; }

export function calculateRankings(
  donations: { fan_nickname: string; amount: number }[],
  limit = 5
): RankEntry[] {
  const map = new Map<string, number>();
  for (const d of donations) {
    map.set(d.fan_nickname, (map.get(d.fan_nickname) || 0) + d.amount);
  }
  return Array.from(map.entries())
    .map(([nickname, total]) => ({ nickname, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function detectThroneChange(
  prev: RankEntry[],
  curr: RankEntry[]
): { previous: string; current: string } | null {
  const prevKing = prev[0]?.nickname;
  const currKing = curr[0]?.nickname;
  if (!prevKing || !currKing || prevKing === currKing) return null;
  return { previous: prevKing, current: currKing };
}
