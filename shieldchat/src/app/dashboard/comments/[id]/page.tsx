'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { SEVERITY_LABELS, CATEGORY_LABELS, PLATFORM_OPTIONS } from '@/lib/toxicity';
import type { Comment } from '@/types';
import type { Severity, Category } from '@/lib/toxicity';
import SeverityBadge from '@/components/dashboard/SeverityBadge';

export default function CommentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [comment, setComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setComment(data as Comment);
      setNotes(data.notes || '');
    }
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleEvidence = async () => {
    if (!comment) return;
    setSaving(true);
    await fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_evidence: !comment.is_evidence }),
    });
    setComment({ ...comment, is_evidence: !comment.is_evidence });
    setSaving(false);
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch(`/api/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    if (comment) setComment({ ...comment, notes });
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    router.push('/dashboard/comments');
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">로딩 중...</div>;
  }

  if (!comment) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">댓글을 찾을 수 없습니다.</p>
        <Link href="/dashboard/comments" className="text-rose-400">목록으로</Link>
      </div>
    );
  }

  // Highlight matched keywords in text
  const highlightText = (text: string) => {
    // Simple approach: the score > 0 means toxicity was detected
    return text;
  };

  const severityColors: Record<string, string> = {
    low: 'border-gray-700',
    medium: 'border-yellow-700',
    high: 'border-orange-700',
    critical: 'border-red-700',
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/comments" className="text-gray-500 hover:text-gray-300 transition">
          &larr; 댓글 목록
        </Link>
      </div>

      {/* Comment Content */}
      <div className={`bg-gray-900 border-2 ${severityColors[comment.severity]} rounded-xl p-6 mb-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <SeverityBadge severity={comment.severity as Severity} />
            {comment.category && (
              <span className="text-sm text-gray-400">
                {CATEGORY_LABELS[comment.category as Category] ?? comment.category}
              </span>
            )}
            {comment.ai_score > 0 && (
              <span className="text-xs text-gray-600">점수: {comment.ai_score}</span>
            )}
          </div>
          {comment.is_evidence && (
            <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded border border-blue-700/50">
              증거 보존됨
            </span>
          )}
        </div>

        <p className="text-lg text-white leading-relaxed whitespace-pre-wrap mb-4">
          {highlightText(comment.content)}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          {comment.author_name && (
            <div>
              <span className="text-gray-500">작성자: </span>
              <span className="text-gray-300">{comment.author_name}</span>
            </div>
          )}
          {comment.platform && (
            <div>
              <span className="text-gray-500">플랫폼: </span>
              <span className="text-gray-300">
                {PLATFORM_OPTIONS.find((p) => p.value === comment.platform)?.label ?? comment.platform}
              </span>
            </div>
          )}
          {comment.source_url && (
            <div className="col-span-2">
              <span className="text-gray-500">원본 URL: </span>
              <a href={comment.source_url} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 break-all">
                {comment.source_url}
              </a>
            </div>
          )}
          <div>
            <span className="text-gray-500">수집일: </span>
            <span className="text-gray-300">
              {new Date(comment.created_at).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Evidence Toggle & Notes */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-3">증거 관리</h3>
          <button
            onClick={toggleEvidence}
            disabled={saving}
            className={`w-full py-2 rounded-lg text-sm transition mb-4 ${
              comment.is_evidence
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {comment.is_evidence ? '증거 해제' : '증거로 보존'}
          </button>

          <label className="block text-sm text-gray-400 mb-1">메모</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500 transition min-h-[80px] resize-y mb-2"
            placeholder="이 댓글에 대한 메모..."
          />
          <button
            onClick={saveNotes}
            disabled={saving}
            className="px-4 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition disabled:opacity-50"
          >
            {saving ? '저장 중...' : '메모 저장'}
          </button>
        </div>

        {/* Actions */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-white mb-3">작업</h3>
          <div className="space-y-2">
            <Link
              href={`/dashboard/reports/new?ids=${comment.id}`}
              className="block w-full py-2 text-center bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition"
            >
              리포트에 추가
            </Link>
            <button
              onClick={handleDelete}
              className="w-full py-2 bg-gray-800 text-red-400 text-sm rounded-lg hover:bg-gray-700 transition"
            >
              삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
