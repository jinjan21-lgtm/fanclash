import { io } from 'socket.io-client';

export interface StreamlabsDonation {
  nickname: string;
  amount: number;
  currency: string;
  message: string;
}

type DonationCallback = (donation: StreamlabsDonation) => void;

// Rough currency to KRW conversion
const CURRENCY_TO_KRW: Record<string, number> = {
  USD: 1350,
  EUR: 1450,
  GBP: 1700,
  JPY: 9,
  KRW: 1,
};

export class StreamlabsConnector {
  private socket: any = null;
  private socketToken: string;
  private onDonation: DonationCallback;

  constructor(socketToken: string, onDonation: DonationCallback) {
    this.socketToken = socketToken;
    this.onDonation = onDonation;
  }

  connect() {
    try {
      this.socket = io(`https://sockets.streamlabs.com?token=${this.socketToken}`, {
        transports: ['websocket'],
      });

      this.socket.on('connect', () => {
        console.log('[Streamlabs] Connected');
      });

      this.socket.on('event', (eventData: any) => {
        if (eventData.type === 'donation') {
          const messages = eventData.message || [];
          for (const msg of messages) {
            const currency = (msg.currency || 'USD').toUpperCase();
            const rawAmount = parseFloat(msg.amount) || 0;
            const krwRate = CURRENCY_TO_KRW[currency] || 1350;

            this.onDonation({
              nickname: msg.from || msg.name || '익명',
              amount: Math.round(rawAmount * krwRate),
              currency: currency,
              message: msg.message || '',
            });
          }
        }
      });

      this.socket.on('disconnect', () => {
        console.log('[Streamlabs] Disconnected');
      });

      this.socket.on('error', (err: any) => {
        console.error('[Streamlabs] Error:', err);
      });

    } catch (err) {
      console.error('[Streamlabs] Connection failed:', err);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    console.log('[Streamlabs] Disconnected');
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}
