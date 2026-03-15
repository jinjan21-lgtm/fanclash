'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';

const WIDGETS = [
  {
    id: 'alert',
    label: '알림',
    description: '후원이 들어오면 화려한 애니메이션과 함께 알림이 표시됩니다. 닉네임, 금액, 메시지가 방송 화면에 나타나 시청자 참여를 유도합니다.',
    triggerMethod: 'postMessage',
  },
  {
    id: 'ranking',
    label: '랭킹',
    description: '실시간 후원 랭킹 보드입니다. 누적 후원 금액 기준으로 순위가 매겨지며, 시청자들의 경쟁심을 자극합니다.',
    triggerMethod: 'postMessage',
  },
  {
    id: 'battle',
    label: '배틀',
    description: '시청자들이 후원으로 1:1 배틀에 참여합니다. 가장 많이 후원한 시청자가 승리하며, 스트리머가 정한 혜택을 받습니다.',
    triggerMethod: 'postMessage',
  },
  {
    id: 'slots',
    label: '슬롯',
    description: '후원하면 슬롯머신이 돌아갑니다! 세 칸이 맞으면 잭팟! 금액이 클수록 당첨 확률이 올라갑니다.',
    triggerMethod: 'donationSlots',
  },
  {
    id: 'gacha',
    label: '가챠',
    description: '후원 금액에 따라 등급이 달라지는 가챠 시스템입니다. SSR 등급을 뽑으면 특별한 이펙트가 터집니다!',
    triggerMethod: 'donationGacha',
  },
  {
    id: 'train',
    label: '기차',
    description: '연속 후원이 들어오면 기차가 길어집니다! 콤보가 이어질수록 기차가 화면을 가득 채웁니다.',
    triggerMethod: 'donationTrain',
  },
  {
    id: 'music',
    label: '뮤직',
    description: '후원 금액에 따라 다른 음계가 연주됩니다. 시청자들이 함께 만드는 즉흥 음악! 비주얼 이펙트도 함께 표시됩니다.',
    triggerMethod: 'donationMusic',
  },
  {
    id: 'rpg',
    label: 'RPG',
    description: '후원이 경험치로 변환됩니다! 레벨업하면 화려한 이펙트가 터지고, 스트리머 캐릭터가 성장합니다.',
    triggerMethod: 'donationRPG',
  },
] as const;

type WidgetId = typeof WIDGETS[number]['id'];

// Map widget IDs to their window trigger methods
const TRIGGER_MAP: Record<string, { objName: string; methodName: string }> = {
  donationSlots: { objName: '__donationSlots', methodName: 'triggerSpin' },
  donationGacha: { objName: '__donationGacha', methodName: 'triggerGacha' },
  donationTrain: { objName: '__donationTrain', methodName: 'triggerDonation' },
  donationMusic: { objName: '__donationMusic', methodName: 'playDonation' },
  donationRPG: { objName: '__donationRPG', methodName: 'processXPGain' },
};

export default function DemoPage() {
  const [selectedWidget, setSelectedWidget] = useState<WidgetId>('alert');
  const [nickname, setNickname] = useState('테스트팬');
  const [amount, setAmount] = useState('5000');
  const [isSending, setIsSending] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentWidget = WIDGETS.find((w) => w.id === selectedWidget)!;

  const handleDonate = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;
    setIsSending(true);

    const numAmount = parseInt(amount, 10) || 1000;
    const name = nickname.trim() || '익명';
    const iframeWindow = iframeRef.current.contentWindow;

    if (currentWidget.triggerMethod === 'postMessage') {
      // For widgets that listen to postMessage (alert, ranking, battle)
      iframeWindow.postMessage(
        {
          type: 'demo:donation',
          data: { fan_nickname: name, amount: numAmount, message: `${name}님의 테스트 후원입니다!` },
        },
        '*'
      );
    } else {
      // For widgets with window-level trigger methods
      const trigger = TRIGGER_MAP[currentWidget.triggerMethod];
      if (trigger) {
        try {
          const win = iframeWindow as unknown as Record<string, Record<string, (a: number, n: string) => void>>;
          const obj = win[trigger.objName];
          if (obj && typeof obj[trigger.methodName] === 'function') {
            obj[trigger.methodName](numAmount, name);
          }
        } catch {
          // Cross-origin — fall back to postMessage
          iframeWindow.postMessage(
            {
              type: 'demo:donation',
              data: { fan_nickname: name, amount: numAmount, message: `${name}님의 테스트 후원입니다!` },
            },
            '*'
          );
        }
      }
    }

    setTimeout(() => setIsSending(false), 800);
  }, [amount, nickname, currentWidget]);

  const presetAmounts = [1000, 3000, 5000, 10000, 50000];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Hero */}
      <section className="px-6 pt-20 pb-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          홈으로
        </Link>
        <h1 className="text-3xl sm:text-5xl font-bold mb-4">
          FanClash <span className="text-purple-400">체험하기</span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          회원가입 없이 위젯을 직접 체험해보세요.
          <br className="hidden sm:block" />
          테스트 후원을 보내 실시간 반응을 확인하세요!
        </p>
      </section>

      {/* Widget Tabs */}
      <section className="px-4 sm:px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {WIDGETS.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWidget(w.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedWidget === w.id
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25'
                    : 'bg-gray-800/60 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Area */}
      <section className="px-4 sm:px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Widget Preview */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800/50 bg-gray-900/80">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-xs text-gray-600 font-mono">
                    /overlay/demo/{selectedWidget}
                  </span>
                </div>
                <div className="relative bg-gray-950" style={{ minHeight: '400px' }}>
                  <iframe
                    ref={iframeRef}
                    key={selectedWidget}
                    src={`/overlay/demo/${selectedWidget}`}
                    className="w-full border-0"
                    style={{ height: '400px' }}
                    title={`${currentWidget.label} 위젯 미리보기`}
                  />
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/50 p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold mb-1">테스트 후원</h3>
                  <p className="text-xs text-gray-500">후원을 보내 위젯 반응을 확인하세요</p>
                </div>

                {/* Nickname */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="닉네임 입력"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">금액</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="후원 금액"
                    min={100}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all placeholder:text-gray-600"
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {presetAmounts.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmount(String(a))}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          amount === String(a)
                            ? 'bg-purple-500/30 text-purple-300 border border-purple-500/40'
                            : 'bg-gray-800 text-gray-500 border border-gray-700 hover:text-gray-300'
                        }`}
                      >
                        {a.toLocaleString()}원
                      </button>
                    ))}
                  </div>
                </div>

                {/* Send Button */}
                <button
                  onClick={handleDonate}
                  disabled={isSending}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                    isSending
                      ? 'bg-purple-500/50 text-purple-200 cursor-not-allowed'
                      : 'bg-purple-500 text-white hover:bg-purple-400 active:scale-[0.98] shadow-lg shadow-purple-500/25'
                  }`}
                >
                  {isSending ? '전송 중...' : '후원하기'}
                </button>

                {/* Widget Description */}
                <div className="pt-4 border-t border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-300 mb-2">{currentWidget.label} 위젯</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {currentWidget.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center border-t border-gray-800/50">
        <h2 className="text-2xl sm:text-3xl font-bold mb-4">
          마음에 드셨나요?
        </h2>
        <p className="text-gray-400 mb-8">
          지금 바로 무료로 시작하세요. 회원가입 후 내 방송에 바로 적용할 수 있습니다.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors shadow-lg shadow-purple-500/25"
        >
          회원가입
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-gray-800/50 text-center">
        <p className="text-gray-600 text-xs">
          &copy; 2025 FanClash by 진크루. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
