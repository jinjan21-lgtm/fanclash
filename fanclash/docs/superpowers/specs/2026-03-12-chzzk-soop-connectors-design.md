# 치지직 + 숲 커넥터 & 연동 가이드 강화

## 개요

FanClash의 외부 플랫폼 연동에 치지직(Chzzk) 백엔드 커넥터와 숲(Soop, 구 아프리카TV) 커넥터를 추가하고, 모든 5개 플랫폼의 연동 가이드를 IntegrationCard 내부에 상세하게 내장한다.

## 목표

1. 치지직 커넥터 백엔드 구현 (UI/타입은 이미 존재)
2. 숲 커넥터: 신규 (백엔드 + UI + 타입)
3. 모든 5개 플랫폼(투네이션, 틱톡, Streamlabs, 치지직, 숲)에 단계별 상세 가이드를 IntegrationCard 안에 내장

## 현재 상태

- 투네이션, 틱톡, Streamlabs 커넥터: 실제 API 연동 완료
- 치지직: **UI + PlatformType 이미 존재**, 백엔드 커넥터만 없음
- 숲: UI도 백엔드도 없음 (완전 신규)
- 가이드: 페이지 하단에 1줄짜리 텍스트만 존재

---

## 의존성 추가

`package.json`에 다음 추가:
```json
{
  "dependencies": {
    "ws": "^8.x"
  },
  "devDependencies": {
    "@types/ws": "^8.x"
  }
}
```

기존 커넥터는 `socket.io-client`를 사용하지만, 치지직과 숲은 네이버/숲 전용 WebSocket 프로토콜을 사용하므로 raw WebSocket(`ws`) 패키지가 필요하다.

---

## 설계

### 1. 치지직 커넥터 (`server/connectors/chzzk.ts`)

치지직은 공식 API가 없으므로 비공식 채팅 웹소켓을 사용한다.

**연동 방식**: 치지직 라이브 채팅 웹소켓 연결 → 후원(치즈) 메시지 감지

**설정값**:
- `channel_id`: 치지직 채널 ID (채널 URL에서 추출) — UI/타입 이미 존재

**구현**:
```
ChzzkConnector
├── constructor(channelId, onDonation)
├── async connect()           ← async (HTTP fetch 후 WebSocket)
│   ├── 채널의 라이브 상태 확인
│   ├── chatChannelId + accessToken 획득
│   ├── 채팅 웹소켓 연결 + 인증 핸드셰이크
│   ├── 후원(치즈) 메시지 파싱
│   └── donationCallback 호출
├── disconnect()
└── isConnected()
```

#### 프로토콜 상세

**Step 1 — 라이브 상태 조회 (HTTP)**:
```
GET https://api.chzzk.naver.com/polling/v3/channels/{channelId}/live-status
응답: { content: { liveId, chatChannelId, status, ... } }
```
- `status === 'OPEN'` 이면 라이브 중
- `chatChannelId` 를 추출하여 채팅 연결에 사용

**Step 2 — 액세스 토큰 획득 (HTTP)**:
```
GET https://comm-api.game.naver.com/nng_main/v1/chats/access-token?channelId={chatChannelId}&chatType=STREAMING
응답: { content: { accessToken, extraToken } }
```

**Step 3 — WebSocket 연결 + 인증**:
```
연결: wss://kr-ss{n}.chat.naver.com/chat
(n = 1~10 중 하나, 서버 부하 분산)

연결 직후 인증 패킷 전송:
{
  "ver": "3",
  "cmd": 100,        // CMD_CONNECT
  "svcid": "game",
  "cid": "{chatChannelId}",
  "bdy": {
    "uid": null,      // 비로그인 (읽기 전용)
    "devType": 2001,
    "accTkn": "{accessToken}",
    "auth": "READ"
  },
  "tid": 1
}
```

