import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/export/highlights?streamerId=xxx&from=ISO&to=ISO
// Returns donation peaks (high-activity periods) as time ranges
// Algorithm: group donations by 1-minute windows, find windows with 3+ donations or total > 10000원
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const streamerId = searchParams.get('streamerId');
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  if (!streamerId) {
    return NextResponse.json({ error: 'streamerId is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Verify caller is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Build query
  let query = supabase
    .from('donations')
    .select('amount, created_at')
    .eq('streamer_id', streamerId)
    .order('created_at', { ascending: true });

  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data: donations, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!donations || donations.length === 0) {
    return NextResponse.json({ highlights: [] });
  }

  // Group donations by 1-minute windows
  const windows: Map<string, { count: number; total: number; start: Date; end: Date }> = new Map();

  for (const d of donations) {
    const ts = new Date(d.created_at);
    // Round down to the nearest minute
    const windowKey = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate(), ts.getHours(), ts.getMinutes()).toISOString();

    const existing = windows.get(windowKey);
    if (existing) {
      existing.count += 1;
      existing.total += d.amount;
      if (ts > existing.end) existing.end = ts;
    } else {
      windows.set(windowKey, {
        count: 1,
        total: d.amount,
        start: new Date(windowKey),
        end: ts,
      });
    }
  }

  // Find peak windows: 3+ donations or total > 10000원
  const peaks = Array.from(windows.values())
    .filter(w => w.count >= 3 || w.total > 10000)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  // Merge adjacent peak windows (within 2 minutes)
  const merged: typeof peaks = [];
  for (const peak of peaks) {
    const last = merged[merged.length - 1];
    if (last && peak.start.getTime() - last.end.getTime() <= 2 * 60 * 1000) {
      last.end = peak.end > last.end ? peak.end : last.end;
      last.count += peak.count;
      last.total += peak.total;
    } else {
      merged.push({ ...peak });
    }
  }

  // Extend each highlight to cover a meaningful range (at least 1 minute before and after)
  const highlights = merged.map(p => ({
    startTime: new Date(p.start.getTime() - 60 * 1000).toISOString(),
    endTime: new Date(p.end.getTime() + 60 * 1000).toISOString(),
    donationCount: p.count,
    totalAmount: p.total,
  }));

  return NextResponse.json({ highlights });
}
