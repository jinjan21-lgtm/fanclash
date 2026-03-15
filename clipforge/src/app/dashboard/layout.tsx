import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/dashboard/Sidebar';
import type { Profile } from '@/types';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase.from('cf_profiles').select('*').eq('id', user.id).single();
    profile = data as Profile | null;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Sidebar profile={profile} />
      <main className="md:ml-64 min-h-screen">
        <div className="p-6 md:p-8 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
