import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data } = await supabase.auth.exchangeCodeForSession(code);

    // Auto-create streamer record for OAuth users
    if (data?.user) {
      const { data: existing } = await supabase
        .from('streamers')
        .select('id')
        .eq('id', data.user.id)
        .single();

      if (!existing) {
        const displayName =
          data.user.user_metadata?.full_name ||
          data.user.user_metadata?.name ||
          data.user.email?.split('@')[0] ||
          '스트리머';
        await supabase.from('streamers').insert({
          id: data.user.id,
          display_name: displayName,
        });
      }
    }
  }

  return NextResponse.redirect(new URL('/dashboard', request.url));
}
