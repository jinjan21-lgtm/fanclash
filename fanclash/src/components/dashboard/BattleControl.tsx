'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSocket } from '@/lib/socket/client';
import { useToast } from '@/components/ui/Toast';
import type { Battle, BattleParticipant, Widget } from '@/types';

interface BattleControlProps {
  widget: Widget;
  onUpdate: () => void;
}

interface TournamentMatch {
  player1: string;
  player2: string;
  winner: string | null;
}

interface TournamentRound {
  matches: TournamentMatch[];
}

interface TournamentState {
  rounds: TournamentRound[];
  currentRound: number;
  currentMatch: number;
  bracketSize: number;
  players: string[];
  finished: boolean;
  champion: string | null;
}

export default function BattleControl({ widget, onUpdate }: BattleControlProps) {
  if (widget.type === 'team_battle') {
    return <TeamBattleControl widget={widget} onUpdate={onUpdate} />;
  }
  const config = (widget.config || {}) as Record<string, unknown>;
  if (config.tournamentMode) {
    return <TournamentControl widget={widget} onUpdate={onUpdate} />;
  }
  return <SingleBattleControl widget={widget} onUpdate={onUpdate} />;
}

/* ═══════════════════════════════════════════
   1:1 Battle (후원 배틀)
   ═══════════════════════════════════════════ */
