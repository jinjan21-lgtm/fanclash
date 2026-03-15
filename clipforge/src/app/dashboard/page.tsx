import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import JobCard from '@/components/dashboard/JobCard';
import type { Job, Profile } from '@/types';
import { PLAN_LIMITS } from '@/types';

export const metadata = { title: '대시보드' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let jobs: Job[] = [];

  if (user) {
    const { data: p } = await supabase.from('cf_profiles').select('*').eq('id', user.id).single();
    profile = p as Profile | null;

    const { data: j } = await supabase
      .from('cf_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    jobs = (j || []) as Job[];
  }

  const plan = profile?.plan || 'free';
  const used = profile?.clips_used_this_month || 0;
  const limit = PLAN_LIMITS[plan].clips_per_month;
  const limitLabel = limit === Infinity ? '무제한' : `${limit}개`;

  return (
    <div className="pt-12 md:pt-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">대시보드</h1>
          <p className="text-gray-500 text-sm mt-1">
            안녕하세요, {profile?.display_name || '사용자'}님
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          새 클립 만들기
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">이번 달 사용량</p>
          <p className="text-2xl font-bold">
            {used}<span className="text-sm text-gray-500 font-normal"> / {limitLabel}</span>
          </p>
          {plan === 'free' && used >= (limit as number) && (
            <p className="text-xs text-amber-400 mt-1">한도에 도달했습니다</p>
          )}
        </div>
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">플랜</p>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold">{plan === 'pro' ? 'Pro' : 'Free'}</p>
            {plan === 'free' && (
              <Link href="/dashboard/pricing" className="text-xs text-emerald-400 hover:text-emerald-300">
                업그레이드
              </Link>
            )}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-gray-900 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">총 작업</p>
          <p className="text-2xl font-bold">{jobs.length}</p>
        </div>
      </div>

      {/* Recent jobs */}
      <div>
        <h2 className="text-lg font-bold mb-4">최근 작업</h2>
        {jobs.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="mb-2">아직 작업이 없습니다</p>
            <Link href="/dashboard/new" className="text-emerald-400 hover:text-emerald-300 text-sm">
              첫 번째 클립을 만들어보세요
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
