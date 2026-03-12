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

export default function BattleControl({ widget, onUpdate }: BattleControlProps) {
  if (widget.type === 'team_battle') {
    return <TeamBattleControl widget={widget} onUpdate={onUpdate} />;
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
