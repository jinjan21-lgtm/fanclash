'use client';

import Link from 'next/link';
import type { Job } from '@/types';
import { platformLabel, platformColor, statusLabel, statusColor } from '@/types';

interface JobCardProps {
  job: Job;
}

export default function JobCard({ job }: JobCardProps) {
  const clipCount = job.highlights?.length || 0;

  return (
    <Link
      href={`/dashboard/jobs/${job.id}`}
      className="block p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/30 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${platformColor(job.platform)}`} />
          <span className="text-sm font-medium">{platformLabel(job.platform)}</span>
        </div>
        <span className={`text-xs font-medium ${statusColor(job.status)}`}>
          {statusLabel(job.status)}
        </span>
      </div>

      <p className="text-sm text-gray-400 truncate mb-3">{job.vod_url}</p>

      {job.status === 'processing' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>처리 중</span>
            <span>{job.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 animate-progress-pulse"
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{new Date(job.created_at).toLocaleDateString('ko-KR')}</span>
        {job.status === 'completed' && (
          <span>{clipCount}개 하이라이트 감지</span>
        )}
      </div>
    </Link>
  );
}
