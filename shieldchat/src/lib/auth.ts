import { createSupabaseServer } from './supabase-server';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  return data;
}
