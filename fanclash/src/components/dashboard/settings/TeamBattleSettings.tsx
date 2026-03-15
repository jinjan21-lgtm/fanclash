export default function TeamBattleSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const teamNames = (config.defaultTeamNames as string[]) || ['A팀', 'B팀'];

  const updateTeamName = (index: number, value: string) => {
    const updated = [...teamNames];
    updated[index] = value;
    onChange({ ...config, defaultTeamNames: updated });
  };

  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 팀 수</label>
        <select
          value={(config.defaultTeamCount as number) || 2}
          onChange={e => {
            const count = parseInt(e.target.value);
            const names = [...teamNames];
            while (names.length < count) names.push(`${String.fromCharCode(65 + names.length)}팀`);
            onChange({ ...config, defaultTeamCount: count, defaultTeamNames: names.slice(0, count) });
          }}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={2}>2팀</option>
          <option value={3}>3팀</option>
          <option value={4}>4팀</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-2">팀 이름</label>
        <div className="space-y-2">
          {teamNames.slice(0, (config.defaultTeamCount as number) || 2).map((name, i) => (
            <input
              key={i}
              type="text"
              value={name}
              onChange={e => updateTeamName(i, e.target.value)}
              placeholder={`${i + 1}번째 팀`}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            />
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">기본 제한 시간</label>
        <select
          value={(config.defaultTimeLimit as number) || 300}
          onChange={e => onChange({ ...config, defaultTimeLimit: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={120}>2분</option>
          <option value={180}>3분</option>
          <option value={300}>5분</option>
          <option value={600}>10분</option>
        </select>
      </div>
    </>
  );
}
