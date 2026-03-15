-- Users/profiles
CREATE TABLE IF NOT EXISTS cf_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  clips_used_this_month int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- VOD processing jobs
CREATE TABLE IF NOT EXISTS cf_jobs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES cf_profiles(id) ON DELETE CASCADE,
  vod_url text NOT NULL,
  platform text, -- youtube, chzzk, twitch
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress int DEFAULT 0, -- 0-100
  highlights jsonb DEFAULT '[]', -- detected highlight timestamps
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Generated clips
CREATE TABLE IF NOT EXISTS cf_clips (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid REFERENCES cf_jobs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES cf_profiles(id) ON DELETE CASCADE,
  title text,
  start_time float NOT NULL, -- seconds
  end_time float NOT NULL,
  duration float,
  thumbnail_url text,
  clip_url text, -- download URL (mock for MVP)
  format text DEFAULT '9:16',
  subtitle_style text DEFAULT 'default',
  downloaded boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE cf_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cf_clips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON cf_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON cf_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON cf_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own jobs" ON cf_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own jobs" ON cf_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own jobs" ON cf_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own clips" ON cf_clips FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clips" ON cf_clips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clips" ON cf_clips FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clips" ON cf_clips FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.cf_profiles (id, email, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
