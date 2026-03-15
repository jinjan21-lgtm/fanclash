import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock battle-store and team-battle-store before importing
vi.mock('../../server/services/battle-store', () => ({
  activeBattles: new Map(),
}));
vi.mock('../../server/services/team-battle-store', () => ({
  activeTeamBattles: new Map(),
}));

import { processDonation } from '../../server/services/donation-processor';

// --- helpers ---

function createMockChain(data: any = null, error: any = null) {
  const chain: any = {
    _data: data,
    _error: error,
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockImplementation(() => Promise.resolve({ data: chain._data, error: chain._error })),
    then: vi.fn().mockImplementation((cb: any) => Promise.resolve({ data: chain._data, error: chain._error }).then(cb)),
  };
  // Make the chain itself thenable for awaited insert/update calls
  return chain;
}

function makeSupabase(overrides: Record<string, any> = {}) {
  // Track call order to return different chains per table+operation
  const fromMap: Record<string, any> = {};

  const supabase: any = {
    from: vi.fn((table: string) => {
      if (fromMap[table]) return fromMap[table];
      return createMockChain();
    }),
    _setChain(table: string, chain: any) {
      fromMap[table] = chain;
    },
  };

  return supabase;
}

function makeIO() {
  const emitFn = vi.fn();
  const toFn = vi.fn().mockReturnValue({ emit: emitFn });
  const io: any = { to: toFn };
  return { io, toFn, emitFn };
}

// --- tests ---

