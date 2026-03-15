-- Fan Achievements / Badge system
CREATE TABLE IF NOT EXISTS fan_achievements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id uuid REFERENCES streamers(id) ON DELETE CASCADE,
  fan_nickname text NOT NULL,
  achievement_id text NOT NULL,
  unlocked_at timestamptz DEFAULT now(),
  UNIQUE(streamer_id, fan_nickname, achievement_id)
);
CREATE INDEX idx_fan_achievements_fan ON fan_achievements(streamer_id, fan_nickname);
