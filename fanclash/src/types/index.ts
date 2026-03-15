export type WidgetType = 'ranking' | 'throne' | 'goal' | 'affinity' | 'battle' | 'team_battle' | 'timer' | 'messages' | 'alert' | 'roulette' | 'music' | 'gacha' | 'physics' | 'territory' | 'weather' | 'train' | 'slots' | 'meter' | 'quiz' | 'rpg' | 'mission';
export type ThemeName = 'modern' | 'game' | 'girlcam';
export type BattleStatus = 'recruiting' | 'active' | 'finished' | 'cancelled';

export interface Streamer {
  id: string;
  display_name: string;
  channel_url: string | null;
  referral_code: string;
  referred_by: string | null;
  broadcast_style: string | null;
  broadcast_platforms: string[] | null;
  created_at: string;
}

export interface Widget {
  id: string;
  streamer_id: string;
  type: WidgetType;
  enabled: boolean;
  config: Record<string, unknown>;
  theme: ThemeName;
  created_at: string;
}

export interface Donation {
  id: string;
  streamer_id: string;
  fan_nickname: string;
  amount: number;
  message?: string;
  created_at: string;
}

export interface FanProfile {
  id: string;
  streamer_id: string;
  nickname: string;
  total_donated: number;
  affinity_level: number;
  title: string;
  updated_at: string;
}

export interface DonationGoal {
  id: string;
  streamer_id: string;
  current_amount: number;
  milestones: { amount: number; mission: string }[];
  active: boolean;
}

export interface Battle {
  id: string;
  streamer_id: string;
  status: BattleStatus;
  benefit: string;
  min_amount: number;
  time_limit: number;
  winner_nickname: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  nickname: string;
  amount: number;
  joined_at: string;
}

export interface TeamBattle {
  id: string;
  streamer_id: string;
  status: BattleStatus;
  team_count: number;
  team_names: string[];
  time_limit: number;
  winning_team: number | null;
  created_at: string;
}

export interface TeamBattleMember {
  id: string;
  team_battle_id: string;
  team_index: number;
  nickname: string;
  amount: number;
}

export interface ServerToClientEvents {
  'ranking:update': (data: { rankings: FanProfile[]; period: string }) => void;
  'throne:change': (data: { previous: string; current: string; count: number }) => void;
  'goal:update': (data: { current_amount: number; milestones: DonationGoal['milestones'] }) => void;
  'affinity:levelup': (data: { nickname: string; level: number; title: string }) => void;
  'battle:update': (data: { battle: Battle; participants: BattleParticipant[] }) => void;
  'battle:finished': (data: { winner: string; benefit: string }) => void;
  'team_battle:update': (data: { battle: TeamBattle; teams: Record<number, { total: number; members: TeamBattleMember[] }> }) => void;
  'donation:new': (data: Donation) => void;
  'widget:chain-action': (data: { type: string; data: Record<string, unknown> }) => void;
}

export interface ClientToServerEvents {
  'widget:subscribe': (widgetId: string) => void;
  'widget:event': (data: { type: string; data: Record<string, unknown>; streamerId?: string }) => void;
  'live:subscribe': (streamerId: string) => void;
  'donation:add': (data: { streamer_id: string; fan_nickname: string; amount: number; message?: string }) => void;
  'battle:create': (data: { streamer_id: string; benefit: string; min_amount: number; time_limit: number }) => void;
  'battle:join': (data: { battle_id: string; nickname: string; amount: number }) => void;
  'battle:start': (battle_id: string) => void;
  'battle:donate': (data: { battle_id: string; nickname: string; amount: number }) => void;
}

export const AFFINITY_LEVELS = [
  { level: 0, title: '지나가는 팬', minAmount: 0 },
  { level: 1, title: '단골', minAmount: 10000 },
  { level: 2, title: '열혈팬', minAmount: 50000 },
  { level: 3, title: '첫사랑', minAmount: 200000 },
  { level: 4, title: '소울메이트', minAmount: 500000 },
] as const;

// Integration types
export type PlatformType = 'toonation' | 'tiktok' | 'streamlabs' | 'chzzk' | 'soop';

export interface Integration {
  id: string;
  streamer_id: string;
  platform: PlatformType;
  config: Record<string, string>;
  enabled: boolean;
  connected: boolean;
  created_at: string;
}

export interface ToonationConfig {
  alertbox_key: string;
}

export interface TiktokConfig {
  username: string;
}

export interface StreamlabsConfig {
  socket_token: string;
}

export interface SoopConfig {
  bj_id: string;
}
