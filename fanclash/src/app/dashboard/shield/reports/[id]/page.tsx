'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SEVERITY_LABELS, CATEGORY_LABELS, type Severity, type Category } from '@/lib/toxicity';

interface ReportRow {
  id: string;
  title: string;
  status: string;
  comment_ids: string[];
  comment_count: number;
  created_at: string;
}

interface CommentRow {
  id: string;
  content: string;
  author: string;
  platform: string;
  severity: Severity;
  category: Category | null;
  score: number;
  created_at: string;
  matches: string[];
}

const SEVERITY_COLORS: Record<Severity, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-500',
  high: 'text-orange-500',
  critical: 'text-red-500',
};

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<ReportRow | null>(null);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: reportData } = await supabase
          .from('sc_reports')
          .select('*')
          .eq('id', reportId)
          .eq('user_id', user.id)
          .single();

        if (!reportData) return;
        setReport(reportData);

        if (reportData.comment_ids && reportData.comment_ids.length > 0) {
          const { data: commentData } = await supabase
            .from('sc_comments')
            .select('*')
            .in('id', reportData.comment_ids);

          if (commentData) setComments(commentData);
        }
      } catch {
        // Table may not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId]);

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const { generateReportPDF } = await import('@/lib/pdf-generator');
      await generateReportPDF(
        printRef.current,
        `report_${report?.title || reportId}.pdf`
      );
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="pt-12 md:pt-0 text-center py-16 text-gray-500">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-rose-400 rounded-full animate-spin mx-auto mb-3" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="pt-12 md:pt-0 text-center py-16 text-gray-500">
        <p>리포트를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="pt-12 md:pt-0 max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">{report.title}</h1>
          <p className="text-gray-500 text-sm mt-1">
            {new Date(report.created_at).toLocaleDateString('ko-KR')} | 댓글 {report.comment_count}건
          </p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-colors"
        >
          {downloading ? 'PDF 생성 중...' : 'PDF 다운로드'}
        </button>
      </div>

      {/* Printable content */}
      <div ref={printRef} className="bg-white text-black p-8 rounded-xl">
        <h1 className="text-xl font-bold mb-1">{report.title}</h1>
        <p className="text-sm text-gray-600 mb-6">
          생성일: {new Date(report.created_at).toLocaleDateString('ko-KR')} | 총 {comments.length}건의 악성 댓글 포함
        </p>

        <div className="border-t pt-4">
          {comments.map((comment, i) => (
            <div key={comment.id} className="mb-4 pb-4 border-b border-gray-200 last:border-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-sm font-medium">#{i + 1}</p>
                <span className={`text-xs font-bold ${SEVERITY_COLORS[comment.severity]}`}>
                  {SEVERITY_LABELS[comment.severity]} (점수: {comment.score})
                </span>
              </div>
              <p className="text-sm mb-2 whitespace-pre-wrap">{comment.content}</p>
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>작성자: {comment.author || '익명'} | 플랫폼: {comment.platform}</p>
                {comment.category && <p>분류: {CATEGORY_LABELS[comment.category]}</p>}
                {comment.matches && comment.matches.length > 0 && (
                  <p>감지된 키워드: {comment.matches.join(', ')}</p>
                )}
                <p>기록 시점: {new Date(comment.created_at).toLocaleString('ko-KR')}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-gray-400">
          <p>본 리포트는 FanClash 댓글 방어 시스템에 의해 자동 생성되었습니다.</p>
          <p>증거 보존 목적으로 생성된 문서이며, 법적 효력은 전문가와 상담하시기 바랍니다.</p>
        </div>
      </div>

      {/* Screen view of comments */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">포함된 댓글</h2>
        <div className="space-y-2">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-sm text-gray-300 mb-2">{comment.content}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{comment.author || '익명'}</span>
                <span className="text-gray-600">|</span>
                <span>{comment.platform}</span>
                <span className="text-gray-600">|</span>
                <span className={SEVERITY_COLORS[comment.severity]}>
                  {SEVERITY_LABELS[comment.severity]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
