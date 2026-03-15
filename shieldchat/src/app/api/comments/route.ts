import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { analyzeToxicity } from '@/lib/toxicity';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const body = await request.json();
  const { comments } = body as {
    comments: {
      content: string;
      author_name?: string;
      platform?: string;
      source_url?: string;
      author_url?: string;
    }[];
  };

  if (!comments || !Array.isArray(comments) || comments.length === 0) {
    return NextResponse.json({ error: '댓글 데이터가 필요합니다.' }, { status: 400 });
  }

  // Check free plan limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, reports_used_this_month')
    .eq('id', user.id)
    .single();

  if (profile?.plan === 'free') {
    const { count } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if ((count ?? 0) + comments.length > 100) {
      return NextResponse.json(
        { error: '무료 플랜은 최대 100건까지 저장할 수 있습니다. Pro로 업그레이드해주세요.' },
        { status: 403 }
      );
    }
  }

  const insertData = comments.map((c) => {
    const analysis = analyzeToxicity(c.content);
    return {
      user_id: user.id,
      content: c.content,
      author_name: c.author_name || null,
      author_url: c.author_url || null,
      platform: c.platform || null,
      source_url: c.source_url || null,
      severity: analysis.severity,
      category: analysis.category,
      ai_score: analysis.score,
    };
  });

  const { data, error } = await supabase
    .from('comments')
    .insert(insertData)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get('severity');
  const category = searchParams.get('category');
  const platform = searchParams.get('platform');

  let query = supabase
    .from('comments')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (severity) query = query.eq('severity', severity);
  if (category) query = query.eq('category', category);
  if (platform) query = query.eq('platform', platform);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data });
}