**Step 4 — 메시지 수신 및 후원 파싱**:
```
서버에서 수신하는 메시지 형식:
{
  "cmd": 93006,       // CMD_CHAT (일반 채팅)
  "bdy": [{
    "msg": "메시지 내용",
    "msgTypeCode": 10,  // 10 = 후원(치즈) 메시지
    "profile": "{\"nickname\":\"팬이름\"}",
    "extras": "{\"payAmount\":1000}"
  }]
}

후원 메시지 판별: msgTypeCode === 10
금액 추출: JSON.parse(extras).payAmount
닉네임 추출: JSON.parse(profile).nickname
```

**Step 5 — Heartbeat (Ping)**:
```
20초마다 ping 전송:
{ "ver": "3", "cmd": 0, "svcid": "game", "cid": "{chatChannelId}" }
```

**참고 구현체**: npm `chzzk` 패키지, GitHub의 치지직 채팅 파서 프로젝트들

### 2. 숲 커넥터 (`server/connectors/soop.ts`)

숲(구 아프리카TV)도 비공식 채팅 웹소켓을 사용한다.

**연동 방식**: 숲 채팅 웹소켓 연결 → 별풍선/애드벌룬 이벤트 감지

**설정값**:
- `bj_id`: 숲 BJ 아이디

**구현**:
```
SoopConnector
├── constructor(bjId, onDonation)
├── async connect()           ← async (HTTP fetch 후 WebSocket)
│   ├── 방송 상태 확인
│   ├── 채팅 서버 정보 획득
│   ├── 채팅 웹소켓 연결 + 입장 패킷
│   ├── 별풍선/애드벌룬 메시지 파싱
│   └── donationCallback 호출
├── disconnect()
└── isConnected()
```

#### 프로토콜 상세

**Step 1 — 방송 정보 조회 (HTTP POST)**:
```
POST https://live.sooplive.co.kr/afreeca/player_live_api.php
Content-Type: application/x-www-form-urlencoded

body: bid={bjId}

응답 (JSON):
{
  "CHANNEL": {
    "CHATNO": "12345",          // 채팅방 번호
    "FTK": "token_value",       // 채팅 토큰
    "TITLE": "방송 제목",
    "BJID": "bjid",
    "CHPT": 8001                // 채팅 서버 포트
  }
}
```

**Step 2 — WebSocket 연결**:
```
연결: wss://chat-{n}.sooplive.co.kr:{CHPT}/Websocket
(n = CHATNO 기반 해시)

프로토콜: 숲은 구분자 기반 텍스트 프로토콜 사용
구분자: \x0c (Form Feed, 0x0C)
```

**Step 3 — 입장 패킷 전송**:
```
연결 직후 입장 메시지:
"0001{sep}0000{sep}{CHATNO}{sep}{FTK}{sep}16{sep}"
(sep = \x0c)
```

**Step 4 — 메시지 수신 및 후원 파싱**:
```
메시지 형식: opcode{sep}field1{sep}field2{sep}...

별풍선 메시지 (opcode 0104):
"0104{sep}{nickname}{sep}{count}{sep}..."
→ amount = count * 100 (별풍선 1개 = 100원)

애드벌룬 메시지 (opcode 0107):
"0107{sep}{nickname}{sep}{amount}{sep}..."
→ 애드벌룬 금액은 메시지에 직접 포함 (원 단위)
```

**Step 5 — Heartbeat (Ping)**:
```
60초마다 ping 전송:
"0000{sep}00{sep}"
```

**환산 기준**:
- 별풍선: 1개 = 100원
- 애드벌룬: 메시지에 포함된 금액 그대로 사용 (원 단위)

**참고 구현체**: GitHub의 afreecaTV/soop 채팅 파서 프로젝트들

### 3. IntegrationManager 변경 (`server/connectors/manager.ts`)

**변경 사항**:
- import 추가: `ChzzkConnector`, `SoopConnector`
- `ActiveConnection.connector` 타입에 두 커넥터 추가
- `startIntegration` switch-case에 `'chzzk'`, `'soop'` 케이스 추가
- 두 커넥터 모두 `connect()`가 async이므로 `await connector.connect()` 사용 (TikTok과 동일 패턴)

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

### 4. 타입 변경 (`src/types/index.ts`)

`chzzk`은 PlatformType에 이미 존재. `'soop'`만 추가하고, SoopConfig 타입 추가:

