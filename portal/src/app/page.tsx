export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-32 sm:py-40 text-center">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-500/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto">
          <p className="animate-fade-in text-sm font-medium tracking-widest uppercase text-gray-400 mb-6">
            진크루 프로덕트
          </p>
          <h1 className="animate-fade-in-up delay-100 text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            크리에이터를 위한
            <br />
            <span className="shimmer-text">올인원 툴킷</span>
          </h1>
          <p className="animate-fade-in-up delay-300 text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto">
            진크루가 만드는 크리에이터 프로덕트 시리즈.
            <br className="hidden sm:block" />
            방송을 더 재밌게, 더 안전하게, 더 효율적으로.
          </p>
        </div>
      </section>

      {/* Product Cards */}
      <section className="px-6 pb-32">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* FanClash */}
          <a
            href="https://fanclash.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="product-card animate-fade-in-up delay-200 group relative rounded-2xl border border-purple-500/20 bg-gray-900/50 backdrop-blur-sm p-8 hover:border-purple-500/50 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">
                <span role="img" aria-label="FanClash">&#x1F49C;</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-purple-300">FanClash</h3>
                <p className="text-sm text-gray-500">도네이션을 게임으로</p>
              </div>
            </div>
            <ul className="space-y-3 text-gray-400 text-sm mb-8">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                위젯 20종
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                실시간 인터랙션
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                RPG / 배틀 / 가챠
              </li>
            </ul>
            <div className="flex items-center text-purple-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* ClipForge */}
          <a
            href="https://clipforge.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="product-card animate-fade-in-up delay-400 group relative rounded-2xl border border-emerald-500/20 bg-gray-900/50 backdrop-blur-sm p-8 hover:border-emerald-500/50 hover:shadow-[0_0_40px_rgba(16,185,129,0.15)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-2xl">
                <span role="img" aria-label="ClipForge">&#x1F7E2;</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-emerald-300">ClipForge</h3>
                <p className="text-sm text-gray-500">하이라이트를 숏폼으로</p>
              </div>
            </div>
            <ul className="space-y-3 text-gray-400 text-sm mb-8">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                AI 하이라이트 감지
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                자동 클립 추출
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                세로 크롭
              </li>
            </ul>
            <div className="flex items-center text-emerald-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* ShieldChat */}
          <a
            href="https://shieldchat.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="product-card animate-fade-in-up delay-600 group relative rounded-2xl border border-rose-500/20 bg-gray-900/50 backdrop-blur-sm p-8 hover:border-rose-500/50 hover:shadow-[0_0_40px_rgba(244,63,94,0.15)]"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center text-2xl">
                <span role="img" aria-label="ShieldChat">&#x1F534;</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-rose-300">ShieldChat</h3>
                <p className="text-sm text-gray-500">악성 댓글로부터 방어</p>
              </div>
            </div>
            <ul className="space-y-3 text-gray-400 text-sm mb-8">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                독성 분석
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                증거 PDF 추출
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                법적 가이드
              </li>
            </ul>
            <div className="flex items-center text-rose-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
              바로가기
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </section>

      {/* Why 진크루 */}
      <section className="px-6 py-24 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="animate-fade-in-up text-3xl sm:text-4xl font-bold mb-16">
            왜 <span className="text-purple-400">진크루</span>인가요?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">
            <div className="animate-fade-in-up delay-200">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-800/80 flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">스트리머 출신 개발팀</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                방송 현장을 아는 팀이 만듭니다.
                <br />
                진짜 필요한 기능만 담았습니다.
              </p>
            </div>
            <div className="animate-fade-in-up delay-400">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-800/80 flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">한국 시장 특화</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                투네이션, 치지직, 숲 등
                <br />
                국내 플랫폼 완벽 지원.
              </p>
            </div>
            <div className="animate-fade-in-up delay-600">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-800/80 flex items-center justify-center">
                <svg className="w-7 h-7 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">무료로 시작</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                무료로 시작하고,
                <br />
                필요할 때 업그레이드하세요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-20 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="animate-scale-in delay-200">
              <p className="text-4xl sm:text-5xl font-bold text-purple-400 mb-2">20+</p>
              <p className="text-gray-500 text-sm">위젯 종류</p>
            </div>
            <div className="animate-scale-in delay-400">
              <p className="text-4xl sm:text-5xl font-bold text-emerald-400 mb-2">3</p>
              <p className="text-gray-500 text-sm">프로덕트</p>
            </div>
            <div className="animate-scale-in delay-600">
              <p className="text-4xl sm:text-5xl font-bold text-rose-400 mb-2">All-in-1</p>
              <p className="text-gray-500 text-sm">올인원</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto text-center text-gray-600 text-sm space-y-2">
          <p className="font-medium text-gray-500">진크루</p>
          <p>사업자등록번호: 559-26-01952</p>
          <p className="text-gray-700">&copy; 2025 진크루. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
