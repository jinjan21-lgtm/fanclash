import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ seasonId: string }> }) {
  const { seasonId } = await params;
  const supabase = await createClient();

  const { data: rankings } = await supabase
    .from('season_rankings')
    .select('fan_nickname, total_donated, rank')
    .eq('season_id', seasonId)
    .order('rank', { ascending: true });

  return NextResponse.json(rankings || []);
}
