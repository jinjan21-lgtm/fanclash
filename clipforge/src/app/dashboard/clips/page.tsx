'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatDuration } from '@/types';
import type { Clip } from '@/types';
import Link from 'next/link';

type SortKey = 'newest' | 'duration';

export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('newest');

  const fetchClips = useCallback(async () => {
    try {
      const res = await fetch('/api/clips');
      if (res.ok) {
        const data = await res.json();
        setClips(data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClips();
  }, [fetchClips]);

  const handleDelete = async (id: string) => {
    if (!confirm('이 클립을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/clips/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setClips((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {
      // ignore
    }
  };

  const sortedClips = [...clips].sort((a, b) => {
    if (sort === 'duration') return b.duration - a.duration;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="pt-12 md:pt-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">클립 관리</h1>
          <p className="text-gray-500 text-sm mt-1">
            {clips.length}개의 클립 기록
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/new"
            className="text-sm bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
          >
            새 클립 만들기
          </Link>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="text-sm bg-gray-900 border border-gray-800 text-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="newest">최신순</option>
            <option value="duration">길이순</option>
          </select>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-500">
          클립은 브라우저에서 직접 생성됩니다. &quot;새 클립 만들기&quot; 페이지에서 영상을 업로드하고 하이라이트를 분석한 후 클립을 생성하고 다운로드할 수 있습니다.
          이 페이지에서는 Supabase에 저장된 클립 메타데이터를 확인할 수 있습니다.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-900 border border-gray-800 animate-pulse p-4">
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-3" />
              <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : sortedClips.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <p className="mb-2">아직 클립 기록이 없습니다</p>
          <Link
            href="/dashboard/new"
            className="text-emerald-400 hover:text-emerald-300 text-sm"
          >
            첫 번째 클립을 만들어보세요
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedClips.map((clip) => (
            <div
              key={clip.id}
              className="rounded-xl bg-gray-900 border border-gray-800 p-4 hover:border-emerald-500/30 transition-colors"
            >
              <h3 className="text-sm font-medium truncate mb-2">
                {clip.title || '제목 없음'}
              </h3>
              <p className="text-xs text-gray-500 mb-1">
                {formatDuration(clip.start_time)} ~ {formatDuration(clip.end_time)}
              </p>
              <p className="text-xs text-gray-600 mb-3">
                {formatDuration(clip.duration)} 길이
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">
                  {new Date(clip.created_at).toLocaleDateString('ko-KR')}
                </span>
                <button
                  onClick={() => handleDelete(clip.id)}
                  className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
