import { createSupabaseServer } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { SEVERITY_LABELS, CATEGORY_LABELS } from '@/lib/toxicity';
import type { Severity, Category } from '@/lib/toxicity';
import TrendDashboard from '@/components/dashboard/TrendDashboard';

export const metadata = { title: '대시보드' };

export default async function DashboardPage() {
  const user = await requireAuth();
  const supabase = await createSupabaseServer();

  // Fetch stats
  const { count: totalComments } = await supabase
    .from('sc_comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const { count: dangerCount } = await supabase
    .from('sc_comments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .in('severity', ['high', 'critical']);

  const { count: reportCount } = await supabase
    .from('sc_reports')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // Severity distribution
  const { data: allComments } = await supabase
    .from('sc_comments')
    .select('severity')
    .eq('user_id', user.id);

  const severityDist: Record<string, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  allComments?.forEach((c) => {
    if (c.severity && severityDist[c.severity] !== undefined) {
      severityDist[c.severity]++;
    }
  });
  const maxCount = Math.max(...Object.values(severityDist), 1);

  // Recent toxic comments
  const { data: recentComments } = await supabase
    .from('sc_comments')
    .select('*')
    .eq('user_id', user.id)
    .in('severity', ['medium', 'high', 'critical'])
    .order('created_at', { ascending: false })
    .limit(5);

  const stats = [
    { label: '총 수집 댓글', value: totalComments ?? 0, color: 'text-white' },
    { label: '위험 댓글', value: dangerCount ?? 0, color: 'text-red-400' },
    { label: '이번 달 리포트', value: reportCount ?? 0, color: 'text-blue-400' },
  ];

  const severityColors: Record<string, string> = {
    low: 'bg-gray-600',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">대시보드</h1>
        <div className="flex gap-3">
          <Link
            href="/dashboard/comments/new"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition"
          >
            댓글 추가
          </Link>
          <Link
            href="/dashboard/reports/new"
            className="px-4 py-2 border border-gray-700 hover:border-gray-600 text-gray-300 text-sm rounded-lg transition"
          >
            리포트 생성
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">심각도 분포</h2>
          <div className="space-y-3">
            {(Object.entries(severityDist) as [Severity, number][]).map(([sev, count]) => (
              <div key={sev} className="flex items-center gap-3">
                <span className="text-sm text-gray-400 w-12">{SEVERITY_LABELS[sev]}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full ${severityColors[sev]} rounded-full transition-all flex items-center justify-end pr-2`}
                    style={{ width: `${Math.max((count / maxCount) * 100, count > 0 ? 10 : 0)}%` }}
                  >
                    {count > 0 && <span className="text-xs text-white font-medium">{count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Toxic Comments */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">최근 위험 댓글</h2>
            <Link href="/dashboard/comments" className="text-sm text-rose-400 hover:text-rose-300">
              전체 보기
            </Link>
          </div>
          {recentComments && recentComments.length > 0 ? (
            <div className="space-y-3">
              {recentComments.map((c) => (
                <Link
                  key={c.id}
                  href={`/dashboard/comments/${c.id}`}
                  className="block bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800 transition"
                >
                  <p className="text-sm text-gray-200 line-clamp-1 mb-1">{c.content}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded ${
                      c.severity === 'critical' ? 'bg-red-900/50 text-red-400' :
                      c.severity === 'high' ? 'bg-orange-900/50 text-orange-400' :
                      'bg-yellow-900/50 text-yellow-400'
                    }`}>
                      {SEVERITY_LABELS[c.severity as Severity]}
                    </span>
                    {c.category && (
                      <span className="text-gray-500">
                        {CATEGORY_LABELS[c.category as Category] ?? c.category}
                      </span>
                    )}
                    {c.author_name && (
                      <span className="text-gray-600">by {c.author_name}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 py-8 text-center">
              아직 수집된 위험 댓글이 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Trend Dashboard */}
      <TrendDashboard />
    </div>
  );
}
