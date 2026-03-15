export interface Profile {
  id: string;
  email: string;
  display_name: string;
  plan: 'free' | 'pro';
  reports_used_this_month: number;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  platform: string | null;
  author_name: string | null;
  author_url: string | null;
  content: string;
  source_url: string | null;
  screenshot_url: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string | null;
  ai_score: number;
  is_evidence: boolean;
  notes: string | null;
  detected_at: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  title: string;
  comment_ids: string[];
  comment_count: number;
  pdf_url: string | null;
  status: 'draft' | 'generated' | 'submitted';
  created_at: string;
}
