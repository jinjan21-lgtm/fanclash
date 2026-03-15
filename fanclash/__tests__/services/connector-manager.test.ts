import { IntegrationManager } from '../../server/connectors/manager';

// Store all created instances for assertions
const instances: any[] = [];

const {
  MockToonation,
  MockTiktok,
  MockStreamlabs,
  MockChzzk,
  MockSoop,
} = vi.hoisted(() => {
  // We cannot reference `instances` from vi.hoisted, so we use a shared array via globalThis
  (globalThis as any).__mockInstances = [];

  function createMockConnectorClass(asyncConnect = false) {
    return class MockConnector {
      connect = asyncConnect ? vi.fn().mockResolvedValue(undefined) : vi.fn();
      disconnect = vi.fn();
      isConnected = vi.fn().mockReturnValue(true);
      setOnDisconnect = vi.fn();
      constructor(..._args: any[]) {
        (globalThis as any).__mockInstances.push(this);
      }
    };
  }

  return {
    MockToonation: createMockConnectorClass(),
    MockTiktok: createMockConnectorClass(true),
    MockStreamlabs: createMockConnectorClass(),
    MockChzzk: createMockConnectorClass(true),
    MockSoop: createMockConnectorClass(true),
  };
});

vi.mock('../../server/connectors/toonation', () => ({
  ToonationConnector: MockToonation,
}));

vi.mock('../../server/connectors/tiktok', () => ({
  TiktokConnector: MockTiktok,
}));

vi.mock('../../server/connectors/streamlabs', () => ({
  StreamlabsConnector: MockStreamlabs,
}));

vi.mock('../../server/connectors/chzzk', () => ({
  ChzzkConnector: MockChzzk,
}));

vi.mock('../../server/connectors/soop', () => ({
  SoopConnector: MockSoop,
}));

vi.mock('../../server/services/donation-processor', () => ({
  processDonation: vi.fn(),
}));

// Supabase mock helpers
function createSupabaseMock() {
  const eqMock = vi.fn().mockResolvedValue({ data: null, error: null });
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock });
  const selectEqMock = vi.fn().mockResolvedValue({ data: [], error: null });
  const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock });

  return {
    from: vi.fn().mockReturnValue({
      update: updateMock,
      select: selectMock,
    }),
    _updateMock: updateMock,
  };
}

function getLastInstance(): any {
  const arr = (globalThis as any).__mockInstances;
  return arr[arr.length - 1] ?? null;
}

function getInstanceAt(index: number): any {
  return (globalThis as any).__mockInstances[index] ?? null;
}

