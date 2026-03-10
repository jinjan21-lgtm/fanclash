import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-400">FanClash</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white">로그인</Link>
          <Link href="/signup" className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">시작하기</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto text-center pt-24 px-6">
        <h2 className="text-5xl font-bold mb-6">
          팬들의 <span className="text-purple-400">경쟁</span>이<br/>
          당신의 <span className="text-yellow-400">수익</span>이 됩니다
        </h2>
        <p className="text-xl text-gray-400 mb-12">
          후원 랭킹, 왕좌 쟁탈전, 배틀 시스템으로<br/>
          시청자 참여와 후원을 극대화하세요
        </p>
        <Link href="/signup"
          className="inline-block px-8 py-4 bg-purple-600 rounded-xl text-xl font-bold hover:bg-purple-700 transition">
          무료로 시작하기
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">👑</div>
            <h3 className="font-bold text-lg mb-2">왕좌 쟁탈전</h3>
            <p className="text-gray-400 text-sm">1등이 바뀔 때마다 풀스크린 알림. 경쟁심 폭발!</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="font-bold text-lg mb-2">후원 배틀</h3>
            <p className="text-gray-400 text-sm">베네핏을 걸고 시청자끼리 후원 대결. 3중 수익화!</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">💕</div>
            <h3 className="font-bold text-lg mb-2">호감도 시스템</h3>
            <p className="text-gray-400 text-sm">후원할수록 칭호가 올라가는 팬 등급 시스템</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-bold text-lg mb-2">실시간 랭킹</h3>
            <p className="text-gray-400 text-sm">TOP 5 후원 랭킹 보드. 순위 변동 애니메이션</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">🎯</div>
            <h3 className="font-bold text-lg mb-2">도네 목표</h3>
            <p className="text-gray-400 text-sm">단계별 목표 게이지. 달성 시 미션 수행!</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold text-lg mb-2">테마 3종</h3>
            <p className="text-gray-400 text-sm">모던, 게임, 여캠 감성. 내 방송에 맞게!</p>
          </div>
        </div>
        <div className="mt-24 mb-16">
          <p className="text-gray-500 text-sm">FanClash - 스트리머를 위한 인터랙티브 도구</p>
        </div>
      </main>
    </div>
  );
}
