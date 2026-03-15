'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase-browser';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || email.split('@')[0] },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
        <div className="w-full max-w-md text-center">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
            <div className="text-4xl mb-4">📧</div>
            <h2 className="text-xl font-bold text-white mb-2">이메일을 확인해주세요</h2>
            <p className="text-gray-400 text-sm mb-4">
              {email}로 인증 메일을 보냈습니다.<br />
              이메일의 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <Link href="/login" className="text-rose-400 hover:text-rose-300 text-sm">
              로그인 페이지로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-950">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold text-rose-500">ShieldChat</Link>
          <p className="text-gray-400 mt-2">회원가입</p>
        </div>

        <form onSubmit={handleSignup} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-400 mb-1">닉네임</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
              placeholder="선택사항"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-rose-500 transition"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">6자 이상</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>

          <p className="text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-rose-400 hover:text-rose-300">로그인</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
