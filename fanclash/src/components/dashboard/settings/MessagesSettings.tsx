export default function MessagesSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">표시 메시지 수</label>
      <select
        value={(config.maxMessages as number) || 5}
        onChange={e => onChange({ ...config, maxMessages: parseInt(e.target.value) })}
        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm">
        <option value={3}>3개</option>
        <option value={5}>5개</option>
        <option value={10}>10개</option>
      </select>
    </div>
  );
}
