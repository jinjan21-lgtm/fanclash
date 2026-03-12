'use client';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const FEATURES = [
  { icon: '👑', title: '왕좌 쟁탈전', desc: '1등이 바뀔 때마다 풀스크린 알림. 경쟁심을 자극해 후원이 폭발합니다', color: 'from-yellow-500/20 to-orange-500/20', border: 'border-yellow-500/30' },
  { icon: '⚔️', title: '후원 배틀', desc: '베네핏을 걸고 시청자끼리 후원 대결. 3중 수익화 구조로 매출 극대화', color: 'from-red-500/20 to-pink-500/20', border: 'border-red-500/30' },
  { icon: '💕', title: '호감도 시스템', desc: '후원할수록 칭호가 올라가는 팬 등급. 충성 팬을 만드는 게이미피케이션', color: 'from-pink-500/20 to-purple-500/20', border: 'border-pink-500/30' },
  { icon: '📊', title: '실시간 랭킹', desc: 'TOP 5 후원 랭킹 보드. 순위 변동 시 화려한 애니메이션으로 경쟁 유도', color: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30' },
  { icon: '🎯', title: '도네 목표', desc: '단계별 목표 게이지. 달성할 때마다 미션 수행으로 방송이 더 재밌어집니다', color: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30' },
  { icon: '🎰', title: '룰렛 시스템', desc: '후원 시 자동 룰렛 발동. 당첨 결과에 따른 리액션으로 재미 요소 극대화', color: 'from-purple-500/20 to-violet-500/20', border: 'border-purple-500/30' },
];

const STEPS = [
  { num: '01', title: '가입하기', desc: 'Google 계정으로 30초 만에 가입', icon: '🚀' },
  { num: '02', title: '플랫폼 연동', desc: '투네이션, 틱톡, 치지직 등 원클릭 연결', icon: '🔗' },
  { num: '03', title: 'OBS에 추가', desc: '위젯 URL 복사 → 브라우저 소스로 추가', icon: '🖥️' },
  { num: '04', title: '수익 극대화', desc: '경쟁 시스템이 자동으로 후원을 끌어올립니다', icon: '💰' },
];

const PLATFORMS = ['투네이션', '틱톡', '스트림랩스', '치지직', '숲(아프리카)'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            FanClash
          </Link>
          <div className="flex gap-3 items-center">
            <Link href="/login" className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">로그인</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-purple-600 rounded-xl hover:bg-purple-500 transition-all text-sm font-semibold shadow-lg shadow-purple-600/25">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px]" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-pink-600/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-block px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-8">
              스트리머를 위한 인터랙티브 후원 플랫폼
            </div>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-extrabold leading-tight mb-8 tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            팬들의{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              경쟁
            </span>
            이<br />
            당신의{' '}
            <span className="bg-gradient-to-r from-yellow-300 via-orange-400 to-yellow-300 bg-clip-text text-transparent">
              수익
            </span>
            이 됩니다
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            후원 랭킹, 왕좌 쟁탈전, 배틀 시스템, 룰렛까지.<br />
            시청자 참여를 게임으로 만들어 후원을 극대화하세요.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Link href="/signup"
              className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-lg font-bold hover:shadow-2xl hover:shadow-purple-600/30 transition-all hover:-translate-y-0.5">
              무료로 시작하기
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
            <Link href="#features"
              className="px-8 py-4 border border-gray-700 rounded-2xl text-gray-300 hover:border-gray-500 hover:text-white transition-all text-lg">
              기능 살펴보기
            </Link>
          </motion.div>

          {/* Platform badges */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <span className="text-gray-500 text-sm mr-2 self-center">연동 가능:</span>
            {PLATFORMS.map(p => (
              <span key={p} className="px-3 py-1 bg-gray-800/60 border border-gray-700/50 rounded-full text-gray-400 text-xs">
                {p}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-white/5 bg-gray-900/30">
        <div className="max-w-5xl mx-auto py-12 px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '5+', label: '연동 플랫폼' },
            { value: '6종', label: '위젯 타입' },
            { value: '3가지', label: '테마 지원' },
            { value: '무료', label: '기본 요금' },
          ].map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.1} className="text-center">
              <div className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-gray-500 text-sm mt-1">{stat.label}</div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 scroll-mt-20">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              방송을 <span className="text-purple-400">게임</span>으로 만드세요
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              경쟁, 보상, 성취 — 게이미피케이션의 3요소를 방송에 녹여냈습니다
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <AnimatedSection key={f.title} delay={i * 0.08}>
                <div className={`group relative bg-gradient-to-br ${f.color} border ${f.border} rounded-2xl p-6 h-full hover:-translate-y-1 transition-all duration-300 hover:shadow-lg`}>
                  <div className="text-4xl mb-4">{f.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-900/20 border-y border-white/5">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              <span className="text-yellow-400">4단계</span>면 끝
            </h2>
            <p className="text-gray-400 text-lg">복잡한 설정 없이, 5분 안에 시작할 수 있습니다</p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {STEPS.map((step, i) => (
              <AnimatedSection key={step.num} delay={i * 0.1}>
                <div className="flex gap-5 items-start bg-gray-800/30 border border-gray-700/40 rounded-2xl p-6 hover:border-purple-500/30 transition-colors">
                  <div className="flex-shrink-0 w-12 h-12 bg-purple-600/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-2xl">
                    {step.icon}
                  </div>
                  <div>
                    <div className="text-purple-400 text-xs font-bold mb-1">STEP {step.num}</div>
                    <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                    <p className="text-gray-400 text-sm">{step.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison / Pain point */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              기존 도네이션의 <span className="text-red-400">한계</span>를 넘어서
            </h2>
          </AnimatedSection>

          <AnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Before */}
              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-8">
                <div className="text-red-400 font-bold text-sm mb-4 uppercase tracking-wider">Before</div>
                <ul className="space-y-3">
                  {[
                    '후원 알림이 떠도 반응 끝',
                    '시청자 간 경쟁 요소 없음',
                    '한번 후원하면 동기 부여 없음',
                    '후원 데이터 활용 불가',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-400 text-sm">
                      <span className="text-red-400 mt-0.5">✕</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {/* After */}
              <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8">
                <div className="text-green-400 font-bold text-sm mb-4 uppercase tracking-wider">With FanClash</div>
                <ul className="space-y-3">
                  {[
                    '랭킹 경쟁으로 연쇄 후원 유도',
                    '배틀 & 왕좌전으로 팬 vs 팬 구도',
                    '호감도 시스템으로 지속적 동기 부여',
                    '실시간 통계로 방송 전략 수립',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-3 text-gray-300 text-sm">
                      <span className="text-green-400 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-1/3 w-80 h-80 bg-pink-600/8 rounded-full blur-[100px]" />
        </div>
        <AnimatedSection className="relative max-w-3xl mx-auto text-center">
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-3xl p-12 md:p-16">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              지금 바로 시작하세요
            </h2>
            <p className="text-gray-400 text-lg mb-8 max-w-lg mx-auto">
              무료 플랜으로 모든 핵심 기능을 체험할 수 있습니다.<br />
              신용카드 불필요. 30초면 가입 완료.
            </p>
            <Link href="/signup"
              className="group inline-block px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl text-lg font-bold hover:shadow-2xl hover:shadow-purple-600/30 transition-all hover:-translate-y-0.5">
              무료로 시작하기
              <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <span className="text-lg font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">FanClash</span>
            <p className="text-gray-500 text-sm mt-1">스트리머를 위한 인터랙티브 후원 플랫폼</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/login" className="hover:text-gray-300 transition-colors">로그인</Link>
            <Link href="/signup" className="hover:text-gray-300 transition-colors">회원가입</Link>
            <Link href="/dashboard/pricing" className="hover:text-gray-300 transition-colors">요금제</Link>
          </div>
          <p className="text-gray-600 text-xs">&copy; 2026 FanClash. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
