import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const refCode = searchParams.get('ref');
  const redirectUrl = new URL('/dashboard', request.url);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

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
        // Look up referrer by referral code
        let referredBy: string | null = null;
        if (refCode) {
          const { data: referrer } = await supabase
            .from('streamers')
            .select('id')
            .eq('referral_code', refCode)
            .single();
          if (referrer) referredBy = referrer.id;
        }
        await supabase.from('streamers').insert({
          id: data.user.id,
          display_name: displayName,
          ...(referredBy && { referred_by: referredBy }),
        });
      }
    }
  }

  return NextResponse.redirect(redirectUrl);
}
