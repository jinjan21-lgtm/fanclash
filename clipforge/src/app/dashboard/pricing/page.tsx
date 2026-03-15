import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/types';

export const metadata = { title: '요금제' };

const FREE_FEATURES = [
  { text: '월 3개 클립', included: true },
  { text: '기본 자막 스타일', included: true },
  { text: '9:16 세로 변환', included: true },
  { text: '워터마크 포함', included: false },
  { text: '우선 처리', included: false },
  { text: '커스텀 자막', included: false },
];

const PRO_FEATURES = [
  { text: '무제한 클립', included: true },
  { text: '기본 + 커스텀 자막', included: true },
  { text: '9:16 세로 변환', included: true },
  { text: '워터마크 제거', included: true },
  { text: '우선 처리', included: true },
  { text: '커스텀 자막 스타일', included: true },
];

export default async function PricingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    profile = data as Profile | null;
  }

  const currentPlan = profile?.plan || 'free';

  return (
    <div className="pt-12 md:pt-0 max-w-3xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold mb-2">요금제</h1>
        <p className="text-gray-500 text-sm">필요에 맞는 플랜을 선택하세요</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free */}
        <div className={`p-8 rounded-2xl bg-gray-900 border ${
          currentPlan === 'free' ? 'border-emerald-500/50' : 'border-gray-800'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">Free</h2>
            {currentPlan === 'free' && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">현재 플랜</span>
            )}
          </div>
          <div className="text-3xl font-bold mb-6">무료</div>
          <ul className="space-y-3 mb-8">
            {FREE_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                <span className={f.included ? 'text-emerald-400' : 'text-gray-600'}>
                  {f.included ? '\u2713' : '\u2717'}
                </span>
                <span className={f.included ? 'text-gray-300' : 'text-gray-600'}>{f.text}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'free' ? (
            <button disabled className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-500 text-sm">
              현재 플랜
            </button>
          ) : (
            <button disabled className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-400 text-sm">
              다운그레이드
            </button>
          )}
        </div>

        {/* Pro */}
        <div className={`p-8 rounded-2xl bg-gray-900 border-2 relative ${
          currentPlan === 'pro' ? 'border-emerald-500/50' : 'border-emerald-500'
        }`}>
          {currentPlan !== 'pro' && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">
              추천
            </div>
          )}
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-bold">Pro</h2>
            {currentPlan === 'pro' && (
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">현재 플랜</span>
            )}
          </div>
          <div className="text-3xl font-bold mb-1">
            9,900원<span className="text-base font-normal text-gray-400">/월</span>
          </div>
          <p className="text-xs text-gray-500 mb-6">VAT 포함</p>
          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-400">{'\u2713'}</span>
                <span className="text-gray-300">{f.text}</span>
              </li>
            ))}
          </ul>
          {currentPlan === 'pro' ? (
            <button disabled className="w-full py-2.5 rounded-xl bg-gray-800 text-gray-500 text-sm">
              현재 플랜
            </button>
          ) : (
            <button className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors">
              Pro 시작하기
            </button>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-lg font-bold mb-6 text-center">자주 묻는 질문</h2>
        <div className="space-y-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium mb-2">무료 플랜의 클립 한도가 초기화되나요?</h3>
            <p className="text-sm text-gray-500">네, 매월 1일에 자동으로 초기화됩니다.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium mb-2">Pro 구독을 취소할 수 있나요?</h3>
            <p className="text-sm text-gray-500">언제든지 취소할 수 있으며, 현재 결제 주기가 끝날 때까지 Pro 기능을 이용하실 수 있습니다.</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-sm font-medium mb-2">어떤 플랫폼을 지원하나요?</h3>
            <p className="text-sm text-gray-500">YouTube, 치지직(CHZZK), Twitch, 아프리카TV의 VOD를 지원합니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
