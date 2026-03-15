import Link from 'next/link';

export const metadata = { title: '요금제' };

const plans = [
  {
    name: 'Free',
    price: '0',
    period: '무료',
    features: [
      '월 100건 댓글 저장',
      '수동 입력',
      '독성 분석',
      '기본 리포트',
      '법적 가이드',
    ],
    cta: '현재 플랜',
    ctaStyle: 'bg-gray-700 text-gray-400 cursor-default',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '14,900',
    period: '월',
    features: [
      '무제한 댓글 저장',
      '일괄 입력',
      '상세 독성 분석',
      'PDF 리포트 생성',
      '법적 가이드',
      '자동 수집 (Phase 2)',
      '법률 상담 연결 (Phase 2)',
      '우선 지원',
    ],
    cta: '시작하기',
    ctaStyle: 'bg-rose-600 hover:bg-rose-700 text-white',
    highlight: true,
  },
];

export default function PricingPage() {
  return (
    <div>
      <div className="text-center mb-10">
        <h1 className="text-2xl font-bold text-white mb-2">요금제</h1>
        <p className="text-gray-400">목적에 맞는 플랜을 선택하세요</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-xl p-6 ${
              plan.highlight
                ? 'bg-gray-900 border-2 border-rose-500 relative'
                : 'bg-gray-900 border border-gray-800'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-600 text-white text-xs px-3 py-1 rounded-full">
                추천
              </span>
            )}
            <h2 className="text-xl font-bold text-white mb-1">{plan.name}</h2>
            <div className="mb-4">
              <span className="text-3xl font-bold text-white">{plan.price}원</span>
              <span className="text-gray-500 text-sm">/{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                  <span className="text-rose-500 mt-0.5">&#10003;</span>
                  {f}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2.5 rounded-lg font-medium transition text-sm ${plan.ctaStyle}`}
              disabled={!plan.highlight}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600 mt-8">
        결제는 곧 지원될 예정입니다. 문의: support@shieldchat.kr
      </p>
    </div>
  );
}
