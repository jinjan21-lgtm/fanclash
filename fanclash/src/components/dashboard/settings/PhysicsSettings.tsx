'use client';
export default function PhysicsSettings({ config, onChange }: {
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최대 오브젝트 수</label>
        <select value={(config.maxObjects as number) || 50}
          onChange={e => onChange({ ...config, maxObjects: parseInt(e.target.value) })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value={20}>20개</option>
          <option value={50}>50개</option>
          <option value={100}>100개</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">중력</label>
        <select value={(config.gravity as string) || 'medium'}
          onChange={e => onChange({ ...config, gravity: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="low">약</option>
          <option value="medium">중</option>
          <option value="high">강</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">이모지 크기</label>
        <select value={(config.emojiSize as string) || 'auto'}
          onChange={e => onChange({ ...config, emojiSize: e.target.value })}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
          <option value="auto">자동 (금액 비례)</option>
          <option value="small">작게</option>
          <option value="large">크게</option>
        </select>
      </div>
    </>
  );
}
