export default function RankingSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">표시 인원 수</label>
        <select
          value={(config.maxDisplay as number) || 5}
          onChange={e => onChange({ ...config, maxDisplay: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={3}>TOP 3</option>
          <option value={5}>TOP 5</option>
          <option value={10}>TOP 10</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">집계 기간</label>
        <select
          value={(config.period as string) || 'daily'}
          onChange={e => onChange({ ...config, period: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="daily">오늘</option>
          <option value="weekly">이번 주</option>
          <option value="monthly">이번 달</option>
          <option value="all">전체</option>
        </select>
      </div>
    </>
  );
}
