'use client';
import { useState } from 'react';

interface Season {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: 'active' | 'ended';
}

interface SeasonRanking {
  fan_nickname: string;
  total_donated: number;
  rank: number;
}

export default function SeasonManager({ seasons: initialSeasons }: { seasons: Season[] }) {
  const [seasons, setSeasons] = useState(initialSeasons);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [rankings, setRankings] = useState<SeasonRanking[]>([]);

  const activeSeason = seasons.find(s => s.status === 'active');

  const handleNewSeason = async () => {
    setCreating(true);
    const res = await fetch('/api/seasons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName || undefined }),
    });
    if (res.ok) {
      // Refresh seasons list
      const listRes = await fetch('/api/seasons');
      if (listRes.ok) setSeasons(await listRes.json());
      setNewName('');
    }
    setCreating(false);
  };

  const viewRankings = async (seasonId: string) => {
    if (viewingId === seasonId) { setViewingId(null); return; }
    const res = await fetch(`/api/seasons/${seasonId}`);
    if (res.ok) {
      setRankings(await res.json());
      setViewingId(seasonId);
    }
  };

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];

  return (
    <div className="bg-gray-900 rounded-xl p-6 mt-8">
      <h3 className="font-bold text-lg mb-4">시즌 시스템</h3>

      {/* Active season */}
      {activeSeason && (
        <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-green-400 text-sm font-bold">진행 중</span>
              <p className="font-bold mt-1">{activeSeason.name}</p>
              <p className="text-xs text-gray-500">{new Date(activeSeason.start_date).toLocaleDateString('ko-KR')} ~</p>
            </div>
          </div>
        </div>
      )}

      {/* New season */}
      <div className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder={activeSeason ? '새 시즌 이름 (현재 시즌 종료됨)' : '시즌 이름'}
          value={newName}
          onChange={e => setNewName(e.target.value)}
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
        />
        <button
          onClick={handleNewSeason}
          disabled={creating}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold disabled:opacity-50"
        >
          {creating ? '...' : activeSeason ? '시즌 교체' : '시즌 시작'}
        </button>
      </div>

      {/* Past seasons */}
      {seasons.filter(s => s.status === 'ended').length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-400 mb-3">지난 시즌</h4>
          <div className="space-y-2">
            {seasons.filter(s => s.status === 'ended').map(s => (
              <div key={s.id}>
                <button
                  onClick={() => viewRankings(s.id)}
                  className="w-full flex items-center justify-between p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800 text-sm"
                >
                  <div className="text-left">
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(s.start_date).toLocaleDateString('ko-KR')} ~ {s.end_date ? new Date(s.end_date).toLocaleDateString('ko-KR') : ''}
                    </p>
                  </div>
                  <span className="text-gray-500">{viewingId === s.id ? '\u25B2' : '\u25BC'}</span>
                </button>
                {viewingId === s.id && (
                  <div className="mt-2 ml-4 space-y-1">
                    {rankings.length === 0 ? (
                      <p className="text-gray-500 text-sm py-2">랭킹 데이터 없음</p>
                    ) : rankings.map(r => (
                      <div key={r.rank} className="flex items-center gap-3 py-1.5 text-sm">
                        <span className="w-8 text-center">{medals[r.rank - 1] || r.rank}</span>
                        <span className="flex-1 font-medium">{r.fan_nickname}</span>
                        <span className="text-purple-400">{r.total_donated.toLocaleString()}원</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
