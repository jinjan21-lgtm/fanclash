'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase-browser';
import type { Profile } from '@/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('sc_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setDisplayName(data.display_name || '');
      }
      setLoading(false);
    };
    load();
  }, [supabase]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('sc_profiles')
      .update({ display_name: displayName.trim() })
      .eq('id', profile.id);

    if (error) {
      setMessage('저장에 실패했습니다.');
    } else {
      setMessage('저장되었습니다.');
      setProfile({ ...profile, display_name: displayName.trim() });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-6">설정</h1>

      {/* Profile */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">프로필</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일</label>
            <p className="text-gray-300">{profile?.email}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">닉네임</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm rounded-lg transition disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            {message && (
              <span className={`text-sm ${message.includes('실패') ? 'text-red-400' : 'text-green-400'}`}>
                {message}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Plan */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">플랜</h2>
        <div className="flex items-center gap-3 mb-4">
          <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
            profile?.plan === 'pro'
              ? 'bg-rose-600 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}>
            {profile?.plan === 'pro' ? 'Pro' : 'Free'}
          </span>
        </div>

        {profile?.plan === 'free' && (
          <div className="text-sm text-gray-400 space-y-1">
            <p>무료 플랜: 최대 100건 댓글 저장</p>
            <p>더 많은 기능이 필요하시면 Pro로 업그레이드하세요.</p>
            <a
              href="/dashboard/pricing"
              className="inline-block mt-2 text-rose-400 hover:text-rose-300"
            >
              Pro 플랜 보기 &rarr;
            </a>
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">이용 현황</h2>
        <div className="text-sm text-gray-400">
          <p>이번 달 리포트 생성: {profile?.reports_used_this_month ?? 0}건</p>
          <p className="text-gray-600 text-xs mt-1">
            가입일: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('ko-KR') : '-'}
          </p>
        </div>
      </div>

      {/* 진크루 서비스 */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">진크루 서비스</h2>
        <p className="text-gray-400 text-sm mb-4">같은 계정으로 모든 서비스를 이용할 수 있습니다</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <a href="https://fanclash.vercel.app" target="_blank"
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <span className="text-2xl">🎮</span>
            <div>
              <p className="font-medium text-purple-400">FanClash</p>
              <p className="text-xs text-gray-500">도네이션 이벤트 엔터테인먼트</p>
            </div>
          </a>
          <a href="https://clipforge.vercel.app" target="_blank"
            className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition">
            <span className="text-2xl">🎬</span>
            <div>
              <p className="font-medium text-emerald-400">ClipForge</p>
              <p className="text-xs text-gray-500">방송 하이라이트 → 숏폼</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
