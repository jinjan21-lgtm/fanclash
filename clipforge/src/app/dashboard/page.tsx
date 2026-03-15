import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile, Clip } from '@/types';
import { PLAN_LIMITS, formatDuration } from '@/types';

export const metadata = { title: '대시보드' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  let recentClips: Clip[] = [];

  if (user) {
    const { data: p } = await supabase.from('cf_profiles').select('*').eq('id', user.id).single();
    profile = p as Profile | null;

    const { data: c } = await supabase
      .from('cf_clips')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    recentClips = (c || []) as Clip[];
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
          <p className="text-xs text-gray-500 mb-1">총 클립</p>
          <p className="text-2xl font-bold">{recentClips.length}</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
        <h3 className="text-sm font-medium mb-3">사용 방법</h3>
        <div className="grid sm:grid-cols-4 gap-4 text-xs text-gray-500">
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
            <span>영상 파일을 업로드합니다</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
            <span>오디오를 분석하여 하이라이트를 감지합니다</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
            <span>원하는 구간을 선택하여 클립을 생성합니다</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] shrink-0 mt-0.5">4</span>
            <span>클립을 다운로드합니다</span>
          </div>
        </div>
      </div>

      {/* Recent clips */}
      <div>
        <h2 className="text-lg font-bold mb-4">최근 클립</h2>
        {recentClips.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
            </svg>
            <p className="mb-2">아직 클립이 없습니다</p>
            <Link href="/dashboard/new" className="text-emerald-400 hover:text-emerald-300 text-sm">
              첫 번째 클립을 만들어보세요
            </Link>
          </div>
        ) : (
          <div className="grid gap-3">
            {recentClips.map((clip) => (
              <div
                key={clip.id}
                className="p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-medium truncate">{clip.title || '제목 없음'}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDuration(clip.start_time)} ~ {formatDuration(clip.end_time)}
                      <span className="ml-2 text-gray-600">({formatDuration(clip.duration)})</span>
                    </p>
                  </div>
                  <span className="text-xs text-gray-600 shrink-0 ml-4">
                    {new Date(clip.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
