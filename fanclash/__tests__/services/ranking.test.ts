import { describe, it, expect } from 'vitest';
import { calculateRankings, detectThroneChange } from '../../server/services/ranking';

describe('calculateRankings', () => {
  const donations = [
    { fan_nickname: '팬A', amount: 10000 },
    { fan_nickname: '팬B', amount: 30000 },
    { fan_nickname: '팬A', amount: 20000 },
    { fan_nickname: '팬C', amount: 25000 },
  ];

  it('aggregates by nickname and sorts descending', () => {
    const result = calculateRankings(donations);
    expect(result).toEqual([
      { nickname: '팬A', total: 30000 },
      { nickname: '팬B', total: 30000 },
      { nickname: '팬C', total: 25000 },
    ]);
  });

  it('returns top N', () => {
    expect(calculateRankings(donations, 2)).toHaveLength(2);
  });

  it('returns empty for no donations', () => {
    expect(calculateRankings([])).toEqual([]);
  });
});

describe('detectThroneChange', () => {
  it('detects when #1 changes', () => {
    const prev = [{ nickname: '팬A', total: 30000 }];
    const curr = [{ nickname: '팬B', total: 35000 }];
    expect(detectThroneChange(prev, curr)).toEqual({ previous: '팬A', current: '팬B' });
  });

  it('returns null when #1 unchanged', () => {
    const prev = [{ nickname: '팬A', total: 30000 }];
    const curr = [{ nickname: '팬A', total: 40000 }];
    expect(detectThroneChange(prev, curr)).toBeNull();
  });

  it('returns null for empty', () => {
    expect(detectThroneChange([], [])).toBeNull();
  });
});
