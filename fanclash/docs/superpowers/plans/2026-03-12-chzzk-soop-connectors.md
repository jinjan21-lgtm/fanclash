# Chzzk + Soop Connectors & Integration Guide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Chzzk and Soop backend connectors for real-time donation capture, and embed detailed setup guides into every IntegrationCard.

**Architecture:** Two new WebSocket-based connectors (`ChzzkConnector`, `SoopConnector`) following the existing connector pattern (constructor, connect, disconnect, isConnected). IntegrationCard gets a collapsible guide section with step-by-step instructions for all 5 platforms.

**Tech Stack:** TypeScript, `ws` package (raw WebSocket), Socket.IO, React (Next.js)

**Spec:** `docs/superpowers/specs/2026-03-12-chzzk-soop-connectors-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `server/connectors/chzzk.ts` | Create | Chzzk chat WebSocket connector — live status check, auth, donation parsing |
| `server/connectors/soop.ts` | Create | Soop chat WebSocket connector — broadcast info fetch, starballoon/adballoon parsing |
| `server/connectors/manager.ts` | Modify | Register new connectors in switch-case, extend union type |
| `server/index.ts` | Modify | Add `integration:error` event forwarding |
| `src/types/index.ts` | Modify | Add `'soop'` to PlatformType, add SoopConfig |
| `src/components/dashboard/IntegrationCard.tsx` | Modify | Add guide data for all 5 platforms, collapsible guide UI, soop entry |
| `src/app/dashboard/integrations/page.tsx` | Modify | Add `'soop'` to PLATFORMS, remove bottom guide section |

---

## Chunk 1: Backend — Dependencies & Connectors

### Task 1: Install `ws` dependency

**Files:**
- Modify: `fanclash/package.json`

- [ ] **Step 1: Install ws and types**

```bash
cd fanclash && npm install ws && npm install -D @types/ws
```

- [ ] **Step 2: Verify installation**

```bash
cd fanclash && node -e "require('ws'); console.log('ws OK')"
```
Expected: `ws OK`

- [ ] **Step 3: Commit**

```bash
cd fanclash && git add package.json package-lock.json && git commit -m "chore: add ws dependency for Chzzk/Soop connectors"
```

---

### Task 2: Create Chzzk connector

**Files:**
- Create: `fanclash/server/connectors/chzzk.ts`

- [ ] **Step 1: Create ChzzkConnector**

Follow the same class pattern as `ToonationConnector` (constructor, connect, disconnect, isConnected). The connector must:

1. Fetch live status via HTTP: `GET https://api.chzzk.naver.com/polling/v3/channels/{channelId}/live-status`
   - Extract `chatChannelId` from `content` when `status === 'OPEN'`
   - If not live, log warning and return without connecting

2. Fetch access token: `GET https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chatChannelId}&chatType=STREAMING`
   - Extract `accessToken` from `content`

3. Connect WebSocket: `wss://kr-ss1.chat.naver.com/chat`
   - On open, send auth packet:
     ```json
     {
       "ver": "3",
       "cmd": 100,
       "svcid": "game",
       "cid": "{chatChannelId}",
       "bdy": {
         "uid": null,
         "devType": 2001,
         "accTkn": "{accessToken}",
         "auth": "READ"
       },
       "tid": 1
     }
     ```

4. Listen for messages, parse donation events:
   - Parse JSON messages where `cmd === 93006`
   - Filter `bdy` entries where `msgTypeCode === 10` (donation/cheese)
   - Extract nickname from `JSON.parse(profile).nickname`
   - Extract amount from `JSON.parse(extras).payAmount`
   - Call `onDonation({ nickname, amount })`

5. Heartbeat: every 20 seconds send:
   ```json
   { "ver": "3", "cmd": 0, "svcid": "game", "cid": "{chatChannelId}" }
   ```

6. Error/close handlers: log and set `_connected = false`

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd fanclash && npx tsc --noEmit server/connectors/chzzk.ts --esModuleInterop --moduleResolution node --module commonjs --target es2020 --skipLibCheck
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd fanclash && git add server/connectors/chzzk.ts && git commit -m "feat: add Chzzk connector for live cheese donation capture"
```

---

### Task 3: Create Soop connector

**Files:**
- Create: `fanclash/server/connectors/soop.ts`

- [ ] **Step 1: Create SoopConnector**

Follow the same class pattern. The connector must:

1. Fetch broadcast info via HTTP POST: `POST https://live.sooplive.co.kr/afreeca/player_live_api.php`
   - Body: `bid={bjId}` (form-urlencoded)
   - Extract `CHANNEL.CHATNO`, `CHANNEL.FTK`, `CHANNEL.CHPT` from response
   - If no CHATNO, broadcast is offline

