export interface ReferralSettings {
  enabled: boolean;
  reward_type: 'pro_days' | 'none';
  reward_days: number;
  reward_both: boolean; // reward both referrer and referee
}

export interface SiteSetting<T = unknown> {
  key: string;
  value: T;
  updated_at: string;
}
