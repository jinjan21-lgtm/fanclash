CREATE TABLE integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('toonation', 'tiktok', 'streamlabs', 'chzzk')),
  config JSONB NOT NULL DEFAULT '{}',
  -- toonation: { "alertbox_key": "xxx" }
  -- tiktok: { "username": "@xxx" }
  -- streamlabs: { "socket_token": "xxx" }
  -- chzzk: { "channel_id": "xxx" }
  enabled BOOLEAN DEFAULT true,
  connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(streamer_id, platform)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_own" ON integrations FOR ALL USING (streamer_id = auth.uid());
