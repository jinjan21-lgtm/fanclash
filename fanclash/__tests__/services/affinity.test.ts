import { describe, it, expect } from 'vitest';
import { calculateAffinity } from '../../server/services/affinity';

describe('calculateAffinity', () => {
  it('returns level 0 for < 10000', () => {
    expect(calculateAffinity(5000)).toEqual({ level: 0, title: '지나가는 팬' });
  });
  it('returns level 1 for >= 10000', () => {
    expect(calculateAffinity(10000)).toEqual({ level: 1, title: '단골' });
  });
  it('returns level 4 for >= 500000', () => {
    expect(calculateAffinity(500000)).toEqual({ level: 4, title: '소울메이트' });
  });
  it('uses custom titles', () => {
    const custom = [
      { level: 0, title: '새내기', minAmount: 0 },
      { level: 1, title: '친구', minAmount: 10000 },
    ];
    expect(calculateAffinity(15000, custom)).toEqual({ level: 1, title: '친구' });
  });
  it('returns 0 for zero', () => {
    expect(calculateAffinity(0)).toEqual({ level: 0, title: '지나가는 팬' });
  });
});