function SingleBattleControl({ widget, onUpdate }: BattleControlProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const config = (widget.config || {}) as Record<string, unknown>;

  const [benefit, setBenefit] = useState((config.defaultBenefit as string) || '');
  const [minAmount, setMinAmount] = useState(String((config.defaultMinAmount as number) ?? 5000));
  const [timeLimit, setTimeLimit] = useState(String((config.defaultTimeLimit as number) ?? 180));
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [loading, setLoading] = useState(true);

  const saveConfig = async () => {
    const newConfig = {
      ...config,
      defaultBenefit: benefit,
      defaultMinAmount: parseInt(minAmount) || 5000,
      defaultTimeLimit: parseInt(timeLimit) || 180,
    };
    await supabase.from('widgets').update({ config: newConfig }).eq('id', widget.id);
    onUpdate();
    toast('설정이 저장되었습니다');
  };

  useEffect(() => {
    supabase
      .from('battles')
      .select('*')
      .eq('streamer_id', widget.streamer_id)
      .in('status', ['recruiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (data) {
          setActiveBattle(data);
          setBenefit(data.benefit || benefit);
          setMinAmount(String(data.min_amount));
          setTimeLimit(String(data.time_limit));
          const { data: parts } = await supabase
            .from('battle_participants')
            .select('*')
            .eq('battle_id', data.id)
            .order('amount', { ascending: false });
          if (parts) setParticipants(parts);
        }
        setLoading(false);
      });
  }, [widget.streamer_id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('streamer:subscribe' as any, widget.streamer_id);
    const updateHandler = (data: any) => { setActiveBattle(data.battle); setParticipants(data.participants); };
    const finishHandler = (data: any) => { setActiveBattle(null); setParticipants([]); toast(`배틀 종료! 승자: ${data.winner}`); };
    socket.on('battle:update', updateHandler);
    socket.on('battle:finished', finishHandler);
    return () => { socket.off('battle:update', updateHandler); socket.off('battle:finished', finishHandler); };
  }, [widget.streamer_id]);

  const createBattle = async () => {
    if (!benefit) return;
    await saveConfig();
    getSocket().emit('battle:create', {
      streamer_id: widget.streamer_id,
      benefit,
      min_amount: parseInt(minAmount),
      time_limit: parseInt(timeLimit),
    });
  };

  const startBattle = () => { if (activeBattle) getSocket().emit('battle:start', activeBattle.id); };
  const cancelBattle = () => {
    if (!activeBattle) return;
    getSocket().emit('battle:cancel' as any, activeBattle.id);
    setActiveBattle(null);
    setParticipants([]);
  };

  if (loading) return <div className="text-gray-500 p-4">로딩 중...</div>;

  const isRecruiting = activeBattle?.status === 'recruiting';
  const isActive = activeBattle?.status === 'active';

  return (
    <div className="space-y-5">
      {/* Settings */}
      <SettingsSection title="배틀 설정" disabled={isActive}>
        <div>
          <label className="block text-sm text-gray-400 mb-1">베네핏</label>
          <input type="text" placeholder="예: 듀오 한판!" value={benefit} onChange={e => setBenefit(e.target.value)}
            disabled={!!isActive} className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">최소 참가 금액</label>
            <div className="flex items-center gap-2">
              <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)}
                disabled={!!isActive} step={1000} min={1000}
                className="flex-1 p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50" />
              <span className="text-gray-400 text-sm">원</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">제한 시간</label>
            <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} disabled={!!isActive}
              className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50">
              <option value="60">1분</option>
              <option value="120">2분</option>
              <option value="180">3분</option>
              <option value="300">5분</option>
              <option value="600">10분</option>
            </select>
          </div>
        </div>
        {!activeBattle && (
          <button onClick={saveConfig} className="w-full py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 text-gray-300">
            설정 저장
          </button>
        )}
      </SettingsSection>

      <div className="border-t border-gray-700" />

      {/* Battle Status */}
      {activeBattle ? (
        <ActiveBattleView
          status={activeBattle.status}
          info={`🎁 ${activeBattle.benefit} · 최소 ${activeBattle.min_amount.toLocaleString()}원 · ${activeBattle.time_limit}초`}
          participants={participants.map((p, i) => ({
            label: `${i === 0 && participants.length > 1 ? '👑 ' : ''}${p.nickname}`,
            value: `${(p.amount || 0).toLocaleString()}원`,
          }))}
          onStart={isRecruiting ? startBattle : undefined}
          onCancel={cancelBattle}
          startDisabled={participants.length < 2}
          startLabel={participants.length < 2 ? `배틀 시작 (${participants.length}/2명)` : '배틀 시작!'}
        />
      ) : (
        <div>
          <button onClick={createBattle} disabled={!benefit}
            className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
            ⚔️ 배틀 개설
          </button>
          <p className="text-gray-500 text-xs mt-2 text-center">위 설정으로 배틀을 개설합니다. 시청자가 후원으로 참가합니다.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Team Battle (팬 투표)
   ═══════════════════════════════════════════ */
function TeamBattleControl({ widget, onUpdate }: BattleControlProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const config = (widget.config || {}) as Record<string, unknown>;

  const [teamCount, setTeamCount] = useState((config.defaultTeamCount as number) || 2);
  const [teamNames, setTeamNames] = useState<string[]>((config.defaultTeamNames as string[]) || ['A팀', 'B팀']);
  const [timeLimit, setTimeLimit] = useState(String((config.defaultTimeLimit as number) ?? 300));
  const [activeBattle, setActiveBattle] = useState<any>(null);
  const [teams, setTeams] = useState<Record<number, { total: number; members: any[] }>>({});
  const [loading, setLoading] = useState(true);

  const saveConfig = async () => {
    const newConfig = {
      ...config,
      defaultTeamCount: teamCount,
      defaultTeamNames: teamNames.slice(0, teamCount),
      defaultTimeLimit: parseInt(timeLimit) || 300,
    };
    await supabase.from('widgets').update({ config: newConfig }).eq('id', widget.id);
    onUpdate();
    toast('설정이 저장되었습니다');
  };

  const updateTeamCount = (count: number) => {
    setTeamCount(count);
    const names = [...teamNames];
    while (names.length < count) names.push(`${String.fromCharCode(65 + names.length)}팀`);
    setTeamNames(names.slice(0, count));
  };

  useEffect(() => {
    supabase
      .from('team_battles')
      .select('*')
      .eq('streamer_id', widget.streamer_id)
      .in('status', ['recruiting', 'active'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      .then(async ({ data }) => {
        if (data) {
          setActiveBattle(data);
          setTeamCount(data.team_count || 2);
          setTeamNames(data.team_names || teamNames);
          setTimeLimit(String(data.time_limit));
          const { data: members } = await supabase
            .from('team_battle_members')
            .select('*')
            .eq('team_battle_id', data.id);
          if (members) {
            const teamsMap: Record<number, { total: number; members: any[] }> = {};
            for (let i = 0; i < (data.team_count || 2); i++) {
              const teamMembers = members.filter((m: any) => m.team_index === i);
              teamsMap[i] = {
                total: teamMembers.reduce((sum: number, m: any) => sum + (m.amount || 0), 0),
                members: teamMembers,
              };
            }
            setTeams(teamsMap);
          }
        }
        setLoading(false);
      });
  }, [widget.streamer_id]);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('streamer:subscribe' as any, widget.streamer_id);
    const updateHandler = (data: any) => { setActiveBattle(data.battle); setTeams(data.teams || {}); };
    const finishHandler = (data: any) => {
      setActiveBattle(null);
      setTeams({});
      const winName = data.team_names?.[data.winning_team] || `팀 ${data.winning_team + 1}`;
      toast(`팀 배틀 종료! 승리: ${winName}`);
    };
    socket.on('team_battle:update' as any, updateHandler);
    socket.on('team_battle:finished' as any, finishHandler);
    return () => { socket.off('team_battle:update' as any, updateHandler); socket.off('team_battle:finished' as any, finishHandler); };
  }, [widget.streamer_id]);

  const createBattle = async () => {
    await saveConfig();
    getSocket().emit('team_battle:create' as any, {
      streamer_id: widget.streamer_id,
      team_count: teamCount,
      team_names: teamNames.slice(0, teamCount),
      time_limit: parseInt(timeLimit),
    });
  };

  const startBattle = () => { if (activeBattle) getSocket().emit('team_battle:start' as any, activeBattle.id); };
  const cancelBattle = () => {
    if (!activeBattle) return;
    getSocket().emit('team_battle:cancel' as any, activeBattle.id);
    setActiveBattle(null);
    setTeams({});
  };

  if (loading) return <div className="text-gray-500 p-4">로딩 중...</div>;

  const isRecruiting = activeBattle?.status === 'recruiting';
  const isActive = activeBattle?.status === 'active';
  const EMOJIS = ['🔴', '🔵', '🟢', '🟡'];

  // Build participants list from teams
  const teamParticipants = Object.entries(teams).map(([idx, team]) => ({
    label: `${EMOJIS[Number(idx)] || ''} ${teamNames[Number(idx)] || `팀 ${Number(idx) + 1}`}`,
    value: `${team.total.toLocaleString()}원 (${team.members.length}명)`,
  }));

  const totalMembers = Object.values(teams).reduce((sum, t) => sum + t.members.length, 0);

  return (
    <div className="space-y-5">
      {/* Settings */}
      <SettingsSection title="팀 배틀 설정" disabled={isActive}>
        <div>
          <label className="block text-sm text-gray-400 mb-1">팀 수</label>
          <select value={teamCount} onChange={e => updateTeamCount(parseInt(e.target.value))} disabled={!!isActive}
            className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50">
            <option value={2}>2팀</option>
            <option value={3}>3팀</option>
            <option value={4}>4팀</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-2">팀 이름</label>
          <div className="space-y-2">
            {teamNames.slice(0, teamCount).map((name, i) => (
              <div key={i} className="flex items-center gap-2">
                <span>{EMOJIS[i]}</span>
                <input type="text" value={name}
                  onChange={e => { const n = [...teamNames]; n[i] = e.target.value; setTeamNames(n); }}
                  disabled={!!isActive}
                  className="flex-1 p-2 rounded-lg bg-gray-800 text-white text-sm disabled:opacity-50" />
              </div>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">제한 시간</label>
          <select value={timeLimit} onChange={e => setTimeLimit(e.target.value)} disabled={!!isActive}
            className="w-full p-3 rounded-lg bg-gray-800 text-white disabled:opacity-50">
            <option value="120">2분</option>
            <option value="180">3분</option>
            <option value="300">5분</option>
            <option value="600">10분</option>
          </select>
        </div>
        {!activeBattle && (
          <button onClick={saveConfig} className="w-full py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-600 text-gray-300">
            설정 저장
          </button>
        )}
      </SettingsSection>

      <div className="border-t border-gray-700" />

      {/* Battle Status */}
      {activeBattle ? (
        <ActiveBattleView
          status={activeBattle.status}
          info={`${teamCount}팀 · ${parseInt(timeLimit)}초`}
          participants={teamParticipants}
          onStart={isRecruiting ? startBattle : undefined}
          onCancel={cancelBattle}
          startDisabled={totalMembers < 2}
          startLabel={totalMembers < 2 ? `시작 (${totalMembers}/2명)` : '배틀 시작!'}
        />
      ) : (
        <div>
          <button onClick={createBattle}
            className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700">
            ⚔️ 팀 배틀 개설
          </button>
          <p className="text-gray-500 text-xs mt-2 text-center">후원 시 자동으로 팀에 배정됩니다.</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Tournament Mode (토너먼트)
   ═══════════════════════════════════════════ */
function TournamentControl({ widget, onUpdate }: BattleControlProps) {
  const { toast } = useToast();
  const config = (widget.config || {}) as Record<string, unknown>;
  const bracketSize = (config.bracketSize as number) || 4;
  const supabase = createClient();

  const [tournament, setTournament] = useState<TournamentState | null>(null);
  const [collecting, setCollecting] = useState(false);
  const [players, setPlayers] = useState<string[]>([]);

  // Listen for donations to fill player slots
  useEffect(() => {
    if (!collecting) return;
    const socket = getSocket();
    socket.emit('streamer:subscribe' as any, widget.streamer_id);
    const handler = (data: any) => {
      setPlayers(prev => {
        if (prev.includes(data.fan_nickname)) return prev;
        if (prev.length >= bracketSize) return prev;
        return [...prev, data.fan_nickname];
      });
    };
    socket.on('donation:new' as any, handler);
    return () => { socket.off('donation:new' as any, handler); };
  }, [collecting, widget.streamer_id, bracketSize]);

  const startCollecting = () => {
    setPlayers([]);
    setCollecting(true);
    setTournament(null);
    toast('참가자 모집 시작! 도네이션으로 참가합니다.');
  };

  const buildBracket = () => {
    if (players.length < bracketSize) {
      toast(`참가자가 부족합니다 (${players.length}/${bracketSize})`);
      return;
    }
    setCollecting(false);
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const firstRoundMatches: TournamentMatch[] = [];
    for (let i = 0; i < shuffled.length; i += 2) {
      firstRoundMatches.push({ player1: shuffled[i], player2: shuffled[i + 1], winner: null });
    }

    const totalRounds = Math.log2(bracketSize);
    const rounds: TournamentRound[] = [{ matches: firstRoundMatches }];
    let matchCount = firstRoundMatches.length / 2;
    for (let r = 1; r < totalRounds; r++) {
      const emptyMatches: TournamentMatch[] = [];
      for (let m = 0; m < matchCount; m++) {
        emptyMatches.push({ player1: '', player2: '', winner: null });
      }
      rounds.push({ matches: emptyMatches });
      matchCount = matchCount / 2;
    }

    setTournament({
      rounds,
      currentRound: 0,
      currentMatch: 0,
      bracketSize,
      players: shuffled,
      finished: false,
      champion: null,
    });
  };

  const startMatch = () => {
    if (!tournament) return;
    const match = tournament.rounds[tournament.currentRound].matches[tournament.currentMatch];
    if (!match.player1 || !match.player2) {
      toast('대진이 아직 준비되지 않았습니다');
      return;
    }
    const socket = getSocket();
    socket.emit('battle:create' as any, {
      streamer_id: widget.streamer_id,
      benefit: getRoundLabel(tournament.currentRound, tournament.currentMatch, bracketSize),
      min_amount: (config.defaultMinAmount as number) || 1000,
      time_limit: (config.defaultTimeLimit as number) || 180,
    });
    toast(`${match.player1} vs ${match.player2} 배틀 시작!`);

    // Emit tournament info to overlay
    socket.emit('tournament:update' as any, {
      streamer_id: widget.streamer_id,
      roundLabel: getRoundLabel(tournament.currentRound, tournament.currentMatch, bracketSize),
      tournament,
    });
  };

  const setMatchWinner = (winnerName: string) => {
    if (!tournament) return;
    const newTournament = { ...tournament };
    const rounds = newTournament.rounds.map(r => ({ ...r, matches: r.matches.map(m => ({ ...m })) }));

    rounds[tournament.currentRound].matches[tournament.currentMatch].winner = winnerName;

    // Advance winner to next round
    if (tournament.currentRound < rounds.length - 1) {
      const nextRound = rounds[tournament.currentRound + 1];
      const nextMatchIdx = Math.floor(tournament.currentMatch / 2);
      const slot = tournament.currentMatch % 2 === 0 ? 'player1' : 'player2';
      nextRound.matches[nextMatchIdx][slot] = winnerName;
    }

    // Find next match
    let nextRound = tournament.currentRound;
    let nextMatch = tournament.currentMatch + 1;

    if (nextMatch >= rounds[nextRound].matches.length) {
      nextRound++;
      nextMatch = 0;
    }

    const isFinished = nextRound >= rounds.length;

    setTournament({
      ...newTournament,
      rounds,
      currentRound: isFinished ? tournament.currentRound : nextRound,
      currentMatch: isFinished ? tournament.currentMatch : nextMatch,
      finished: isFinished,
      champion: isFinished ? winnerName : null,
    });

    if (isFinished) {
      toast(`토너먼트 우승: ${winnerName}!`);
      const socket = getSocket();
      socket.emit('tournament:champion' as any, {
        streamer_id: widget.streamer_id,
        champion: winnerName,
      });
    }
  };

  const resetTournament = () => {
    setTournament(null);
    setPlayers([]);
    setCollecting(false);
  };

  if (!tournament && !collecting) {
    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">토너먼트 모드</h4>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-sm">대진표: <span className="text-white font-bold">{bracketSize}강</span></p>
          </div>
        </div>
        <button onClick={startCollecting}
          className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700">
          &#x1F3C6; 토너먼트 참가자 모집
        </button>
        <p className="text-gray-500 text-xs text-center">도네이션으로 {bracketSize}명의 참가자를 모집합니다.</p>
      </div>
    );
  }

  if (collecting) {
    return (
      <div className="space-y-5">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">&#x1F3C6; 참가자 모집 중</h4>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-600">
            {players.length}/{bracketSize}
          </span>
        </div>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={i} className="flex justify-between bg-gray-800 rounded-lg p-3">
              <span className="font-bold text-white">#{i + 1} {p}</span>
            </div>
          ))}
          {players.length < bracketSize && (
            <p className="text-gray-500 text-sm text-center py-3">도네이션으로 참가 대기 중...</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={buildBracket} disabled={players.length < bracketSize}
            className="flex-1 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50">
            대진표 생성 ({players.length}/{bracketSize})
          </button>
          <button onClick={resetTournament}
            className="px-4 py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600">
            취소
          </button>
        </div>
      </div>
    );
  }

  // Tournament bracket view
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">&#x1F3C6; 토너먼트</h4>
        {tournament?.finished && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-600">완료</span>
        )}
      </div>

      {tournament?.champion && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
          <span className="text-3xl">&#x1F3C6;</span>
          <p className="text-yellow-400 font-bold text-xl mt-1">우승: {tournament.champion}</p>
        </div>
      )}

      {/* Bracket visualization */}
      <div className="space-y-4 overflow-x-auto">
        {tournament?.rounds.map((round, rIdx) => (
          <div key={rIdx}>
            <p className="text-xs text-gray-500 mb-2 font-bold">
              {getRoundLabel(rIdx, -1, bracketSize)}
            </p>
            <div className="space-y-2">
              {round.matches.map((match, mIdx) => {
                const isCurrent = !tournament.finished && rIdx === tournament.currentRound && mIdx === tournament.currentMatch;
                return (
                  <div key={mIdx} className={`rounded-lg p-3 ${isCurrent ? 'bg-purple-900/40 border border-purple-500' : 'bg-gray-800/50'}`}>
                    <div className="flex justify-between items-center text-sm">
                      <span className={`font-bold ${match.winner === match.player1 ? 'text-yellow-400' : match.player1 ? 'text-white' : 'text-gray-600'}`}>
                        {match.player1 || 'TBD'}
                      </span>
                      <span className="text-gray-600 text-xs">VS</span>
                      <span className={`font-bold ${match.winner === match.player2 ? 'text-yellow-400' : match.player2 ? 'text-white' : 'text-gray-600'}`}>
                        {match.player2 || 'TBD'}
                      </span>
                    </div>
                    {match.winner && (
                      <p className="text-xs text-yellow-400 text-center mt-1">&#x1F451; {match.winner}</p>
                    )}
                    {isCurrent && !match.winner && match.player1 && match.player2 && (
                      <div className="mt-2 space-y-2">
                        <button onClick={startMatch}
                          className="w-full py-2 bg-red-600 rounded text-xs font-bold hover:bg-red-700">
                          &#x26A1; 배틀 시작
                        </button>
                        <div className="flex gap-2">
                          <button onClick={() => setMatchWinner(match.player1)}
                            className="flex-1 py-1.5 bg-gray-700 rounded text-xs hover:bg-gray-600">
                            {match.player1} 승리
                          </button>
                          <button onClick={() => setMatchWinner(match.player2)}
                            className="flex-1 py-1.5 bg-gray-700 rounded text-xs hover:bg-gray-600">
                            {match.player2} 승리
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {tournament?.finished && (
        <button onClick={resetTournament}
          className="w-full py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600">
          토너먼트 초기화
        </button>
      )}
    </div>
  );
}

function getRoundLabel(roundIdx: number, matchIdx: number, bracketSize: number): string {
  const totalRounds = Math.log2(bracketSize);
  const roundFromEnd = totalRounds - roundIdx;
  if (roundFromEnd === 1) return matchIdx >= 0 ? '결승전' : '결승';
  if (roundFromEnd === 2) return matchIdx >= 0 ? `4강 ${matchIdx + 1}경기` : '4강';
  if (roundFromEnd === 3) return matchIdx >= 0 ? `8강 ${matchIdx + 1}경기` : '8강';
  return matchIdx >= 0 ? `${Math.pow(2, roundFromEnd)}강 ${matchIdx + 1}경기` : `${Math.pow(2, roundFromEnd)}강`;
}

/* ═══════════════════════════════════════════
   Shared Components
   ═══════════════════════════════════════════ */
function SettingsSection({ title, disabled, children }: { title: string; disabled?: boolean | null; children: React.ReactNode }) {
  return (
    <div className={`space-y-3 ${disabled ? 'opacity-60' : ''}`}>
      <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">{title}</h4>
      {children}
    </div>
  );
}

function ActiveBattleView({
  status, info, participants, onStart, onCancel, startDisabled, startLabel,
}: {
  status: string;
  info: string;
  participants: { label: string; value: string }[];
  onStart?: () => void;
  onCancel: () => void;
  startDisabled?: boolean;
  startLabel: string;
}) {
  const isRecruiting = status === 'recruiting';
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wide">
          {isRecruiting ? '⚔️ 모집 중' : '🔥 진행 중'}
        </h4>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${isRecruiting ? 'bg-yellow-600' : 'bg-red-600'}`}>
          {status}
        </span>
      </div>

      <div className="bg-gray-800/50 rounded-lg p-3">
        <p className="text-gray-400 text-sm">{info}</p>
      </div>

      <div className="space-y-2">
        {participants.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-3">참가자를 기다리는 중...</p>
        ) : (
          participants.map((p, i) => (
            <div key={i} className="flex justify-between bg-gray-800 rounded-lg p-3">
              <span className="font-bold">{p.label}</span>
              <span className="text-purple-400 font-bold">{p.value}</span>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-3">
        {onStart && (
          <button onClick={onStart} disabled={startDisabled}
            className="flex-1 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {startLabel}
          </button>
        )}
        <button onClick={onCancel}
          className={`${onStart ? 'px-4' : 'flex-1'} py-3 bg-gray-700 rounded-lg font-bold hover:bg-gray-600`}>
          {isRecruiting ? '취소' : '중단'}
        </button>
      </div>
    </div>
  );
}
