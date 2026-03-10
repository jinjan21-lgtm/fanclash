'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('streamers').insert({ id: data.user.id, display_name: displayName });
    }
    setLoading(false);
    router.push('/dashboard');
  };

  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <form onSubmit={handleSignup} className="bg-gray-900 p-8 rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">FanClash 회원가입</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Social login buttons */}
        <div className="space-y-2">
          <button type="button" onClick={() => handleSocialLogin('kakao')}
            className="w-full p-3 rounded-lg bg-[#FEE500] text-[#191919] font-bold hover:bg-[#FDD800] flex items-center justify-center gap-2">
            <span>💬</span> 카카오로 시작하기
          </button>
          <button type="button" onClick={() => handleSocialLogin('google')}
            className="w-full p-3 rounded-lg bg-white text-gray-800 font-bold hover:bg-gray-100 flex items-center justify-center gap-2">
            <span>G</span> Google로 시작하기
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-xs">또는 이메일로</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <input type="text" placeholder="방송 닉네임" value={displayName} onChange={e => setDisplayName(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required />
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required minLength={6} />
        <button type="submit" disabled={loading}
          className="w-full p-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50">
          {loading ? '가입 중...' : '가입하기'}
        </button>
        <p className="text-gray-400 text-center text-sm">
          이미 계정이 있으신가요? <Link href="/login" className="text-purple-400 hover:underline">로그인</Link>
        </p>
      </form>
    </div>
  );
}
