'use client';

import { SUBTITLE_PRESETS, type SubtitleStyle } from '@/lib/subtitle-styles';

interface SubtitlePreviewProps {
  selectedId: string | null;
  onSelect: (style: SubtitleStyle) => void;
}

export default function SubtitlePreview({ selectedId, onSelect }: SubtitlePreviewProps) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-2">자막 스타일</h3>
      <p className="text-sm text-gray-500 mb-4">클립에 적용할 자막 스타일을 선택하세요</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {SUBTITLE_PRESETS.map((preset) => {
          const isSelected = selectedId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => onSelect(preset)}
              className={`text-left rounded-xl border p-3 transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                  : 'border-gray-800 bg-gray-900 hover:border-gray-600'
              }`}
            >
              {/* Mini preview */}
              <div className="relative w-full h-20 bg-gray-950 rounded-lg mb-3 overflow-hidden flex items-end justify-center">
                {/* Position-based alignment */}
                <div
                  className={`absolute left-0 right-0 flex justify-center ${
                    preset.position === 'top' ? 'top-1' :
                    preset.position === 'center' ? 'top-1/2 -translate-y-1/2' :
                    'bottom-1'
                  }`}
                >
                  <span
                    style={{
                      fontFamily: preset.fontFamily,
                      fontSize: `${Math.max(preset.fontSize / 4, 10)}px`,
                      fontWeight: preset.fontWeight,
                      color: preset.color,
                      backgroundColor: preset.backgroundOpacity > 0
                        ? `${preset.backgroundColor}${Math.round(preset.backgroundOpacity * 2.55).toString(16).padStart(2, '0')}`
                        : 'transparent',
                      padding: '1px 6px',
                      borderRadius: '2px',
                      textShadow: preset.outline
                        ? `1px 1px 0 ${preset.outlineColor}, -1px -1px 0 ${preset.outlineColor}, 1px -1px 0 ${preset.outlineColor}, -1px 1px 0 ${preset.outlineColor}`
                        : 'none',
                    }}
                  >
                    안녕하세요 여러분!
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{preset.name}</p>
                  <p className="text-xs text-gray-500">{preset.description}</p>
                </div>
                {isSelected && (
                  <span className="text-emerald-400 text-xs shrink-0 ml-2">선택됨</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
