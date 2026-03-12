import { SupabaseClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import { ToonationConnector } from './toonation';
import { TiktokConnector } from './tiktok';
import { StreamlabsConnector } from './streamlabs';
import { ChzzkConnector } from './chzzk';
import { SoopConnector } from './soop';
import { processDonation } from '../services/donation-processor';

type AnyConnector = ToonationConnector | TiktokConnector | StreamlabsConnector | ChzzkConnector | SoopConnector;

interface ActiveConnection {
  platform: string;
  connector: AnyConnector;
  streamerId: string;
}

interface IntegrationRecord {
  id: string;
  streamer_id: string;
  platform: string;
  config: Record<string, string>;
}

const RETRY_INTERVAL_MS = 60_000; // 1 minute
const MAX_RETRIES = 10;

export class IntegrationManager {
  private connections = new Map<string, ActiveConnection>();
  private retryTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private retryCounts = new Map<string, number>();
  private io: Server;
  private supabase: SupabaseClient;

  constructor(io: Server, supabase: SupabaseClient) {
    this.io = io;
    this.supabase = supabase;
  }

  async startIntegration(integrationId: string, streamerId: string, platform: string, config: Record<string, string>) {
    // Stop existing connection for this integration
    this.stopIntegration(integrationId);

    const donationHandler = (nickname: string, amount: number) => {
      processDonation(this.io, this.supabase, streamerId, nickname, amount);
    };

    let connector: AnyConnector;

    switch (platform) {
      case 'toonation':
        connector = new ToonationConnector(config.alertbox_key, (d) => donationHandler(d.nickname, d.amount));
        connector.connect();
        break;
      case 'tiktok':
        connector = new TiktokConnector(config.username, (g) => donationHandler(g.nickname, g.amount));
        (connector as TiktokConnector).setOnDisconnect(() => {
          this.scheduleRetry(integrationId, streamerId, platform, config);
        });
        await (connector as TiktokConnector).connect();
        break;
      case 'streamlabs':
        connector = new StreamlabsConnector(config.socket_token, (d) => donationHandler(d.nickname, d.amount));
        connector.connect();
        break;
      case 'chzzk':
        connector = new ChzzkConnector(config.channel_id, (d) => donationHandler(d.nickname, d.amount));
        await connector.connect();
        break;
      case 'soop':
        connector = new SoopConnector(config.bj_id, (d) => donationHandler(d.nickname, d.amount));
        await connector.connect();
        break;
      default:
        console.error(`[Integration] Unknown platform: ${platform}`);
        return;
    }

    this.connections.set(integrationId, { platform, connector, streamerId });
    this.retryCounts.delete(integrationId);

    // Update connected status in DB
    await this.supabase.from('integrations').update({ connected: true }).eq('id', integrationId);

    console.log(`[Integration] Started ${platform} for streamer ${streamerId.substring(0, 8)}`);
  }

  private scheduleRetry(integrationId: string, streamerId: string, platform: string, config: Record<string, string>) {
    // Clear any existing retry timer
    const existing = this.retryTimers.get(integrationId);
    if (existing) clearTimeout(existing);

    const count = (this.retryCounts.get(integrationId) || 0) + 1;
    this.retryCounts.set(integrationId, count);

    if (count > MAX_RETRIES) {
      console.log(`[Integration] ${platform} max retries (${MAX_RETRIES}) reached, giving up. Streamer: ${streamerId.substring(0, 8)}`);
      this.supabase.from('integrations').update({ connected: false }).eq('id', integrationId);
      return;
    }

    // Mark as disconnected in DB
    this.supabase.from('integrations').update({ connected: false }).eq('id', integrationId);

    console.log(`[Integration] ${platform} disconnected, retry ${count}/${MAX_RETRIES} in ${RETRY_INTERVAL_MS / 1000}s`);

    const timer = setTimeout(async () => {
      this.retryTimers.delete(integrationId);
      try {
        await this.startIntegration(integrationId, streamerId, platform, config);
        console.log(`[Integration] ${platform} reconnected successfully`);
      } catch (err: any) {
        console.error(`[Integration] ${platform} retry failed:`, err?.message || err);
        this.scheduleRetry(integrationId, streamerId, platform, config);
      }
    }, RETRY_INTERVAL_MS);

    this.retryTimers.set(integrationId, timer);
  }

  async stopIntegration(integrationId: string) {
    // Clear retry timer
    const timer = this.retryTimers.get(integrationId);
    if (timer) {
      clearTimeout(timer);
      this.retryTimers.delete(integrationId);
    }
    this.retryCounts.delete(integrationId);

    const existing = this.connections.get(integrationId);
    if (existing) {
      existing.connector.disconnect();
      this.connections.delete(integrationId);
      await this.supabase.from('integrations').update({ connected: false }).eq('id', integrationId);
      console.log(`[Integration] Stopped ${existing.platform}`);
    }
  }

  async loadAllIntegrations() {
    const { data: integrations } = await this.supabase
      .from('integrations')
      .select('*')
      .eq('enabled', true);

    if (!integrations) return;

    console.log(`[Integration] Loading ${integrations.length} integrations...`);

    for (const integration of integrations) {
      try {
        await this.startIntegration(
          integration.id,
          integration.streamer_id,
          integration.platform,
          integration.config,
        );
      } catch (err: any) {
        console.error(`[Integration] Failed to start ${integration.platform}:`, err?.message || err);
        // Schedule retry for failed initial connections
        this.scheduleRetry(
          integration.id,
          integration.streamer_id,
          integration.platform,
          integration.config,
        );
      }
    }
  }

  getStatus(): { id: string; platform: string; connected: boolean }[] {
    return Array.from(this.connections.entries()).map(([id, conn]) => ({
      id,
      platform: conn.platform,
      connected: conn.connector.isConnected(),
    }));
  }
}
