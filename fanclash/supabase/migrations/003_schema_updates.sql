-- Add plan columns to streamers
ALTER TABLE streamers ADD COLUMN plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro'));
ALTER TABLE streamers ADD COLUMN plan_expires_at TIMESTAMPTZ;

-- Add message column to donations
ALTER TABLE donations ADD COLUMN message TEXT;

-- Add UNIQUE constraint on widgets (one type per streamer)
ALTER TABLE widgets ADD CONSTRAINT widgets_streamer_type_unique UNIQUE (streamer_id, type);

-- Add missing widget types (alert, timer, messages)
ALTER TABLE widgets DROP CONSTRAINT IF EXISTS widgets_type_check;
ALTER TABLE widgets ADD CONSTRAINT widgets_type_check
  CHECK (type IN ('ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle', 'alert', 'timer', 'messages'));

-- Update user plan to pro
UPDATE streamers
SET plan = 'pro', plan_expires_at = NOW() + INTERVAL '12 months'
WHERE id = (SELECT id FROM auth.users WHERE email = 'jinjan21@gmail.com');

-- Public insert policy for donations (fan donation page)
CREATE POLICY "donations_public_insert" ON donations FOR INSERT WITH CHECK (true);

-- Public read for streamers (fan page needs streamer info)
CREATE POLICY "streamers_public_read" ON streamers FOR SELECT USING (true);
