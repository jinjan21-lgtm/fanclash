'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { detectPlatform, platformLabel } from '@/types';

export default function NewJobPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const detected = url.trim() ? detectPlatform(url) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('URL을 입력해주세요.');
      return;
    }

    if (detected === 'unknown') {
      setError('지원되지 않는 플랫폼입니다. YouTube, 치지직, Twitch URL을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vod_url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '작업 생성에 실패했습니다.');
        return;
      }
      router.push(`/dashboard/jobs/${data.id}`);
    } catch {
      setError('작업 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-12 md:pt-0 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">새 클립 만들기</h1>
      <p className="text-gray-500 text-sm mb-8">
        방송 VOD URL을 입력하면 AI가 하이라이트를 자동으로 감지합니다.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm text-gray-400 mb-2">방송 URL</label>
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-colors pr-28"
            />
            {detected && detected !== 'unknown' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs bg-gray-800 text-gray-300 px-2.5 py-1 rounded-lg">
                {platformLabel(detected)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            지원 플랫폼: YouTube, 치지직(CHZZK), Twitch, 아프리카TV
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">분석 과정</h3>
          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">1</span>
              URL 확인 및 영상 정보 추출
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">2</span>
              오디오 추출 및 음성 인식
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">3</span>
              자막 생성 및 하이라이트 감지
            </div>
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-[10px]">4</span>
              세로 클립 자동 생성
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !url.trim()}
          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600 text-white font-medium transition-colors"
        >
          {loading ? '분석 시작 중...' : '분석 시작'}
        </button>
      </form>
    </div>
  );
}
