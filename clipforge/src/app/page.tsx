import Link from 'next/link';

const FEATURES = [
  { icon: '🎯', title: '자동 하이라이트 감지', desc: 'AI가 방송에서 가장 재밌는 순간을 자동으로 찾아냅니다. 채팅 폭발, 큰 리액션, 킬 장면 등을 감지합니다.' },
  { icon: '📱', title: '세로 자동 크롭', desc: '가로 방송을 TikTok/Shorts에 최적화된 9:16 세로 영상으로 자동 변환합니다.' },
  { icon: '💬', title: '자막 자동 생성', desc: '음성 인식으로 자막을 자동 생성하고, 다양한 스타일을 적용할 수 있습니다.' },
  { icon: '⚡', title: '원클릭 다운로드', desc: '생성된 클립을 바로 다운로드하여 TikTok, YouTube Shorts, Instagram Reels에 업로드하세요.' },
];

const STEPS = [
  { num: '01', title: 'URL 입력', desc: 'YouTube, 치지직, Twitch 방송 URL을 붙여넣기하세요.' },
  { num: '02', title: 'AI 분석', desc: 'AI가 자동으로 하이라이트 구간을 감지합니다.' },
  { num: '03', title: '클립 다운로드', desc: '원하는 클립을 선택하고 다운로드하세요.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text">ClipForge</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">
              로그인
            </Link>
            <Link href="/signup" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            스트리머를 위한 숏폼 자동화
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            방송 하이라이트를<br />
            <span className="gradient-text">자동으로 숏폼으로</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            URL 하나면 충분합니다. AI가 방송에서 가장 재밌는 순간을 찾아내고,
            TikTok/YouTube Shorts에 바로 올릴 수 있는 세로 클립을 만들어줍니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors">
              무료로 시작하기
            </Link>
            <Link href="/dashboard/pricing" className="border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white px-8 py-3.5 rounded-xl text-lg font-medium transition-colors">
              요금제 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">3단계로 완성되는 숏폼</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.num} className="relative">
                <div className="text-6xl font-black text-emerald-500/10 mb-4">{step.num}</div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">강력한 기능</h2>
          <p className="text-gray-400 text-center mb-16 max-w-2xl mx-auto">
            복잡한 편집 없이, URL 하나로 숏폼 콘텐츠를 만드세요
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-emerald-500/30 transition-colors">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-6 bg-gray-900/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">심플한 요금제</h2>
          <p className="text-gray-400 mb-12">무료로 시작하고, 필요할 때 업그레이드하세요</p>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="p-8 rounded-2xl bg-gray-900 border border-gray-800">
              <h3 className="text-lg font-bold mb-2">Free</h3>
              <div className="text-3xl font-bold mb-6">무료</div>
              <ul className="text-left text-gray-400 text-sm space-y-3">
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 월 3개 클립</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 기본 자막 스타일</li>
                <li className="flex items-center gap-2"><span className="text-gray-600">&#10005;</span> 워터마크 포함</li>
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-gray-900 border-2 border-emerald-500 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">추천</div>
              <h3 className="text-lg font-bold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-1">9,900원<span className="text-base font-normal text-gray-400">/월</span></div>
              <p className="text-xs text-gray-500 mb-6">VAT 포함</p>
              <ul className="text-left text-gray-400 text-sm space-y-3">
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 무제한 클립</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 워터마크 제거</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 커스텀 자막 스타일</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">&#10003;</span> 우선 처리</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-gray-400 mb-8">
            매일 몇 시간씩 편집에 쓰는 시간을 아끼세요.
            ClipForge가 알아서 해드립니다.
          </p>
          <Link href="/signup" className="inline-block bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3.5 rounded-xl text-lg font-semibold transition-colors">
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="text-xl font-bold gradient-text mb-2">ClipForge</div>
              <p className="text-gray-500 text-sm">방송 하이라이트 자동 숏폼 변환</p>
            </div>
            <div className="text-gray-500 text-xs space-y-1">
              <p>상호: 진크루 | 대표: 대표자명</p>
              <p>사업자등록번호: 559-26-01952</p>
              <p>이메일: support@clipforge.kr</p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-gray-600 text-xs text-center">
            &copy; 2026 ClipForge. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
