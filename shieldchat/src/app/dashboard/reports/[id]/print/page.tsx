'use client';

import { useEffect, useState, use } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { SEVERITY_LABELS, CATEGORY_LABELS, PLATFORM_OPTIONS } from '@/lib/toxicity';
import type { Comment, Report } from '@/types';
import type { Severity, Category } from '@/lib/toxicity';

export default function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string; email: string } | null>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      const { data: reportData } = await supabase
        .from('reports')
        .select('*')
        .eq('id', id)
        .single();

      if (!reportData) {
        setLoading(false);
        return;
      }
      setReport(reportData as Report);

      if (reportData.comment_ids?.length) {
        const { data: commentsData } = await supabase
          .from('comments')
          .select('*')
          .in('id', reportData.comment_ids)
          .order('severity', { ascending: true });
        setComments(commentsData as Comment[] ?? []);
      }

      setLoading(false);
    };
    load();
  }, [id, supabase]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">로딩 중...</div>;
  }

  if (!report) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">리포트를 찾을 수 없습니다.</div>;
  }

  const severityCount: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  comments.forEach((c) => { severityCount[c.severity] = (severityCount[c.severity] || 0) + 1; });

  const categoryCount: Record<string, number> = {};
  comments.forEach((c) => {
    if (c.category) categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
  });

  const severityTextColors: Record<string, string> = {
    low: 'text-gray-600',
    medium: 'text-yellow-700',
    high: 'text-orange-700',
    critical: 'text-red-700',
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Print button (no-print) */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-sm"
        >
          PDF로 저장 (Ctrl+P)
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
        >
          돌아가기
        </button>
      </div>

      <div className="max-w-[210mm] mx-auto px-8 py-12" style={{ fontFamily: 'serif' }}>
        {/* Header */}
        <div className="text-center border-b-2 border-black pb-6 mb-8">
          <h1 className="text-2xl font-bold mb-2">악성 댓글 증거 보존 리포트</h1>
          <p className="text-lg text-gray-700">{report.title}</p>
        </div>

        {/* Report Info */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <span className="text-gray-500">작성자: </span>
            <span>{profile?.display_name ?? profile?.email ?? '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">작성일: </span>
            <span>{new Date(report.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
          <div>
            <span className="text-gray-500">총 댓글 수: </span>
            <span>{comments.length}건</span>
          </div>
          <div>
            <span className="text-gray-500">리포트 ID: </span>
            <span className="font-mono text-xs">{report.id}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 p-4 bg-gray-50 border rounded">
          <h2 className="text-lg font-bold mb-3">요약</h2>
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map((sev) => (
              <div key={sev}>
                <div className={`text-2xl font-bold ${severityTextColors[sev]}`}>
                  {severityCount[sev]}
                </div>
                <div className="text-xs text-gray-500">{SEVERITY_LABELS[sev]}</div>
              </div>
            ))}
          </div>
          {Object.keys(categoryCount).length > 0 && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">카테고리: </span>
              {Object.entries(categoryCount).map(([cat, cnt]) => (
                <span key={cat} className="mr-3">
                  {CATEGORY_LABELS[cat as Category] ?? cat} ({cnt})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments */}
        <h2 className="text-lg font-bold mb-4">수집된 댓글 목록</h2>
        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={c.id} className="border rounded p-4 break-inside-avoid">
              <div className="flex items-center gap-2 mb-2 text-sm">
                <span className="font-bold">#{i + 1}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                  c.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  c.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  c.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {SEVERITY_LABELS[c.severity as Severity]}
                </span>
                {c.category && (
                  <span className="text-gray-500">
                    [{CATEGORY_LABELS[c.category as Category] ?? c.category}]
                  </span>
                )}
              </div>
              <p className="text-sm mb-2 whitespace-pre-wrap">{c.content}</p>
              <div className="text-xs text-gray-400 space-y-0.5">
                {c.author_name && <div>작성자: {c.author_name}</div>}
                {c.platform && (
                  <div>플랫폼: {PLATFORM_OPTIONS.find((p) => p.value === c.platform)?.label ?? c.platform}</div>
                )}
                {c.source_url && <div>원본 URL: {c.source_url}</div>}
                <div>수집일: {new Date(c.created_at).toLocaleString('ko-KR')}</div>
                {c.ai_score > 0 && <div>독성 점수: {c.ai_score}/100</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-xs text-gray-400 text-center">
          <p className="mb-1">본 리포트는 ShieldChat에 의해 자동 생성되었습니다.</p>
          <p className="mb-1">이 자료는 법적 증거 자료로 활용될 수 있으며, 원본 데이터의 무결성을 보장하지 않습니다.</p>
          <p>법적 조치를 위해서는 반드시 변호사와 상담하시기 바랍니다.</p>
          <p className="mt-4 text-gray-300">Generated by ShieldChat - {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );
}
