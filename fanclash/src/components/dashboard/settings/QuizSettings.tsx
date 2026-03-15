'use client';
export default function QuizSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 제한 시간</label>
        <select value={(config.defaultTimeLimit as number) || 60}
          onChange={e => onChange({ ...config, defaultTimeLimit: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={30}>30초</option>
          <option value={60}>60초</option>
          <option value={120}>120초</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 후원 금액</label>
        <div className="flex items-center gap-2">
          <input type="number" value={(config.minAmount as number) || 0}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000} min={0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none" />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">0이면 금액 제한 없음</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">퀴즈 중 정답자 표시</label>
          <p className="text-xs text-gray-600">OFF면 퀴즈 종료 후에만 정답자 표시</p>
        </div>
        <button onClick={() => onChange({ ...config, showAnswersDuringQuiz: !(config.showAnswersDuringQuiz ?? false) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showAnswersDuringQuiz ?? false) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="정답자 표시 토글" aria-pressed={(config.showAnswersDuringQuiz ?? false) as boolean}>
          {(config.showAnswersDuringQuiz ?? false) ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}
