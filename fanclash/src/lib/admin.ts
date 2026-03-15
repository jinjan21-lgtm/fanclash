import { createClient } from '@/lib/supabase/server';

const ADMIN_EMAILS = ['jinjan21@naver.com'];

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return false;

  // Check hardcoded list first (fallback)
  if (ADMIN_EMAILS.includes(user.email)) return true;

  // Check DB
  const { data } = await supabase.from('admin_users').select('email').eq('email', user.email).single();
  return !!data;
}

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('site_settings').select('value').eq('key', key).single();
  return data?.value as T ?? null;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const supabase = await createClient();
  await supabase.from('site_settings').upsert({
    key,
    value,
    updated_at: new Date().toISOString(),
  });
}
