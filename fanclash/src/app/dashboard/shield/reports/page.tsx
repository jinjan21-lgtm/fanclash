'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface ReportRow {
  id: string;
  title: string;
  status: string;
  comment_count: number;
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: '작성 중', color: 'bg-gray-700 text-gray-300' },
  completed: { label: '완료', color: 'bg-emerald-900/50 text-emerald-400' },
  submitted: { label: '제출됨', color: 'bg-blue-900/50 text-blue-400' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('sc_reports')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (data) setReports(data);
      } catch {
        // Table may not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="pt-12 md:pt-0 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">리포트</h1>
          <p className="text-gray-500 text-sm mt-1">악성 댓글 증거 리포트를 관리하세요</p>
        </div>
        <Link
          href="/dashboard/shield/reports/new"
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm transition-colors"
        >
          새 리포트
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <div className="w-8 h-8 border-2 border-gray-600 border-t-rose-400 rounded-full animate-spin mx-auto mb-3" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 border border-gray-800 rounded-2xl bg-gray-900/50">
          <p className="text-gray-400 mb-2">리포트가 없습니다</p>
          <p className="text-xs text-gray-600 mb-4">악성 댓글을 모아 증거 리포트를 생성하세요</p>
          <Link
            href="/dashboard/shield/reports/new"
            className="inline-block px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium text-sm transition-colors"
          >
            첫 리포트 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => {
            const statusInfo = STATUS_LABELS[report.status] || STATUS_LABELS.draft;
            return (
              <Link
                key={report.id}
                href={`/dashboard/shield/reports/${report.id}`}
                className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{report.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        댓글 {report.comment_count}건
                      </span>
                      <span className="text-xs text-gray-600">|</span>
                      <span className="text-xs text-gray-600">
                        {new Date(report.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
