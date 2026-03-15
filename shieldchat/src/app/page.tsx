import Link from "next/link";

const features = [
  {
    icon: "🔍",
    title: "실시간 독성 감지",
    desc: "한국어 악성 댓글을 자동으로 분석하고 심각도를 분류합니다.",
  },
  {
    icon: "📄",
    title: "증거 PDF 리포트",
    desc: "법적 대응을 위한 증거 자료를 PDF로 생성합니다.",
  },
  {
    icon: "⚖️",
    title: "법적 가이드",
    desc: "사이버 명예훼손 신고 방법부터 고소장 작성까지 안내합니다.",
  },
  {
    icon: "🌐",
    title: "다중 플랫폼",
    desc: "YouTube, 치지직, TikTok, Instagram 등 모든 플랫폼을 지원합니다.",
  },
];

const steps = [
  { num: "01", title: "댓글 수집", desc: "악성 댓글을 직접 입력하거나 일괄 붙여넣기로 수집합니다." },
  { num: "02", title: "AI 분석", desc: "욕설, 협박, 명예훼손, 성희롱, 차별 자동 분류 및 심각도 평가." },
  { num: "03", title: "증거 보존", desc: "분석 결과를 PDF 리포트로 생성하여 법적 증거로 보존합니다." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav */}
      <header>
      <nav className="fixed top-0 w-full z-50 bg-gray-950/80 backdrop-blur border-b border-gray-800" aria-label="메인 네비게이션">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-rose-500">
            ShieldChat
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="px-4 py-2 text-sm text-gray-300 hover:text-white transition">
              로그인
            </Link>
            <Link href="/signup" className="px-4 py-2 text-sm bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>
      </header>

      <main>
      {/* Hero */}
      <section className="pt-32 pb-20 px-6" aria-label="히어로">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-rose-500/10 text-rose-400 text-sm px-4 py-1.5 rounded-full mb-6 border border-rose-500/20">
            크리에이터를 위한 악플 방어 도구
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            크리에이터를 위한<br />
            <span className="text-rose-500">악성 댓글 방패</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            악플에 지치셨나요? 증거 수집부터 법적 대응까지,<br />
            ShieldChat이 당신의 방패가 되어드립니다.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition text-lg"
            >
              무료로 시작하기
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-gray-700 hover:border-gray-600 text-gray-300 font-medium rounded-lg transition text-lg"
            >
              자세히 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-20 px-6 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            간단한 <span className="text-rose-500">3단계</span>로 시작하세요
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step) => (
              <div key={step.num} className="relative">
                <span className="text-5xl font-black text-rose-500/20">{step.num}</span>
                <h3 className="text-xl font-bold text-white mt-2 mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-white mb-16">
            주요 기능
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-rose-500/30 transition"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-gray-800" aria-label="시작하기">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-gray-400 mb-8">
            무료 플랜으로 매월 10건까지 댓글 분석이 가능합니다.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition text-lg"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            <p className="font-medium text-gray-400">ShieldChat</p>
            <p>사업자등록번호: 000-00-00000 | 대표: 홍길동</p>
            <p>이메일: support@shieldchat.kr</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/terms" className="hover:text-gray-300">이용약관</Link>
            <Link href="/privacy" className="hover:text-gray-300">개인정보처리방침</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
