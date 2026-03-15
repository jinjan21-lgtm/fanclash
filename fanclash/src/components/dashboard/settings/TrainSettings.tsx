'use client';
export default function TrainSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">콤보 유지 시간</label>
        <select value={(config.comboWindow as number) || 30}
          onChange={e => onChange({ ...config, comboWindow: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={15}>15초</option>
          <option value={30}>30초</option>
          <option value={60}>60초</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">이 시간 안에 연속 후원이 오면 콤보가 유지됩니다</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 후원 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 1000}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000}
            min={1000}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">이펙트 강도</label>
        <select value={(config.effectIntensity as string) || 'medium'}
          onChange={e => onChange({ ...config, effectIntensity: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="low">약</option>
          <option value="medium">중</option>
          <option value="high">강</option>
        </select>
      </div>
    </>
  );
}
