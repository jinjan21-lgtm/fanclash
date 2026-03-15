import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API 문서',
  description: 'FanClash API 및 Socket.IO 이벤트 문서',
};

interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
  params?: { name: string; type: string; desc: string; required?: boolean }[];
  response: string;
}

const SOCKET_RECEIVE_EVENTS = [
  { event: 'donation:new', description: '새 도네이션 발생', payload: '{ fan_nickname: string, amount: number, message?: string }' },
  { event: 'ranking:update', description: '랭킹 업데이트', payload: '{ rankings: Array<{ nickname: string, total: number }> }' },
  { event: 'battle:update', description: '배틀 상태 변경', payload: '{ battle_id: string, status: string, players: [...] }' },
  { event: 'widget:chain-action', description: '위젯 체인 액션 수신', payload: '{ type: string, data: Record<string, unknown> }' },
  { event: 'throne:change', description: '왕좌 변경', payload: '{ fan_nickname: string }' },
  { event: 'goal:complete', description: '목표 달성', payload: '{ title?: string }' },
  { event: 'affinity:levelup', description: '호감도 레벨업', payload: '{ fan_nickname: string, level: number, title: string }' },
  { event: 'integration:error', description: '연동 오류', payload: '{ platform: string, message: string }' },
];

const SOCKET_SEND_EVENTS = [
  { event: 'widget:subscribe', description: '위젯 구독 (오버레이용)', payload: 'widgetId: string' },
  { event: 'live:subscribe', description: '실시간 관전 구독', payload: 'streamerId: string' },
  { event: 'streamer:subscribe', description: '스트리머 대시보드 구독', payload: 'streamerId: string' },
  { event: 'integration:start', description: '플랫폼 연동 시작', payload: '{ integration_id: string, streamer_id: string, platform: string, config: object }' },
  { event: 'integration:stop', description: '플랫폼 연동 중지', payload: '{ integration_id: string }' },
  { event: 'widget:event', description: '위젯 이벤트 발신 (체인용)', payload: '{ type: string, data: object, streamerId: string }' },
];

