'use client';
export default function MeterSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">판정 기간</label>
        <select value={(config.windowMinutes as number) || 5}
          onChange={e => onChange({ ...config, windowMinutes: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={3}>3분</option>
          <option value={5}>5분</option>
          <option value={10}>10분</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">이 시간 동안의 후원 총액으로 온도를 측정합니다</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">MAX 기준 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.maxAmount as number) || 50000}
            onChange={e => onChange({ ...config, maxAmount: parseInt(e.target.value) })}
            step={5000}
            min={10000}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">이 금액의 80% 이상이면 MAX 단계가 됩니다</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">파티클 효과</label>
          <p className="text-xs text-gray-600">MAX 단계에서 불꽃 파티클 표시</p>
        </div>
        <button onClick={() => onChange({ ...config, showParticles: !(config.showParticles ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showParticles ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="파티클 효과 토글" aria-pressed={(config.showParticles ?? true) as boolean}>
          {(config.showParticles ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}
