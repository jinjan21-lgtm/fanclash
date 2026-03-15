'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ComingSoon from '@/components/ui/ComingSoon';

interface Clip {
  id: string;
  filename: string;
  start_time: number;
  end_time: number;
  reason: string;
  created_at: string;
  storage_url: string | null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClips() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('cf_clips')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data) setClips(data);
      } catch {
        // Table may not exist yet — show empty state
      } finally {
        setLoading(false);
      }
    }
    loadClips();
  }, []);

  return (
    <div className="pt-12 md:pt-0 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">클립 메이커</h1>
          <p className="text-gray-500 text-sm mt-1">방송 하이라이트를 자동으로 숏폼 클립으로 만드세요</p>
        </div>
        <Link
          href="/dashboard/clips/new"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors"
        >
          새 클립 만들기
        </Link>
      </div>

      {/* Coming Soon features */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <ComingSoon
          feature="AI 자막 생성 (Whisper)"
          description="OpenAI Whisper API로 자동 자막 생성"
        />
        <ComingSoon
          feature="FanClash 하이라이트 자동 연동"
          description="도네이션 피크 데이터로 하이라이트 정확도 향상"
        />
      </div>

      {/* Clips list */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-emerald-400 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm">클립 불러오는 중...</p>
        </div>
      ) : clips.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-2xl bg-gray-900/50">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-gray-400 mb-2">아직 생성된 클립이 없습니다</p>
          <p className="text-xs text-gray-600 mb-4">영상을 업로드하고 하이라이트를 감지해보세요</p>
          <Link
            href="/dashboard/clips/new"
            className="inline-block px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-sm transition-colors"
          >
            첫 클립 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clips.map((clip) => (
            <div key={clip.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{clip.filename || clip.reason}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(clip.start_time)} ~ {formatTime(clip.end_time)}
                    <span className="ml-2 text-gray-600">
                      {new Date(clip.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </p>
                </div>
                {clip.storage_url && (
                  <a
                    href={clip.storage_url}
                    download
                    className="text-xs px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shrink-0"
                  >
                    다운로드
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
