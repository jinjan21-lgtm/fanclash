export default function GoalSettings({
  milestones, newAmount, newMission, onNewAmountChange, onNewMissionChange, onAdd, onRemove, onReset,
}: {
  milestones: { amount: number; mission: string }[];
  newAmount: string;
  newMission: string;
  onNewAmountChange: (v: string) => void;
  onNewMissionChange: (v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
  onReset: () => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-2">마일스톤 목록</label>
        {milestones.length === 0 && (
          <p className="text-gray-500 text-sm mb-2">아직 마일스톤이 없습니다. 아래에서 추가하세요.</p>
        )}
        <div className="space-y-2 mb-3">
          {milestones.map((m, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
              <span className="text-purple-400 font-bold text-sm min-w-[80px]">
                {m.amount.toLocaleString()}원
              </span>
              <span className="flex-1 text-sm">{m.mission}</span>
              <button onClick={() => onRemove(i)} className="text-red-400 hover:text-red-300 text-lg">&times;</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={newAmount}
            onChange={e => onNewAmountChange(e.target.value)}
            placeholder="금액"
            className="w-28 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <input
            type="text"
            value={newMission}
            onChange={e => onNewMissionChange(e.target.value)}
            placeholder="미션 (예: 노래 한 곡)"
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
            onKeyDown={e => e.key === 'Enter' && onAdd()}
          />
          <button onClick={onAdd}
            className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap">
            추가
          </button>
        </div>
      </div>
      <button onClick={onReset}
        className="w-full py-2 bg-red-900/50 border border-red-800 rounded-lg text-sm text-red-400 hover:bg-red-900">
        현재 목표 금액 초기화 (0원으로)
      </button>
    </>
  );
}
