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
import { handleTeamBattle } from './handlers/team-battle';
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
const httpServer = createServer((req, res) => {
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
  handleTeamBattle(io, socket, supabase);

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

