'use client';

import { useState, useEffect } from 'react';

interface TrendData {
  hourlyDistribution: number[];
  dailyTrend: { date: string; count: number }[];
  topAuthors: { name: string; count: number; topSeverity: string }[];
  topKeywords: { word: string; count: number }[];
  totalToxic: number;
  totalComments: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const SEVERITY_LABELS: Record<string, string> = {
  low: '낮음',
  medium: '보통',
  high: '높음',
  critical: '심각',
};

export default function TrendDashboard() {
  const [data, setData] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/trends')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(setData)
      .catch(() => setError('트렌드 데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-5 bg-gray-800 rounded w-40" />
          <div className="h-32 bg-gray-800 rounded" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mt-8 bg-gray-900 border border-gray-800 rounded-xl p-6">
        <p className="text-sm text-gray-500">{error || '데이터 없음'}</p>
      </div>
    );
  }

  if (data.totalComments === 0) {
    return null; // No comments yet, hide the dashboard
  }

  const maxHourly = Math.max(...data.hourlyDistribution, 1);
  const maxDaily = Math.max(...data.dailyTrend.map(d => d.count), 1);
  const maxKeyword = data.topKeywords.length > 0 ? data.topKeywords[0].count : 1;

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold text-white mb-4">감정 트렌드 분석</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">시간대별 악성 댓글 분포</h3>
          <div className="flex items-end gap-[2px] h-32">
            {data.hourlyDistribution.map((count, hour) => (
              <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full bg-rose-500/80 rounded-t-sm transition-all hover:bg-rose-400 min-h-[1px]"
                  style={{ height: `${Math.max((count / maxHourly) * 100, count > 0 ? 4 : 0)}%` }}
                />
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                  {hour}시: {count}건
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-600">
            <span>0시</span>
            <span>6시</span>
            <span>12시</span>
            <span>18시</span>
            <span>23시</span>
          </div>
          {data.totalToxic > 0 && (
            <p className="text-xs text-gray-500 mt-3">
              총 {data.totalToxic}건의 악성 댓글 분석 결과
            </p>
          )}
        </div>

        {/* Daily Trend (7 days) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">심각도 트렌드 (7일)</h3>
          <div className="h-32 flex items-end gap-2">
            {data.dailyTrend.map((day) => (
              <div key={day.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className="w-full bg-orange-500/80 rounded-t-sm transition-all hover:bg-orange-400"
                  style={{ height: `${Math.max((day.count / maxDaily) * 100, day.count > 0 ? 6 : 0)}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-800 text-xs text-white px-2 py-1 rounded whitespace-nowrap z-10">
                  {day.date.slice(5)}: {day.count}건
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-gray-600">
            {data.dailyTrend.map((day) => (
              <span key={day.date}>{day.date.slice(8)}</span>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            높음 + 심각 등급 댓글 수
          </p>
        </div>

        {/* Top Attackers */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">반복 공격자 TOP 5</h3>
          {data.topAuthors.length > 0 ? (
            <div className="space-y-3">
              {data.topAuthors.map((author, i) => (
                <div key={author.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-200 truncate">{author.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEVERITY_COLORS[author.topSeverity]} text-white`}>
                        {SEVERITY_LABELS[author.topSeverity] ?? author.topSeverity}
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-rose-500/70 rounded-full"
                        style={{ width: `${(author.count / (data.topAuthors[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{author.count}건</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">데이터 없음</p>
          )}
        </div>

        {/* Keyword Frequency */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">키워드 빈도</h3>
          {data.topKeywords.length > 0 ? (
            <div className="space-y-2">
              {data.topKeywords.map((kw) => (
                <div key={kw.word} className="flex items-center gap-3">
                  <span className="text-xs text-gray-300 w-16 truncate shrink-0">{kw.word}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-purple-500/70 rounded-full flex items-center justify-end pr-1.5"
                      style={{ width: `${Math.max((kw.count / maxKeyword) * 100, 8)}%` }}
                    >
                      <span className="text-[10px] text-white font-medium">{kw.count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-4 text-center">데이터 없음</p>
          )}
        </div>
      </div>
    </div>
  );
}
