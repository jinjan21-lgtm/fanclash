'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { CATEGORY_LABELS } from '@/lib/toxicity';
import type { Comment } from '@/types';
import type { Severity, Category } from '@/lib/toxicity';
import SeverityBadge from '@/components/dashboard/SeverityBadge';

export default function NewReportPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-gray-500">로딩 중...</div>}>
      <NewReportContent />
    </Suspense>
  );
}

function NewReportContent() {
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const loadComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .in('severity', ['medium', 'high', 'critical'])
        .order('created_at', { ascending: false });

      setComments(data as Comment[] ?? []);

      // Pre-select from URL params
      const ids = searchParams.get('ids');
      if (ids) {
        setSelected(new Set(ids.split(',')));
      }

      setLoading(false);
    };
    loadComments();
  }, [supabase, searchParams]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selected.size === 0) {
      setError('제목을 입력하고 댓글을 선택해주세요.');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          comment_ids: Array.from(selected),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '리포트 생성에 실패했습니다.');
      }

      const data = await res.json();

      // Generate the report
      await fetch(`/api/reports/${data.report.id}/generate`, { method: 'POST' });

      router.push(`/dashboard/reports/${data.report.id}/print`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">새 리포트</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate}>
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-1">리포트 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
            placeholder="예: 2024년 3월 악성 댓글 증거"
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm text-gray-400">
              포함할 댓글 선택 ({selected.size}건 선택됨)
            </label>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 bg-gray-900 border border-gray-800 rounded-xl">
              <p className="text-gray-500 text-sm">보통 이상 심각도의 댓글이 없습니다.</p>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
              <div className="divide-y divide-gray-800">
                {comments.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleSelect(c.id)}
                      className="rounded mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-200 line-clamp-2 mb-1">{c.content}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <SeverityBadge severity={c.severity as Severity} />
                        {c.category && (
                          <span className="text-gray-500">
                            {CATEGORY_LABELS[c.category as Category] ?? c.category}
                          </span>
                        )}
                        {c.author_name && (
                          <span className="text-gray-600">by {c.author_name}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={creating || selected.size === 0}
          className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition disabled:opacity-50"
        >
          {creating ? 'PDF 생성 중...' : `리포트 생성 (${selected.size}건)`}
        </button>
      </form>
    </div>
  );
}
