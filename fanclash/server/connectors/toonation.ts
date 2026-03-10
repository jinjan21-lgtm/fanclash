import { io as ioV4 } from 'socket.io-client';

// Toonation uses Socket.IO for their alertbox
// We connect to their alertbox WebSocket endpoint

export interface ToonationDonation {
  nickname: string;
  amount: number;
  message: string;
}

type DonationCallback = (donation: ToonationDonation) => void;

export class ToonationConnector {
  private socket: any = null;
  private alertboxKey: string;
  private onDonation: DonationCallback;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(alertboxKey: string, onDonation: DonationCallback) {
    this.alertboxKey = alertboxKey;
    this.onDonation = onDonation;
  }

  connect() {
    try {
      // Toonation alertbox uses Socket.IO
      // Connect to their widget endpoint
      this.socket = ioV4(`https://toon.at`, {
        path: '/widget/alertbox',
        transports: ['websocket'],
        query: { alertbox_key: this.alertboxKey },
      });

      this.socket.on('connect', () => {
        console.log(`[Toonation] Connected with key: ${this.alertboxKey.substring(0, 8)}...`);
        // Emit the alertbox key to start receiving events
        this.socket.emit('join', this.alertboxKey);
      });

      // Listen for donation events
      this.socket.on('message', (data: any) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (parsed && parsed.amount) {
            this.onDonation({
              nickname: parsed.name || parsed.nickname || '익명',
              amount: parseInt(parsed.amount) || 0,
              message: parsed.message || parsed.comment || '',
            });
          }
        } catch (e) {
          // Try other event formats
        }
      });

      // Some Toonation events come as 'alert' type
      this.socket.on('alert', (data: any) => {
        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          if (parsed && parsed.amount) {
            this.onDonation({
              nickname: parsed.name || parsed.nickname || '익명',
              amount: parseInt(parsed.amount) || 0,
              message: parsed.message || parsed.comment || '',
            });
          }
        } catch (e) {
          console.error('[Toonation] Parse error:', e);
        }
      });

      // Keepalive ping every 25 seconds
      this.pingInterval = setInterval(() => {
        if (this.socket?.connected) {
          this.socket.emit('ping');
        }
      }, 25000);

      this.socket.on('disconnect', () => {
        console.log('[Toonation] Disconnected');
      });

      this.socket.on('error', (err: any) => {
        console.error('[Toonation] Error:', err);
      });

    } catch (err) {
      console.error('[Toonation] Connection failed:', err);
    }
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log('[Toonation] Disconnected');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
