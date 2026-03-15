'use client';
import { useState, useRef, useCallback, useEffect } from 'react';
import { getSocket } from '@/lib/socket/client';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import type { WidgetType } from '@/types';

const RANDOM_NICKNAMES = ['별빛팬', '후원왕', '새벽감성', '치킨러버', '고래밥', '불꽃소녀', '달빛기사', '테스트유저'];
const AMOUNT_PRESETS = [1000, 5000, 10000, 50000];

const WIDGET_TABS: { type: WidgetType; label: string }[] = [
  { type: 'alert', label: '알림' },
  { type: 'ranking', label: '랭킹' },
  { type: 'battle', label: '배틀' },
  { type: 'slots', label: '슬롯' },
  { type: 'gacha', label: '가챠' },
  { type: 'rpg', label: 'RPG' },
  { type: 'train', label: '트레인' },
  { type: 'meter', label: '미터' },
  { type: 'physics', label: '폭격' },
  { type: 'weather', label: '날씨' },
];

function getRandomAmount(): number {
  const r = Math.random();
  if (r < 0.6) return 1000 + Math.floor(Math.random() * 4) * 1000; // 1000~4000
  if (r < 0.85) return 5000 + Math.floor(Math.random() * 5) * 1000; // 5000~9000
  return 10000 + Math.floor(Math.random() * 4) * 10000; // 10000~40000
}

function getRandomNickname(): string {
  return RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)];
}

export default function TestPage() {
  const { toast } = useToast();
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [nickname, setNickname] = useState('테스트팬');
  const [amount, setAmount] = useState('5000');
  const [message, setMessage] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<WidgetType>('alert');
  const [history, setHistory] = useState<{ nickname: string; amount: number; message: string; time: string }[]>([]);

  // Auto-test state
  const [autoInterval, setAutoInterval] = useState(3);
  const [autoCount, setAutoCount] = useState(5);
  const [autoRunning, setAutoRunning] = useState(false);
  const [autoSent, setAutoSent] = useState(0);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setStreamerId(user.id);
    })();
    return () => {
      if (autoRef.current) clearInterval(autoRef.current);
    };
  }, []);

  const sendDonation = useCallback((nick: string, amt: number, msg: string) => {
    if (!streamerId) return;
    const socket = getSocket();
    socket.emit('donation:add', {
      streamer_id: streamerId,
      fan_nickname: nick,
      amount: amt,
      message: msg || undefined,
    });
    setHistory(prev => [{
      nickname: nick,
      amount: amt,
      message: msg,
      time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }, ...prev].slice(0, 30));
  }, [streamerId]);

  const handleSend = () => {
    const amt = parseInt(amount);
    if (!nickname || !amt) return;
    sendDonation(nickname, amt, message);
    toast(`${nickname}님 ${amt.toLocaleString()}원 테스트 후원`);
  };

  const startAutoTest = () => {
    if (autoRunning) {
      if (autoRef.current) clearInterval(autoRef.current);
      autoRef.current = null;
      setAutoRunning(false);
      setAutoSent(0);
      return;
    }

    setAutoRunning(true);
    setAutoSent(0);
    let count = 0;

    const run = () => {
      const nick = getRandomNickname();
      const amt = getRandomAmount();
      const msgs = ['테스트입니다', '파이팅!', '화이팅~', '', '', '재밌다ㅋㅋ', ''];
      const msg = msgs[Math.floor(Math.random() * msgs.length)];
      sendDonation(nick, amt, msg);
      count++;
      setAutoSent(count);

      if (autoCount !== 0 && count >= autoCount) {
        if (autoRef.current) clearInterval(autoRef.current);
        autoRef.current = null;
        setAutoRunning(false);
      }
    };

    run(); // first one immediately
    autoRef.current = setInterval(run, autoInterval * 1000);
  };

  const demoUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/overlay/demo/${selectedWidget}`
    : '';

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">테스트 도네이션</h2>
      <p className="text-gray-400 text-sm mb-6">실제 플랫폼 연동 없이 위젯을 테스트할 수 있습니다</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Controls */}
        <div className="space-y-6">
          {/* Manual donation form */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
            <h3 className="font-bold">수동 테스트</h3>
            <div>
              <label className="block text-sm text-gray-400 mb-1">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="테스트팬"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">금액</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="5000"
                min={100}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
              <div className="flex flex-wrap gap-2 mt-2">
                {AMOUNT_PRESETS.map(v => (
                  <button key={v} type="button" onClick={() => setAmount(String(v))}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      amount === String(v) ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}>
                    {v.toLocaleString()}원
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">메시지 (선택)</label>
              <input
                type="text"
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="테스트 메시지"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSend}
              className="w-full py-3 bg-purple-600 rounded-lg font-bold text-sm hover:bg-purple-700 transition-colors"
            >
              테스트 후원 보내기
            </button>
          </div>

          {/* Auto-test */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
            <h3 className="font-bold">연속 테스트</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">간격</label>
                <div className="flex gap-1">
                  {[1, 3, 5].map(s => (
                    <button key={s} onClick={() => setAutoInterval(s)}
                      className={`flex-1 py-1.5 rounded-lg text-xs ${
                        autoInterval === s ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                      }`}>
                      {s}초
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">횟수</label>
                <div className="flex gap-1">
                  {[5, 10, 0].map(c => (
                    <button key={c} onClick={() => setAutoCount(c)}
                      className={`flex-1 py-1.5 rounded-lg text-xs ${
                        autoCount === c ? 'bg-purple-600' : 'bg-gray-800 hover:bg-gray-700'
                      }`}>
                      {c === 0 ? '무한' : c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              onClick={startAutoTest}
              className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${
                autoRunning
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-800 border border-purple-600 text-purple-400 hover:bg-purple-900/30'
              }`}
            >
              {autoRunning
                ? `중지 (${autoSent}${autoCount > 0 ? `/${autoCount}` : ''} 전송됨)`
                : '자동 테스트 시작'}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">전송 기록</h3>
                <button onClick={() => setHistory([])} className="text-xs text-gray-500 hover:text-gray-300">초기화</button>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-800/50 last:border-0">
                    <div className="flex gap-2">
                      <span className="text-gray-400">{h.nickname}</span>
                      <span className="text-purple-400 font-medium">{h.amount.toLocaleString()}원</span>
                      {h.message && <span className="text-gray-600 truncate max-w-[100px]">{h.message}</span>}
                    </div>
                    <span className="text-gray-600">{h.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Widget Preview */}
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="flex overflow-x-auto border-b border-gray-800">
              {WIDGET_TABS.map(tab => (
                <button key={tab.type} onClick={() => setSelectedWidget(tab.type)}
                  className={`px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedWidget === tab.type
                      ? 'text-purple-400 border-b-2 border-purple-500 bg-gray-800/50'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative bg-gray-950" style={{ height: '500px' }}>
              <iframe
                key={selectedWidget}
                src={demoUrl}
                className="w-full h-full border-0"
                title={`${selectedWidget} widget preview`}
                allow="autoplay"
              />
            </div>
          </div>
          <p className="text-xs text-gray-600 text-center">
            위젯 데모 미리보기 (자동 시뮬레이션 포함)
          </p>
        </div>
      </div>
    </div>
  );
}
