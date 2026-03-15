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
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">토너먼트 모드</label>
          <p className="text-xs text-gray-600">여러 참가자의 토너먼트 대진표</p>
        </div>
        <button onClick={() => onChange({ ...config, tournamentMode: !(config.tournamentMode ?? false) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.tournamentMode ?? false) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="토너먼트 모드 토글" aria-pressed={(config.tournamentMode ?? false) as boolean}>
          {(config.tournamentMode ?? false) ? 'ON' : 'OFF'}
        </button>
      </div>
      {(config.tournamentMode as boolean) && (
        <div>
          <label className="block text-sm text-gray-400 mb-1">대진표 크기</label>
          <select
            value={(config.bracketSize as number) || 4}
            onChange={e => onChange({ ...config, bracketSize: parseInt(e.target.value) })}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
            <option value={4}>4강</option>
            <option value={8}>8강</option>
          </select>
        </div>
      )}
    </>
  );
}
