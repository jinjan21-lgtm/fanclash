'use client';
import { useState, useEffect } from 'react';

interface CollabBattle {
  id: string;
  title: string;
  host_id: string;
  guest_id: string | null;
  invite_code: string;
  host_total: number;
  guest_total: number;
  status: 'pending' | 'active' | 'finished';
  duration_minutes: number;
  started_at: string | null;
  host?: { display_name: string };
  guest?: { display_name: string };
}

export default function CollabBattleManager() {
  const [battles, setBattles] = useState<CollabBattle[]>([]);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const fetchBattles = async () => {
    const res = await fetch('/api/collab');
    if (res.ok) setBattles(await res.json());
  };

  useEffect(() => { fetchBattles(); }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    const res = await fetch('/api/collab', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title || undefined, duration_minutes: duration }),
    });
    if (res.ok) {
      setTitle('');
      fetchBattles();
    } else {
      const data = await res.json();
      setError(data.error || '생성 실패');
    }
    setCreating(false);
  };

  const handleJoin = async () => {
    setJoining(true);
    setError('');
    const res = await fetch('/api/collab/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: joinCode }),
    });
    if (res.ok) {
      setJoinCode('');
      fetchBattles();
    } else {
      const data = await res.json();
      setError(data.error || '참가 실패');
    }
    setJoining(false);
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <h3 className="font-bold text-lg mb-4">콜라보 배틀</h3>
      <p className="text-gray-400 text-sm mb-4">다른 스트리머와 팬 후원 대결을 벌여보세요!</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('create')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'create' ? 'bg-purple-600' : 'bg-gray-800 text-gray-400'}`}>
          배틀 만들기
        </button>
        <button onClick={() => setTab('join')} className={`px-4 py-2 rounded-lg text-sm font-bold ${tab === 'join' ? 'bg-purple-600' : 'bg-gray-800 text-gray-400'}`}>
          초대 코드 입력
        </button>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {tab === 'create' && (
        <div className="space-y-3 mb-6">
          <input type="text" placeholder="배틀 제목" value={title} onChange={e => setTitle(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm" />
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-400">진행 시간:</label>
            <select value={duration} onChange={e => setDuration(Number(e.target.value))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
              <option value={15}>15분</option>
              <option value={30}>30분</option>
              <option value={60}>1시간</option>
              <option value={120}>2시간</option>
            </select>
          </div>
          <button onClick={handleCreate} disabled={creating}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold disabled:opacity-50">
            {creating ? '생성 중...' : '배틀 생성'}
          </button>
        </div>
      )}

      {tab === 'join' && (
        <div className="flex gap-2 mb-6">
          <input type="text" placeholder="초대 코드 6자리" value={joinCode} onChange={e => setJoinCode(e.target.value)} maxLength={6}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm font-mono tracking-widest" />
          <button onClick={handleJoin} disabled={joining || joinCode.length < 6}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-bold disabled:opacity-50">
            {joining ? '...' : '참가'}
          </button>
        </div>
      )}

      {/* Battle list */}
      {battles.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-400">내 배틀</h4>
          {battles.map(b => (
            <div key={b.id} className={`p-4 rounded-lg border ${
              b.status === 'active' ? 'border-green-800/50 bg-green-900/10' :
              b.status === 'pending' ? 'border-yellow-800/50 bg-yellow-900/10' :
              'border-gray-800 bg-gray-800/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold">{b.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  b.status === 'active' ? 'bg-green-600/20 text-green-400' :
                  b.status === 'pending' ? 'bg-yellow-600/20 text-yellow-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {b.status === 'active' ? '진행 중' : b.status === 'pending' ? '대기 중' : '종료'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{b.host?.display_name || '호스트'}: <strong className="text-purple-400">{b.host_total.toLocaleString()}원</strong></span>
                <span className="text-gray-500">VS</span>
                <span>{b.guest?.display_name || '상대 대기 중'}: <strong className="text-purple-400">{b.guest_total.toLocaleString()}원</strong></span>
              </div>
              {b.status === 'pending' && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-gray-500">초대 코드:</span>
                  <code className="bg-gray-800 px-2 py-0.5 rounded text-sm font-mono tracking-widest">{b.invite_code}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
