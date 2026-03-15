CREATE TABLE IF NOT EXISTS sc_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  display_name text,
  plan text DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  reports_used_this_month int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sc_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES sc_profiles(id) ON DELETE CASCADE,
  platform text,
  author_name text,
  author_url text,
  content text NOT NULL,
  source_url text,
  screenshot_url text,
  severity text DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  category text,
  ai_score float DEFAULT 0,
  is_evidence boolean DEFAULT false,
  notes text,
  detected_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sc_reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES sc_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  comment_ids uuid[] DEFAULT '{}',
  comment_count int DEFAULT 0,
  pdf_url text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'submitted')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sc_comments_user ON sc_comments(user_id);
CREATE INDEX idx_sc_comments_severity ON sc_comments(user_id, severity);
CREATE INDEX idx_sc_reports_user ON sc_reports(user_id);

-- RLS
ALTER TABLE sc_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sc_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON sc_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON sc_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON sc_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own comments" ON sc_comments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own comments" ON sc_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON sc_comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON sc_comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own reports" ON sc_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON sc_reports FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON sc_reports FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON sc_reports FOR DELETE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.sc_profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
