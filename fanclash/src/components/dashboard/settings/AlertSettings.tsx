export default function AlertSettings({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  return (
    <>
      <div>
        <label className="block text-sm text-gray-400 mb-1">알림 표시 시간 (초)</label>
        <input
          type="number"
          value={(config.alertDuration as number) || 5}
          onChange={e => onChange({ ...config, alertDuration: parseInt(e.target.value) })}
          min={2} max={15}
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-400 mb-1">최소 표시 금액</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={(config.minAmount as number) || 0}
            onChange={e => onChange({ ...config, minAmount: parseInt(e.target.value) })}
            step={1000} min={0}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
          />
          <span className="text-gray-400 text-sm">원</span>
        </div>
        <p className="text-xs text-gray-600 mt-1">이 금액 미만의 후원은 알림을 표시하지 않습니다</p>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">메시지 표시</label>
          <p className="text-xs text-gray-600">후원 메시지를 알림에 표시</p>
        </div>
        <button
          onClick={() => onChange({ ...config, showMessage: !(config.showMessage ?? true) })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${(config.showMessage ?? true) ? 'bg-green-600' : 'bg-gray-700'}`}>
          {(config.showMessage ?? true) ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-gray-400">TTS (음성 읽기)</label>
          <p className="text-xs text-gray-600">후원 내용을 음성으로 읽어줍니다</p>
        </div>
        <button
          onClick={() => onChange({ ...config, ttsEnabled: !config.ttsEnabled })}
          className={`px-3 py-1 rounded-full text-xs font-bold ${config.ttsEnabled ? 'bg-green-600' : 'bg-gray-700'}`}>
          {config.ttsEnabled ? 'ON' : 'OFF'}
        </button>
      </div>
    </>
  );
}
