import { createSupabaseServer } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

// Korean common/stop words to filter out
const STOP_WORDS = new Set([
  '이', '그', '저', '것', '수', '등', '좀', '더', '안', '못', '잘', '다', '매우',
  '아', '어', '음', '응', '네', '예', '아니', '뭐', '왜', '어디', '누구', '언제',
  '하다', '되다', '있다', '없다', '않다', '같다', '보다', '주다', '가다', '오다',
  '을', '를', '에', '의', '와', '과', '도', '는', '은', '가', '이', '로', '으로',
  '에서', '까지', '부터', '한', '된', '할', '하는', '들', '및', '대', '중',
  'the', 'a', 'is', 'are', 'was', 'be', 'to', 'of', 'and', 'in', 'that', 'it',
]);

export async function GET() {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all comments for this user
    const { data: comments, error } = await supabase
      .from('sc_comments')
      .select('id, content, severity, category, author_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allComments = comments ?? [];

    // 1. Hourly distribution (0-23)
    const hourlyDistribution: number[] = new Array(24).fill(0);
    const toxicComments = allComments.filter(c =>
      c.severity === 'medium' || c.severity === 'high' || c.severity === 'critical'
    );
    toxicComments.forEach(c => {
      const hour = new Date(c.created_at).getHours();
      hourlyDistribution[hour]++;
    });

    // 2. Daily trend (last 7 days)
    const dailyTrend: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const count = allComments.filter(c => {
        const cDate = new Date(c.created_at).toISOString().slice(0, 10);
        return cDate === dateStr && (c.severity === 'high' || c.severity === 'critical');
      }).length;
      dailyTrend.push({ date: dateStr, count });
    }

    // 3. Top attackers (by author_name)
    const authorMap: Record<string, { count: number; severities: Record<string, number> }> = {};
    toxicComments.forEach(c => {
      const name = c.author_name || '익명';
      if (!authorMap[name]) authorMap[name] = { count: 0, severities: {} };
      authorMap[name].count++;
      const sev = c.severity || 'low';
      authorMap[name].severities[sev] = (authorMap[name].severities[sev] || 0) + 1;
    });
    const topAuthors = Object.entries(authorMap)
      .map(([name, data]) => {
        const topSeverity = Object.entries(data.severities)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || 'low';
        return { name, count: data.count, topSeverity };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Keyword frequency
    const wordMap: Record<string, number> = {};
    toxicComments.forEach(c => {
      const words = c.content
        .replace(/[^\w\sㄱ-ㅎ가-힣]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length >= 2 && !STOP_WORDS.has(w));
      words.forEach((w: string) => {
        wordMap[w] = (wordMap[w] || 0) + 1;
      });
    });
    const topKeywords = Object.entries(wordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return NextResponse.json({
      hourlyDistribution,
      dailyTrend,
      topAuthors,
      topKeywords,
      totalToxic: toxicComments.length,
      totalComments: allComments.length,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
