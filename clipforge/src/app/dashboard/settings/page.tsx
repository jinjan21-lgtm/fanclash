import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';
import { PLAN_LIMITS } from '@/types';

export const metadata = { title: '설정' };

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from('cf_profiles').select('*').eq('id', user.id).single();
    profile = data as Profile | null;
  }

  const plan = profile?.plan || 'free';
  const used = profile?.clips_used_this_month || 0;
  const limit = PLAN_LIMITS[plan].clips_per_month;
  const limitLabel = limit === Infinity ? '무제한' : `${limit}개`;

  return (
    <div className="pt-12 md:pt-0 max-w-2xl">
      <h1 className="text-2xl font-bold mb-8">설정</h1>

      {/* Profile */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">프로필 정보</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이메일</label>
            <p className="text-sm">{profile?.email || '-'}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">닉네임</label>
            <p className="text-sm">{profile?.display_name || '-'}</p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">가입일</label>
            <p className="text-sm">
              {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString('ko-KR')
                : '-'}
            </p>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">플랜 정보</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-sm px-3 py-1 rounded-full font-medium ${
            plan === 'pro' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-700 text-gray-400'
          }`}>
            {plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>이번 달 사용량</span>
            <span className="text-white">{used} / {limitLabel}</span>
          </div>
          <div className="flex justify-between">
            <span>워터마크</span>
            <span className="text-white">{PLAN_LIMITS[plan].watermark ? '포함' : '제거됨'}</span>
          </div>
          <div className="flex justify-between">
            <span>자막 스타일</span>
            <span className="text-white">{PLAN_LIMITS[plan].subtitle === 'custom' ? '커스텀' : '기본'}</span>
          </div>
          <div className="flex justify-between">
            <span>우선 처리</span>
            <span className="text-white">{PLAN_LIMITS[plan].priority ? '활성화' : '비활성화'}</span>
          </div>
        </div>
        {plan === 'free' && (
          <Link
            href="/dashboard/pricing"
            className="mt-4 inline-block text-sm text-emerald-400 hover:text-emerald-300"
          >
            Pro로 업그레이드 &rarr;
          </Link>
        )}
      </section>
      {/* 진크루 서비스 */}
      <section className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">진크루 서비스</h2>
        <p className="text-gray-400 text-sm mb-4">같은 계정으로 모든 서비스를 이용할 수 있습니다</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="https://fanclash.vercel.app" target="_blank"
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <span className="text-2xl">🎮</span>
            <div>
              <p className="font-medium text-purple-400">FanClash</p>
              <p className="text-xs text-gray-500">도네이션 이벤트 엔터테인먼트</p>
            </div>
          </a>
          <a href="https://shieldchat.vercel.app" target="_blank"
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-medium text-rose-400">ShieldChat</p>
              <p className="text-xs text-gray-500">악성 댓글 방어</p>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}
