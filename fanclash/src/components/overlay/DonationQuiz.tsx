'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

type QuizState = 'IDLE' | 'ACTIVE' | 'RESULT';

interface QuizAnswer {
  nickname: string;
  amount: number;
  timestamp: number;
}

interface DonationQuizProps {
  widgetId?: string;
  config?: {
    defaultTimeLimit?: number;
    minAmount?: number;
    showAnswersDuringQuiz?: boolean;
  };
}

export default function DonationQuiz({ widgetId, config }: DonationQuizProps) {
  const [state, setState] = useState<QuizState>('IDLE');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState<QuizAnswer[]>([]);
  const [answerCount, setAnswerCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const showAnswersDuringQuiz = config?.showAnswersDuringQuiz ?? false;
  const minAmount = config?.minAmount ?? 0;

  const startQuiz = useCallback((q: string, a: string, timeLimit: number) => {
    setQuestion(q);
    setAnswer(a.trim().toLowerCase());
    setTimeLeft(timeLimit);
    setTotalTime(timeLimit);
    setCorrectAnswers([]);
    setAnswerCount(0);
    setState('ACTIVE');
  }, []);

  const endQuiz = useCallback(() => {
    setState('RESULT');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = undefined;
    }
    // Auto-hide result after 10s
    setTimeout(() => {
      setState('IDLE');
      setQuestion('');
      setAnswer('');
      setCorrectAnswers([]);
      setAnswerCount(0);
    }, 10000);
  }, []);

  const handleDonation = useCallback((nickname: string, amount: number, message?: string) => {
    if (state !== 'ACTIVE') return;
    if (minAmount > 0 && amount < minAmount) return;
    setAnswerCount(prev => prev + 1);
    if (message && message.trim().toLowerCase() === answer) {
      setCorrectAnswers(prev => {
        if (prev.some(a => a.nickname === nickname)) return prev;
        return [...prev, { nickname, amount, timestamp: Date.now() }];
      });
    }
  }, [state, answer, minAmount]);

  // Timer countdown
  useEffect(() => {
    if (state !== 'ACTIVE') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, endQuiz]);

  // Expose for demo/socket
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__donationQuiz = { startQuiz, endQuiz, handleDonation };
    return () => { delete (window as unknown as Record<string, unknown>).__donationQuiz; };
  }, [startQuiz, endQuiz, handleDonation]);

  // Socket.IO
  useEffect(() => {
    if (!widgetId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl);
      socket.on('connect', () => socket.emit('widget:subscribe', widgetId));
      socket.on('quiz:start' as any, (data: { question: string; answer: string; timeLimit: number }) => {
        startQuiz(data.question, data.answer, data.timeLimit);
      });
      socket.on('quiz:end' as any, () => {
        endQuiz();
      });
      socket.on('donation:new', (data: { fan_nickname: string; amount: number; message?: string }) => {
        handleDonation(data.fan_nickname, data.amount, data.message);
      });
    });
    return () => { socket?.disconnect(); };
  }, [widgetId, startQuiz, endQuiz, handleDonation]);

  if (state === 'IDLE') {
    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="text-center p-8 rounded-2xl bg-gray-900/80 border border-gray-700">
          <div className="text-5xl mb-3" style={{ animation: 'quizBounce 2s ease-in-out infinite' }}>&#x2753;</div>
          <p className="text-xl font-bold text-white">팬 퀴즈</p>
          <p className="text-gray-500 text-sm mt-1">퀴즈 대기 중...</p>
        </div>
        <style>{`
          @keyframes quizBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        `}</style>
      </div>
    );
  }

  if (state === 'RESULT') {
    return (
      <div className="relative w-full h-full flex items-center justify-center" style={{ background: 'transparent' }}>
        <div className="text-center p-8 rounded-2xl bg-gray-900/90 border-2 border-yellow-500 shadow-2xl shadow-yellow-500/20 max-w-md w-full mx-4"
          style={{ animation: 'quizResultIn 0.5s ease-out' }}>
          <div className="text-5xl mb-3">&#x1F3C6;</div>
          <p className="text-2xl font-bold text-yellow-400 mb-2">퀴즈 종료!</p>
          <div className="bg-gray-800/60 rounded-lg p-3 mb-4">
            <p className="text-gray-400 text-sm">문제</p>
            <p className="text-white font-bold text-lg">{question}</p>
            <p className="text-green-400 font-bold mt-1">정답: {answer}</p>
          </div>
          {correctAnswers.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-400">정답자 ({correctAnswers.length}명)</p>
              {correctAnswers.map((a, i) => (
                <div key={a.nickname} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
                  <span className="flex items-center gap-2">
                    {i === 0 && <span className="text-yellow-400">&#x1F451;</span>}
                    <span className="text-white font-bold">{a.nickname}</span>
                  </span>
                  <span className="text-gray-400 text-sm">{a.amount.toLocaleString()}원</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">정답자가 없습니다</p>
          )}
          <p className="text-gray-600 text-xs mt-3">총 응답: {answerCount}건</p>
        </div>
        <style>{`
          @keyframes quizResultIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    );
  }

  // ACTIVE state
  const timerPercent = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
  const isUrgent = timeLeft <= 10;

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: 'transparent' }}>
      {/* Timer bar at top */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gray-800">
        <div
          className="h-full transition-all duration-1000 ease-linear"
          style={{
            width: `${timerPercent}%`,
            background: isUrgent ? '#ef4444' : 'linear-gradient(to right, #8b5cf6, #a855f7)',
            animation: isUrgent ? 'timerPulse 0.5s ease-in-out infinite' : undefined,
          }}
        />
      </div>

      {/* Timer display */}
      <div className="absolute top-4 right-4">
        <span className={`text-3xl font-mono font-bold ${isUrgent ? 'text-red-400' : 'text-white'}`}
          style={{ animation: isUrgent ? 'timerPulse 0.5s ease-in-out infinite' : undefined }}>
          {timeLeft}초
        </span>
      </div>

      {/* Answer count */}
      <div className="absolute top-4 left-4">
        <span className="text-sm text-gray-400">응답 {answerCount}건</span>
      </div>

      {/* Question card in center */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="text-center p-8 rounded-2xl bg-gray-900/90 border-2 border-purple-500 shadow-2xl shadow-purple-500/20 max-w-lg w-full"
          style={{ animation: 'quizCardIn 0.5s ease-out' }}>
          <div className="text-4xl mb-3">&#x2753;</div>
          <p className="text-2xl font-bold text-white leading-relaxed">{question}</p>
          <p className="text-purple-400 text-sm mt-3">도네이션 메시지로 정답을 입력하세요!</p>
          {minAmount > 0 && (
            <p className="text-gray-500 text-xs mt-1">최소 {minAmount.toLocaleString()}원 이상</p>
          )}
        </div>
      </div>

      {/* Correct answers list on side */}
      {correctAnswers.length > 0 && (showAnswersDuringQuiz || state === 'RESULT') && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2 max-h-[40%] overflow-y-auto">
          <p className="text-xs text-green-400 font-bold">정답자</p>
          {correctAnswers.map((a, i) => (
            <div key={a.nickname} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-900/40 border border-green-500/30 text-sm"
              style={{ animation: `slideIn 0.3s ease-out ${i * 0.1}s both` }}>
              {i === 0 && <span>&#x1F451;</span>}
              <span className="text-white font-medium">{a.nickname}</span>
            </div>
          ))}
        </div>
      )}

      {/* First correct answerer badge */}
      {correctAnswers.length > 0 && !showAnswersDuringQuiz && (
        <div className="absolute bottom-4 left-4">
          <div className="px-4 py-2 rounded-lg bg-green-900/40 border border-green-500/30">
            <span className="text-green-400 text-sm">&#x2705; 정답자 {correctAnswers.length}명</span>
          </div>
        </div>
      )}

      <style>{`
        @keyframes timerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes quizCardIn { 0% { opacity: 0; transform: translateY(30px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes slideIn { 0% { opacity: 0; transform: translateX(20px); } 100% { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
