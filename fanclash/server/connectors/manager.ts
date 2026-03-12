import { SupabaseClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import { ToonationConnector } from './toonation';
import { TiktokConnector } from './tiktok';
import { StreamlabsConnector } from './streamlabs';
import { calculateAffinity } from '../services/affinity';

interface ActiveConnection {
  platform: string;
  connector: ToonationConnector | TiktokConnector | StreamlabsConnector;
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

  private async processDonation(streamerId: string, fanNickname: string, amount: number) {
    const room = `streamer:${streamerId}`;

    // 1. Save donation
    await this.supabase.from('donations').insert({
      streamer_id: streamerId,
      fan_nickname: fanNickname,
      amount,
      message: '',
    });

    // 2. Update fan profile
    const { data: existing } = await this.supabase
      .from('fan_profiles')
      .select('*')
      .eq('streamer_id', streamerId)
      .eq('nickname', fanNickname)
      .single();

    const newTotal = (existing?.total_donated || 0) + amount;
    const oldLevel = existing?.affinity_level || 0;
    const affinity = calculateAffinity(newTotal);

    if (existing) {
      await this.supabase.from('fan_profiles')
        .update({ total_donated: newTotal, affinity_level: affinity.level, title: affinity.title, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await this.supabase.from('fan_profiles')
        .insert({ streamer_id: streamerId, nickname: fanNickname, total_donated: newTotal, affinity_level: affinity.level, title: affinity.title });
    }

    // 3. Emit donation event
    this.io.to(room).emit('donation:new', {
      id: '', streamer_id: streamerId, fan_nickname: fanNickname, amount, message: '', created_at: new Date().toISOString(),
    });

    // 4. Update rankings
    const { data: allProfiles } = await this.supabase
      .from('fan_profiles')
      .select('nickname, total_donated')
      .eq('streamer_id', streamerId)
      .order('total_donated', { ascending: false })
      .limit(10);

    const rankings = (allProfiles || []).map(d => ({ nickname: d.nickname, total: d.total_donated }));
    this.io.to(room).emit('ranking:update', { rankings: rankings as any, period: 'total' });

    // 5. Check affinity level up
    if (affinity.level > oldLevel) {
      this.io.to(room).emit('affinity:levelup', { nickname: fanNickname, level: affinity.level, title: affinity.title });
    }

    // 6. Update donation goal
    const { data: goal } = await this.supabase
      .from('donation_goals')
      .select('*')
      .eq('streamer_id', streamerId)
      .eq('active', true)
      .single();

    if (goal) {
      const newAmount = goal.current_amount + amount;
      await this.supabase.from('donation_goals').update({ current_amount: newAmount }).eq('id', goal.id);
      this.io.to(room).emit('goal:update', { current_amount: newAmount, milestones: goal.milestones });
    }

    console.log(`[Integration] Donation processed: ${fanNickname} -> ${amount}원 (streamer: ${streamerId.substring(0, 8)})`);
  }

  async startIntegration(integrationId: string, streamerId: string, platform: string, config: Record<string, string>) {
    // Stop existing connection for this integration
    this.stopIntegration(integrationId);

    const donationHandler = (nickname: string, amount: number) => {
      this.processDonation(streamerId, nickname, amount);
    };

    let connector: ToonationConnector | TiktokConnector | StreamlabsConnector;

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
