'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSocket } from '@/lib/socket/client';
import { useToast } from '@/components/ui/Toast';
import type { Widget } from '@/types';

interface QuizControlProps {
  widget: Widget;
  onUpdate: () => void;
}

export default function QuizControl({ widget, onUpdate }: QuizControlProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const config = (widget.config || {}) as Record<string, unknown>;

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [timeLimit, setTimeLimit] = useState(String((config.defaultTimeLimit as number) ?? 60));
  const [quizActive, setQuizActive] = useState(false);

  const saveConfig = async () => {
    const newConfig = {
      ...config,
      defaultTimeLimit: parseInt(timeLimit) || 60,
    };
    await supabase.from('widgets').update({ config: newConfig }).eq('id', widget.id);
    onUpdate();
    toast('설정이 저장되었습니다');
  };

  useEffect(() => {
    const socket = getSocket();
    socket.emit('streamer:subscribe' as any, widget.streamer_id);
  }, [widget.streamer_id]);

  const startQuiz = () => {
    if (!question.trim() || !answer.trim()) {
      toast('문제와 정답을 입력해주세요');
      return;
    }
    const socket = getSocket();
    socket.emit('quiz:start' as any, {
      streamer_id: widget.streamer_id,
      question: question.trim(),
      answer: answer.trim(),
      timeLimit: parseInt(timeLimit) || 60,
    });
    setQuizActive(true);
    toast('퀴즈가 시작되었습니다!');
  };

  const endQuiz = () => {
    const socket = getSocket();
    socket.emit('quiz:end' as any, {
      streamer_id: widget.streamer_id,
    });
    setQuizActive(false);
    setQuestion('');
    setAnswer('');
    toast('퀴즈가 종료되었습니다');
  };

  return (
    <div className="space-y-5">
      {/* Settings */}
      <div className={`space-y-3 ${quizActive ? 'opacity-60' : ''}`}>
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">퀴즈 설정</h4>
        <div>
          <label className="block text-sm text-gray-400 mb-1">문제</label>
          <input type="text" placeholder="예: 오늘 먹은 저녁 메뉴는?"
            value={question} onChange={e => setQuestion(e.target.value)}
            disabled={quizActive}
            className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50" />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">정답</label>
          <input type="text" placeholder="예: 치킨"
            value={answer} onChange={e => setAnswer(e.target.value)}
            disabled={quizActive}
            className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50" />
          <p className="text-xs text-gray-600 mt-1">대소문자/공백 무시, 정확히 일치해야 정답</p>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">제한 시간</label>
          <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} disabled={quizActive}
            className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50">
            <option value="30">30초</option>
            <option value="60">1분</option>
            <option value="120">2분</option>
          </select>
        </div>
        {!quizActive && (
          <button onClick={saveConfig} className="w-full py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 text-gray-300">
            설정 저장
          </button>
        )}
      </div>

      <div className="border-t border-gray-700" />

      {/* Quiz Status */}
      {quizActive ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
              &#x2753; 퀴즈 진행 중
            </h4>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-600">LIVE</span>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">문제: <span className="text-white font-bold">{question}</span></p>
            <p className="text-gray-400 text-sm mt-1">정답: <span className="text-green-400 font-bold">{answer}</span></p>
            <p className="text-gray-400 text-sm mt-1">시간: {timeLimit}초</p>
          </div>
          <button onClick={endQuiz}
            className="w-full py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700">
            퀴즈 종료
          </button>
        </div>
      ) : (
        <div>
          <button onClick={startQuiz} disabled={!question.trim() || !answer.trim()}
            className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
            &#x2753; 퀴즈 시작
          </button>
          <p className="text-gray-500 text-xs mt-2 text-center">시청자가 도네이션 메시지로 정답을 맞힙니다.</p>
        </div>
      )}
    </div>
  );
}
