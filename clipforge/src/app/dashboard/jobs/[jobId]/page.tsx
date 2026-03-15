'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Job, Highlight } from '@/types';
import { platformLabel, statusLabel, statusColor, formatDuration } from '@/types';

const PROCESSING_STEPS = [
  'URL 확인',
  '오디오 추출',
  '자막 생성',
  '하이라이트 감지',
  '클립 생성',
];

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatingClip, setCreatingClip] = useState<number | null>(null);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        router.push('/dashboard');
        return;
      }
      const data = await res.json();
      setJob(data);
    } catch {
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [jobId, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  // Simulate progress for processing jobs
  useEffect(() => {
    if (!job || job.status !== 'processing') return;

    const interval = setInterval(async () => {
      setJob((prev) => {
        if (!prev || prev.status !== 'processing') return prev;
        const newProgress = Math.min(prev.progress + Math.floor(Math.random() * 8) + 3, 100);
        if (newProgress >= 100) {
          // Trigger refetch to get completed data with highlights
          setTimeout(() => fetchJob(), 500);
          return { ...prev, progress: 100, status: 'completed' };
        }
        return { ...prev, progress: newProgress };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [job?.status, fetchJob]);

  const currentStep = job ? Math.min(Math.floor(job.progress / 20), 4) : 0;

  const handleCreateClip = async (index: number, highlight: Highlight) => {
    setCreatingClip(index);
    try {
      const res = await fetch('/api/clips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          title: `하이라이트 #${index + 1} — ${highlight.reason}`,
          start_time: highlight.start_time,
          end_time: highlight.end_time,
        }),
      });
      if (res.ok) {
        alert('클립이 생성되었습니다! 클립 관리 페이지에서 확인하세요.');
      } else {
        const data = await res.json();
        alert(data.error || '클립 생성에 실패했습니다.');
      }
    } catch {
      alert('오류가 발생했습니다.');
    } finally {
      setCreatingClip(null);
    }
  };

  if (loading) {
    return (
      <div className="pt-12 md:pt-0 flex items-center justify-center min-h-[50vh]">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!job) return null;

  return (
    <div className="pt-12 md:pt-0 max-w-3xl">
      <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 mb-4 inline-block">
        &larr; 대시보드로 돌아가기
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="text-2xl font-bold">작업 상세</h1>
        <span className={`text-sm font-medium ${statusColor(job.status)}`}>
          {statusLabel(job.status)}
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-8 truncate">
        {platformLabel(job.platform)} &middot; {job.vod_url}
      </p>

      {/* Progress */}
      {(job.status === 'processing' || job.status === 'pending') && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
          <div className="flex justify-between text-sm mb-3">
            <span className="text-gray-400">처리 진행률</span>
            <span className="font-medium">{job.progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-6">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${job.progress}%` }}
            />
          </div>
          <div className="space-y-3">
            {PROCESSING_STEPS.map((step, i) => (
              <div key={step} className="flex items-center gap-3 text-sm">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                  i < currentStep
                    ? 'bg-emerald-500 text-white'
                    : i === currentStep
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                    : 'bg-gray-800 text-gray-600'
                }`}>
                  {i < currentStep ? '\u2713' : i + 1}
                </span>
                <span className={i <= currentStep ? 'text-gray-300' : 'text-gray-600'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed */}
      {job.status === 'failed' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 text-center">
          <p className="text-red-400 mb-2">처리 중 오류가 발생했습니다.</p>
          <p className="text-sm text-gray-500">URL을 확인하고 다시 시도해주세요.</p>
        </div>
      )}

      {/* Highlights */}
      {job.status === 'completed' && job.highlights && job.highlights.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">
            감지된 하이라이트 ({job.highlights.length}개)
          </h2>
          <div className="space-y-4">
            {job.highlights.map((h, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full">
                        #{i + 1}
                      </span>
                      <span className="text-xs text-gray-500">
                        점수: {h.score}/100
                      </span>
                    </div>
                    <p className="font-medium mb-1">{h.reason}</p>
                    <p className="text-sm text-gray-500">
                      {formatDuration(h.start_time)} — {formatDuration(h.end_time)}
                      <span className="ml-2 text-gray-600">
                        ({formatDuration(h.end_time - h.start_time)})
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => handleCreateClip(i, h)}
                    disabled={creatingClip === i}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
                  >
                    {creatingClip === i ? '생성 중...' : '클립 생성'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {job.status === 'completed' && (!job.highlights || job.highlights.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <p>하이라이트가 감지되지 않았습니다.</p>
        </div>
      )}
    </div>
  );
}
