import WebSocket from 'ws';

export interface SoopDonation {
  nickname: string;
  amount: number;
}

type DonationCallback = (donation: SoopDonation) => void;

const SEP = '\x0c'; // Form Feed separator
const STARBALLOON_KRW = 100; // 1 starballoon = 100 KRW

export class SoopConnector {
  private ws: WebSocket | null = null;
  private bjId: string;
  private onDonation: DonationCallback;
  private pingInterval: NodeJS.Timeout | null = null;
  private _connected = false;

  constructor(bjId: string, onDonation: DonationCallback) {
    this.bjId = bjId;
    this.onDonation = onDonation;
  }

  async connect() {
    try {
      // Step 1: Get broadcast info
      const res = await fetch('https://live.sooplive.co.kr/afreeca/player_live_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `bid=${encodeURIComponent(this.bjId)}`,
      });
      const data = await res.json();
      const channel = data?.CHANNEL;

      if (!channel || !channel.CHATNO) {
        console.warn(`[Soop] BJ ${this.bjId} is not live`);
        return;
      }

      const chatNo = channel.CHATNO;
      const ftk = channel.FTK || '';
      const port = channel.CHPT || 8001;
      const serverNum = (parseInt(chatNo) % 5) + 1;

      // Step 2: Connect WebSocket
      this.ws = new WebSocket(`wss://chat-${serverNum}.sooplive.co.kr:${port}/Websocket`);

      this.ws.on('open', () => {
        console.log(`[Soop] Connected to BJ ${this.bjId}`);
        this._connected = true;

        // Send join packet
        this.ws!.send(`0001${SEP}0000${SEP}${chatNo}${SEP}${ftk}${SEP}16${SEP}`);

        // Heartbeat every 60 seconds
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(`0000${SEP}00${SEP}`);
          }
        }, 60000);
      });

      this.ws.on('message', (raw: WebSocket.Data) => {
        try {
          const message = raw.toString();
          const parts = message.split(SEP);
          const opcode = parts[0];

          if (opcode === '0104' && parts.length >= 3) {
            // Starballoon: opcode, nickname, count, ...
            const nickname = parts[1] || '익명';
            const count = parseInt(parts[2]) || 0;
            if (count > 0) {
              this.onDonation({
                nickname,
                amount: count * STARBALLOON_KRW,
              });
            }
          } else if (opcode === '0107' && parts.length >= 3) {
            // Adballoon: opcode, nickname, amount (KRW), ...
            const nickname = parts[1] || '익명';
            const amount = parseInt(parts[2]) || 0;
            if (amount > 0) {
              this.onDonation({ nickname, amount });
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      });

      this.ws.on('close', () => {
        console.log('[Soop] Disconnected');
        this._connected = false;
      });

      this.ws.on('error', (err: Error) => {
        console.error('[Soop] Error:', err.message);
        this._connected = false;
      });

    } catch (err: any) {
      console.error(`[Soop] Connection failed:`, err?.message || err);
      this._connected = false;
    }
  }

  disconnect() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._connected = false;
    console.log('[Soop] Disconnected');
  }

  isConnected(): boolean {
    return this._connected;
  }
}
