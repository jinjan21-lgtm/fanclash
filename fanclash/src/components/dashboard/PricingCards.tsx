'use client';
import { useToast } from '@/components/ui/Toast';

const PLANS = [
  {
    name: 'Free',
    price: '무료',
    features: [
      '핵심 위젯 3종 (알림, 랭킹, 목표)',
      '기본 테마 (모던)',
      '팬 리더보드',
      '플랫폼 연동 2개',
    ],
    limitations: [
      '배틀/룰렛 등 프리미엄 위젯',
      '커스텀 사운드',
      '커스텀 CSS',
      '후원 통계 & 분석',
      '추가 테마',
    ],
    cta: '현재 사용 중',
    key: 'free',
  },
  {
    name: 'Pro',
    price: '₩9,900/월',
    features: [
      '위젯 10종 무제한',
      '모든 테마 (모던, 게임, 걸캠)',
      '팬 리더보드',
      '플랫폼 연동 무제한',
      '커스텀 알림 사운드',
      '커스텀 CSS (위젯 스타일)',
      '후원 통계 & 분석',
      '시즌 시스템',
      '소셜 공유 카드',
      '우선 지원',
    ],
    limitations: [],
    cta: 'Pro 시작하기',
    key: 'pro',
  },
];

export default function PricingCards({ currentPlan }: { currentPlan: string }) {
  const { toast } = useToast();

  const handleUpgrade = () => {
    toast('결제 시스템 준비 중입니다. 곧 오픈 예정!', 'info');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
      {PLANS.map(plan => {
        const isCurrent = plan.key === currentPlan;
        const isPro = plan.key === 'pro';

        return (
          <div key={plan.key} className={`rounded-2xl p-6 border-2 ${
            isPro ? 'border-purple-500 bg-purple-950/20' : 'border-gray-700 bg-gray-900'
          } ${isCurrent ? 'ring-2 ring-purple-400' : ''}`}>
            {isPro && (
              <span className="inline-block px-3 py-1 bg-purple-600 rounded-full text-xs font-bold mb-3">추천</span>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className={`text-3xl font-bold mt-2 ${isPro ? 'text-purple-400' : 'text-gray-400'}`}>{plan.price}</p>

            <ul className="mt-6 space-y-2">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-green-400">✓</span> {f}
                </li>
              ))}
              {plan.limitations.map((l, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="text-gray-600">✕</span> {l}
                </li>
              ))}
            </ul>

            <button
              onClick={isPro && !isCurrent ? handleUpgrade : undefined}
              disabled={isCurrent}
              className={`w-full mt-6 py-3 rounded-xl font-bold text-sm ${
                isCurrent
                  ? 'bg-gray-700 text-gray-400 cursor-default'
                  : isPro
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-gray-700 text-gray-400'
              }`}
            >
              {isCurrent ? '현재 플랜' : plan.cta}
            </button>
          </div>
        );
      })}
    </div>
  );
}