2. Connect WebSocket: `wss://chat-{serverNum}.sooplive.co.kr:{CHPT}/Websocket`
   - `serverNum` = derive from CHATNO (simple modulo or default to 1)

3. On open, send join packet using separator `\x0c`:
   - `"0001\x0c0000\x0c{CHATNO}\x0c{FTK}\x0c16\x0c"`

4. Listen for messages, parse by separator:
   - Opcode `0104` = starballoon: `amount = count * 100`
   - Opcode `0107` = adballoon: `amount` directly from message (KRW)
   - Call `onDonation({ nickname, amount })`

5. Heartbeat: every 60 seconds send `"0000\x0c00\x0c"`

```typescript
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
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd fanclash && npx tsc --noEmit server/connectors/soop.ts --esModuleInterop --moduleResolution node --module commonjs --target es2020 --skipLibCheck
```
Expected: No errors

- [ ] **Step 3: Commit**

```bash
cd fanclash && git add server/connectors/soop.ts && git commit -m "feat: add Soop connector for starballoon/adballoon donation capture"
```

---

### Task 4: Register connectors in IntegrationManager

**Files:**
- Modify: `fanclash/server/connectors/manager.ts`

- [ ] **Step 1: Add imports and extend types**

At top of file, add imports after existing ones:
```typescript
import { ChzzkConnector } from './chzzk';
import { SoopConnector } from './soop';
```

Update `ActiveConnection` interface — change `connector` type:
```typescript
connector: ToonationConnector | TiktokConnector | StreamlabsConnector | ChzzkConnector | SoopConnector;
```

Update `let connector` declaration in `startIntegration` to same union type.

- [ ] **Step 2: Add switch cases in `startIntegration`**

Add before the `default:` case:
```typescript
      case 'chzzk':
        connector = new ChzzkConnector(config.channel_id, (d) => donationHandler(d.nickname, d.amount));
        await connector.connect();
        break;
      case 'soop':
        connector = new SoopConnector(config.bj_id, (d) => donationHandler(d.nickname, d.amount));
        await connector.connect();
        break;
```

- [ ] **Step 3: Verify build**

```bash
cd fanclash && npx tsc --noEmit server/connectors/manager.ts --esModuleInterop --moduleResolution node --module commonjs --target es2020 --skipLibCheck
```
Expected: No errors

- [ ] **Step 4: Commit**

```bash
cd fanclash && git add server/connectors/manager.ts && git commit -m "feat: register Chzzk and Soop connectors in IntegrationManager"
```

---

### Task 5: Add `integration:error` event to server

**Files:**
- Modify: `fanclash/server/index.ts`

- [ ] **Step 1: Wrap `integration:start` handler with error forwarding**

Replace the existing `integration:start` handler (lines 107-109) with:
```typescript
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
```

- [ ] **Step 2: Verify build**

```bash
cd fanclash && npm run build
```
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
cd fanclash && git add server/index.ts && git commit -m "feat: forward integration:error event to client on connection failure"
```

---

## Chunk 2: Frontend — Types, Guides & UI

### Task 6: Update types

**Files:**
- Modify: `fanclash/src/types/index.ts`

- [ ] **Step 1: Add 'soop' to PlatformType and add SoopConfig**

Change line 118:
```typescript
export type PlatformType = 'toonation' | 'tiktok' | 'streamlabs' | 'chzzk' | 'soop';
```

Add after `StreamlabsConfig` (after line 140):
```typescript
export interface SoopConfig {
  bj_id: string;
}
```

- [ ] **Step 2: Commit**

```bash
cd fanclash && git add src/types/index.ts && git commit -m "feat: add soop to PlatformType, add SoopConfig type"
```

---

### Task 7: Enhance IntegrationCard with guides and soop platform

**Files:**
- Modify: `fanclash/src/components/dashboard/IntegrationCard.tsx`

- [ ] **Step 1: Update PLATFORM_INFO type and add guide data + soop entry**

Replace the entire `PLATFORM_INFO` constant (lines 7-36) with expanded version that includes `guide` field and `soop` entry:

```typescript
interface PlatformGuide {
  steps: string[];
  warning: string;
  faq: string;
}

