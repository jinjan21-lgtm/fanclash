CREATE TABLE IF NOT EXISTS gacha_collections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id uuid REFERENCES streamers(id) ON DELETE CASCADE,
  fan_nickname text NOT NULL,
  grade text NOT NULL CHECK (grade IN ('N', 'R', 'SR', 'SSR', 'UR')),
  count int DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(streamer_id, fan_nickname, grade)
);
CREATE INDEX IF NOT EXISTS idx_gacha_collections_streamer ON gacha_collections(streamer_id);