```typescript
// PlatformType에 'soop' 추가
export type PlatformType = 'toonation' | 'tiktok' | 'streamlabs' | 'chzzk' | 'soop';

// 새 config 타입 (ChzzkConfig는 이미 암묵적으로 존재하므로 SoopConfig만 추가)
export interface SoopConfig {
  bj_id: string;
}
```

### 5. 연동 가이드 시스템 (`IntegrationCard.tsx`)

**핵심 변경**: 각 플랫폼 카드 안에 접이식 상세 가이드를 내장한다.

**PLATFORM_INFO 타입 확장**: 기존 `{ label, icon, fields }` → `{ label, icon, fields, guide }` 로 확장. guide 필드 추가.

**가이드 데이터 — 모든 5개 플랫폼**:

| 플랫폼 | 가이드 단계 | 핵심 안내 |
|--------|------------|----------|
| 투네이션 | 6단계 | toonation.com > 마이페이지 > Alert Box > URL에서 key 복사 |
| 틱톡 | 3단계 | @ 없이 유저네임 입력, 라이브 중에만 동작 |
| Streamlabs | 5단계 | Settings > API Settings > Socket API Token 복사 |
| 치지직 | 5단계 | 채널 URL에서 채널 ID 복사 |
| 숲 | 6단계 | 방송국 URL에서 BJ 아이디 확인 |

각 가이드에는 `steps` (넘버링 단계), `warning` (주의사항), `faq` (팁) 포함.

**UI**: 카드 하단에 "연동 가이드" 접이식 토글. 클릭 시 단계별 가이드 + 경고 + FAQ 표시.

**숲 플랫폼 필드 추가**:
```typescript
soop: {
  label: '숲 (아프리카TV)',
  icon: '🌳',
  fields: [{ key: 'bj_id', label: 'BJ 아이디', placeholder: '숲 BJ 아이디 입력' }],
  guide: { ... },
}
```

### 6. integrations 페이지 변경 (`integrations/page.tsx`)

- `PLATFORMS` 배열에 `'soop'` 추가
- 하단 연동 가이드 텍스트 블록 제거 (카드 내장으로 대체)

### 7. 에러 상태 UX

치지직과 숲은 라이브 방송 중일 때만 연결되므로, 연결 실패 시 사용자에게 명확한 메시지가 필요:

- 연결 실패 시 IntegrationCard에 상태 메시지 표시: "방송이 꺼져 있습니다. 라이브 시작 후 다시 연결해주세요."
- Socket.IO 이벤트 `integration:error` 추가 → 서버에서 연결 실패 사유 전달
- 자동 재시도는 이번 범위에서 제외 (향후 개선)

---

## 변경 파일 목록

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `package.json` | 수정 | `ws`, `@types/ws` 의존성 추가 |
| `server/connectors/chzzk.ts` | 신규 | 치지직 커넥터 |
| `server/connectors/soop.ts` | 신규 | 숲 커넥터 |
| `server/connectors/manager.ts` | 수정 | 새 커넥터 등록, connector 타입 확장 |
| `server/index.ts` | 수정 | `integration:error` 이벤트 전달 |
| `src/types/index.ts` | 수정 | PlatformType에 'soop' 추가, SoopConfig 추가 |
| `src/components/dashboard/IntegrationCard.tsx` | 수정 | guide 데이터 + 접이식 가이드 UI + soop 플랫폼 + 에러 상태 표시 |
| `src/app/dashboard/integrations/page.tsx` | 수정 | PLATFORMS에 'soop' 추가, 하단 가이드 제거 |

## 기술적 리스크

- 치지직/숲 모두 비공식 API 사용 → 엔드포인트 변경 시 커넥터 코드 수정 필요
- 라이브 방송 중일 때만 연결 가능 → 에러 UX로 대응
- 별풍선→원화(100원/개), 다이아→원화(7원/개) 환산은 고정 비율 (실시간 환율 아님)
- 자동 재시도는 이번 범위에 포함하지 않음 (기존 3개 커넥터도 미구현)
