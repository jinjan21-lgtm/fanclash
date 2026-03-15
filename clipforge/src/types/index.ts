export interface Profile {
  id: string;
  email: string;
  display_name: string;
  plan: 'free' | 'pro';
  clips_used_this_month: number;
  created_at: string;
}

export interface Highlight {
  start_time: number;
  end_time: number;
  reason: string;
  score: number;
}

export interface Job {
  id: string;
  user_id: string;
  vod_url: string;
  platform: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  highlights: Highlight[];
  created_at: string;
  completed_at: string | null;
}

export interface Clip {
  id: string;
  job_id: string;
  user_id: string;
  title: string;
  start_time: number;
  end_time: number;
  duration: number;
  thumbnail_url: string | null;
  clip_url: string | null;
  format: string;
  subtitle_style: string;
  downloaded: boolean;
  created_at: string;
}

export const PLAN_LIMITS = {
  free: { clips_per_month: 3, watermark: true, subtitle: 'basic', priority: false },
  pro: { clips_per_month: Infinity, watermark: false, subtitle: 'custom', priority: true },
} as const;

export function detectPlatform(url: string): string {
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('chzzk.naver.com')) return 'chzzk';
  if (url.includes('twitch.tv')) return 'twitch';
  if (url.includes('afreecatv.com')) return 'afreeca';
  return 'unknown';
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    chzzk: '치지직',
    twitch: 'Twitch',
    afreeca: '아프리카TV',
    unknown: '기타',
  };
  return labels[platform] || platform;
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    youtube: 'bg-red-500',
    chzzk: 'bg-green-500',
    twitch: 'bg-purple-500',
    afreeca: 'bg-blue-500',
    unknown: 'bg-gray-500',
  };
  return colors[platform] || 'bg-gray-500';
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '대기 중',
    processing: '처리 중',
    completed: '완료',
    failed: '실패',
  };
  return labels[status] || status;
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'text-yellow-400',
    processing: 'text-blue-400',
    completed: 'text-emerald-400',
    failed: 'text-red-400',
  };
  return colors[status] || 'text-gray-400';
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

