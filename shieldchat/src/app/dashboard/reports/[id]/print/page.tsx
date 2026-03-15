'use client';

import { useEffect, useState, useRef, useCallback, use } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import { SEVERITY_LABELS, CATEGORY_LABELS, PLATFORM_OPTIONS } from '@/lib/toxicity';
import type { Comment, Report } from '@/types';
import type { Severity, Category } from '@/lib/toxicity';

export default function ReportPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [profile, setProfile] = useState<{ display_name: string; email: string } | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('sc_profiles')
        .select('display_name, email')
        .eq('id', user.id)
        .single();
      setProfile(profileData);

      const { data: reportData } = await supabase
        .from('sc_reports')
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
          .from('sc_comments')
          .select('*')
          .in('id', reportData.comment_ids)
          .order('severity', { ascending: true });
        setComments(commentsData as Comment[] ?? []);
      }

      // Mark as generated if still draft
      if (reportData.status === 'draft') {
        await fetch(`/api/reports/${id}/generate`, { method: 'POST' });
      }

      setLoading(false);
    };
    load();
  }, [id, supabase]);

  const handleDownloadPDF = useCallback(async () => {
    if (!printRef.current || downloading) return;
    setDownloading(true);

    try {
      const { generateReportPDF } = await import('@/lib/pdf-generator');
      const filename = `shieldchat-report-${report?.title?.replace(/[^a-zA-Z0-9가-힣]/g, '_') || id}.pdf`;
      await generateReportPDF(printRef.current, filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDownloading(false);
    }
  }, [downloading, report, id]);

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

  const severityBgColors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Action buttons (no-print) */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {downloading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              PDF 생성 중...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF 다운로드
            </>
          )}
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
        >
          인쇄
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-sm"
        >
          돌아가기
        </button>
      </div>

      {/* Report content - captured for PDF */}
      <div ref={printRef} className="max-w-[210mm] mx-auto px-8 py-12 bg-white" style={{ fontFamily: '"Noto Sans KR", "Malgun Gothic", sans-serif' }}>
        {/* Cover / Header */}
        <div className="text-center border-b-2 border-black pb-8 mb-8">
          <div className="text-sm tracking-[0.3em] text-gray-400 mb-3">SHIELDCHAT</div>
          <h1 className="text-2xl font-bold mb-3">악성 댓글 증거 보존 리포트</h1>
          <p className="text-lg text-gray-700 mb-4">{report.title}</p>
          <div className="text-sm text-gray-500">
            {new Date(report.created_at).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Report Info */}
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm border border-gray-200 rounded-lg p-5">
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">작성자</span>
            <span className="font-medium">{profile?.display_name ?? profile?.email ?? '-'}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">작성일</span>
            <span className="font-medium">{new Date(report.created_at).toLocaleDateString('ko-KR')}</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">총 댓글 수</span>
            <span className="font-medium">{comments.length}건</span>
          </div>
          <div>
            <span className="text-gray-400 text-xs block mb-0.5">리포트 ID</span>
            <span className="font-mono text-xs">{report.id}</span>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-8 p-5 bg-gray-50 border border-gray-200 rounded-lg">
          <h2 className="text-lg font-bold mb-4">1. 요약</h2>
          <div className="grid grid-cols-4 gap-4 text-center mb-4">
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map((sev) => (
              <div key={sev} className="bg-white rounded-lg p-3 border border-gray-100">
                <div className={`text-2xl font-bold ${severityTextColors[sev]}`}>
                  {severityCount[sev]}
                </div>
                <div className="text-xs text-gray-500 mt-1">{SEVERITY_LABELS[sev]}</div>
              </div>
            ))}
          </div>
          {Object.keys(categoryCount).length > 0 && (
            <div className="text-sm text-gray-600 mt-3">
              <span className="font-medium">유형별 분류: </span>
              {Object.entries(categoryCount).map(([cat, cnt]) => (
                <span key={cat} className="mr-3 inline-block bg-white px-2 py-0.5 rounded border border-gray-100 text-xs">
                  {CATEGORY_LABELS[cat as Category] ?? cat} ({cnt}건)
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Comments Table */}
        <h2 className="text-lg font-bold mb-4">2. 수집된 댓글 목록</h2>
        <div className="space-y-4">
          {comments.map((c, i) => (
            <div key={c.id} className="border border-gray-200 rounded-lg p-4" style={{ breakInside: 'avoid' }}>
              <div className="flex items-center gap-2 mb-2 text-sm">
                <span className="font-bold text-gray-800">#{i + 1}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityBgColors[c.severity]}`}>
                  {SEVERITY_LABELS[c.severity as Severity]}
                </span>
                {c.category && (
                  <span className="text-gray-500 text-xs">
                    [{CATEGORY_LABELS[c.category as Category] ?? c.category}]
                  </span>
                )}
                {c.platform && (
                  <span className="text-gray-400 text-xs ml-auto">
                    {PLATFORM_OPTIONS.find((p) => p.value === c.platform)?.label ?? c.platform}
                  </span>
                )}
              </div>
              <p className="text-sm mb-3 whitespace-pre-wrap leading-relaxed border-l-2 border-gray-200 pl-3 py-1 bg-gray-50 rounded-r">
                {c.content}
              </p>
              <div className="text-xs text-gray-400 grid grid-cols-2 gap-1">
                {c.author_name && <div>작성자: {c.author_name}</div>}
                {c.source_url && (
                  <div className="truncate">원본 URL: {c.source_url}</div>
                )}
                <div>수집일: {new Date(c.created_at).toLocaleString('ko-KR')}</div>
                {c.ai_score > 0 && <div>독성 점수: {c.ai_score}/100</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300">
          <h2 className="text-sm font-bold text-gray-600 mb-3">법적 고지사항</h2>
          <div className="text-xs text-gray-400 space-y-1.5 leading-relaxed">
            <p>1. 본 리포트는 ShieldChat 서비스를 통해 자동 생성된 증거 보존 자료입니다.</p>
            <p>2. 이 자료는 온라인상의 악성 댓글 및 유해 콘텐츠를 기록 및 분류한 것이며, 법적 증거로서의 효력은 관할 법원의 판단에 따릅니다.</p>
            <p>3. 댓글의 수집 시점과 원본 데이터의 무결성에 대해서는 ShieldChat이 보증하지 않으며, 추가적인 공증 또는 인증 절차가 필요할 수 있습니다.</p>
            <p>4. 법적 조치를 위해서는 반드시 자격을 갖춘 법률 전문가와 상담하시기 바랍니다.</p>
            <p>5. 본 리포트의 무단 복제, 배포 및 변조를 금합니다.</p>
          </div>
          <div className="mt-6 text-center text-xs text-gray-300">
            <p>Generated by ShieldChat</p>
            <p>{new Date().toISOString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
