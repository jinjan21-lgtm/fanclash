-- Streamers (extends Supabase auth.users)
CREATE TABLE streamers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  channel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle')),
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'modern' CHECK (theme IN ('modern', 'game', 'girlcam')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  fan_nickname TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_streamer_created ON donations(streamer_id, created_at DESC);
CREATE INDEX idx_donations_streamer_fan ON donations(streamer_id, fan_nickname);

CREATE TABLE fan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  total_donated INTEGER DEFAULT 0,
  affinity_level INTEGER DEFAULT 0,
  title TEXT DEFAULT '지나가는 팬',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(streamer_id, nickname)
);

CREATE TABLE donation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  current_amount INTEGER DEFAULT 0,
  milestones JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'finished', 'cancelled')),
  benefit TEXT NOT NULL,
  min_amount INTEGER NOT NULL DEFAULT 5000,
  time_limit INTEGER NOT NULL DEFAULT 180,
  winner_nickname TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'finished', 'cancelled')),
  team_count INTEGER DEFAULT 2 CHECK (team_count BETWEEN 2 AND 4),
  team_names JSONB DEFAULT '["A팀", "B팀"]',
  time_limit INTEGER NOT NULL DEFAULT 300,
  winning_team INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_battle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_battle_id UUID NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
  team_index INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  amount INTEGER DEFAULT 0
);

-- RLS
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battle_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "streamers_own" ON streamers FOR ALL USING (id = auth.uid());
CREATE POLICY "widgets_own" ON widgets FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "donations_own" ON donations FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "fan_profiles_own" ON fan_profiles FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "goals_own" ON donation_goals FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "battles_own" ON battles FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "battle_parts_write" ON battle_participants FOR ALL USING (
  battle_id IN (SELECT id FROM battles WHERE streamer_id = auth.uid())
);
CREATE POLICY "team_battles_own" ON team_battles FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "team_members_write" ON team_battle_members FOR ALL USING (
  team_battle_id IN (SELECT id FROM team_battles WHERE streamer_id = auth.uid())
);

-- Public read for overlays
CREATE POLICY "widgets_public_read" ON widgets FOR SELECT USING (true);
CREATE POLICY "donations_public_read" ON donations FOR SELECT USING (true);
CREATE POLICY "fan_profiles_public_read" ON fan_profiles FOR SELECT USING (true);
CREATE POLICY "goals_public_read" ON donation_goals FOR SELECT USING (true);
CREATE POLICY "battles_public_read" ON battles FOR SELECT USING (true);
CREATE POLICY "battle_parts_public_read" ON battle_participants FOR SELECT USING (true);
CREATE POLICY "team_battles_public_read" ON team_battles FOR SELECT USING (true);
CREATE POLICY "team_members_public_read" ON team_battle_members FOR SELECT USING (true);
