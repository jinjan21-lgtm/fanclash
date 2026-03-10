import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { handleDonation } from './handlers/donation';
import { handleBattle } from './handlers/battle';
import { IntegrationManager } from './connectors/manager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const io = new Server({
  cors: { origin: '*' },
});

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('widget:subscribe', async (widgetId: string) => {
    const { data: widget } = await supabase
      .from('widgets').select('streamer_id').eq('id', widgetId).single();
    if (widget) {
      socket.join(`streamer:${widget.streamer_id}`);
    }
  });

  handleDonation(io, socket, supabase);
  handleBattle(io, socket, supabase);

  socket.on('integration:start' as any, async (data: { integration_id: string; streamer_id: string; platform: string; config: Record<string, string> }) => {
    await integrationManager.startIntegration(data.integration_id, data.streamer_id, data.platform, data.config);
  });

  socket.on('integration:stop' as any, async (data: { integration_id: string }) => {
    await integrationManager.stopIntegration(data.integration_id);
  });

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
io.listen(Number(PORT));
console.log(`Socket.io server running on port ${PORT}`);

// Integration manager for auto-donation
const integrationManager = new IntegrationManager(io as any, supabase);
integrationManager.loadAllIntegrations();
