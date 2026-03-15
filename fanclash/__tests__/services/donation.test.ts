import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the donation-processor so we don't hit real Supabase
vi.mock('../../server/services/donation-processor', () => ({
  processDonation: vi.fn().mockResolvedValue(undefined),
}));

import { handleDonationDirect, handleDonation } from '../../server/handlers/donation';
import { processDonation } from '../../server/services/donation-processor';

const mockedProcess = vi.mocked(processDonation);

function makeIO() {
  return { emit: vi.fn() } as any;
}

function makeSupabase() {
  return {} as any;
}

function makeSocket() {
  const handlers: Record<string, Function> = {};
  return {
    on: vi.fn((event: string, handler: Function) => {
      handlers[event] = handler;
    }),
    emit: vi.fn(),
    _trigger(event: string, data: any) {
      return handlers[event]?.(data);
    },
  };
}

function validData(overrides: Record<string, any> = {}) {
  return {
    streamer_id: 'streamer-1',
    fan_nickname: '팬유저',
    amount: 5000,
    message: '응원합니다!',
    ...overrides,
  };
}

describe('handleDonationDirect - validation', () => {
  beforeEach(() => {
    mockedProcess.mockClear();
  });

  it('processes valid donation', async () => {
    const io = makeIO();
    const supabase = makeSupabase();
    await handleDonationDirect(io, supabase, validData());
    expect(mockedProcess).toHaveBeenCalledOnce();
  });

  it('rejects missing streamer_id', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ streamer_id: '' }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('rejects missing fan_nickname', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ fan_nickname: '' }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('rejects amount = 0', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ amount: 0 }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('rejects negative amount', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ amount: -100 }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('rejects amount exceeding 100,000,000', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ amount: 100_000_001 }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('accepts amount at upper boundary (100,000,000)', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ amount: 100_000_000 }));
    expect(mockedProcess).toHaveBeenCalledOnce();
  });

  it('rejects non-number amount', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ amount: '5000' }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('rejects nickname longer than 50 chars', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ fan_nickname: 'A'.repeat(51) }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('accepts nickname exactly 50 chars', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ fan_nickname: 'A'.repeat(50) }));
    expect(mockedProcess).toHaveBeenCalledOnce();
  });

  it('rejects message longer than 500 chars', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ message: 'X'.repeat(501) }));
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('accepts message exactly 500 chars', async () => {
    await handleDonationDirect(makeIO(), makeSupabase(), validData({ message: 'X'.repeat(500) }));
    expect(mockedProcess).toHaveBeenCalledOnce();
  });

  it('accepts donation without message', async () => {
    const data = validData();
    delete (data as any).message;
    await handleDonationDirect(makeIO(), makeSupabase(), data);
    expect(mockedProcess).toHaveBeenCalledOnce();
  });
});

describe('handleDonation (socket) - validation', () => {
  beforeEach(() => {
    mockedProcess.mockClear();
  });

  it('registers donation:add listener', () => {
    const socket = makeSocket();
    handleDonation(makeIO(), socket as any, makeSupabase());
    expect(socket.on).toHaveBeenCalledWith('donation:add', expect.any(Function));
  });

  it('emits error on invalid data', async () => {
    const socket = makeSocket();
    handleDonation(makeIO(), socket as any, makeSupabase());
    await socket._trigger('donation:add', validData({ amount: -1 }));
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Invalid donation data' });
    expect(mockedProcess).not.toHaveBeenCalled();
  });

  it('emits error when nickname too long', async () => {
    const socket = makeSocket();
    handleDonation(makeIO(), socket as any, makeSupabase());
    await socket._trigger('donation:add', validData({ fan_nickname: 'A'.repeat(51) }));
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Input too long' });
  });

  it('emits error when message too long', async () => {
    const socket = makeSocket();
    handleDonation(makeIO(), socket as any, makeSupabase());
    await socket._trigger('donation:add', validData({ message: 'X'.repeat(501) }));
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Input too long' });
  });

  it('processes valid donation through socket', async () => {
    const io = makeIO();
    const socket = makeSocket();
    const supabase = makeSupabase();
    handleDonation(io, socket as any, supabase);
    await socket._trigger('donation:add', validData());
    expect(mockedProcess).toHaveBeenCalledOnce();
  });
});

describe('rate limiting', () => {
  beforeEach(() => {
    mockedProcess.mockClear();
  });

  it('allows up to 30 donations per streamer within the window', async () => {
    const io = makeIO();
    const supabase = makeSupabase();
    const streamerId = `rate-limit-test-${Date.now()}`;

    for (let i = 0; i < 30; i++) {
      await handleDonationDirect(io, supabase, validData({ streamer_id: streamerId }));
    }
    expect(mockedProcess).toHaveBeenCalledTimes(30);
  });

  it('blocks the 31st donation for the same streamer', async () => {
    const io = makeIO();
    const supabase = makeSupabase();
    const streamerId = `rate-limit-block-${Date.now()}`;

    for (let i = 0; i < 31; i++) {
      await handleDonationDirect(io, supabase, validData({ streamer_id: streamerId }));
    }
    // Only the first 30 should have been processed
    expect(mockedProcess).toHaveBeenCalledTimes(30);
  });

  it('allows donations to different streamers independently', async () => {
    const io = makeIO();
    const supabase = makeSupabase();
    const ts = Date.now();

    for (let i = 0; i < 30; i++) {
      await handleDonationDirect(io, supabase, validData({ streamer_id: `streamer-a-${ts}` }));
    }
    // Different streamer should still be allowed
    await handleDonationDirect(io, supabase, validData({ streamer_id: `streamer-b-${ts}` }));
    expect(mockedProcess).toHaveBeenCalledTimes(31);
  });

  it('emits rate limit error through socket handler', async () => {
    const io = makeIO();
    const socket = makeSocket();
    const supabase = makeSupabase();
    const streamerId = `socket-rate-${Date.now()}`;

    handleDonation(io, socket as any, supabase);

    for (let i = 0; i < 31; i++) {
      await socket._trigger('donation:add', validData({ streamer_id: streamerId }));
    }
    expect(socket.emit).toHaveBeenCalledWith('error', { message: 'Too many donations. Please slow down.' });
  });

  it('resets rate limit after the time window', async () => {
    const io = makeIO();
    const supabase = makeSupabase();
    const streamerId = `rate-reset-${Date.now()}`;

    vi.useFakeTimers();
    try {
      for (let i = 0; i < 30; i++) {
        await handleDonationDirect(io, supabase, validData({ streamer_id: streamerId }));
      }
      expect(mockedProcess).toHaveBeenCalledTimes(30);

      // Advance past the 60-second rate window
      vi.advanceTimersByTime(61_000);

      await handleDonationDirect(io, supabase, validData({ streamer_id: streamerId }));
      expect(mockedProcess).toHaveBeenCalledTimes(31);
    } finally {
      vi.useRealTimers();
    }
  });
});
