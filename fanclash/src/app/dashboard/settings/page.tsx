'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState('free');
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

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
        setReferralCode(streamer.referral_code || '');
      }
      // Count referrals
      const { count } = await supabase
        .from('streamers')
        .select('id', { count: 'exact', head: true })
        .eq('referred_by', user.id);
      setReferralCount(count || 0);
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

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' });
      if (res.ok) {
        toast('계정이 삭제되었습니다');
        router.push('/');
      } else {
        const data = await res.json();
        toast(data.error || '계정 삭제에 실패했습니다', 'error');
      }
    } catch {
      toast('계정 삭제 중 오류가 발생했습니다', 'error');
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handlePasswordReset = async () => {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email);
    toast('비밀번호 재설정 이메일을 보냈습니다');
  };

  if (loading) return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-800 rounded-lg mb-6" />
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="h-5 w-32 bg-gray-800 rounded mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-800 rounded" />
              <div className="h-10 bg-gray-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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

        {/* Referral */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h3 className="font-bold text-lg mb-4">초대 프로그램</h3>
          <p className="text-gray-400 text-sm mb-4">
            친구를 초대하면 함께 성장할 수 있어요!
          </p>
          {referralCode && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">내 초대 링크</label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${referralCode}` : ''}
                    className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700 whitespace-nowrap"
                  >
                    {copied ? '복사됨!' : '복사'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">{referralCount}</p>
                  <p className="text-xs text-gray-500">초대한 스트리머</p>
                </div>
              </div>
            </div>
          )}
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
          <h3 className="font-bold text-lg mb-2 text-red-400">계정 삭제</h3>
          <p className="text-gray-500 text-sm mb-3">
            계정을 삭제하면 모든 위젯, 후원 데이터, 연동 정보가 영구적으로 제거됩니다.
            이 작업은 되돌릴 수 없습니다.
          </p>
          <button
            className="w-full py-2.5 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-400 hover:bg-red-900/50"
            disabled={deleting}
            onClick={() => setShowDeleteConfirm(true)}
          >
            {deleting ? '삭제 중...' : '계정 삭제'}
          </button>
        </div>
      </div>

      {showDeleteConfirm && (
        <ConfirmModal
          title="계정 삭제"
          message="정말로 계정을 삭제하시겠습니까? 모든 위젯, 후원 데이터, 연동 정보가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          variant="danger"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}
