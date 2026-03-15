'use client';
import { useState, useMemo } from 'react';
import type { StreamerCard } from '@/app/explore/page';
import type { WidgetType } from '@/types';

const WIDGET_TYPE_LABELS: Partial<Record<WidgetType, string>> = {
  alert: '알림',
  ranking: '랭킹',
  throne: '왕좌',
  goal: '목표',
  affinity: '호감도',
  battle: '배틀',
  team_battle: '투표',
  timer: '타이머',
  messages: '메시지',
  roulette: '룰렛',
  music: '뮤직',
  gacha: '가챠',
  physics: '폭격',
  territory: '영토전쟁',
  weather: '날씨',
  train: '트레인',
  slots: '슬롯',
  meter: '미터',
  quiz: '퀴즈',
  rpg: 'RPG',
  mission: '미션',
};

type SortMode = 'recent' | 'fans' | 'widgets';

export default function ExploreGrid({ streamers }: { streamers: StreamerCard[] }) {
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const filtered = useMemo(() => {
    let result = [...streamers];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(s => s.display_name.toLowerCase().includes(q));
    }

    // Sort
    switch (sortMode) {
      case 'recent':
        result.sort((a, b) => {
          if (!a.last_activity && !b.last_activity) return 0;
          if (!a.last_activity) return 1;
          if (!b.last_activity) return -1;
          return new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime();
        });
        break;
      case 'fans':
        result.sort((a, b) => b.fan_count - a.fan_count);
        break;
      case 'widgets':
        result.sort((a, b) => b.widget_count - a.widget_count);
        break;
    }

    return result;
  }, [streamers, search, sortMode]);

  const getDonationRange = (count: number): string => {
    if (count === 0) return '-';
    if (count < 10) return '~10';
    if (count < 50) return '10~50';
    if (count < 100) return '50~100';
    return '100+';
  };

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const getInitialColor = (name: string): string => {
    const colors = [
      'bg-purple-600', 'bg-blue-600', 'bg-green-600', 'bg-yellow-600',
      'bg-pink-600', 'bg-indigo-600', 'bg-red-600', 'bg-teal-600',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div>
      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="flex-1">
          <input
            type="text"
            placeholder="닉네임 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-purple-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {([
            { key: 'recent', label: '최신활동' },
            { key: 'fans', label: '팬 수' },
            { key: 'widgets', label: '위젯 수' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortMode(key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                sortMode === key
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-900 border border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-gray-500 mb-4">{filtered.length}명의 크리에이터</p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">검색 결과가 없습니다</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(streamer => (
            <div key={streamer.id}
              className="bg-gray-900 rounded-xl p-5 border border-gray-800 hover:border-purple-600/50 transition-colors">
              {/* Avatar + Name */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full ${getInitialColor(streamer.display_name)} flex items-center justify-center text-xl font-black text-white`}>
                  {getInitial(streamer.display_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{streamer.display_name}</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 bg-purple-600/30 rounded text-xs text-purple-300 font-medium">
                      위젯 {streamer.widget_count}개
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-purple-400 font-bold">{streamer.fan_count}</p>
                  <p className="text-gray-500 text-xs">팬 수</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-2 text-center">
                  <p className="text-green-400 font-bold">{getDonationRange(streamer.donation_count)}</p>
                  <p className="text-gray-500 text-xs">총 후원</p>
                </div>
              </div>

              {/* Widget type badges */}
              {streamer.widget_types.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {streamer.widget_types.slice(0, 6).map(type => (
                    <span key={type} className="px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                      {WIDGET_TYPE_LABELS[type as WidgetType] || type}
                    </span>
                  ))}
                  {streamer.widget_types.length > 6 && (
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-[10px] text-gray-400">
                      +{streamer.widget_types.length - 6}
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <a href={`/streamer/${streamer.id}`}
                  className="flex-1 py-2 bg-purple-600 rounded-lg text-sm font-medium hover:bg-purple-700 text-center transition-colors">
                  프로필 보기
                </a>
                <a href={`/live/${streamer.id}`}
                  className="flex-1 py-2 bg-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-700 text-center transition-colors">
                  실시간 보기
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