describe('IntegrationManager', () => {
  let manager: IntegrationManager;
  let supabaseMock: ReturnType<typeof createSupabaseMock>;
  let ioMock: any;

  beforeEach(() => {
    (globalThis as any).__mockInstances = [];
    vi.useFakeTimers();
    supabaseMock = createSupabaseMock();
    ioMock = {} as any;
    manager = new IntegrationManager(ioMock, supabaseMock as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startIntegration', () => {
    it('should create a ToonationConnector for toonation platform', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'test-key-123',
      });

      const instance = getLastInstance();
      expect(instance).not.toBeNull();
      expect(instance.connect).toHaveBeenCalled();

      const status = manager.getStatus();
      expect(status).toHaveLength(1);
      expect(status[0]).toEqual({
        id: 'int-1',
        platform: 'toonation',
        connected: true,
      });
    });

    it('should create a TiktokConnector for tiktok platform', async () => {
      await manager.startIntegration('int-2', 'streamer-1', 'tiktok', {
        username: 'tiktok_user',
      });

      const instance = getLastInstance();
      expect(instance).not.toBeNull();
      expect(instance.connect).toHaveBeenCalled();
      expect(instance.setOnDisconnect).toHaveBeenCalled();

      const status = manager.getStatus();
      expect(status).toHaveLength(1);
      expect(status[0].platform).toBe('tiktok');
    });

    it('should create a StreamlabsConnector for streamlabs platform', async () => {
      await manager.startIntegration('int-3', 'streamer-1', 'streamlabs', {
        socket_token: 'sl-token',
      });

      const instance = getLastInstance();
      expect(instance).not.toBeNull();
      expect(instance.connect).toHaveBeenCalled();

      const status = manager.getStatus();
      expect(status[0].platform).toBe('streamlabs');
    });

    it('should create a ChzzkConnector for chzzk platform', async () => {
      await manager.startIntegration('int-4', 'streamer-1', 'chzzk', {
        channel_id: 'ch-123',
      });

      const instance = getLastInstance();
      expect(instance).not.toBeNull();
      expect(instance.connect).toHaveBeenCalled();

      const status = manager.getStatus();
      expect(status[0].platform).toBe('chzzk');
    });

    it('should create a SoopConnector for soop platform', async () => {
      await manager.startIntegration('int-5', 'streamer-1', 'soop', {
        bj_id: 'bj-456',
      });

      const instance = getLastInstance();
      expect(instance).not.toBeNull();
      expect(instance.connect).toHaveBeenCalled();

      const status = manager.getStatus();
      expect(status[0].platform).toBe('soop');
    });

    it('should update connected status in the database after starting', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key',
      });

      expect(supabaseMock.from).toHaveBeenCalledWith('integrations');
      expect(supabaseMock._updateMock).toHaveBeenCalledWith({ connected: true });
    });

    it('should stop existing connection before starting a new one for the same integration', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key-1',
      });

      const firstInstance = getInstanceAt(0);
      expect(manager.getStatus()).toHaveLength(1);

      // Start again with same integration ID - should replace
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key-2',
      });

      expect(firstInstance.disconnect).toHaveBeenCalled();
      expect(manager.getStatus()).toHaveLength(1);
    });

    it('should not add a connection for unknown platform types', async () => {
      await manager.startIntegration('int-x', 'streamer-1', 'unknown_platform', {});

      const status = manager.getStatus();
      expect(status).toHaveLength(0);
    });
  });

  describe('stopIntegration', () => {
    it('should disconnect the connector and remove from connections', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key',
      });
      expect(manager.getStatus()).toHaveLength(1);

      await manager.stopIntegration('int-1');

      expect(manager.getStatus()).toHaveLength(0);
    });

    it('should update connected=false in the database when stopping', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key',
      });

      // Clear mocks to isolate the stop call
      supabaseMock.from.mockClear();
      supabaseMock._updateMock.mockClear();

      await manager.stopIntegration('int-1');

      expect(supabaseMock.from).toHaveBeenCalledWith('integrations');
      expect(supabaseMock._updateMock).toHaveBeenCalledWith({ connected: false });
    });

    it('should be a no-op when stopping a non-existent integration', async () => {
      // Should not throw
      await manager.stopIntegration('non-existent');
      expect(manager.getStatus()).toHaveLength(0);
    });

    it('should call disconnect on the connector', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key',
      });

      const instance = getLastInstance();
      await manager.stopIntegration('int-1');

      expect(instance.disconnect).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    it('should return empty array when no integrations are active', () => {
      expect(manager.getStatus()).toEqual([]);
    });

    it('should return status for all active integrations', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key1',
      });
      await manager.startIntegration('int-2', 'streamer-2', 'streamlabs', {
        socket_token: 'tok',
      });

      const status = manager.getStatus();
      expect(status).toHaveLength(2);

      const platforms = status.map((s) => s.platform).sort();
      expect(platforms).toEqual(['streamlabs', 'toonation']);
    });

    it('should reflect the connector isConnected() value', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'toonation', {
        alertbox_key: 'key',
      });

      // Change mock to return false
      const instance = getLastInstance();
      instance.isConnected.mockReturnValue(false);

      const status = manager.getStatus();
      expect(status[0].connected).toBe(false);
    });
  });

  describe('loadAllIntegrations', () => {
    it('should load and start all enabled integrations from the database', async () => {
      const integrations = [
        { id: 'int-1', streamer_id: 's1', platform: 'toonation', config: { alertbox_key: 'k1' } },
        { id: 'int-2', streamer_id: 's2', platform: 'streamlabs', config: { socket_token: 't1' } },
      ];

      supabaseMock.from.mockReturnValue({
        update: supabaseMock._updateMock,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: integrations, error: null }),
        }),
      });

      await manager.loadAllIntegrations();

      expect(manager.getStatus()).toHaveLength(2);
    });

    it('should handle null data from database gracefully', async () => {
      supabaseMock.from.mockReturnValue({
        update: supabaseMock._updateMock,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      });

      // Should not throw
      await manager.loadAllIntegrations();
      expect(manager.getStatus()).toHaveLength(0);
    });
  });

  describe('retry logic', () => {
    it('should set up retry via setOnDisconnect for tiktok connectors', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'tiktok', {
        username: 'user1',
      });

      const instance = getLastInstance();
      expect(instance.setOnDisconnect).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should clear retry timers when stopping an integration', async () => {
      await manager.startIntegration('int-1', 'streamer-1', 'tiktok', {
        username: 'user1',
      });

      // Trigger the disconnect callback to schedule a retry
      const instance = getLastInstance();
      const disconnectCb = instance.setOnDisconnect.mock.calls[0][0];
      disconnectCb();

      // Stop should clear the retry timer
      await manager.stopIntegration('int-1');

      // Advance past retry interval - should not cause errors
      await vi.advanceTimersByTimeAsync(120_000);
    });
  });
});
