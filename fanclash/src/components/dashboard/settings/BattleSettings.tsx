export default function BattleSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 최소 참가 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.defaultMinAmount as number) || 5000}
            onChange={e => onChange({ ...config, defaultMinAmount: parseInt(e.target.value) })}
            step={1000}
            min={1000}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 제한 시간</label>
        <select
          value={(config.defaultTimeLimit as number) || 180}
          onChange={e => onChange({ ...config, defaultTimeLimit: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={60}>1분</option>
          <option value={120}>2분</option>
          <option value={180}>3분</option>
          <option value={300}>5분</option>
          <option value={600}>10분</option>
        </select>
      </div>
    </>
  );
}
