import { describe, it, expect } from 'vitest';
import { BattleManager } from '../../server/services/battle';

describe('BattleManager', () => {
  it('creates in recruiting status', () => {
    const bm = new BattleManager('b1', 180);
    expect(bm.getStatus()).toBe('recruiting');
  });
  it('adds participants', () => {
    const bm = new BattleManager('b1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    expect(bm.getParticipants()).toHaveLength(2);
  });
  it('starts battle', () => {
    const bm = new BattleManager('b1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    bm.start();
    expect(bm.getStatus()).toBe('active');
  });
  it('rejects start with < 2', () => {
    const bm = new BattleManager('b1', 180);
    bm.addParticipant('팬A', 5000);
    expect(() => bm.start()).toThrow('최소 2명');
  });
  it('adds donation during battle', () => {
    const bm = new BattleManager('b1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    bm.start();
    bm.addDonation('팬A', 10000);
    expect(bm.getParticipants().find(p => p.nickname === '팬A')?.amount).toBe(15000);
  });
  it('determines winner', () => {
    const bm = new BattleManager('b1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    bm.start();
    bm.addDonation('팬A', 20000);
    expect(bm.finish()).toBe('팬A');
    expect(bm.getStatus()).toBe('finished');
  });
  it('rejects donation when not active', () => {
    const bm = new BattleManager('b1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    expect(() => bm.addDonation('팬A', 1000)).toThrow('진행 중이 아닙');
  });
});
