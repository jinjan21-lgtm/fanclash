'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSocket } from '@/lib/socket/client';
import { useToast } from '@/components/ui/Toast';
import type { Widget } from '@/types';

export default function CommandPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [streamerId, setStreamerId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [loading, setLoading] = useState(true);

  // Quiz quick form
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizAnswer, setQuizAnswer] = useState('');
  const [quizTime, setQuizTime] = useState('60');
  const [quizActive, setQuizActive] = useState(false);

  // Test donation form
  const [testNickname, setTestNickname] = useState('');
  const [testAmount, setTestAmount] = useState('5000');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setStreamerId(user.id);
      const socket = getSocket();
      socket.emit('streamer:subscribe' as any, user.id);

      const { data } = await supabase.from('widgets').select('*').eq('streamer_id', user.id).eq('enabled', true);
      setWidgets(data || []);
      setLoading(false);
    };
    init();
  }, []);

  const emit = (event: string, data?: any) => {
    if (!streamerId) return;
    const socket = getSocket();
    socket.emit(event as any, data || {});
  };

  const sendTestDonation = () => {
    if (!streamerId || !testNickname.trim()) {
      toast('닉네임을 입력해주세요');
      return;
    }
    emit('donation:add', {
      streamer_id: streamerId,
      fan_nickname: testNickname.trim(),
      amount: parseInt(testAmount) || 5000,
      message: testMessage.trim() || undefined,
    });
    toast(`테스트 도네이션: ${testNickname} ${parseInt(testAmount).toLocaleString()}원`);
  };

  const startQuiz = () => {
    if (!streamerId || !quizQuestion.trim() || !quizAnswer.trim()) {
      toast('문제와 정답을 입력해주세요');
      return;
    }
    emit('quiz:start', {
      streamer_id: streamerId,
      question: quizQuestion.trim(),
      answer: quizAnswer.trim(),
      timeLimit: parseInt(quizTime) || 60,
    });
    setQuizActive(true);
    toast('퀴즈 시작!');
  };

  const endQuiz = () => {
    if (!streamerId) return;
    emit('quiz:end', { streamer_id: streamerId });
    setQuizActive(false);
    setQuizQuestion('');
    setQuizAnswer('');
    toast('퀴즈 종료');
  };

  const startBattle = () => {
    if (!streamerId) return;
    emit('battle:create', {
      streamer_id: streamerId,
      benefit: '배틀 보상',
      min_amount: 1000,
      time_limit: 180,
    });
    toast('배틀 개설!');
  };

  const endBattle = () => {
    toast('진행 중인 배틀이 없거나, 배틀 관리에서 종료해주세요');
  };

  const spinRoulette = () => {
    emit('roulette:spin', { streamer_id: streamerId });
    toast('룰렛 스핀!');
  };

  const toggleTimer = () => {
    emit('timer:toggle', { streamer_id: streamerId });
    toast('타이머 토글!');
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 w-48 bg-gray-800 rounded-lg mb-6" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-900 rounded-xl h-16" />
          ))}
        </div>
      </div>
    );
  }

  const activeWidgetTypes = widgets.map(w => w.type);

  // PWA install banner
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: browser)').matches) {
      setShowInstallBanner(true);
    }
  }, []);

  return (
    <div className="max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6">커맨드 패널</h2>

      {showInstallBanner && (
        <div className="bg-purple-900/30 border border-purple-700/50 rounded-xl p-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-purple-300">홈 화면에 추가하면 앱처럼 사용할 수 있습니다</p>
          <button onClick={() => setShowInstallBanner(false)} className="text-gray-500 text-sm">닫기</button>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <CommandButton label="배틀 시작" icon="&#x2694;&#xFE0F;" color="bg-red-600 hover:bg-red-700" onClick={startBattle}
          disabled={!activeWidgetTypes.includes('battle')} />
        <CommandButton label="배틀 종료" icon="&#x1F6D1;" color="bg-gray-700 hover:bg-gray-600" onClick={endBattle}
          disabled={!activeWidgetTypes.includes('battle')} />
        <CommandButton label="룰렛 돌리기" icon="&#x1F3B0;" color="bg-purple-600 hover:bg-purple-700" onClick={spinRoulette}
          disabled={!activeWidgetTypes.includes('roulette')} />
        <CommandButton label="타이머 토글" icon="&#x23F1;&#xFE0F;" color="bg-blue-600 hover:bg-blue-700" onClick={toggleTimer}
          disabled={!activeWidgetTypes.includes('timer')} />
        {!quizActive ? (
          <CommandButton label="퀴즈 출제" icon="&#x2753;" color="bg-green-600 hover:bg-green-700"
            onClick={() => document.getElementById('quiz-section')?.scrollIntoView({ behavior: 'smooth' })}
            disabled={!activeWidgetTypes.includes('quiz')} />
        ) : (
          <CommandButton label="퀴즈 종료" icon="&#x274C;" color="bg-red-600 hover:bg-red-700" onClick={endQuiz} />
        )}
        <CommandButton label="테스트 도네" icon="&#x1F4B0;" color="bg-yellow-600 hover:bg-yellow-700"
          onClick={() => document.getElementById('test-donation-section')?.scrollIntoView({ behavior: 'smooth' })} />
      </div>

      {/* Quiz quick form */}
      {activeWidgetTypes.includes('quiz') && (
        <div id="quiz-section" className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
          <h3 className="font-bold mb-3">&#x2753; 퀴즈 출제</h3>
          {quizActive ? (
            <div className="space-y-3">
              <div className="bg-green-900/30 border border-green-500/30 rounded-lg p-3">
                <p className="text-green-400 text-sm font-bold">퀴즈 진행 중</p>
                <p className="text-white text-sm mt-1">{quizQuestion}</p>
              </div>
              <button onClick={endQuiz}
                className="w-full py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700 text-lg">
                퀴즈 종료
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input type="text" placeholder="문제" value={quizQuestion}
                onChange={e => setQuizQuestion(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white text-sm" />
              <input type="text" placeholder="정답" value={quizAnswer}
                onChange={e => setQuizAnswer(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white text-sm" />
              <select value={quizTime} onChange={e => setQuizTime(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-800 text-white text-sm">
                <option value="30">30초</option>
                <option value="60">1분</option>
                <option value="120">2분</option>
              </select>
              <button onClick={startQuiz} disabled={!quizQuestion.trim() || !quizAnswer.trim()}
                className="w-full py-3 bg-green-600 rounded-lg font-bold hover:bg-green-700 text-lg disabled:opacity-50">
                퀴즈 시작
              </button>
            </div>
          )}
        </div>
      )}

      {/* Test donation form */}
      <div id="test-donation-section" className="bg-gray-900 rounded-xl p-4 border border-gray-800 mb-4">
        <h3 className="font-bold mb-3">&#x1F9EA; 테스트 도네이션</h3>
        <div className="space-y-3">
          <input type="text" placeholder="닉네임" value={testNickname}
            onChange={e => setTestNickname(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white text-sm" />
          <div className="flex gap-2">
            <input type="number" placeholder="금액" value={testAmount}
              onChange={e => setTestAmount(e.target.value)} step={1000} min={1000}
              className="flex-1 p-3 rounded-lg bg-gray-800 text-white text-sm" />
            <span className="self-center text-gray-400 text-sm">원</span>
          </div>
          <input type="text" placeholder="메시지 (선택)" value={testMessage}
            onChange={e => setTestMessage(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white text-sm" />
          <button onClick={sendTestDonation} disabled={!testNickname.trim()}
            className="w-full py-3 bg-yellow-600 rounded-lg font-bold hover:bg-yellow-700 text-lg disabled:opacity-50">
            보내기
          </button>
        </div>
      </div>

      {/* Active widgets status */}
      <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
        <h3 className="font-bold mb-3">&#x1F4E1; 활성 위젯</h3>
        {widgets.length === 0 ? (
          <p className="text-gray-500 text-sm">활성화된 위젯이 없습니다</p>
        ) : (
          <div className="space-y-2">
            {widgets.map(w => (
              <div key={w.id} className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg">
                <span className="text-sm text-white">{(w.config as any)?.title || w.type}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-600">ON</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CommandButton({ label, icon, color, onClick, disabled }: {
  label: string;
  icon: string;
  color: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${color} rounded-xl p-4 text-center font-bold transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed`}
    >
      <span className="text-2xl block mb-1" dangerouslySetInnerHTML={{ __html: icon }} />
      <span className="text-sm">{label}</span>
    </button>
  );
}
