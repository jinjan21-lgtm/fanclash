'use client';

import { useEffect } from 'react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="bg-gray-900 rounded-xl p-8 border border-red-900/50 max-w-md text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">문제가 발생했습니다</h2>
        <p className="text-gray-400 text-sm mb-6">
          페이지를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-xl text-sm font-bold transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
