-- Collab battles between two streamers
CREATE TABLE IF NOT EXISTS collab_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  host_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES streamers(id) ON DELETE SET NULL,
  invite_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 6),
  host_total INTEGER NOT NULL DEFAULT 0,
  guest_total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished')),
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_collab_battles_host ON collab_battles(host_id, status);
CREATE INDEX idx_collab_battles_invite ON collab_battles(invite_code);
