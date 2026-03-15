export default function MessagesSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최대 표시 카드 수</label>
        <select
          value={(config.maxVisible as number) || 30}
          onChange={e => onChange({ ...config, maxVisible: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={20}>20개</option>
          <option value={30}>30개</option>
          <option value={50}>50개</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">화면에 표시할 최대 응원 카드 수</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">금액 표시</label>
          <p className="text-xs text-gray-600">각 카드에 후원 금액을 표시합니다</p>
        </div>
        <button
          onClick={() => onChange({ ...config, showAmount: !(config.showAmount ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showAmount ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}
          aria-label="금액 표시 토글"
          aria-pressed={(config.showAmount ?? true) as boolean}>
          {(config.showAmount ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}
