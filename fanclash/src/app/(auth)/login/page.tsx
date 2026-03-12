'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    // Hard navigation to ensure middleware picks up new session cookies
    window.location.href = '/dashboard';
  };

  const handleSocialLogin = async (provider: 'kakao' | 'google') => {
    if (provider === 'kakao') {
      alert('카카오 로그인은 준비 중입니다. Google 로그인을 이용해주세요.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">FanClash 로그인</h1>
        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

        {/* Social login buttons */}
        <div className="space-y-2">
          <button type="button" onClick={() => handleSocialLogin('kakao')}
            className="w-full p-3 rounded-lg bg-[#FEE500] text-[#191919] font-bold hover:bg-[#FDD800] flex items-center justify-center gap-2">
            <span>💬</span> 카카오로 로그인
          </button>
          <button type="button" onClick={() => handleSocialLogin('google')}
            className="w-full p-3 rounded-lg bg-white text-gray-800 font-bold hover:bg-gray-100 flex items-center justify-center gap-2">
            <span>G</span> Google로 로그인
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-700" />
          <span className="text-gray-500 text-xs">또는 이메일로</span>
          <div className="flex-1 h-px bg-gray-700" />
        </div>

        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-purple-500 focus:outline-none" required />
        <button type="submit" disabled={loading}
          className="w-full p-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 disabled:opacity-50">
          {loading ? '로그인 중...' : '로그인'}
        </button>
        <p className="text-gray-400 text-center text-sm">
          계정이 없으신가요? <Link href="/signup" className="text-purple-400 hover:underline">회원가입</Link>
        </p>
      </form>
    </div>
  );
}
