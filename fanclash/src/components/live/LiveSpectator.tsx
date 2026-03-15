'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface DonationItem {
  id: string;
  fan_nickname: string;
  amount: number;
  message?: string;
  created_at: string;
}

interface RankingItem {
  nickname: string;
  total_donated: number;
  affinity_level?: number;
  title?: string;
}

interface BattleInfo {
  id: string;
  status: string;
  benefit: string;
  min_amount: number;
  time_limit: number;
  winner_nickname: string | null;
  started_at: string | null;
}

interface TeamBattleInfo {
  id: string;
  status: string;
  team_count: number;
  team_names: string[];
  time_limit: number;
  winning_team: number | null;
}

interface RpgCharacter {
  nickname: string;
  level: number;
  exp: number;
  class_name: string;
}

interface LiveSpectatorProps {
  streamerId: string;
  streamerName: string;
  enabledWidgets: string[];
  initialDonations: DonationItem[];
  initialRankings: RankingItem[];
  initialBattle: BattleInfo | null;
  battleParticipants: { nickname: string; amount: number }[];
  initialTeamBattle: TeamBattleInfo | null;
  rpgCharacters: RpgCharacter[];
}

export default function LiveSpectator({
  streamerId,
  streamerName,
  enabledWidgets,
  initialDonations,
  initialRankings,
  initialBattle,
  battleParticipants: initialBattleParticipants,
  initialTeamBattle,
  rpgCharacters: initialRpgCharacters,
}: LiveSpectatorProps) {
  const [donations, setDonations] = useState<DonationItem[]>(initialDonations);
  const [rankings, setRankings] = useState<RankingItem[]>(initialRankings);
  const [battle, setBattle] = useState<BattleInfo | null>(initialBattle);
  const [participants, setParticipants] = useState(initialBattleParticipants);
  const [teamBattle, setTeamBattle] = useState<TeamBattleInfo | null>(initialTeamBattle);
  const [rpgChars, setRpgChars] = useState<RpgCharacter[]>(initialRpgCharacters);
  const [isLive, setIsLive] = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [meterPct, setMeterPct] = useState(0);
  const [copied, setCopied] = useState(false);
  const socketRef = useRef<ReturnType<typeof import('socket.io-client').io> | null>(null);
  const comboTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleNewDonation = useCallback((data: DonationItem) => {
    setDonations(prev => [data, ...prev].slice(0, 10));

    // Update combo counter
    setComboCount(prev => prev + 1);
    clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => setComboCount(0), 30000);
  }, []);

  // Socket.IO connection
  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (!socketUrl) return;

    let socket: ReturnType<typeof import('socket.io-client').io>;
    import('socket.io-client').then(({ io }) => {
      socket = io(socketUrl, {
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        socket.emit('live:subscribe', streamerId);
        setIsLive(true);
      });

      socket.on('disconnect', () => {
        setIsLive(false);
      });

      // Listen for real-time donation events
      socket.on('donation:new', (data: DonationItem) => {
        handleNewDonation(data);
      });

      // Listen for ranking updates
      socket.on('ranking:update', (data: { rankings: { nickname: string; total: number }[] }) => {
        setRankings(
          data.rankings.slice(0, 5).map(r => ({
            nickname: r.nickname,
            total_donated: r.total,
          }))
        );
      });

      // Listen for battle updates
      socket.on('battle:update', (data: { battle: BattleInfo; participants: { nickname: string; amount: number }[] }) => {
        setBattle(data.battle);
        setParticipants(data.participants);
      });

      socket.on('battle:finished', () => {
        setBattle(null);
        setParticipants([]);
      });

      // Listen for team battle updates
      socket.on('team_battle:update', (data: { battle: TeamBattleInfo }) => {
        setTeamBattle(data.battle);
      });

      // Listen for widget chain actions (meter, combo, etc.)
      socket.on('widget:chain-action', (event: { type: string; data: Record<string, unknown> }) => {
        if (event.type === 'meter:max') {
          setMeterPct(event.data.percentage as number || 1);
        }
        if (event.type === 'train:combo') {
          setComboCount(event.data.comboCount as number || 0);
        }
      });
    });

    return () => {
      socket?.disconnect();
      socketRef.current = null;
    };
  }, [streamerId, handleNewDonation]);

  // Cleanup combo timer
  useEffect(() => {
    return () => clearTimeout(comboTimerRef.current);
  }, []);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatAmount = (amount: number) => {
    if (amount >= 10000) return `${(amount / 10000).toFixed(1)}만원`;
    return `${amount.toLocaleString()}원`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}시간 전`;
    return `${Math.floor(diffHour / 24)}일 전`;
  };

  const meterStage = meterPct >= 0.8 ? 'MAX' : meterPct >= 0.6 ? 'HOT' : meterPct >= 0.4 ? 'NORMAL' : meterPct >= 0.2 ? 'COLD' : 'ICE';

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
              {streamerName.charAt(0)}
            </div>
            <div>
              <h1 className="text-lg font-bold">{streamerName}</h1>
              <p className="text-xs text-gray-400">실시간 방송 현황</p>
            </div>
            {isLive ? (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-red-600 text-white animate-pulse">
                LIVE
              </span>
            ) : (
              <span className="ml-2 px-2 py-0.5 text-xs font-bold rounded bg-gray-600 text-gray-300">
                OFFLINE
              </span>
            )}
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors border border-gray-700"
          >
            {copied ? (
              <>
                <CheckIcon />
                <span>복사됨!</span>
              </>
            ) : (
              <>
                <ShareIcon />
                <span>공유</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            {/* Donation feed */}
            <Card title="실시간 후원 피드" icon="💰">
              {donations.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">아직 후원이 없습니다</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {donations.map((d, i) => (
                    <div
                      key={d.id || i}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {d.fan_nickname.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{d.fan_nickname}</span>
                          <span className="text-amber-400 font-bold text-sm">{formatAmount(d.amount)}</span>
                        </div>
                        {d.message && (
                          <p className="text-xs text-gray-400 truncate">{d.message}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">{formatTime(d.created_at)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Rankings */}
            <Card title="랭킹 TOP 5" icon="🏆">
              {rankings.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-6">랭킹 데이터가 없습니다</p>
              ) : (
                <div className="space-y-2">
                  {rankings.map((r, i) => (
                    <div
                      key={r.nickname}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                        i === 0 ? 'bg-yellow-500 text-black' :
                        i === 1 ? 'bg-gray-400 text-black' :
                        i === 2 ? 'bg-amber-700 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm">{r.nickname}</span>
                        {r.title && <span className="ml-2 text-xs text-purple-400">{r.title}</span>}
                      </div>
                      <span className="text-amber-400 font-bold text-sm">{formatAmount(r.total_donated)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Battle status */}
            {(battle || enabledWidgets.includes('battle')) && (
              <Card title="배틀 현황" icon="⚔️">
                {battle ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                        battle.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'
                      }`}>
                        {battle.status === 'active' ? '진행 중' : '모집 중'}
                      </span>
                      <span className="text-xs text-gray-400">보상: {battle.benefit}</span>
                    </div>
                    <div className="space-y-1.5">
                      {participants.map((p, i) => (
                        <div key={p.nickname} className="flex items-center gap-2 text-sm">
                          <span className={`font-bold ${i === 0 ? 'text-amber-400' : 'text-gray-300'}`}>
                            {i + 1}.
                          </span>
                          <span className="flex-1 truncate">{p.nickname}</span>
                          <span className="text-amber-400 font-semibold">{formatAmount(p.amount)}</span>
                        </div>
                      ))}
                      {participants.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-2">참가자를 기다리는 중...</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm text-center py-6">진행 중인 배틀이 없습니다</p>
                )}
              </Card>
            )}

            {/* Team battle */}
            {teamBattle && (
              <Card title="팀 배틀" icon="🏴">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                    teamBattle.status === 'active' ? 'bg-green-600' : 'bg-yellow-600'
                  }`}>
                    {teamBattle.status === 'active' ? '진행 중' : '모집 중'}
                  </span>
                  <span className="text-xs text-gray-400">{teamBattle.team_count}팀</span>
                </div>
                <div className="flex gap-2">
                  {teamBattle.team_names.map((name, i) => (
                    <div key={i} className="flex-1 text-center p-2 rounded-lg bg-gray-800/50 border border-gray-700">
                      <div className="text-sm font-bold">{name}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* RPG Leaderboard */}
            {enabledWidgets.includes('rpg') && (
              <Card title="RPG 레벨 TOP 5" icon="🎮">
                {rpgChars.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">RPG 캐릭터가 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {rpgChars.map((c, i) => (
                      <div key={c.nickname} className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          i === 0 ? 'bg-purple-500' : 'bg-gray-700'
                        }`}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm">{c.nickname}</span>
                          <span className="ml-2 text-xs text-gray-400">{c.class_name}</span>
                        </div>
                        <span className="text-purple-400 font-bold text-sm">Lv.{c.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Meter */}
            {enabledWidgets.includes('meter') && (
              <Card title="분위기 미터" icon="🌡️">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        meterStage === 'MAX' ? 'bg-gradient-to-r from-red-600 to-red-400' :
                        meterStage === 'HOT' ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                        meterStage === 'NORMAL' ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                        meterStage === 'COLD' ? 'bg-gradient-to-r from-blue-500 to-cyan-400' :
                        'bg-gradient-to-r from-blue-800 to-blue-600'
                      }`}
                      style={{ width: `${Math.min(meterPct * 100, 100)}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${
                    meterStage === 'MAX' ? 'text-red-400' :
                    meterStage === 'HOT' ? 'text-orange-400' :
                    'text-gray-400'
                  }`}>
                    {meterStage}
                  </span>
                </div>
              </Card>
            )}

            {/* Combo counter */}
            {enabledWidgets.includes('train') && (
              <Card title="콤보 카운터" icon="🚂">
                <div className="text-center py-2">
                  {comboCount > 0 ? (
                    <div className={`text-3xl font-black ${
                      comboCount >= 20 ? 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400' :
                      comboCount >= 10 ? 'text-orange-400' :
                      comboCount >= 5 ? 'text-yellow-400' :
                      'text-white'
                    }`}>
                      {comboCount >= 10 ? 'COMBO' : ''} x{comboCount}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">대기 중...</p>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-gray-500">
          Powered by FanClash
        </div>
      </footer>
    </div>
  );
}

// Helper components

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-gray-900 border border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
        <span>{icon}</span>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
