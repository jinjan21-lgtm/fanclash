'use client';

import type { Clip } from '@/types';
import { formatDuration } from '@/types';

interface ClipCardProps {
  clip: Clip;
  onDelete?: (id: string) => void;
}

const GRADIENT_COLORS = [
  'from-emerald-600 to-cyan-600',
  'from-purple-600 to-pink-600',
  'from-orange-600 to-red-600',
  'from-blue-600 to-indigo-600',
  'from-teal-600 to-emerald-600',
];

export default function ClipCard({ clip, onDelete }: ClipCardProps) {
  const gradientIndex = clip.id.charCodeAt(0) % GRADIENT_COLORS.length;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // MVP: mock download
    alert('MVP 버전에서는 다운로드가 지원되지 않습니다. Pro 출시 후 이용 가능합니다.');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && confirm('이 클립을 삭제하시겠습니까?')) {
      onDelete(clip.id);
    }
  };

  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-emerald-500/30 transition-colors">
      {/* Thumbnail placeholder */}
      <div className={`aspect-[9/16] max-h-48 bg-gradient-to-br ${GRADIENT_COLORS[gradientIndex]} relative flex items-center justify-center`}>
        <div className="text-center text-white/80">
          <svg className="w-8 h-8 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
          </svg>
          <span className="text-xs">{formatDuration(clip.duration)}</span>
        </div>
        <span className="absolute top-2 right-2 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded">
          {clip.format}
        </span>
      </div>

      <div className="p-3">
        <h3 className="text-sm font-medium truncate mb-1">{clip.title || '제목 없음'}</h3>
        <p className="text-xs text-gray-500 mb-3">
          {formatDuration(clip.start_time)} - {formatDuration(clip.end_time)}
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            className="flex-1 text-xs py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            다운로드
          </button>
          <button
            onClick={handleDelete}
            className="text-xs py-1.5 px-3 rounded-lg bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          >
            삭제
          </button>
        </div>
      </div>
    </div>
  );
}
