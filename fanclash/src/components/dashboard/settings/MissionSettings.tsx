'use client';
export default function MissionSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 시간 제한</label>
        <select value={(config.defaultTimeLimit as string) || ''}
          onChange={e => onChange({ ...config, defaultTimeLimit: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="">없음</option>
          <option value="30">30분</option>
          <option value="60">1시간</option>
          <option value="120">2시간</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">보상 텍스트 표시</label>
          <p className="text-xs text-gray-600">오버레이에 보상 내용 표시</p>
        </div>
        <button onClick={() => onChange({ ...config, showReward: !(config.showReward ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showReward ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="보상 텍스트 표시 토글" aria-pressed={(config.showReward ?? true) as boolean}>
          {(config.showReward ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최대 표시 미션 수</label>
        <select value={(config.maxVisible as number) || 3}
          onChange={e => onChange({ ...config, maxVisible: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={1}>1개</option>
          <option value={2}>2개</option>
          <option value={3}>3개</option>
        </select>
      </div>
    </>
  );
}
