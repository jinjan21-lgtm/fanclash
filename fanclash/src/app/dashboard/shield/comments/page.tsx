'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { SEVERITY_LABELS, CATEGORY_LABELS, type Severity, type Category } from '@/lib/toxicity';

interface CommentRow {
  id: string;
  content: string;
  author: string;
  platform: string;
  severity: Severity;
  category: Category | null;
  score: number;
  created_at: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Severity | 'all'>('all');

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('sc_comments')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setComments(data);
      } catch {
        // Table may not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = filter === 'all' ? comments : comments.filter(c => c.severity === filter);

  return (
    <div className="pt-12 md:pt-0 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">댓글 목록</h1>
          <p className="text-gray-500 text-sm mt-1">분석된 댓글을 확인하고 관리하세요</p>
        </div>
        <Link
          href="/dashboard/shield/comments/new"
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm transition-colors"
        >
          댓글 추가
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-rose-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {s === 'all' ? '전체' : SEVERITY_LABELS[s]} ({s === 'all' ? comments.length : comments.filter(c => c.severity === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-rose-400 rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-2xl bg-gray-900/50">
          <p className="text-gray-400 mb-2">댓글이 없습니다</p>
          <Link
            href="/dashboard/shield/comments/new"
            className="inline-block px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm transition-colors mt-3"
          >
            댓글 추가하기
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((comment) => (
            <div key={comment.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 line-clamp-2">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-xs text-gray-500">{comment.author || '익명'}</span>
                    <span className="text-xs text-gray-600">|</span>
                    <span className="text-xs text-gray-500">{comment.platform}</span>
                    {comment.category && (
                      <>
                        <span className="text-xs text-gray-600">|</span>
                        <span className="text-xs text-gray-500">{CATEGORY_LABELS[comment.category]}</span>
                      </>
                    )}
                    <span className="text-xs text-gray-600">|</span>
                    <span className="text-xs text-gray-600">
                      {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${SEVERITY_COLORS[comment.severity]}`}>
                  {SEVERITY_LABELS[comment.severity]}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
