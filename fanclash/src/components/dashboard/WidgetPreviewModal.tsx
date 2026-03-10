'use client';
import { useState } from 'react';
import type { Widget, WidgetType } from '@/types';

const PREVIEW_SIZES: Record<WidgetType, { w: number; h: number }> = {
  ranking: { w: 420, h: 380 },
  throne: { w: 600, h: 400 },
  goal: { w: 450, h: 350 },
  affinity: { w: 400, h: 250 },
  battle: { w: 500, h: 400 },
  team_battle: { w: 500, h: 400 },
};

interface Props {
  widget: Widget;
  onClose: () => void;
}

export default function WidgetPreviewModal({ widget, onClose }: Props) {
  const overlayUrl = typeof window !== 'undefined' ? `${window.location.origin}/overlay/${widget.id}` : '';
  const size = PREVIEW_SIZES[widget.type];
  const [scale, setScale] = useState(1);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={onClose}>
      <div className="flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
        {/* Controls */}
        <div className="flex items-center gap-4 bg-gray-900 rounded-xl px-5 py-3 border border-gray-700">
          <span className="text-sm text-gray-400">미리보기</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-sm font-bold">-</button>
            <span className="text-sm text-white w-12 text-center">{(scale * 100).toFixed(0)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.25))}
              className="w-7 h-7 rounded bg-gray-700 hover:bg-gray-600 text-sm font-bold">+</button>
          </div>
          <div className="w-px h-5 bg-gray-700" />
          <span className="text-xs text-gray-500">{size.w} x {size.h}</span>
          <div className="w-px h-5 bg-gray-700" />
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">&times;</button>
        </div>

        {/* Preview frame */}
        <div
          className="rounded-xl overflow-hidden border-2 border-dashed border-gray-600 bg-[#18181b]"
          style={{ width: size.w * scale, height: size.h * scale }}
        >
          <iframe
            src={overlayUrl}
            className="border-0"
            style={{
              width: size.w,
              height: size.h,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            title="위젯 미리보기"
          />
        </div>

        <p className="text-xs text-gray-500">
          실시간 소켓 연결됨 — 후원 입력 시 여기서 바로 반영됩니다
        </p>
      </div>
    </div>
  );
}
