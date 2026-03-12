// @ts-nocheck
// TikTok-Live-Connector types are not perfect, so we suppress some TS errors

let WebcastPushConnection: any;
try {
  const mod = require('tiktok-live-connector');
  WebcastPushConnection = mod.WebcastPushConnection;
} catch (e) {
  console.warn('[TikTok] tiktok-live-connector not available');
}

export interface TiktokGift {
  nickname: string;
  giftName: string;
  diamondCount: number;
  repeatCount: number;
  amount: number; // converted to KRW estimate
}

type GiftCallback = (gift: TiktokGift) => void;
type DisconnectCallback = () => void;

// Rough diamond to KRW conversion (1 diamond ≈ 7 KRW)
const DIAMOND_TO_KRW = 7;

export class TiktokConnector {
  private connection: any = null;
  private username: string;
  private onGift: GiftCallback;
  private onDisconnect: DisconnectCallback | null = null;
  private _connected = false;

  constructor(username: string, onGift: GiftCallback) {
    // Remove @ if present
    this.username = username.replace('@', '');
    this.onGift = onGift;
  }

  setOnDisconnect(cb: DisconnectCallback) {
    this.onDisconnect = cb;
  }

  async connect() {
    if (!WebcastPushConnection) {
      throw new Error('tiktok-live-connector not installed');
    }

    this.connection = new WebcastPushConnection(this.username, {
      enableExtendedGiftInfo: true,
    });

    this.connection.on('gift', (data: any) => {
      // Only process when gift streak ends (repeatEnd: true) or non-streak gifts
      if (data.repeatEnd || !data.gift?.repeat_end) {
        const diamondCount = data.diamondCount || data.gift?.diamond_count || 0;
        const repeatCount = data.repeatCount || 1;
        const totalDiamonds = diamondCount * repeatCount;

        this.onGift({
          nickname: data.nickname || data.uniqueId || '익명',
          giftName: data.giftName || data.gift?.name || 'Gift',
          diamondCount: totalDiamonds,
          repeatCount: repeatCount,
          amount: Math.round(totalDiamonds * DIAMOND_TO_KRW),
        });
      }
    });

    this.connection.on('connected', () => {
      console.log(`[TikTok] Connected to @${this.username}`);
      this._connected = true;
    });

    this.connection.on('disconnected', () => {
      console.log(`[TikTok] Disconnected from @${this.username}`);
      this._connected = false;
      this.onDisconnect?.();
    });

    this.connection.on('error', (err: any) => {
      console.error('[TikTok] Error:', err?.info || err?.message || err);
    });

    // connect() throws on failure (e.g. user not live)
    await this.connection.connect();
  }

  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.connection = null;
    }
    this._connected = false;
    console.log('[TikTok] Disconnected');
  }

  isConnected(): boolean {
    return this._connected;
  }
}
