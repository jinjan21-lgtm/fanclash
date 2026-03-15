import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const streamerId = searchParams.get('id');

  if (!streamerId) {
    return new Response('Missing id', { status: 400 });
  }

  // Note: edge runtime can't use the server supabase client directly
  // Use fetch to Supabase REST API instead
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // Fetch streamer
  const streamerRes = await fetch(
    `${supabaseUrl}/rest/v1/streamers?id=eq.${streamerId}&select=display_name`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const streamers = await streamerRes.json();
  const streamerName = streamers?.[0]?.display_name || '스트리머';

  // Fetch top 5 fans
  const fansRes = await fetch(
    `${supabaseUrl}/rest/v1/fan_profiles?streamer_id=eq.${streamerId}&select=nickname,total_donated,title&order=total_donated.desc&limit=5`,
    { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
  );
  const fans = await fansRes.json();

  const medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}', '4', '5'];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
          padding: '60px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '48px', fontWeight: 'bold' }}>{streamerName}</span>
            <span style={{ fontSize: '24px', color: '#a78bfa', marginTop: '8px' }}>팬 랭킹 TOP 5</span>
          </div>
          <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#a78bfa' }}>FanClash</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          {(fans || []).map((fan: { nickname: string; total_donated: number; title: string }, i: number) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                background: i === 0 ? 'rgba(167, 139, 250, 0.15)' : 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px 28px',
                border: i === 0 ? '2px solid rgba(167, 139, 250, 0.3)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <span style={{ fontSize: '32px', width: '50px' }}>{medals[i]}</span>
              <span style={{ fontSize: '28px', fontWeight: 'bold', flex: 1 }}>{fan.nickname}</span>
              <span style={{ fontSize: '24px', color: '#a78bfa', fontWeight: 'bold' }}>
                {fan.total_donated.toLocaleString()}원
              </span>
            </div>
          ))}
          {(!fans || fans.length === 0) && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, fontSize: '28px', color: '#6b7280' }}>
              아직 후원 기록이 없습니다
            </div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <span style={{ fontSize: '18px', color: '#6b7280' }}>fanclash.co.kr</span>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
