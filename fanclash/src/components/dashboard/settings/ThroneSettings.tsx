export default function ThroneSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">알림 표시 시간 (초)</label>
        <input
          type="number"
          value={(config.alertDuration as number) || 5}
          onChange={e => onChange({ ...config, alertDuration: parseInt(e.target.value) })}
          min={2}
          max={15}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">알림 효과음</label>
        <select
          value={(config.sound as string) || 'default'}
          onChange={e => onChange({ ...config, sound: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="default">기본</option>
          <option value="fanfare">팡파레</option>
          <option value="none">없음</option>
        </select>
      </div>
    </>
  );
}
