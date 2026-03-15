export default function AffinitySettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const levels = (config.levels as { title: string; minAmount: number }[]) || [
    { title: '지나가는 팬', minAmount: 0 },
    { title: '단골', minAmount: 10000 },
    { title: '열혈팬', minAmount: 50000 },
    { title: '첫사랑', minAmount: 200000 },
    { title: '소울메이트', minAmount: 500000 },
  ];

  const updateLevel = (index: number, field: 'title' | 'minAmount', value: string | number) => {
    const updated = levels.map((l, i) => i === index ? { ...l, [field]: value } : l);
    onChange({ ...config, levels: updated });
  };

  return (
    <div>
      <label className="block text-sm text-gray-400 mb-2">호감도 레벨 설정</label>
      <div className="space-y-2">
        {levels.map((level, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-gray-500 text-sm w-6">Lv{i}</span>
            <input
              type="text"
              value={level.title}
              onChange={e => updateLevel(i, 'title', e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
            />
            <input
              type="number"
              value={level.minAmount}
              onChange={e => updateLevel(i, 'minAmount', parseInt(e.target.value) || 0)}
              className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:border-purple-500 focus:outline-none"
              disabled={i === 0}
            />
            <span className="text-gray-500 text-xs">원</span>
          </div>
        ))}
      </div>
    </div>
  );
}
