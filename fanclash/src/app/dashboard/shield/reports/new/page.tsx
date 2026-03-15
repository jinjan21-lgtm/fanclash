'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SEVERITY_LABELS, type Severity } from '@/lib/toxicity';

interface CommentRow {
  id: string;
  content: string;
  author: string;
  platform: string;
  severity: Severity;
  created_at: string;
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-400',
  high: 'bg-orange-900/50 text-orange-400',
  critical: 'bg-red-900/50 text-red-400',
};

export default function NewReportPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const selectAllDangerous = () => {
    const dangerous = comments.filter(c => c.severity === 'high' || c.severity === 'critical');
    setSelected(new Set(dangerous.map(c => c.id)));
  };

  const handleCreate = async () => {
    if (!title.trim() || selected.size === 0) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('sc_reports')
        .insert({
          user_id: user.id,
          title: title.trim(),
          status: 'completed',
          comment_ids: Array.from(selected),
          comment_count: selected.size,
        })
        .select('id')
        .single();

      if (data) {
        router.push(`/dashboard/shield/reports/${data.id}`);
      }
    } catch (err) {
      console.error('Failed to create report:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pt-12 md:pt-0 max-w-3xl">
      <h1 className="text-2xl font-bold mb-2">새 리포트</h1>
      <p className="text-gray-500 text-sm mb-8">증거로 포함할 댓글을 선택하고 리포트를 생성하세요</p>

      {/* Title */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">리포트 제목</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-sm focus:border-rose-500 outline-none"
          placeholder="예: 2026년 3월 악성 댓글 리포트"
        />
      </div>

      {/* Comment selection */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium">댓글 선택 ({selected.size}건 선택됨)</h2>
          <button
            onClick={selectAllDangerous}
            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            위험 댓글 모두 선택
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-6 h-6 border-2 border-gray-600 border-t-rose-400 rounded-full animate-spin mx-auto" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border border-gray-800 rounded-xl">
            <p className="text-sm">분석된 댓글이 없습니다</p>
            <p className="text-xs text-gray-600 mt-1">먼저 댓글을 추가해주세요</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {comments.map((comment) => (
              <button
                key={comment.id}
                onClick={() => toggleSelect(comment.id)}
                className={`w-full text-left bg-gray-900 border rounded-xl p-3 transition-colors ${
                  selected.has(comment.id)
                    ? 'border-rose-500 bg-rose-500/5'
                    : 'border-gray-800 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center shrink-0 ${
                    selected.has(comment.id) ? 'bg-rose-600 border-rose-600' : 'border-gray-600'
                  }`}>
                    {selected.has(comment.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-300 line-clamp-2">{comment.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${SEVERITY_COLORS[comment.severity]}`}>
                        {SEVERITY_LABELS[comment.severity]}
                      </span>
                      <span className="text-[10px] text-gray-600">
                        {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Create button */}
      <button
        onClick={handleCreate}
        disabled={!title.trim() || selected.size === 0 || saving}
        className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors"
      >
        {saving ? '생성 중...' : `리포트 생성 (${selected.size}건)`}
      </button>
    </div>
  );
}
