'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Report } from '@/types';

const statusLabels: Record<string, string> = {
  draft: '초안',
  generated: '생성됨',
  submitted: '제출됨',
};

const statusColors: Record<string, string> = {
  draft: 'bg-gray-700 text-gray-300',
  generated: 'bg-green-900/50 text-green-400',
  submitted: 'bg-blue-900/50 text-blue-400',
};

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports')
      .then((r) => r.json())
      .then((d) => {
        setReports(d.reports ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">리포트</h1>
        <Link
          href="/dashboard/reports/new"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition"
        >
          새 리포트
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">로딩 중...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-gray-500 mb-4">생성된 리포트가 없습니다.</p>
          <Link
            href="/dashboard/reports/new"
            className="text-rose-400 hover:text-rose-300 text-sm"
          >
            첫 번째 리포트 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center justify-between hover:border-gray-700 transition"
            >
              <div>
                <h3 className="text-white font-medium mb-1">{r.title}</h3>
                <div className="flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs ${statusColors[r.status]}`}>
                    {statusLabels[r.status]}
                  </span>
                  <span className="text-gray-500">{r.comment_count}건</span>
                  <span className="text-gray-600">
                    {new Date(r.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {r.status === 'generated' && (
                  <Link
                    href={`/dashboard/reports/${r.id}/print`}
                    className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm rounded-lg hover:bg-gray-700 transition flex items-center gap-1.5"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF 다운로드
                  </Link>
                )}
                {r.status === 'draft' && (
                  <Link
                    href={`/dashboard/reports/${r.id}/print`}
                    className="px-3 py-1.5 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition"
                  >
                    리포트 생성
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
