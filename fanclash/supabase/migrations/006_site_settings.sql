-- Site settings (key-value store for admin configuration)
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default referral settings
INSERT INTO site_settings (key, value) VALUES
  ('referral', '{"enabled": true, "reward_type": "pro_days", "reward_days": 7, "reward_both": true}')
ON CONFLICT (key) DO NOTHING;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default admin
INSERT INTO admin_users (email) VALUES ('jinjan21@naver.com')
ON CONFLICT (email) DO NOTHING;

-- Pro subscription expiry for referral rewards & future Toss subscription
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;
