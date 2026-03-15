-- Seasons table for periodic ranking resets
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '시즌 1',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_seasons_streamer ON seasons(streamer_id, status);

-- Season rankings snapshot (taken when season ends)
CREATE TABLE IF NOT EXISTS season_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  fan_nickname TEXT NOT NULL,
  total_donated INTEGER NOT NULL DEFAULT 0,
  rank INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_season_rankings_season ON season_rankings(season_id);
