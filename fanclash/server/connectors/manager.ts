import { SupabaseClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import { ToonationConnector } from './toonation';
import { TiktokConnector } from './tiktok';
import { StreamlabsConnector } from './streamlabs';
import { ChzzkConnector } from './chzzk';
import { SoopConnector } from './soop';
import { processDonation } from '../services/donation-processor';

interface ActiveConnection {
  platform: string;
  connector: ToonationConnector | TiktokConnector | StreamlabsConnector | ChzzkConnector | SoopConnector;
  streamerId: string;
}

export class IntegrationManager {
  private connections = new Map<string, ActiveConnection>();
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

    let connector: ToonationConnector | TiktokConnector | StreamlabsConnector | ChzzkConnector | SoopConnector;

    switch (platform) {
      case 'toonation':
        connector = new ToonationConnector(config.alertbox_key, (d) => donationHandler(d.nickname, d.amount));
        connector.connect();
        break;
      case 'tiktok':
        connector = new TiktokConnector(config.username, (g) => donationHandler(g.nickname, g.amount));
        await connector.connect();
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

    // Update connected status in DB
    await this.supabase.from('integrations').update({ connected: true }).eq('id', integrationId);

    console.log(`[Integration] Started ${platform} for streamer ${streamerId.substring(0, 8)}`);
  }

  async stopIntegration(integrationId: string) {
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
      } catch (err) {
        console.error(`[Integration] Failed to start ${integration.platform}:`, err);
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
