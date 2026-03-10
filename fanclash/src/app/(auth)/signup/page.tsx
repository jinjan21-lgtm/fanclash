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
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); return; }
    if (data.user) {
      await supabase.from('streamers').insert({ id: data.user.id, display_name: displayName });
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form onSubmit={handleSignup} className="bg-gray-900 p-8 rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">FanClash 회원가입</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input type="text" placeholder="방송 닉네임" value={displayName} onChange={e => setDisplayName(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required />
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required minLength={6} />
        <button type="submit" className="w-full p-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700">
          가입하기
        </button>
        <p className="text-gray-400 text-center text-sm">
          이미 계정이 있으신가요? <Link href="/login" className="text-purple-400 hover:underline">로그인</Link>
        </p>
      </form>
    </div>
  );
}
