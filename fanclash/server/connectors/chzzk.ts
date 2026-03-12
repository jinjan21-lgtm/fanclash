import WebSocket from 'ws';

export interface ChzzkDonation {
  nickname: string;
  amount: number;
}

type DonationCallback = (donation: ChzzkDonation) => void;

export class ChzzkConnector {
  private ws: WebSocket | null = null;
  private channelId: string;
  private chatChannelId: string | null = null;
  private onDonation: DonationCallback;
  private pingInterval: NodeJS.Timeout | null = null;
  private _connected = false;

  constructor(channelId: string, onDonation: DonationCallback) {
    this.channelId = channelId;
    this.onDonation = onDonation;
  }

  async connect() {
    try {
      // Step 1: Get live status
      const liveRes = await fetch(
        `https://api.chzzk.naver.com/polling/v3/channels/${this.channelId}/live-status`
      );
      const liveData = await liveRes.json();
      const content = liveData?.content;

      if (!content || content.status !== 'OPEN') {
        console.warn(`[Chzzk] Channel ${this.channelId.substring(0, 8)}... is not live`);
        return;
      }

      this.chatChannelId = content.chatChannelId;

      // Step 2: Get access token
      const tokenRes = await fetch(
        `https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId=${this.chatChannelId}&chatType=STREAMING`
      );
      const tokenData = await tokenRes.json();
      const accessToken = tokenData?.content?.accessToken;

      if (!accessToken) {
        console.error('[Chzzk] Failed to get access token');
        return;
      }

      // Step 3: Connect WebSocket
      this.ws = new WebSocket('wss://kr-ss1.chat.naver.com/chat');

      this.ws.on('open', () => {
        console.log(`[Chzzk] Connected to channel ${this.channelId.substring(0, 8)}...`);
        this._connected = true;

        // Send auth packet
        this.ws!.send(JSON.stringify({
          ver: '3',
          cmd: 100,
          svcid: 'game',
          cid: this.chatChannelId,
          bdy: {
            uid: null,
            devType: 2001,
            accTkn: accessToken,
            auth: 'READ',
          },
          tid: 1,
        }));

        // Heartbeat every 20 seconds
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
              ver: '3',
              cmd: 0,
              svcid: 'game',
              cid: this.chatChannelId,
            }));
          }
        }, 20000);
      });

      this.ws.on('message', (raw: WebSocket.Data) => {
        try {
          const data = JSON.parse(raw.toString());

          // cmd 93006 = chat messages
          if (data.cmd === 93006 && Array.isArray(data.bdy)) {
            for (const msg of data.bdy) {
              // msgTypeCode 10 = donation (cheese)
              if (msg.msgTypeCode === 10) {
                const profile = JSON.parse(msg.profile || '{}');
                const extras = JSON.parse(msg.extras || '{}');
                const nickname = profile.nickname || '익명';
                const amount = parseInt(extras.payAmount) || 0;

                if (amount > 0) {
                  this.onDonation({ nickname, amount });
                }
              }
            }
          }
        } catch (e) {
          // Non-JSON or irrelevant message, ignore
        }
      });

      this.ws.on('close', () => {
        console.log('[Chzzk] Disconnected');
        this._connected = false;
      });

      this.ws.on('error', (err: Error) => {
        console.error('[Chzzk] Error:', err.message);
        this._connected = false;
      });

    } catch (err: any) {
      console.error(`[Chzzk] Connection failed:`, err?.message || err);
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
    console.log('[Chzzk] Disconnected');
  }

  isConnected(): boolean {
    return this._connected;
  }
}