const REST_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/export/highlights',
    description: '도네이션 피크 타임스탬프를 조회합니다. ClipForge 연동에 사용됩니다.',
    params: [
      { name: 'streamerId', type: 'string', desc: '스트리머 ID', required: true },
      { name: 'from', type: 'ISO 8601', desc: '시작 시간', required: false },
      { name: 'to', type: 'ISO 8601', desc: '종료 시간', required: false },
    ],
    response: `{
  "highlights": [
    {
      "startTime": "2026-03-15T14:30:00.000Z",
      "endTime": "2026-03-15T14:32:00.000Z",
      "donationCount": 5,
      "totalAmount": 25000
    }
  ]
}`,
  },
  {
    method: 'POST',
    path: '/api/rpg',
    description: 'RPG 캐릭터 XP를 업데이트합니다.',
    params: [
      { name: 'streamer_id', type: 'string', desc: '스트리머 ID', required: true },
      { name: 'fan_nickname', type: 'string', desc: '팬 닉네임', required: true },
      { name: 'xp_amount', type: 'number', desc: '추가할 XP', required: true },
    ],
    response: `{
  "character": {
    "nickname": "팬닉네임",
    "level": 5,
    "xp": 1200,
    "title": "숙련자",
    "equipment": { "weapon": "강철검", "armor": "가죽갑옷" }
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/rpg',
    description: 'RPG 캐릭터를 조회합니다.',
    params: [
      { name: 'streamer_id', type: 'string', desc: '스트리머 ID', required: true },
      { name: 'fan_nickname', type: 'string', desc: '팬 닉네임', required: true },
    ],
    response: `{
  "character": {
    "nickname": "팬닉네임",
    "level": 5,
    "xp": 1200,
    "title": "숙련자"
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/gacha/collection',
    description: '가챠 컬렉션을 업데이트합니다.',
    params: [
      { name: 'streamer_id', type: 'string', desc: '스트리머 ID', required: true },
      { name: 'fan_nickname', type: 'string', desc: '팬 닉네임', required: true },
      { name: 'grade', type: 'string', desc: '등급 (N/R/SR/SSR/UR)', required: true },
    ],
    response: `{
  "collection": {
    "N": 10,
    "R": 5,
    "SR": 2,
    "SSR": 1,
    "UR": 0
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/gacha/collection',
    description: '가챠 컬렉션을 조회합니다.',
    params: [
      { name: 'streamer_id', type: 'string', desc: '스트리머 ID', required: true },
      { name: 'fan_nickname', type: 'string', desc: '팬 닉네임', required: true },
    ],
    response: `{
  "collection": {
    "N": 10,
    "R": 5,
    "SR": 2,
    "SSR": 1,
    "UR": 0
  }
}`,
  },
];

const TOC_ITEMS = [
  { id: 'connection', label: '연결' },
  { id: 'receive-events', label: '수신 이벤트' },
  { id: 'send-events', label: '발신 이벤트' },
  { id: 'rest-api', label: 'REST API' },
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold text-purple-400 hover:text-purple-300 transition-colors">
              FanClash
            </Link>
            <span className="text-gray-700">/</span>
            <h1 className="text-lg font-bold">API 문서</h1>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            대시보드
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto flex gap-8 px-6 py-8">
        {/* Table of Contents - Sidebar */}
        <nav className="hidden lg:block w-48 shrink-0 sticky top-8 self-start">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">목차</p>
          <ul className="space-y-2">
            {TOC_ITEMS.map(item => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Intro */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold mb-4">FanClash API</h2>
            <p className="text-gray-400 leading-relaxed">
              FanClash는 Socket.IO 기반 실시간 이벤트와 REST API를 제공합니다.
              위젯 오버레이, 실시간 관전, 외부 서비스 연동에 활용할 수 있습니다.
            </p>
          </div>

          {/* Socket.IO Connection */}
          <section id="connection" className="mb-12">
            <h3 className="text-xl font-bold mb-4 text-purple-400">연결</h3>
            <p className="text-gray-400 text-sm mb-4">
              Socket.IO 클라이언트를 사용하여 실시간 이벤트를 수신합니다.
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 overflow-x-auto">
              <pre className="text-sm font-mono text-gray-300"><code>{`import { io } from 'socket.io-client';

const socket = io('wss://your-server.com', {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

socket.on('connect', () => {
  console.log('Connected!');
  // 스트리머 이벤트 구독
  socket.emit('streamer:subscribe', streamerId);
});`}</code></pre>
            </div>
          </section>

          {/* Receive Events */}
          <section id="receive-events" className="mb-12">
            <h3 className="text-xl font-bold mb-4 text-purple-400">수신 이벤트</h3>
            <p className="text-gray-400 text-sm mb-6">
              서버에서 클라이언트로 전송되는 이벤트입니다.
            </p>
            <div className="space-y-4">
              {SOCKET_RECEIVE_EVENTS.map(evt => (
                <div key={evt.event} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400 font-mono font-bold">
                      ON
                    </span>
                    <code className="text-sm font-mono text-purple-300">{evt.event}</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{evt.description}</p>
                  <div className="bg-gray-800 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs font-mono text-gray-300"><code>{evt.payload}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Send Events */}
          <section id="send-events" className="mb-12">
            <h3 className="text-xl font-bold mb-4 text-purple-400">발신 이벤트</h3>
            <p className="text-gray-400 text-sm mb-6">
              클라이언트에서 서버로 전송하는 이벤트입니다.
            </p>
            <div className="space-y-4">
              {SOCKET_SEND_EVENTS.map(evt => (
                <div key={evt.event} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono font-bold">
                      EMIT
                    </span>
                    <code className="text-sm font-mono text-purple-300">{evt.event}</code>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{evt.description}</p>
                  <div className="bg-gray-800 rounded-lg p-3 overflow-x-auto">
                    <pre className="text-xs font-mono text-gray-300"><code>{evt.payload}</code></pre>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* REST API */}
          <section id="rest-api" className="mb-12">
            <h3 className="text-xl font-bold mb-4 text-purple-400">REST API</h3>
            <p className="text-gray-400 text-sm mb-6">
              HTTP 기반 API 엔드포인트입니다. 인증이 필요한 엔드포인트는 Supabase 세션 쿠키가 필요합니다.
            </p>
            <div className="space-y-6">
              {REST_ENDPOINTS.map((ep, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono font-bold ${
                      ep.method === 'GET'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-orange-500/10 text-orange-400'
                    }`}>
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono text-gray-200">{ep.path}</code>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-400 mb-4">{ep.description}</p>

                    {ep.params && ep.params.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">파라미터</p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500 border-b border-gray-800">
                                <th className="pb-2 pr-4 font-medium">이름</th>
                                <th className="pb-2 pr-4 font-medium">타입</th>
                                <th className="pb-2 pr-4 font-medium">필수</th>
                                <th className="pb-2 font-medium">설명</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ep.params.map(p => (
                                <tr key={p.name} className="border-b border-gray-800/50 last:border-0">
                                  <td className="py-2 pr-4 font-mono text-purple-300 text-xs">{p.name}</td>
                                  <td className="py-2 pr-4 text-xs text-gray-500">{p.type}</td>
                                  <td className="py-2 pr-4 text-xs">
                                    {p.required ? (
                                      <span className="text-red-400">Y</span>
                                    ) : (
                                      <span className="text-gray-600">N</span>
                                    )}
                                  </td>
                                  <td className="py-2 text-xs text-gray-400">{p.desc}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">응답 예시</p>
                      <div className="bg-gray-800 rounded-lg p-3 overflow-x-auto">
                        <pre className="text-xs font-mono text-gray-300"><code>{ep.response}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-gray-600 text-sm">
        <p>FanClash API Documentation &mdash; 진크루</p>
      </footer>
    </div>
  );
}
