'use client';
export default function TerritorySettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">격자 크기</label>
        <select value={(config.gridSize as string) || '20x12'}
          onChange={e => onChange({ ...config, gridSize: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="10x6">10x6 (소형)</option>
          <option value="20x12">20x12 (중형)</option>
          <option value="30x18">30x18 (대형)</option>
        </select>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">리더보드 표시</label>
          <p className="text-xs text-gray-600">영토 점령 순위 표시</p>
        </div>
        <button onClick={() => onChange({ ...config, showLeaderboard: !(config.showLeaderboard ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showLeaderboard ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="리더보드 표시 토글" aria-pressed={(config.showLeaderboard ?? true) as boolean}>
          {(config.showLeaderboard ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 후원 금액</label>
        <div className="flex items-center gap-2">
          <input type="number" value={(config.minAmount as number) || 1000}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000} min={0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none" />
          <span className="text-gray-400 text-sm">원</span>
        </div>
      </div>
    </>
  );
}
