'use client';
export default function RPGSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">XP 배율</label>
        <select value={(config.xpRate as number) || 1}
          onChange={e => onChange({ ...config, xpRate: parseFloat(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={0.5}>0.5x (느림)</option>
          <option value={1}>1x (기본)</option>
          <option value={2}>2x (빠름)</option>
          <option value={5}>5x (매우 빠름)</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">100원당 XP 획득량. 1x = 100원당 1 XP</p>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">장비 표시</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onChange({ ...config, showEquipment: config.showEquipment !== false ? false : true })}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              config.showEquipment !== false ? 'bg-purple-600' : 'bg-gray-700'
            }`}
          >
            {config.showEquipment !== false ? 'ON' : 'OFF'}
          </button>
          <span className="text-xs text-gray-500">캐릭터 장비 슬롯 표시 여부</span>
        </div>
      </div>
    </>
  );
}
