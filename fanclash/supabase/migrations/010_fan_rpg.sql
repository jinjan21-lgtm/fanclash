CREATE TABLE IF NOT EXISTS fan_rpg_characters (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id uuid REFERENCES streamers(id) ON DELETE CASCADE,
  fan_nickname text NOT NULL,
  level int DEFAULT 1,
  xp int DEFAULT 0,
  xp_to_next int DEFAULT 100,
  equipment jsonb DEFAULT '{"weapon":"wooden_sword","armor":"cloth","pet":"none"}'::jsonb,
  title text DEFAULT '초보 모험가',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(streamer_id, fan_nickname)
);
CREATE INDEX IF NOT EXISTS idx_fan_rpg_streamer ON fan_rpg_characters(streamer_id);