const PLATFORM_INFO: Record<PlatformType, {
  label: string;
  icon: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  guide: PlatformGuide;
}> = {
  toonation: {
    label: '투네이션',
    icon: '🎵',
    fields: [
      { key: 'alertbox_key', label: 'Alert Box 키', placeholder: 'toonation alertbox URL의 키 값', type: 'password' },
    ],
    guide: {
      steps: [
        '투네이션(toonation.com)에 로그인합니다.',
        '우측 상단 프로필 아이콘 클릭 → "마이페이지"로 이동합니다.',
        '"위젯/알림" 메뉴에서 "Alert Box"를 선택합니다.',
        'Alert Box URL을 확인합니다. URL에서 key= 뒤의 값이 Alert Box 키입니다.',
        '예: https://toon.at/widget/alertbox/ABCDEF... → "ABCDEF..." 부분을 복사합니다.',
        '위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
      ],
      warning: 'Alert Box 키는 절대 타인에게 공유하지 마세요. 키가 노출되면 투네이션에서 재발급하세요.',
      faq: '투네이션 후원이 들어오면 자동으로 FanClash 위젯에 반영됩니다. 기존 투네이션 알림과 동시에 사용 가능합니다.',
    },
  },
  tiktok: {
    label: '틱톡 라이브',
    icon: '🎵',
    fields: [
      { key: 'username', label: '틱톡 유저네임', placeholder: '@없이 유저네임 입력' },
    ],
    guide: {
      steps: [
        '틱톡 프로필에서 사용자 이름(유저네임)을 확인합니다.',
        '@ 기호 없이 유저네임만 입력합니다. 예: myusername',
        '"저장" 후 "연결" 버튼을 누릅니다.',
      ],
      warning: '틱톡 라이브가 켜져 있을 때만 연동됩니다. 라이브 시작 전에 연결해두면 자동으로 감지합니다.',
      faq: '틱톡 선물(Gift)이 FanClash에 자동 반영됩니다. 다이아몬드는 한국 원화로 자동 환산됩니다 (1다이아 ≈ 7원).',
    },
  },
  streamlabs: {
    label: 'Streamlabs',
    icon: '🔴',
    fields: [
      { key: 'socket_token', label: 'Socket API Token', placeholder: 'Streamlabs API Settings에서 복사', type: 'password' },
    ],
    guide: {
      steps: [
        'Streamlabs(streamlabs.com)에 로그인합니다.',
        '좌측 메뉴에서 "Settings" → "API Settings"로 이동합니다.',
        '"API Tokens" 섹션에서 "Socket API Token"을 찾습니다.',
        '"Copy" 버튼을 눌러 토큰을 복사합니다.',
        '위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
      ],
      warning: 'Socket API Token은 절대 타인에게 공유하지 마세요.',
      faq: 'Streamlabs를 통한 모든 후원이 자동 반영됩니다. USD, EUR 등 외화는 자동으로 원화 환산됩니다.',
    },
  },
  chzzk: {
    label: '치지직',
    icon: '🟢',
    fields: [
      { key: 'channel_id', label: '채널 ID', placeholder: '치지직 채널 ID' },
    ],
    guide: {
      steps: [
        '치지직(chzzk.naver.com)에서 내 채널로 이동합니다.',
        '채널 URL을 확인합니다.',
        '예: https://chzzk.naver.com/channel/abc123def... → "abc123def..." 부분이 채널 ID입니다.',
        '채널 ID를 위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
        '"연결"을 누르면 라이브 방송 시 치즈 후원이 자동으로 감지됩니다.',
      ],
      warning: '라이브 방송 중일 때만 연동됩니다. 방송 시작 전 미리 연결해두세요.',
      faq: '치지직 치즈 후원이 실시간으로 FanClash 위젯에 반영됩니다.',
    },
  },
  soop: {
    label: '숲 (아프리카TV)',
    icon: '🌳',
    fields: [
      { key: 'bj_id', label: 'BJ 아이디', placeholder: '숲 BJ 아이디 입력' },
    ],
    guide: {
      steps: [
        '숲(sooplive.co.kr)에 로그인합니다.',
        '내 방송국으로 이동합니다.',
        '방송국 URL에서 BJ 아이디를 확인합니다.',
        '예: https://bj.sooplive.co.kr/mybjid → "mybjid" 부분이 BJ 아이디입니다.',
        'BJ 아이디를 위 입력란에 붙여넣고 "저장" 버튼을 누릅니다.',
        '"연결"을 누르면 라이브 방송 시 별풍선이 자동으로 감지됩니다.',
      ],
      warning: '라이브 방송 중일 때만 연동됩니다. 별풍선 1개 = 100원으로 환산됩니다.',
      faq: '숲 별풍선과 애드벌룬이 실시간으로 FanClash 위젯에 반영됩니다.',
    },
  },
};
```

- [ ] **Step 2: Add guide toggle state and UI**

Add state inside the component function (after line 53's `connecting` state):
```typescript
const [showGuide, setShowGuide] = useState(false);
```

Add collapsible guide section at the bottom of the card, just before the closing `</div>` of the outer container (before line 173's `</div>`). Insert after the editing/display block:

```tsx
      {/* Guide section */}
      <div className="mt-4 border-t border-gray-700 pt-3">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="text-sm text-gray-400 hover:text-gray-300 flex items-center gap-1"
        >
          <span className={`transition-transform ${showGuide ? 'rotate-90' : ''}`}>▸</span>
          연동 가이드
        </button>
        {showGuide && (
          <div className="mt-3 space-y-3 text-sm">
            <ol className="space-y-2 text-gray-300">
              {info.guide.steps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-purple-400 font-bold shrink-0">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
            <div className="p-2 bg-yellow-900/30 border border-yellow-700/50 rounded text-yellow-300 text-xs">
              ⚠️ {info.guide.warning}
            </div>
            <div className="p-2 bg-blue-900/30 border border-blue-700/50 rounded text-blue-300 text-xs">
              💡 {info.guide.faq}
            </div>
          </div>
        )}
      </div>
```

- [ ] **Step 3: Verify build**

```bash
cd fanclash && npm run build
```
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
cd fanclash && git add src/components/dashboard/IntegrationCard.tsx && git commit -m "feat: add collapsible setup guides for all 5 platforms in IntegrationCard"
```

---

### Task 8: Update integrations page with soop + error handling

**Files:**
- Modify: `fanclash/src/app/dashboard/integrations/page.tsx`

- [ ] **Step 1: Add 'soop' to PLATFORMS array**

Change line 8:
```typescript
const PLATFORMS: PlatformType[] = ['toonation', 'tiktok', 'streamlabs', 'chzzk', 'soop'];
```

- [ ] **Step 2: Remove bottom guide section**

Delete lines 68-76 (the `<div className="mt-8 ...">` block with the old guide text).

- [ ] **Step 3: Add `integration:error` listener and error state**

Add state for integration errors:
```typescript
const [integrationErrors, setIntegrationErrors] = useState<Record<string, string>>({});
```

Add socket listener inside the existing `useEffect` that creates the socket (after `setSocket(s)`):
```typescript
s.on('integration:error', (data: { integration_id: string; platform: string; message: string }) => {
  setIntegrationErrors(prev => ({ ...prev, [data.platform]: data.message }));
});
```

Pass error to IntegrationCard as a new prop:
```tsx
<IntegrationCard
  key={platform}
  platform={platform}
  integration={integrations.find(i => i.platform === platform) || null}
  streamerId={streamerId}
  onUpdate={() => {
    fetchIntegrations();
    setIntegrationErrors(prev => {
      const next = { ...prev };
      delete next[platform];
      return next;
    });
  }}
  onToggleConnection={handleToggleConnection}
  error={integrationErrors[platform] || null}
/>
```

- [ ] **Step 4: Add `error` prop to IntegrationCard**

In `fanclash/src/components/dashboard/IntegrationCard.tsx`, add `error` to Props interface:
```typescript
interface Props {
  platform: PlatformType;
  integration: Integration | null;
  streamerId: string;
  onUpdate: () => void;
  onToggleConnection: (integration: Integration, connect: boolean) => void;
  error: string | null;
}
```

Update the component function signature to accept `error`:
```typescript
export default function IntegrationCard({ platform, integration, streamerId, onUpdate, onToggleConnection, error }: Props) {
```

Add error display after the status indicator (after the `● 미설정` span, inside the status display div):
```tsx
{error && (
  <span className="text-xs text-red-400">● {error}</span>
)}
```

- [ ] **Step 5: Verify build**

```bash
cd fanclash && npm run build
```
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
cd fanclash && git add src/app/dashboard/integrations/page.tsx src/components/dashboard/IntegrationCard.tsx && git commit -m "feat: add soop platform, integration error display, remove legacy guide section"
```

---

### Task 9: Final build verification

- [ ] **Step 1: Full build**

```bash
cd fanclash && npm run build
```
Expected: Build succeeds with no errors

- [ ] **Step 2: Verify server starts**

```bash
cd fanclash && timeout 5 npx tsx server/index.ts 2>&1 || true
```
Expected: Server starts without import/compilation errors (will fail to connect to Supabase without env vars, that's OK)

- [ ] **Step 3: Final commit (if any unstaged changes)**

```bash
cd fanclash && git status
```
If clean, done. If not, stage and commit remaining changes.
