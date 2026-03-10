'use client';
import { useRouter } from 'next/navigation';

const PERIODS = [
  { value: '1d', label: '오늘' },
  { value: '7d', label: '7일' },
  { value: '30d', label: '30일' },
  { value: '90d', label: '90일' },
];

export default function StatsFilter({ current }: { current: string }) {
  const router = useRouter();

  return (
    <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
      {PERIODS.map(p => (
        <button
          key={p.value}
          onClick={() => router.push(`/dashboard/stats?period=${p.value}`)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            current === p.value
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
