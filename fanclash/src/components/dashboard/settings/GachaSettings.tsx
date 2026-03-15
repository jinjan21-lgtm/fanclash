'use client';
export default function GachaSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">뽑기 히스토리 표시</label>
          <p className="text-xs text-gray-600">최근 뽑기 결과를 화면에 표시</p>
        </div>
        <button onClick={() => onChange({ ...config, showHistory: !(config.showHistory ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showHistory ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="히스토리 표시 토글" aria-pressed={(config.showHistory ?? true) as boolean}>
          {(config.showHistory ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최대 히스토리 수</label>
        <select value={(config.maxHistory as number) || 10}
          onChange={e => onChange({ ...config, maxHistory: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={5}>5개</option><option value={10}>10개</option><option value={20}>20개</option>
        </select>
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
