import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function DELETE() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
  }

  const userId = user.id;

  try {
    // Delete user's data in order (respecting foreign key constraints)
    // 1. Donations
    await supabase.from('donations').delete().eq('streamer_id', userId);
    // 2. Widgets
    await supabase.from('widgets').delete().eq('streamer_id', userId);
    // 3. Integrations
    await supabase.from('integrations').delete().eq('streamer_id', userId);
    // 4. Donation goals
    await supabase.from('donation_goals').delete().eq('streamer_id', userId);
    // 5. Streamer record
    await supabase.from('streamers').delete().eq('id', userId);

    // Delete auth user via admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
      const adminClient = createAdminClient(supabaseUrl, serviceRoleKey);
      await adminClient.auth.admin.deleteUser(userId);
    } else {
      // If no service role key, sign the user out at minimum
      await supabase.auth.signOut();
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[Account Delete] Error:', err);
    return NextResponse.json(
      { error: '계정 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