describe('processDonation', () => {
  const STREAMER_ID = 'streamer-uuid-1234';
  const FAN = '팬닉네임';
  const AMOUNT = 5000;
  const MESSAGE = '응원합니다!';

  let supabase: any;
  let io: any;
  let emitFn: ReturnType<typeof vi.fn>;

  // Per-table chains so we can control return values
  let donationsChain: any;
  let fanProfilesChain: any;
  let allProfilesChain: any;
  let goalChain: any;
  let battlesChain: any;
  let teamBattlesChain: any;

  beforeEach(() => {
    vi.clearAllMocks();

    const ioMock = makeIO();
    io = ioMock.io;
    emitFn = ioMock.emitFn;

    // Build per-call response chains
    // We need fine-grained control because supabase.from('fan_profiles') is called
    // multiple times with different queries. We use a call-counter approach.
    donationsChain = createMockChain();
    goalChain = createMockChain(null); // no active goal by default
    battlesChain = createMockChain(null);
    teamBattlesChain = createMockChain(null);

    // fan_profiles: first call = single lookup, second call = top10 select
    let fanProfileCallCount = 0;
    const fanProfileFrom: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        fanProfileCallCount++;
        if (fanProfileCallCount === 1) {
          // First single() = fan profile lookup — no existing fan
          return Promise.resolve({ data: null, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: vi.fn().mockImplementation((cb: any) =>
        Promise.resolve({ data: [], error: null }).then(cb),
      ),
    };

    supabase = {
      from: vi.fn((table: string) => {
        switch (table) {
          case 'donations': return donationsChain;
          case 'fan_profiles': return fanProfileFrom;
          case 'donation_goals': return goalChain;
          case 'battles': return battlesChain;
          case 'team_battles': return teamBattlesChain;
          default: return createMockChain();
        }
      }),
    };
  });

  it('saves donation to the database', async () => {
    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT, MESSAGE);

    expect(supabase.from).toHaveBeenCalledWith('donations');
    expect(donationsChain.insert).toHaveBeenCalledWith({
      streamer_id: STREAMER_ID,
      fan_nickname: FAN,
      amount: AMOUNT,
      message: MESSAGE,
    });
  });

  it('inserts a new fan profile when fan does not exist', async () => {
    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    // fan_profiles.insert should have been called (new fan)
    const fanCall = supabase.from.mock.results.find(
      (_: any, i: number) => supabase.from.mock.calls[i][0] === 'fan_profiles',
    );
    expect(fanCall).toBeDefined();
  });

  it('emits donation:new to the correct room', async () => {
    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT, MESSAGE);

    expect(io.to).toHaveBeenCalledWith(`streamer:${STREAMER_ID}`);
    expect(emitFn).toHaveBeenCalledWith('donation:new', expect.objectContaining({
      streamer_id: STREAMER_ID,
      fan_nickname: FAN,
      amount: AMOUNT,
      message: MESSAGE,
    }));
  });

  it('emits ranking:update after donation', async () => {
    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    expect(emitFn).toHaveBeenCalledWith('ranking:update', expect.objectContaining({
      rankings: expect.any(Array),
      period: 'total',
    }));
  });

  it('uses empty string when message is omitted', async () => {
    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    expect(donationsChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ message: '' }),
    );
    expect(emitFn).toHaveBeenCalledWith('donation:new', expect.objectContaining({
      message: '',
    }));
  });

  it('updates existing fan profile when fan already exists', async () => {
    // Override fan_profiles to return an existing profile on first single()
    let callCount = 0;
    const existingProfile = {
      id: 'fp-1',
      streamer_id: STREAMER_ID,
      nickname: FAN,
      total_donated: 8000,
      affinity_level: 0,
      title: '지나가는 팬',
    };

    const fanProfileFrom: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: existingProfile, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: vi.fn().mockImplementation((cb: any) =>
        Promise.resolve({ data: [], error: null }).then(cb),
      ),
    };

    supabase.from = vi.fn((table: string) => {
      if (table === 'fan_profiles') return fanProfileFrom;
      if (table === 'donations') return donationsChain;
      if (table === 'donation_goals') return goalChain;
      if (table === 'battles') return battlesChain;
      if (table === 'team_battles') return teamBattlesChain;
      return createMockChain();
    });

    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    // Should call update (not insert) for existing fan
    expect(fanProfileFrom.update).toHaveBeenCalledWith(
      expect.objectContaining({
        total_donated: 8000 + AMOUNT, // 13000
        affinity_level: 1, // crosses 10000 threshold -> 단골
        title: '단골',
      }),
    );
  });

  it('emits affinity:levelup when fan levels up', async () => {
    let callCount = 0;
    const existingProfile = {
      id: 'fp-1',
      streamer_id: STREAMER_ID,
      nickname: FAN,
      total_donated: 8000,
      affinity_level: 0,
      title: '지나가는 팬',
    };

    const fanProfileFrom: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: existingProfile, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: vi.fn().mockImplementation((cb: any) =>
        Promise.resolve({ data: [], error: null }).then(cb),
      ),
    };

    supabase.from = vi.fn((table: string) => {
      if (table === 'fan_profiles') return fanProfileFrom;
      if (table === 'donations') return donationsChain;
      if (table === 'donation_goals') return goalChain;
      if (table === 'battles') return battlesChain;
      if (table === 'team_battles') return teamBattlesChain;
      return createMockChain();
    });

    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    // 8000 + 5000 = 13000 -> level 1 (단골), old level was 0
    expect(emitFn).toHaveBeenCalledWith('affinity:levelup', {
      nickname: FAN,
      level: 1,
      title: '단골',
    });
  });

  it('does not emit affinity:levelup when level stays the same', async () => {
    let callCount = 0;
    const existingProfile = {
      id: 'fp-1',
      streamer_id: STREAMER_ID,
      nickname: FAN,
      total_donated: 15000, // already level 1
      affinity_level: 1,
      title: '단골',
    };

    const fanProfileFrom: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: existingProfile, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      }),
      then: vi.fn().mockImplementation((cb: any) =>
        Promise.resolve({ data: [], error: null }).then(cb),
      ),
    };

    supabase.from = vi.fn((table: string) => {
      if (table === 'fan_profiles') return fanProfileFrom;
      if (table === 'donations') return donationsChain;
      if (table === 'donation_goals') return goalChain;
      if (table === 'battles') return battlesChain;
      if (table === 'team_battles') return teamBattlesChain;
      return createMockChain();
    });

    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    const levelUpCalls = emitFn.mock.calls.filter(
      (call: any[]) => call[0] === 'affinity:levelup',
    );
    expect(levelUpCalls).toHaveLength(0);
  });

  it('emits goal:update when active donation goal exists', async () => {
    const goal = {
      id: 'goal-1',
      streamer_id: STREAMER_ID,
      current_amount: 50000,
      active: true,
      milestones: [100000, 200000],
    };

    goalChain = createMockChain(goal);

    supabase.from = vi.fn((table: string) => {
      if (table === 'donation_goals') return goalChain;
      if (table === 'donations') return donationsChain;
      if (table === 'fan_profiles') {
        const chain = createMockChain(null);
        chain.then = vi.fn().mockImplementation((cb: any) =>
          Promise.resolve({ data: [], error: null }).then(cb),
        );
        return chain;
      }
      if (table === 'battles') return battlesChain;
      if (table === 'team_battles') return teamBattlesChain;
      return createMockChain();
    });

    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    expect(emitFn).toHaveBeenCalledWith('goal:update', {
      current_amount: 50000 + AMOUNT,
      milestones: [100000, 200000],
    });
  });

  it('does not emit goal:update when no active goal', async () => {
    await processDonation(io, supabase, STREAMER_ID, FAN, AMOUNT);

    const goalCalls = emitFn.mock.calls.filter(
      (call: any[]) => call[0] === 'goal:update',
    );
    expect(goalCalls).toHaveLength(0);
  });
});
