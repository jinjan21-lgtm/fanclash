import { config } from 'dotenv';
import { resolve } from 'path';
// Load .env.local for local dev; Railway injects env vars directly
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '.env.local') });

import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { handleDonation, handleDonationDirect } from './handlers/donation';
import { handleBattle } from './handlers/battle';
import { IntegrationManager } from './connectors/manager';

// Validate required environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CORS_ORIGIN = process.env.CORS_ORIGIN;
const SERVER_SECRET = process.env.SOCKET_SERVER_SECRET;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  process.exit(1);
}
if (!CORS_ORIGIN) {
  console.error('FATAL: CORS_ORIGIN is required (comma-separated list of allowed origins)');
  process.exit(1);
}
if (!SERVER_SECRET) {
  console.error('FATAL: SOCKET_SERVER_SECRET is required for /emit endpoint security');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// HTTP server for both Socket.IO and REST endpoints
const httpServer = createServer(async (req, res) => {
  // CORS headers - only allow explicitly configured origins
  const origin = req.headers.origin || '';
  const allowedOrigins = CORS_ORIGIN.split(',').map(s => s.trim());
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  // Debug: TikTok connectivity test
  if (req.method === 'GET' && req.url?.startsWith('/debug/tiktok')) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const username = url.searchParams.get('user') || '.ventress';
    res.writeHead(200, { 'Content-Type': 'application/json' });

    const results: Record<string, any> = {};

    // 1. Server IP & region
    try {
      const ipRes = await fetch('https://ipinfo.io/json');
      results.serverInfo = await ipRes.json();
    } catch (e: any) {
      results.serverInfo = { error: e.message };
    }

    // 2. Can we reach TikTok at all?
    try {
      const tiktokRes = await fetch(`https://www.tiktok.com/@${username}/live`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      });
      results.tiktokFetch = {
        status: tiktokRes.status,
        headers: Object.fromEntries(tiktokRes.headers.entries()),
        bodyPreview: (await tiktokRes.text()).substring(0, 500),
      };
    } catch (e: any) {
      results.tiktokFetch = { error: e.message };
    }

    // 3. Try tiktok-live-connector
    try {
      const { WebcastPushConnection } = require('tiktok-live-connector');
      const conn = new WebcastPushConnection(username, { enableExtendedGiftInfo: true });
      await Promise.race([
        conn.connect().then(() => {
          results.connector = { success: true, message: 'Connected!' };
          conn.disconnect();
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 10s')), 10000)),
      ]);
    } catch (e: any) {
      results.connector = {
        success: false,
        message: e.message || String(e),
        errors: e.errors?.map((err: any) => err.message || String(err)),
      };
    }

    res.end(JSON.stringify(results, null, 2));
    return;
  }

  // POST /emit - server-to-server donation event
  if (req.method === 'POST' && req.url === '/emit') {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${SERVER_SECRET}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', async () => {
      try {
        const { event, data } = JSON.parse(body);
        if (!event || !data) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing event or data' }));
          return;
        }

        if (event === 'donation:add' && data.streamer_id) {
          await handleDonationDirect(io, supabase, data);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end();
});

const corsOrigins = CORS_ORIGIN.split(',').map(s => s.trim());

const io = new Server(httpServer, {
  cors: { origin: corsOrigins },
});

io.on('connection', (socket) => {
  // connection logged for debugging

  socket.on('widget:subscribe', async (widgetId: string) => {
    const { data: widget } = await supabase
      .from('widgets').select('streamer_id').eq('id', widgetId).single();
    if (widget) {
      socket.join(`streamer:${widget.streamer_id}`);
    }
  });

  socket.on('streamer:subscribe', (streamerId: string) => {
    socket.join(`streamer:${streamerId}`);
  });

  handleDonation(io, socket, supabase);
  handleBattle(io, socket, supabase);

  socket.on('integration:start' as any, async (data: { integration_id: string; streamer_id: string; platform: string; config: Record<string, string> }) => {
    try {
      await integrationManager.startIntegration(data.integration_id, data.streamer_id, data.platform, data.config);
    } catch (err: any) {
      socket.emit('integration:error', {
        integration_id: data.integration_id,
        platform: data.platform,
        message: err?.message || 'Connection failed',
      });
    }
  });

  socket.on('integration:stop' as any, async (data: { integration_id: string }) => {
    await integrationManager.stopIntegration(data.integration_id);
  });

  socket.on('disconnect', () => {
    // disconnection logged for debugging
  });
});

const PORT = process.env.PORT || process.env.SOCKET_PORT || 3001;
httpServer.listen(Number(PORT), () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Integration manager for auto-donation
const integrationManager = new IntegrationManager(io as any, supabase);
integrationManager.loadAllIntegrations();

// Debug: log server IP and test TikTok connectivity on startup
(async () => {
  try {
    const ipRes = await fetch('https://ipinfo.io/json');
    const ipInfo = await ipRes.json();
    console.log('[DEBUG] Server IP info:', JSON.stringify(ipInfo));
  } catch (e: any) {
    console.log('[DEBUG] Failed to get IP info:', e.message);
  }

  try {
    const tiktokRes = await fetch('https://www.tiktok.com/@.ventress/live', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    console.log('[DEBUG] TikTok fetch status:', tiktokRes.status);
    const body = await tiktokRes.text();
    console.log('[DEBUG] TikTok response length:', body.length);
    console.log('[DEBUG] Has SIGI_STATE:', body.includes('SIGI_STATE'));
    console.log('[DEBUG] Has LiveRoom:', body.includes('LiveRoom'));
    const sigiMatch = body.match(/<script id="SIGI_STATE" type="application\/json">(.*?)<\/script>/);
    if (sigiMatch) {
      try {
        const sigi = JSON.parse(sigiMatch[1]);
        const liveRoom = sigi?.LiveRoom;
        console.log('[DEBUG] LiveRoom keys:', liveRoom ? Object.keys(liveRoom) : 'null');
        console.log('[DEBUG] liveRoomUserInfo exists:', !!liveRoom?.liveRoomUserInfo);
        if (liveRoom?.liveRoomUserInfo) {
          console.log('[DEBUG] liveRoomUserInfo keys:', Object.keys(liveRoom.liveRoomUserInfo));
        } else {
          console.log('[DEBUG] LiveRoom content (first 500 chars):', JSON.stringify(liveRoom).substring(0, 500));
        }
      } catch (e: any) {
        console.log('[DEBUG] Failed to parse SIGI_STATE:', e.message);
      }
    }
  } catch (e: any) {
    console.log('[DEBUG] TikTok fetch failed:', e.message);
  }

  // Test actual library connection to .ventress
  try {
    const { WebcastPushConnection } = require('tiktok-live-connector');
    console.log('[DEBUG] Testing tiktok-live-connector with .ventress...');
    const testConn = new WebcastPushConnection('.ventress', { enableExtendedGiftInfo: true });

    testConn.on('error', (err: any) => {
      console.log('[DEBUG] Library error event:', JSON.stringify({ info: err?.info, message: err?.exception?.message || err?.message }));
    });

    await Promise.race([
      testConn.connect().then(() => {
        console.log('[DEBUG] Library .ventress: CONNECTED!');
        testConn.disconnect();
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 15s')), 15000)),
    ]);
  } catch (e: any) {
    console.log('[DEBUG] Library .ventress FAILED:', e.message || String(e));
    if (e.errors) {
      e.errors.forEach((err: any, i: number) => {
        console.log(`[DEBUG] Library error[${i}]:`, err.message || String(err));
      });
    }
  }
})();
