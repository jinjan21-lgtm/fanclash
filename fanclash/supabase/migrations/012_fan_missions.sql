-- Fan Missions: streamer-created goals for fans to collectively achieve
CREATE TABLE IF NOT EXISTS fan_missions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  streamer_id uuid REFERENCES streamers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  goal_type text NOT NULL CHECK (goal_type IN ('donation_count', 'unique_donors', 'total_amount')),
  goal_value int NOT NULL,
  current_value int DEFAULT 0,
  reward text NOT NULL,
  time_limit_minutes int,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_fan_missions_streamer ON fan_missions(streamer_id, status);
