'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data: streamer } = await supabase.from('streamers').select('*').eq('id', user.id).single();
      if (streamer) {
        setDisplayName(streamer.display_name || '');
        setChannelUrl(streamer.channel_url || '');
        setPlan(streamer.plan || 'free');
      }
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('streamers').update({
      display_name: displayName,
      channel_url: channelUrl || null,
    }).eq('id', user.id);
    setSaving(false);
    toast('프로필이 저장되었습니다');
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email);
    toast('비밀번호 재설정 이메일을 보냈습니다');
  };

  if (loading) {
    return <div className="text-gray-500">로딩 중...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">프로필 설정</h2>

      <div className="max-w-lg space-y-6">
        {/* Profile section */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-4">기본 정보</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">이메일</label>
              <input
                readOnly
                value={email}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">닉네임 (방송 표시명)</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="방송에서 사용할 이름"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">채널 URL (선택)</label>
              <input
                type="url"
                value={channelUrl}
                onChange={e => setChannelUrl(e.target.value)}
                placeholder="https://chzzk.naver.com/your-channel"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-1">치지직, 숲, 틱톡 등 채널 링크</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-2.5 bg-purple-600 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>

        {/* Plan info */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-2">요금제</h3>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${plan === 'pro' ? 'bg-purple-600' : 'bg-gray-700'}`}>
              {plan === 'pro' ? 'Pro' : 'Free'}
            </span>
            <span className="text-gray-400 text-sm">
              {plan === 'pro' ? '모든 기능 이용 가능' : '위젯 3개 제한'}
            </span>
          </div>
        </div>

        {/* Security */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-4">보안</h3>
          <button
            onClick={handlePasswordReset}
            className="w-full py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-sm hover:bg-gray-700"
          >
            비밀번호 재설정 이메일 보내기
          </button>
        </div>

        {/* Danger zone */}
        <div className="bg-gray-900 rounded-xl p-6 border border-red-900/50">
          <h3 className="font-bold text-lg mb-2 text-red-400">위험 구역</h3>
          <p className="text-gray-500 text-sm mb-3">계정을 삭제하면 모든 데이터가 영구적으로 제거됩니다.</p>
          <button
            className="w-full py-2.5 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400 hover:bg-red-900/50"
            onClick={() => toast('계정 삭제는 support@fanclash.com으로 요청해주세요')}
          >
            계정 삭제 요청
          </button>
        </div>
      </div>
    </div>
  );
}
