'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { SEVERITY_LABELS, CATEGORY_LABELS, PLATFORM_OPTIONS } from '@/lib/toxicity';
import type { Comment } from '@/types';
import type { Severity, Category } from '@/lib/toxicity';
import SeverityBadge from '@/components/dashboard/SeverityBadge';

type SortKey = 'created_at' | 'severity';
type FilterSeverity = '' | Severity;
type FilterCategory = '' | Category;

const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default function CommentsListPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('created_at');
  const [filterSeverity, setFilterSeverity] = useState<FilterSeverity>('');
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const supabase = createSupabaseBrowser();

  const loadComments = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('sc_comments').select('*');

    if (filterSeverity) query = query.eq('severity', filterSeverity);
    if (filterCategory) query = query.eq('category', filterCategory);
    if (filterPlatform) query = query.eq('platform', filterPlatform);

    query = query.order('created_at', { ascending: false });

    const { data } = await query;

    let sorted = data ?? [];
    if (sort === 'severity') {
      sorted = [...sorted].sort(
        (a, b) => (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4)
      );
    }

    setComments(sorted);
    setLoading(false);
  }, [filterSeverity, filterCategory, filterPlatform, sort, supabase]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === comments.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(comments.map((c) => c.id)));
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">댓글 관리</h1>
        <Link
          href="/dashboard/comments/new"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition"
        >
          댓글 추가
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
        >
          <option value="created_at">최신순</option>
          <option value="severity">심각도순</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value as FilterSeverity)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
        >
          <option value="">전체 심각도</option>
          {(['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => (
            <option key={s} value={s}>{SEVERITY_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as FilterCategory)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
        >
          <option value="">전체 카테고리</option>
          {(Object.entries(CATEGORY_LABELS) as [Category, string][]).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none"
        >
          <option value="">전체 플랫폼</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <Link
            href={`/dashboard/reports/new?ids=${Array.from(selected).join(',')}`}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition"
          >
            선택 {selected.size}건 리포트에 추가
          </Link>
        )}
      </div>

      {/* Comments */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : comments.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-500 mb-4">수집된 댓글이 없습니다.</p>
          <Link
            href="/dashboard/comments/new"
            className="text-rose-400 hover:text-rose-300 text-sm"
          >
            첫 번째 댓글 추가하기
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected.size === comments.length && comments.length > 0}
              onChange={selectAll}
              className="rounded"
            />
            <span className="text-sm text-gray-500">{comments.length}건</span>
          </div>
          <div className="divide-y divide-gray-800">
            {comments.map((c) => (
              <div key={c.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition">
                <input
                  type="checkbox"
                  checked={selected.has(c.id)}
                  onChange={() => toggleSelect(c.id)}
                  className="rounded mt-1"
                />
                <Link href={`/dashboard/comments/${c.id}`} className="flex-1 min-w-0">
                  <p className="text-sm text-gray-200 line-clamp-2 mb-1">{c.content}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <SeverityBadge severity={c.severity as Severity} />
                    {c.category && (
                      <span className="text-gray-500">
                        {CATEGORY_LABELS[c.category as Category] ?? c.category}
                      </span>
                    )}
                    {c.platform && (
                      <span className="text-gray-600">
                        {PLATFORM_OPTIONS.find((p) => p.value === c.platform)?.label ?? c.platform}
                      </span>
                    )}
                    {c.author_name && (
                      <span className="text-gray-600">by {c.author_name}</span>
                    )}
                    <span className="text-gray-700">
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </span>
                    {c.is_evidence && (
                      <span className="text-blue-400">증거</span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
