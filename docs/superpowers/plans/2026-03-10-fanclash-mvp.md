# FanClash MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a streamer interactive tool with donation ranking, throne battle, goal gauge, affinity system, and donation battle as OBS overlay widgets + streamer dashboard.

**Architecture:** Next.js App Router for dashboard + overlay pages. Separate Socket.io server for real-time updates. Supabase for PostgreSQL DB + Auth.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Socket.io, Supabase, Framer Motion

---

## File Structure

```
fanclash/
├── package.json
├── next.config.ts
├── .env.local.example
├── tailwind.config.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Landing
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── dashboard/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx                # Overview
│   │   │   ├── widgets/page.tsx
│   │   │   ├── donations/page.tsx
│   │   │   └── battle/page.tsx
│   │   └── overlay/
│   │       └── [widgetId]/page.tsx     # OBS browser source
│   ├── components/
│   │   ├── ui/                         # shadcn/ui
│   │   ├── dashboard/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── WidgetCard.tsx
│   │   │   ├── DonationForm.tsx
│   │   │   └── BattleControl.tsx
│   │   └── overlay/
│   │       ├── RankingBoard.tsx
│   │       ├── ThroneAlert.tsx
│   │       ├── DonationGoal.tsx
│   │       ├── AffinityBadge.tsx
│   │       ├── BattleArena.tsx
│   │       └── TeamBattle.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── socket/
│   │   │   ├── client.ts
│   │   │   └── events.ts
│   │   └── themes.ts
│   ├── hooks/
│   │   ├── useSocket.ts
│   │   └── useWidget.ts
│   └── types/
│       └── index.ts
├── server/
│   ├── index.ts                        # Socket.io entry
│   ├── handlers/
│   │   ├── donation.ts
│   │   ├── battle.ts
│   │   └── ranking.ts
│   └── services/
│       ├── ranking.ts
│       ├── affinity.ts
│       └── battle.ts
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
└── __tests__/
    └── services/
        ├── ranking.test.ts
        ├── affinity.test.ts
        └── battle.test.ts
```

---

## Chunk 1: Foundation (Tasks 1-3)

### Task 1: Project Scaffolding

**Files:**
- Create: `fanclash/package.json`, `fanclash/next.config.ts`, `fanclash/.env.local.example`, `fanclash/src/app/layout.tsx`

- [ ] **Step 1: Create Next.js project**

```bash
cd C:/Users/user/Desktop/AIwork/mcn
npx create-next-app@latest fanclash --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

- [ ] **Step 2: Install dependencies**

```bash
cd fanclash
npm install socket.io socket.io-client @supabase/supabase-js @supabase/ssr framer-motion zustand
npm install -D vitest @testing-library/react
```

- [ ] **Step 3: Create .env.local.example**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```
Expected: Next.js dev server on localhost:3000

- [ ] **Step 5: Commit**

```bash
git add fanclash/
git commit -m "chore: scaffold FanClash Next.js project"
```

---

### Task 2: Database Schema

**Files:**
- Create: `fanclash/supabase/migrations/001_initial.sql`
- Create: `fanclash/src/types/index.ts`

- [ ] **Step 1: Write migration SQL**

```sql
-- 001_initial.sql

-- Streamers (extends Supabase auth.users)
CREATE TABLE streamers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  channel_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Widgets
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle')),
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  theme TEXT DEFAULT 'modern' CHECK (theme IN ('modern', 'game', 'girlcam')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  fan_nickname TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_donations_streamer_created ON donations(streamer_id, created_at DESC);
CREATE INDEX idx_donations_streamer_fan ON donations(streamer_id, fan_nickname);

-- Fan profiles (per streamer)
CREATE TABLE fan_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  total_donated INTEGER DEFAULT 0,
  affinity_level INTEGER DEFAULT 0,
  title TEXT DEFAULT '지나가는 팬',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(streamer_id, nickname)
);

-- Donation goals
CREATE TABLE donation_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  current_amount INTEGER DEFAULT 0,
  milestones JSONB NOT NULL DEFAULT '[]',
  -- milestones: [{ "amount": 50000, "mission": "노래 1곡" }, ...]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battles
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'finished', 'cancelled')),
  benefit TEXT NOT NULL,
  min_amount INTEGER NOT NULL DEFAULT 5000,
  time_limit INTEGER NOT NULL DEFAULT 180, -- seconds
  winner_nickname TEXT,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Battle participants
CREATE TABLE battle_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL,
  amount INTEGER DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team battles
CREATE TABLE team_battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  streamer_id UUID NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'recruiting' CHECK (status IN ('recruiting', 'active', 'finished', 'cancelled')),
  team_count INTEGER DEFAULT 2 CHECK (team_count BETWEEN 2 AND 4),
  team_names JSONB DEFAULT '["A팀", "B팀"]',
  time_limit INTEGER NOT NULL DEFAULT 300,
  winning_team INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE team_battle_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_battle_id UUID NOT NULL REFERENCES team_battles(id) ON DELETE CASCADE,
  team_index INTEGER NOT NULL,
  nickname TEXT NOT NULL,
  amount INTEGER DEFAULT 0
);

-- RLS policies
ALTER TABLE streamers ENABLE ROW LEVEL SECURITY;
ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_battle_members ENABLE ROW LEVEL SECURITY;

-- Streamers can read/write own data
CREATE POLICY "streamers_own" ON streamers FOR ALL USING (id = auth.uid());
CREATE POLICY "widgets_own" ON widgets FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "donations_own" ON donations FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "fan_profiles_own" ON fan_profiles FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "goals_own" ON donation_goals FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "battles_own" ON battles FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "battle_parts_read" ON battle_participants FOR SELECT USING (
  battle_id IN (SELECT id FROM battles WHERE streamer_id = auth.uid())
);
CREATE POLICY "battle_parts_write" ON battle_participants FOR ALL USING (
  battle_id IN (SELECT id FROM battles WHERE streamer_id = auth.uid())
);
CREATE POLICY "team_battles_own" ON team_battles FOR ALL USING (streamer_id = auth.uid());
CREATE POLICY "team_members_read" ON team_battle_members FOR SELECT USING (
  team_battle_id IN (SELECT id FROM team_battles WHERE streamer_id = auth.uid())
);
CREATE POLICY "team_members_write" ON team_battle_members FOR ALL USING (
  team_battle_id IN (SELECT id FROM team_battles WHERE streamer_id = auth.uid())
);

-- Overlay pages need public read access via widget ID
CREATE POLICY "widgets_public_read" ON widgets FOR SELECT USING (true);
CREATE POLICY "donations_public_read" ON donations FOR SELECT USING (true);
CREATE POLICY "fan_profiles_public_read" ON fan_profiles FOR SELECT USING (true);
CREATE POLICY "goals_public_read" ON donation_goals FOR SELECT USING (true);
CREATE POLICY "battles_public_read" ON battles FOR SELECT USING (true);
CREATE POLICY "battle_parts_public_read" ON battle_participants FOR SELECT USING (true);
CREATE POLICY "team_battles_public_read" ON team_battles FOR SELECT USING (true);
CREATE POLICY "team_members_public_read" ON team_battle_members FOR SELECT USING (true);
```

- [ ] **Step 2: Write TypeScript types**

```typescript
// src/types/index.ts

export type WidgetType = 'ranking' | 'throne' | 'goal' | 'affinity' | 'battle' | 'team_battle';
export type ThemeName = 'modern' | 'game' | 'girlcam';
export type BattleStatus = 'recruiting' | 'active' | 'finished' | 'cancelled';

export interface Streamer {
  id: string;
  display_name: string;
  channel_url: string | null;
  created_at: string;
}

export interface Widget {
  id: string;
  streamer_id: string;
  type: WidgetType;
  enabled: boolean;
  config: Record<string, unknown>;
  theme: ThemeName;
  created_at: string;
}

export interface Donation {
  id: string;
  streamer_id: string;
  fan_nickname: string;
  amount: number;
  created_at: string;
}

export interface FanProfile {
  id: string;
  streamer_id: string;
  nickname: string;
  total_donated: number;
  affinity_level: number;
  title: string;
  updated_at: string;
}

export interface DonationGoal {
  id: string;
  streamer_id: string;
  current_amount: number;
  milestones: { amount: number; mission: string }[];
  active: boolean;
}

export interface Battle {
  id: string;
  streamer_id: string;
  status: BattleStatus;
  benefit: string;
  min_amount: number;
  time_limit: number;
  winner_nickname: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface BattleParticipant {
  id: string;
  battle_id: string;
  nickname: string;
  amount: number;
  joined_at: string;
}

export interface TeamBattle {
  id: string;
  streamer_id: string;
  status: BattleStatus;
  team_count: number;
  team_names: string[];
  time_limit: number;
  winning_team: number | null;
  created_at: string;
}

export interface TeamBattleMember {
  id: string;
  team_battle_id: string;
  team_index: number;
  nickname: string;
  amount: number;
}

// Socket.io event types
export interface ServerToClientEvents {
  'ranking:update': (data: { rankings: FanProfile[]; period: string }) => void;
  'throne:change': (data: { previous: string; current: string; count: number }) => void;
  'goal:update': (data: { current_amount: number; milestones: DonationGoal['milestones'] }) => void;
  'affinity:levelup': (data: { nickname: string; level: number; title: string }) => void;
  'battle:update': (data: { battle: Battle; participants: BattleParticipant[] }) => void;
  'battle:finished': (data: { winner: string; benefit: string }) => void;
  'team_battle:update': (data: { battle: TeamBattle; teams: Record<number, { total: number; members: TeamBattleMember[] }> }) => void;
  'donation:new': (data: Donation) => void;
}

export interface ClientToServerEvents {
  'widget:subscribe': (widgetId: string) => void;
  'donation:add': (data: { streamer_id: string; fan_nickname: string; amount: number }) => void;
  'battle:create': (data: { streamer_id: string; benefit: string; min_amount: number; time_limit: number }) => void;
  'battle:join': (data: { battle_id: string; nickname: string; amount: number }) => void;
  'battle:start': (battle_id: string) => void;
  'battle:donate': (data: { battle_id: string; nickname: string; amount: number }) => void;
}

// Affinity level config
export const AFFINITY_LEVELS = [
  { level: 0, title: '지나가는 팬', minAmount: 0 },
  { level: 1, title: '단골', minAmount: 10000 },
  { level: 2, title: '열혈팬', minAmount: 50000 },
  { level: 3, title: '첫사랑', minAmount: 200000 },
  { level: 4, title: '소울메이트', minAmount: 500000 },
] as const;
```

- [ ] **Step 3: Run migration in Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste `001_initial.sql` → Run.

- [ ] **Step 4: Commit**

```bash
git add fanclash/supabase/ fanclash/src/types/
git commit -m "feat: add database schema and TypeScript types"
```

---

### Task 3: Supabase Client + Auth

**Files:**
- Create: `fanclash/src/lib/supabase/client.ts`
- Create: `fanclash/src/lib/supabase/server.ts`
- Create: `fanclash/src/lib/supabase/middleware.ts`
- Create: `fanclash/src/middleware.ts`
- Create: `fanclash/src/app/(auth)/login/page.tsx`
- Create: `fanclash/src/app/(auth)/signup/page.tsx`

- [ ] **Step 1: Create Supabase clients**

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
```

```typescript
// src/lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  return supabaseResponse;
}
```

```typescript
// src/middleware.ts
import { updateSession } from '@/lib/supabase/middleware';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
```

- [ ] **Step 2: Create login page**

```tsx
// src/app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form onSubmit={handleLogin} className="bg-gray-900 p-8 rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">FanClash 로그인</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required />
        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required />
        <button type="submit" className="w-full p-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700">
          로그인
        </button>
        <p className="text-gray-400 text-center text-sm">
          계정이 없으신가요? <Link href="/signup" className="text-purple-400 hover:underline">회원가입</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Create signup page**

```tsx
// src/app/(auth)/signup/page.tsx
'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) { setError(signUpError.message); return; }
    if (data.user) {
      await supabase.from('streamers').insert({ id: data.user.id, display_name: displayName });
    }
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <form onSubmit={handleSignup} className="bg-gray-900 p-8 rounded-xl w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">FanClash 회원가입</h1>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <input type="text" placeholder="방송 닉네임" value={displayName} onChange={e => setDisplayName(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required />
        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required />
        <input type="password" placeholder="비밀번호 (6자 이상)" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white" required minLength={6} />
        <button type="submit" className="w-full p-3 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700">
          가입하기
        </button>
        <p className="text-gray-400 text-center text-sm">
          이미 계정이 있으신가요? <Link href="/login" className="text-purple-400 hover:underline">로그인</Link>
        </p>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Verify login/signup flow works**

```bash
npm run dev
```
Visit localhost:3000/signup → create account → redirected to /dashboard

- [ ] **Step 5: Commit**

```bash
git add fanclash/src/lib/supabase/ fanclash/src/middleware.ts fanclash/src/app/\(auth\)/
git commit -m "feat: add Supabase auth with login/signup pages"
```

---

## Chunk 2: Core Services + Socket.io (Tasks 4-7)

### Task 4: Ranking Service (TDD)

**Files:**
- Create: `fanclash/server/services/ranking.ts`
- Create: `fanclash/__tests__/services/ranking.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/services/ranking.test.ts
import { describe, it, expect } from 'vitest';
import { calculateRankings, detectThroneChange } from '../../server/services/ranking';
import type { Donation } from '../../src/types';

describe('calculateRankings', () => {
  const donations: Pick<Donation, 'fan_nickname' | 'amount'>[] = [
    { fan_nickname: '팬A', amount: 10000 },
    { fan_nickname: '팬B', amount: 30000 },
    { fan_nickname: '팬A', amount: 20000 },
    { fan_nickname: '팬C', amount: 25000 },
  ];

  it('aggregates by nickname and sorts descending', () => {
    const result = calculateRankings(donations);
    expect(result).toEqual([
      { nickname: '팬A', total: 30000 },
      { nickname: '팬B', total: 30000 },
      { nickname: '팬C', total: 25000 },
    ]);
  });

  it('returns top N', () => {
    const result = calculateRankings(donations, 2);
    expect(result).toHaveLength(2);
  });

  it('returns empty for no donations', () => {
    expect(calculateRankings([])).toEqual([]);
  });
});

describe('detectThroneChange', () => {
  it('detects when #1 changes', () => {
    const prev = [{ nickname: '팬A', total: 30000 }];
    const curr = [{ nickname: '팬B', total: 35000 }];
    expect(detectThroneChange(prev, curr)).toEqual({ previous: '팬A', current: '팬B' });
  });

  it('returns null when #1 unchanged', () => {
    const prev = [{ nickname: '팬A', total: 30000 }];
    const curr = [{ nickname: '팬A', total: 40000 }];
    expect(detectThroneChange(prev, curr)).toBeNull();
  });

  it('returns null for empty rankings', () => {
    expect(detectThroneChange([], [])).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd fanclash && npx vitest run __tests__/services/ranking.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implement**

```typescript
// server/services/ranking.ts

interface RankEntry { nickname: string; total: number; }

export function calculateRankings(
  donations: { fan_nickname: string; amount: number }[],
  limit = 5
): RankEntry[] {
  const map = new Map<string, number>();
  for (const d of donations) {
    map.set(d.fan_nickname, (map.get(d.fan_nickname) || 0) + d.amount);
  }
  return Array.from(map.entries())
    .map(([nickname, total]) => ({ nickname, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function detectThroneChange(
  prev: RankEntry[],
  curr: RankEntry[]
): { previous: string; current: string } | null {
  const prevKing = prev[0]?.nickname;
  const currKing = curr[0]?.nickname;
  if (!prevKing || !currKing || prevKing === currKing) return null;
  return { previous: prevKing, current: currKing };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/services/ranking.test.ts
```
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add fanclash/server/services/ranking.ts fanclash/__tests__/services/ranking.test.ts
git commit -m "feat: add ranking calculation service with tests"
```

---

### Task 5: Affinity Service (TDD)

**Files:**
- Create: `fanclash/server/services/affinity.ts`
- Create: `fanclash/__tests__/services/affinity.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/services/affinity.test.ts
import { describe, it, expect } from 'vitest';
import { calculateAffinity } from '../../server/services/affinity';
import { AFFINITY_LEVELS } from '../../src/types';

describe('calculateAffinity', () => {
  it('returns level 0 for < 10000', () => {
    const result = calculateAffinity(5000);
    expect(result).toEqual({ level: 0, title: '지나가는 팬' });
  });

  it('returns level 1 for >= 10000', () => {
    const result = calculateAffinity(10000);
    expect(result).toEqual({ level: 1, title: '단골' });
  });

  it('returns level 4 for >= 500000', () => {
    const result = calculateAffinity(500000);
    expect(result).toEqual({ level: 4, title: '소울메이트' });
  });

  it('uses custom titles when provided', () => {
    const custom = [
      { level: 0, title: '새내기', minAmount: 0 },
      { level: 1, title: '친구', minAmount: 10000 },
    ];
    expect(calculateAffinity(15000, custom)).toEqual({ level: 1, title: '친구' });
  });

  it('returns 0 for zero amount', () => {
    expect(calculateAffinity(0)).toEqual({ level: 0, title: '지나가는 팬' });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/services/affinity.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// server/services/affinity.ts
import { AFFINITY_LEVELS } from '../../src/types';

interface AffinityLevel { level: number; title: string; minAmount: number; }

export function calculateAffinity(
  totalDonated: number,
  levels: readonly AffinityLevel[] = AFFINITY_LEVELS
): { level: number; title: string } {
  let result = { level: levels[0].level, title: levels[0].title };
  for (const l of levels) {
    if (totalDonated >= l.minAmount) {
      result = { level: l.level, title: l.title };
    }
  }
  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/services/affinity.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add fanclash/server/services/affinity.ts fanclash/__tests__/services/affinity.test.ts
git commit -m "feat: add affinity/title calculation service with tests"
```

---

### Task 6: Battle Service (TDD)

**Files:**
- Create: `fanclash/server/services/battle.ts`
- Create: `fanclash/__tests__/services/battle.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/services/battle.test.ts
import { describe, it, expect } from 'vitest';
import { BattleManager } from '../../server/services/battle';

describe('BattleManager', () => {
  it('creates a battle in recruiting status', () => {
    const bm = new BattleManager('battle1', 180);
    expect(bm.getStatus()).toBe('recruiting');
  });

  it('adds participants', () => {
    const bm = new BattleManager('battle1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    expect(bm.getParticipants()).toHaveLength(2);
  });

  it('starts battle when called', () => {
    const bm = new BattleManager('battle1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    bm.start();
    expect(bm.getStatus()).toBe('active');
  });

  it('rejects start with < 2 participants', () => {
    const bm = new BattleManager('battle1', 180);
    bm.addParticipant('팬A', 5000);
    expect(() => bm.start()).toThrow('최소 2명');
  });

  it('adds donation to participant during battle', () => {
    const bm = new BattleManager('battle1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    bm.start();
    bm.addDonation('팬A', 10000);
    const p = bm.getParticipants().find(p => p.nickname === '팬A');
    expect(p?.amount).toBe(15000);
  });

  it('determines winner by highest amount', () => {
    const bm = new BattleManager('battle1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    bm.start();
    bm.addDonation('팬A', 20000);
    bm.addDonation('팬B', 10000);
    const winner = bm.finish();
    expect(winner).toBe('팬A');
    expect(bm.getStatus()).toBe('finished');
  });

  it('rejects donation when not active', () => {
    const bm = new BattleManager('battle1', 180);
    bm.addParticipant('팬A', 5000);
    bm.addParticipant('팬B', 5000);
    expect(() => bm.addDonation('팬A', 1000)).toThrow('진행 중이 아닙');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run __tests__/services/battle.test.ts
```

- [ ] **Step 3: Implement**

```typescript
// server/services/battle.ts

interface Participant { nickname: string; amount: number; }

export class BattleManager {
  private id: string;
  private status: 'recruiting' | 'active' | 'finished' | 'cancelled' = 'recruiting';
  private participants: Participant[] = [];
  private timeLimit: number;

  constructor(id: string, timeLimit: number) {
    this.id = id;
    this.timeLimit = timeLimit;
  }

  getStatus() { return this.status; }
  getParticipants() { return [...this.participants]; }
  getTimeLimit() { return this.timeLimit; }

  addParticipant(nickname: string, amount: number) {
    if (this.status !== 'recruiting') throw new Error('모집 중이 아닙니다');
    this.participants.push({ nickname, amount });
  }

  start() {
    if (this.participants.length < 2) throw new Error('최소 2명의 참가자가 필요합니다');
    this.status = 'active';
  }

  addDonation(nickname: string, amount: number) {
    if (this.status !== 'active') throw new Error('배틀이 진행 중이 아닙니다');
    const p = this.participants.find(p => p.nickname === nickname);
    if (!p) throw new Error('참가자가 아닙니다');
    p.amount += amount;
  }

  finish(): string {
    if (this.status !== 'active') throw new Error('배틀이 진행 중이 아닙니다');
    this.status = 'finished';
    const sorted = [...this.participants].sort((a, b) => b.amount - a.amount);
    return sorted[0].nickname;
  }

  cancel() { this.status = 'cancelled'; }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run __tests__/services/battle.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add fanclash/server/services/battle.ts fanclash/__tests__/services/battle.test.ts
git commit -m "feat: add battle state machine service with tests"
```

---

### Task 7: Socket.io Server

**Files:**
- Create: `fanclash/server/index.ts`
- Create: `fanclash/server/handlers/donation.ts`
- Create: `fanclash/server/handlers/battle.ts`
- Create: `fanclash/server/handlers/ranking.ts`
- Create: `fanclash/src/lib/socket/events.ts`
- Create: `fanclash/src/lib/socket/client.ts`

- [ ] **Step 1: Create socket event constants**

```typescript
// src/lib/socket/events.ts
export const EVENTS = {
  DONATION_ADD: 'donation:add',
  DONATION_NEW: 'donation:new',
  RANKING_UPDATE: 'ranking:update',
  THRONE_CHANGE: 'throne:change',
  GOAL_UPDATE: 'goal:update',
  AFFINITY_LEVELUP: 'affinity:levelup',
  BATTLE_CREATE: 'battle:create',
  BATTLE_JOIN: 'battle:join',
  BATTLE_START: 'battle:start',
  BATTLE_DONATE: 'battle:donate',
  BATTLE_UPDATE: 'battle:update',
  BATTLE_FINISHED: 'battle:finished',
  TEAM_BATTLE_UPDATE: 'team_battle:update',
  WIDGET_SUBSCRIBE: 'widget:subscribe',
} as const;
```

- [ ] **Step 2: Create Socket.io server**

```typescript
// server/index.ts
import { Server } from 'socket.io';
import { createClient } from '@supabase/supabase-js';
import { handleDonation } from './handlers/donation';
import { handleBattle } from './handlers/battle';
import type { ServerToClientEvents, ClientToServerEvents } from '../src/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const io = new Server<ClientToServerEvents, ServerToClientEvents>({
  cors: { origin: '*' },
});

const streamerRooms = new Map<string, Set<string>>(); // streamerId -> socketIds

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('widget:subscribe', async (widgetId) => {
    const { data: widget } = await supabase
      .from('widgets').select('streamer_id').eq('id', widgetId).single();
    if (widget) {
      socket.join(`streamer:${widget.streamer_id}`);
    }
  });

  handleDonation(io, socket, supabase);
  handleBattle(io, socket, supabase);

  socket.on('disconnect', () => {
    console.log('disconnected:', socket.id);
  });
});

const PORT = process.env.SOCKET_PORT || 3001;
io.listen(Number(PORT));
console.log(`Socket.io server running on port ${PORT}`);
```

- [ ] **Step 3: Create donation handler**

```typescript
// server/handlers/donation.ts
import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateRankings, detectThroneChange } from '../services/ranking';
import { calculateAffinity } from '../services/affinity';

export function handleDonation(io: Server, socket: Socket, supabase: SupabaseClient) {
  socket.on('donation:add' as any, async (data: { streamer_id: string; fan_nickname: string; amount: number }) => {
    const { streamer_id, fan_nickname, amount } = data;
    const room = `streamer:${streamer_id}`;

    // 1. Save donation
    await supabase.from('donations').insert({ streamer_id, fan_nickname, amount });

    // 2. Update fan profile
    const { data: existing } = await supabase
      .from('fan_profiles')
      .select('*')
      .eq('streamer_id', streamer_id)
      .eq('nickname', fan_nickname)
      .single();

    const newTotal = (existing?.total_donated || 0) + amount;
    const oldLevel = existing?.affinity_level || 0;
    const affinity = calculateAffinity(newTotal);

    if (existing) {
      await supabase.from('fan_profiles')
        .update({ total_donated: newTotal, affinity_level: affinity.level, title: affinity.title })
        .eq('id', existing.id);
    } else {
      await supabase.from('fan_profiles')
        .insert({ streamer_id, nickname: fan_nickname, total_donated: newTotal, affinity_level: affinity.level, title: affinity.title });
    }

    // 3. Emit new donation
    io.to(room).emit('donation:new', { id: '', streamer_id, fan_nickname, amount, created_at: new Date().toISOString() });

    // 4. Recalculate rankings
    const { data: allDonations } = await supabase
      .from('fan_profiles')
      .select('nickname, total_donated')
      .eq('streamer_id', streamer_id)
      .order('total_donated', { ascending: false })
      .limit(10);

    const rankings = (allDonations || []).map(d => ({ nickname: d.nickname, total: d.total_donated }));
    io.to(room).emit('ranking:update', { rankings: rankings as any, period: 'total' });

    // 5. Check throne change
    if (rankings.length >= 2 && rankings[0].nickname === fan_nickname && existing) {
      const prevRankings = [...rankings];
      // If this fan just became #1, emit throne change
      if (oldLevel < affinity.level || rankings[0].nickname !== existing.nickname) {
        io.to(room).emit('throne:change', { previous: rankings[1]?.nickname || '', current: fan_nickname, count: 0 });
      }
    }

    // 6. Check affinity level up
    if (affinity.level > oldLevel) {
      io.to(room).emit('affinity:levelup', { nickname: fan_nickname, level: affinity.level, title: affinity.title });
    }

    // 7. Update donation goal
    const { data: goal } = await supabase
      .from('donation_goals')
      .select('*')
      .eq('streamer_id', streamer_id)
      .eq('active', true)
      .single();

    if (goal) {
      const newAmount = goal.current_amount + amount;
      await supabase.from('donation_goals').update({ current_amount: newAmount }).eq('id', goal.id);
      io.to(room).emit('goal:update', { current_amount: newAmount, milestones: goal.milestones });
    }
  });
}
```

- [ ] **Step 4: Create battle handler**

```typescript
// server/handlers/battle.ts
import type { Server, Socket } from 'socket.io';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BattleManager } from '../services/battle';

const activeBattles = new Map<string, BattleManager>();

export function handleBattle(io: Server, socket: Socket, supabase: SupabaseClient) {
  socket.on('battle:create' as any, async (data: { streamer_id: string; benefit: string; min_amount: number; time_limit: number }) => {
    const { streamer_id, benefit, min_amount, time_limit } = data;
    const { data: battle } = await supabase.from('battles')
      .insert({ streamer_id, benefit, min_amount, time_limit, status: 'recruiting' })
      .select().single();

    if (battle) {
      activeBattles.set(battle.id, new BattleManager(battle.id, time_limit));
      io.to(`streamer:${streamer_id}`).emit('battle:update', { battle, participants: [] });
    }
  });

  socket.on('battle:join' as any, async (data: { battle_id: string; nickname: string; amount: number }) => {
    const { battle_id, nickname, amount } = data;
    const bm = activeBattles.get(battle_id);
    if (!bm) return;

    bm.addParticipant(nickname, amount);
    await supabase.from('battle_participants').insert({ battle_id, nickname, amount });

    const { data: battle } = await supabase.from('battles').select().eq('id', battle_id).single();
    io.to(`streamer:${battle?.streamer_id}`).emit('battle:update', { battle, participants: bm.getParticipants() as any });
  });

  socket.on('battle:start' as any, async (battle_id: string) => {
    const bm = activeBattles.get(battle_id);
    if (!bm) return;

    bm.start();
    await supabase.from('battles').update({ status: 'active', started_at: new Date().toISOString() }).eq('id', battle_id);

    const { data: battle } = await supabase.from('battles').select().eq('id', battle_id).single();
    io.to(`streamer:${battle?.streamer_id}`).emit('battle:update', { battle, participants: bm.getParticipants() as any });

    // Auto-finish timer
    setTimeout(async () => {
      if (bm.getStatus() !== 'active') return;
      const winner = bm.finish();
      await supabase.from('battles')
        .update({ status: 'finished', winner_nickname: winner, finished_at: new Date().toISOString() })
        .eq('id', battle_id);
      io.to(`streamer:${battle?.streamer_id}`).emit('battle:finished', { winner, benefit: battle?.benefit || '' });
      activeBattles.delete(battle_id);
    }, bm.getTimeLimit() * 1000);
  });

  socket.on('battle:donate' as any, async (data: { battle_id: string; nickname: string; amount: number }) => {
    const { battle_id, nickname, amount } = data;
    const bm = activeBattles.get(battle_id);
    if (!bm) return;

    bm.addDonation(nickname, amount);
    await supabase.from('battle_participants')
      .update({ amount: bm.getParticipants().find(p => p.nickname === nickname)?.amount })
      .eq('battle_id', battle_id)
      .eq('nickname', nickname);

    const { data: battle } = await supabase.from('battles').select().eq('id', battle_id).single();
    io.to(`streamer:${battle?.streamer_id}`).emit('battle:update', { battle, participants: bm.getParticipants() as any });
  });
}
```

- [ ] **Step 5: Create socket client**

```typescript
// src/lib/socket/client.ts
import { io, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/types';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001');
  }
  return socket;
}
```

- [ ] **Step 6: Add server start script to package.json**

Add to `fanclash/package.json` scripts:
```json
"server": "npx tsx server/index.ts"
```

- [ ] **Step 7: Verify socket server starts**

```bash
npm run server
```
Expected: "Socket.io server running on port 3001"

- [ ] **Step 8: Commit**

```bash
git add fanclash/server/ fanclash/src/lib/socket/
git commit -m "feat: add Socket.io server with donation, battle, ranking handlers"
```

---

## Chunk 3: Dashboard UI (Tasks 8-11)

### Task 8: Dashboard Layout

**Files:**
- Create: `fanclash/src/app/dashboard/layout.tsx`
- Create: `fanclash/src/app/dashboard/page.tsx`
- Create: `fanclash/src/components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar**

```tsx
// src/components/dashboard/Sidebar.tsx
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/dashboard/widgets', label: '위젯 관리', icon: '🎮' },
  { href: '/dashboard/donations', label: '후원 입력', icon: '💰' },
  { href: '/dashboard/battle', label: '배틀 관리', icon: '⚔️' },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-gray-900 min-h-screen p-4 border-r border-gray-800">
      <h1 className="text-xl font-bold text-purple-400 mb-8 px-3">FanClash</h1>
      <nav className="space-y-1">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === item.href ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}>
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create dashboard layout**

```tsx
// src/app/dashboard/layout.tsx
import Sidebar from '@/components/dashboard/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Create dashboard overview page**

```tsx
// src/app/dashboard/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: streamer } = await supabase.from('streamers').select().eq('id', user!.id).single();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">안녕하세요, {streamer?.display_name}님!</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">오늘 총 후원</p>
          <p className="text-3xl font-bold text-purple-400 mt-2">집계 중...</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">활성 위젯</p>
          <p className="text-3xl font-bold text-green-400 mt-2">0개</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-6">
          <p className="text-gray-400 text-sm">진행 중 배틀</p>
          <p className="text-3xl font-bold text-red-400 mt-2">없음</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify dashboard renders**

```bash
npm run dev
```
Login → should see dashboard with sidebar

- [ ] **Step 5: Commit**

```bash
git add fanclash/src/app/dashboard/ fanclash/src/components/dashboard/Sidebar.tsx
git commit -m "feat: add dashboard layout with sidebar and overview page"
```

---

### Task 9: Widget Management Page

**Files:**
- Create: `fanclash/src/app/dashboard/widgets/page.tsx`
- Create: `fanclash/src/components/dashboard/WidgetCard.tsx`

- [ ] **Step 1: Create WidgetCard component**

```tsx
// src/components/dashboard/WidgetCard.tsx
'use client';
import { useState } from 'react';
import type { Widget, WidgetType } from '@/types';
import { createClient } from '@/lib/supabase/client';

const WIDGET_LABELS: Record<WidgetType, { name: string; desc: string }> = {
  ranking: { name: '후원 랭킹 보드', desc: 'TOP 5 실시간 순위' },
  throne: { name: '왕좌 쟁탈전', desc: '1등 변경 시 풀스크린 알림' },
  goal: { name: '도네 목표 게이지', desc: '단계별 목표 프로그레스바' },
  affinity: { name: '호감도/칭호', desc: '팬 레벨업 팝업 알림' },
  battle: { name: '후원 배틀', desc: '1:1 후원 대결 화면' },
  team_battle: { name: '팀 대결', desc: '팀별 후원 경쟁' },
};

export default function WidgetCard({ widget, onUpdate }: { widget: Widget; onUpdate: () => void }) {
  const supabase = createClient();
  const label = WIDGET_LABELS[widget.type];
  const overlayUrl = `${window.location.origin}/overlay/${widget.id}`;

  const toggleEnabled = async () => {
    await supabase.from('widgets').update({ enabled: !widget.enabled }).eq('id', widget.id);
    onUpdate();
  };

  const copyUrl = () => navigator.clipboard.writeText(overlayUrl);

  return (
    <div className={`bg-gray-900 rounded-xl p-5 border ${widget.enabled ? 'border-purple-600' : 'border-gray-800'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-lg">{label.name}</h3>
          <p className="text-gray-400 text-sm">{label.desc}</p>
        </div>
        <button onClick={toggleEnabled}
          className={`px-3 py-1 rounded-full text-xs font-bold ${widget.enabled ? 'bg-green-600' : 'bg-gray-700'}`}>
          {widget.enabled ? 'ON' : 'OFF'}
        </button>
      </div>
      <div className="flex gap-2 mt-4">
        <button onClick={copyUrl}
          className="flex-1 py-2 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
          OBS URL 복사
        </button>
        <select value={widget.theme}
          onChange={async (e) => {
            await supabase.from('widgets').update({ theme: e.target.value }).eq('id', widget.id);
            onUpdate();
          }}
          className="bg-gray-800 rounded-lg px-3 text-sm">
          <option value="modern">모던</option>
          <option value="game">게임</option>
          <option value="girlcam">여캠</option>
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create widgets page**

```tsx
// src/app/dashboard/widgets/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import WidgetCard from '@/components/dashboard/WidgetCard';
import type { Widget, WidgetType } from '@/types';

const ALL_WIDGET_TYPES: WidgetType[] = ['ranking', 'throne', 'goal', 'affinity', 'battle', 'team_battle'];

export default function WidgetsPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const supabase = createClient();

  const fetchWidgets = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('widgets').select('*').eq('streamer_id', user.id);
    setWidgets(data || []);
  };

  const createWidget = async (type: WidgetType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('widgets').insert({ streamer_id: user.id, type });
    fetchWidgets();
  };

  useEffect(() => { fetchWidgets(); }, []);

  const existingTypes = widgets.map(w => w.type);
  const missingTypes = ALL_WIDGET_TYPES.filter(t => !existingTypes.includes(t));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">위젯 관리</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {widgets.map(w => <WidgetCard key={w.id} widget={w} onUpdate={fetchWidgets} />)}
      </div>
      {missingTypes.length > 0 && (
        <div>
          <h3 className="text-lg font-bold mb-3 text-gray-400">위젯 추가</h3>
          <div className="flex flex-wrap gap-2">
            {missingTypes.map(type => (
              <button key={type} onClick={() => createWidget(type)}
                className="px-4 py-2 bg-purple-600 rounded-lg text-sm hover:bg-purple-700">
                + {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/app/dashboard/widgets/ fanclash/src/components/dashboard/WidgetCard.tsx
git commit -m "feat: add widget management page with create/toggle/theme"
```

---

### Task 10: Donation Input Page

**Files:**
- Create: `fanclash/src/app/dashboard/donations/page.tsx`
- Create: `fanclash/src/components/dashboard/DonationForm.tsx`

- [ ] **Step 1: Create DonationForm**

```tsx
// src/components/dashboard/DonationForm.tsx
'use client';
import { useState } from 'react';
import { getSocket } from '@/lib/socket/client';

export default function DonationForm({ streamerId }: { streamerId: string }) {
  const [nickname, setNickname] = useState('');
  const [amount, setAmount] = useState('');
  const [history, setHistory] = useState<{ nickname: string; amount: number; time: string }[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = getSocket();
    const amountNum = parseInt(amount);
    if (!nickname || !amountNum) return;

    socket.emit('donation:add', { streamer_id: streamerId, fan_nickname: nickname, amount: amountNum });
    setHistory(prev => [{ nickname, amount: amountNum, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 20));
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-gray-900 rounded-xl p-6 space-y-4">
        <div className="flex gap-4">
          <input type="text" placeholder="시청자 닉네임" value={nickname} onChange={e => setNickname(e.target.value)}
            className="flex-1 p-3 rounded-lg bg-gray-800 text-white" required />
          <input type="number" placeholder="금액 (원)" value={amount} onChange={e => setAmount(e.target.value)}
            className="w-40 p-3 rounded-lg bg-gray-800 text-white" required min={1} />
          <button type="submit" className="px-6 py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700">
            입력
          </button>
        </div>
        <div className="flex gap-2">
          {[1000, 5000, 10000, 50000].map(v => (
            <button key={v} type="button" onClick={() => setAmount(String(v))}
              className="px-3 py-1 bg-gray-800 rounded-lg text-sm hover:bg-gray-700">
              {v.toLocaleString()}원
            </button>
          ))}
        </div>
      </form>
      {history.length > 0 && (
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="font-bold mb-3">최근 입력</h3>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div key={i} className="flex justify-between text-sm text-gray-300">
                <span>{h.nickname}</span>
                <span>{h.amount.toLocaleString()}원</span>
                <span className="text-gray-500">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create donations page**

```tsx
// src/app/dashboard/donations/page.tsx
import { createClient } from '@/lib/supabase/server';
import DonationForm from '@/components/dashboard/DonationForm';

export default async function DonationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">후원 입력</h2>
      <p className="text-gray-400 mb-4">방송 중 받은 후원을 수동으로 입력하세요. 위젯에 실시간 반영됩니다.</p>
      <DonationForm streamerId={user!.id} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/app/dashboard/donations/ fanclash/src/components/dashboard/DonationForm.tsx
git commit -m "feat: add donation input page with quick amount buttons"
```

---

### Task 11: Battle Management Page

**Files:**
- Create: `fanclash/src/app/dashboard/battle/page.tsx`
- Create: `fanclash/src/components/dashboard/BattleControl.tsx`

- [ ] **Step 1: Create BattleControl**

```tsx
// src/components/dashboard/BattleControl.tsx
'use client';
import { useState, useEffect } from 'react';
import { getSocket } from '@/lib/socket/client';
import type { Battle, BattleParticipant } from '@/types';

export default function BattleControl({ streamerId }: { streamerId: string }) {
  const [benefit, setBenefit] = useState('');
  const [minAmount, setMinAmount] = useState('5000');
  const [timeLimit, setTimeLimit] = useState('180');
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);

  useEffect(() => {
    const socket = getSocket();
    socket.on('battle:update', (data) => {
      setActiveBattle(data.battle as any);
      setParticipants(data.participants as any);
    });
    socket.on('battle:finished', (data) => {
      setActiveBattle(null);
      setParticipants([]);
      alert(`배틀 종료! 승자: ${data.winner} / 베네핏: ${data.benefit}`);
    });
    return () => { socket.off('battle:update'); socket.off('battle:finished'); };
  }, []);

  const createBattle = () => {
    const socket = getSocket();
    socket.emit('battle:create', {
      streamer_id: streamerId,
      benefit,
      min_amount: parseInt(minAmount),
      time_limit: parseInt(timeLimit),
    });
  };

  const startBattle = () => {
    if (!activeBattle) return;
    const socket = getSocket();
    socket.emit('battle:start', activeBattle.id);
  };

  if (activeBattle) {
    return (
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">
            {activeBattle.status === 'recruiting' ? '모집 중' : '배틀 진행 중!'}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            activeBattle.status === 'recruiting' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            {activeBattle.status}
          </span>
        </div>
        <p className="text-purple-400 mb-4">베네핏: {activeBattle.benefit}</p>
        <div className="space-y-2 mb-4">
          {participants.map((p, i) => (
            <div key={i} className="flex justify-between bg-gray-800 rounded-lg p-3">
              <span className="font-bold">{p.nickname}</span>
              <span className="text-purple-400">{(p.amount || 0).toLocaleString()}원</span>
            </div>
          ))}
        </div>
        {activeBattle.status === 'recruiting' && participants.length >= 2 && (
          <button onClick={startBattle} className="w-full py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700">
            배틀 시작!
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <h3 className="font-bold text-lg">새 배틀 개설</h3>
      <input type="text" placeholder="베네핏 (예: 듀오 한판!)" value={benefit} onChange={e => setBenefit(e.target.value)}
        className="w-full p-3 rounded-lg bg-gray-800 text-white" />
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="text-sm text-gray-400">최소 참가 금액</label>
          <input type="number" value={minAmount} onChange={e => setMinAmount(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white mt-1" />
        </div>
        <div className="flex-1">
          <label className="text-sm text-gray-400">제한 시간 (초)</label>
          <input type="number" value={timeLimit} onChange={e => setTimeLimit(e.target.value)}
            className="w-full p-3 rounded-lg bg-gray-800 text-white mt-1" />
        </div>
      </div>
      <button onClick={createBattle} disabled={!benefit}
        className="w-full py-3 bg-purple-600 rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50">
        배틀 개설
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create battle page**

```tsx
// src/app/dashboard/battle/page.tsx
import { createClient } from '@/lib/supabase/server';
import BattleControl from '@/components/dashboard/BattleControl';

export default async function BattlePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">배틀 관리</h2>
      <p className="text-gray-400 mb-4">베네핏을 걸고 배틀을 개설하세요. 시청자가 도네로 참가합니다.</p>
      <BattleControl streamerId={user!.id} />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/app/dashboard/battle/ fanclash/src/components/dashboard/BattleControl.tsx
git commit -m "feat: add battle management page with create/start controls"
```

---

## Chunk 4: Overlay Widgets (Tasks 12-17)

### Task 12: Overlay Base + Theme System

**Files:**
- Create: `fanclash/src/app/overlay/[widgetId]/page.tsx`
- Create: `fanclash/src/lib/themes.ts`
- Create: `fanclash/src/hooks/useSocket.ts`
- Create: `fanclash/src/hooks/useWidget.ts`

- [ ] **Step 1: Create theme config**

```typescript
// src/lib/themes.ts
import type { ThemeName } from '@/types';

export const themes: Record<ThemeName, {
  bg: string; text: string; accent: string; card: string; border: string;
  highlight: string; fontClass: string;
}> = {
  modern: {
    bg: 'bg-transparent', text: 'text-white', accent: 'text-purple-400',
    card: 'bg-gray-900/80', border: 'border-gray-700', highlight: 'bg-purple-600',
    fontClass: 'font-sans',
  },
  game: {
    bg: 'bg-transparent', text: 'text-green-300', accent: 'text-yellow-400',
    card: 'bg-black/90', border: 'border-cyan-500', highlight: 'bg-red-600',
    fontClass: 'font-mono',
  },
  girlcam: {
    bg: 'bg-transparent', text: 'text-pink-100', accent: 'text-pink-400',
    card: 'bg-pink-950/80', border: 'border-pink-300', highlight: 'bg-pink-500',
    fontClass: 'font-sans',
  },
};
```

- [ ] **Step 2: Create useSocket and useWidget hooks**

```typescript
// src/hooks/useSocket.ts
'use client';
import { useEffect, useRef } from 'react';
import { getSocket } from '@/lib/socket/client';
import type { Socket } from 'socket.io-client';

export function useSocket(widgetId: string) {
  const socketRef = useRef<ReturnType<typeof getSocket> | null>(null);

  useEffect(() => {
    const socket = getSocket();
    socket.emit('widget:subscribe' as any, widgetId);
    socketRef.current = socket;
    return () => { socket.off(); };
  }, [widgetId]);

  return socketRef;
}
```

```typescript
// src/hooks/useWidget.ts
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Widget } from '@/types';

export function useWidget(widgetId: string) {
  const [widget, setWidget] = useState<Widget | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.from('widgets').select('*').eq('id', widgetId).single()
      .then(({ data }) => setWidget(data));
  }, [widgetId]);

  return widget;
}
```

- [ ] **Step 3: Create overlay page (widget router)**

```tsx
// src/app/overlay/[widgetId]/page.tsx
'use client';
import { use } from 'react';
import { useWidget } from '@/hooks/useWidget';
import RankingBoard from '@/components/overlay/RankingBoard';
import ThroneAlert from '@/components/overlay/ThroneAlert';
import DonationGoal from '@/components/overlay/DonationGoal';
import AffinityBadge from '@/components/overlay/AffinityBadge';
import BattleArena from '@/components/overlay/BattleArena';
import TeamBattle from '@/components/overlay/TeamBattle';

export default function OverlayPage({ params }: { params: Promise<{ widgetId: string }> }) {
  const { widgetId } = use(params);
  const widget = useWidget(widgetId);

  if (!widget) return <div className="bg-transparent" />;

  const props = { widget };

  switch (widget.type) {
    case 'ranking': return <RankingBoard {...props} />;
    case 'throne': return <ThroneAlert {...props} />;
    case 'goal': return <DonationGoal {...props} />;
    case 'affinity': return <AffinityBadge {...props} />;
    case 'battle': return <BattleArena {...props} />;
    case 'team_battle': return <TeamBattle {...props} />;
    default: return null;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add fanclash/src/app/overlay/ fanclash/src/lib/themes.ts fanclash/src/hooks/
git commit -m "feat: add overlay page router with theme system and hooks"
```

---

### Task 13: Ranking Board Overlay

**Files:**
- Create: `fanclash/src/components/overlay/RankingBoard.tsx`

- [ ] **Step 1: Implement RankingBoard**

```tsx
// src/components/overlay/RankingBoard.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget, FanProfile } from '@/types';

interface RankEntry { nickname: string; total: number; }

export default function RankingBoard({ widget }: { widget: Widget }) {
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('ranking:update', (data) => {
      setRankings(data.rankings.map((r: any) => ({ nickname: r.nickname, total: r.total_donated || r.total })));
    });
    return () => { socket.off('ranking:update'); };
  }, [socketRef.current]);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {rankings.slice(0, 5).map((entry, i) => (
          <motion.div key={entry.nickname}
            layout
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`flex items-center gap-3 mb-2 p-3 rounded-lg ${theme.card} border ${
              i === 0 ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : theme.border
            }`}>
            <span className={`text-2xl font-bold w-8 text-center ${i === 0 ? 'text-yellow-400' : theme.text}`}>
              {i === 0 ? '👑' : i + 1}
            </span>
            <span className={`flex-1 font-bold ${i === 0 ? 'text-yellow-200' : theme.text}`}>
              {entry.nickname}
            </span>
            <span className={`font-bold ${theme.accent}`}>
              {entry.total.toLocaleString()}원
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/components/overlay/RankingBoard.tsx
git commit -m "feat: add ranking board overlay widget with animations"
```

---

### Task 14: Throne Alert Overlay

**Files:**
- Create: `fanclash/src/components/overlay/ThroneAlert.tsx`

- [ ] **Step 1: Implement ThroneAlert**

```tsx
// src/components/overlay/ThroneAlert.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

export default function ThroneAlert({ widget }: { widget: Widget }) {
  const [alert, setAlert] = useState<{ previous: string; current: string } | null>(null);
  const [throneCount, setThroneCount] = useState(0);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('throne:change', (data) => {
      setAlert({ previous: data.previous, current: data.current });
      setThroneCount(prev => prev + 1);
      setTimeout(() => setAlert(null), 5000);
    });
    return () => { socket.off('throne:change'); };
  }, [socketRef.current]);

  return (
    <div className={`${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center">
            <div className={`text-center p-8 rounded-2xl ${theme.card} border-2 border-yellow-500 shadow-2xl shadow-yellow-500/30`}>
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-4">👑</motion.div>
              <p className="text-yellow-400 text-xl font-bold mb-2">왕좌 쟁탈!</p>
              <p className={`text-3xl font-bold ${theme.text}`}>
                <span className="text-red-400 line-through">{alert.previous}</span>
                <span className="mx-3">→</span>
                <span className="text-yellow-300">{alert.current}</span>
              </p>
              <p className="text-gray-400 text-sm mt-3">오늘 쟁탈 횟수: {throneCount}회</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/components/overlay/ThroneAlert.tsx
git commit -m "feat: add throne alert overlay with crown animation"
```

---

### Task 15: Donation Goal Overlay

**Files:**
- Create: `fanclash/src/components/overlay/DonationGoal.tsx`

- [ ] **Step 1: Implement DonationGoal**

```tsx
// src/components/overlay/DonationGoal.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

export default function DonationGoal({ widget }: { widget: Widget }) {
  const [currentAmount, setCurrentAmount] = useState(0);
  const [milestones, setMilestones] = useState<{ amount: number; mission: string }[]>([]);
  const [justReached, setJustReached] = useState<number | null>(null);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('goal:update', (data) => {
      const prevAmount = currentAmount;
      setCurrentAmount(data.current_amount);
      setMilestones(data.milestones);
      // Check if milestone just reached
      for (const m of data.milestones) {
        if (prevAmount < m.amount && data.current_amount >= m.amount) {
          setJustReached(m.amount);
          setTimeout(() => setJustReached(null), 4000);
        }
      }
    });
    return () => { socket.off('goal:update'); };
  }, [socketRef.current, currentAmount]);

  const maxMilestone = milestones.length > 0 ? milestones[milestones.length - 1].amount : 100000;
  const percentage = Math.min((currentAmount / maxMilestone) * 100, 100);

  return (
    <div className={`p-4 ${theme.bg} ${theme.fontClass}`}>
      <div className={`p-4 rounded-xl ${theme.card} border ${theme.border}`}>
        <div className="flex justify-between mb-2">
          <span className={`font-bold ${theme.text}`}>도네 목표</span>
          <span className={`font-bold ${theme.accent}`}>{currentAmount.toLocaleString()}원</span>
        </div>
        <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${theme.highlight} rounded-full`}
            animate={{ width: `${percentage}%` }}
            transition={{ type: 'spring', stiffness: 50 }}
          />
          {milestones.map((m) => (
            <div key={m.amount}
              className="absolute top-0 h-full w-0.5 bg-white/30"
              style={{ left: `${(m.amount / maxMilestone) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-3 space-y-1">
          {milestones.map((m) => (
            <div key={m.amount} className={`flex justify-between text-sm ${
              currentAmount >= m.amount ? 'text-green-400' : 'text-gray-500'
            }`}>
              <span>{currentAmount >= m.amount ? '✅' : '⬜'} {m.mission}</span>
              <span>{m.amount.toLocaleString()}원</span>
            </div>
          ))}
        </div>
      </div>
      {justReached && (
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
          className="fixed inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-2">🎉</div>
            <p className="text-2xl font-bold text-yellow-400">목표 달성!</p>
            <p className={`text-xl ${theme.text}`}>
              {milestones.find(m => m.amount === justReached)?.mission}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/components/overlay/DonationGoal.tsx
git commit -m "feat: add donation goal gauge overlay with milestone celebrations"
```

---

### Task 16: Affinity Badge Overlay

**Files:**
- Create: `fanclash/src/components/overlay/AffinityBadge.tsx`

- [ ] **Step 1: Implement AffinityBadge**

```tsx
// src/components/overlay/AffinityBadge.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const LEVEL_EMOJIS = ['👤', '⭐', '🔥', '💕', '💎'];

export default function AffinityBadge({ widget }: { widget: Widget }) {
  const [levelUp, setLevelUp] = useState<{ nickname: string; level: number; title: string } | null>(null);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('affinity:levelup', (data) => {
      setLevelUp(data);
      setTimeout(() => setLevelUp(null), 4000);
    });
    return () => { socket.off('affinity:levelup'); };
  }, [socketRef.current]);

  return (
    <div className={`${theme.bg} ${theme.fontClass}`}>
      <AnimatePresence>
        {levelUp && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2">
            <div className={`px-8 py-4 rounded-2xl ${theme.card} border ${theme.border} text-center shadow-xl`}>
              <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: 2 }} className="text-4xl mb-2">
                {LEVEL_EMOJIS[levelUp.level] || '💎'}
              </motion.div>
              <p className={`font-bold text-lg ${theme.accent}`}>레벨 업!</p>
              <p className={`text-xl font-bold ${theme.text}`}>{levelUp.nickname}</p>
              <p className={`text-lg ${theme.accent}`}>{levelUp.title}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add fanclash/src/components/overlay/AffinityBadge.tsx
git commit -m "feat: add affinity level-up overlay with badge animation"
```

---

### Task 17: Battle Arena + Team Battle Overlay

**Files:**
- Create: `fanclash/src/components/overlay/BattleArena.tsx`
- Create: `fanclash/src/components/overlay/TeamBattle.tsx`

- [ ] **Step 1: Implement BattleArena**

```tsx
// src/components/overlay/BattleArena.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget, Battle, BattleParticipant } from '@/types';

export default function BattleArena({ widget }: { widget: Widget }) {
  const [battle, setBattle] = useState<Battle | null>(null);
  const [participants, setParticipants] = useState<BattleParticipant[]>([]);
  const [winner, setWinner] = useState<{ winner: string; benefit: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('battle:update', (data) => {
      setBattle(data.battle as any);
      setParticipants(data.participants as any);
      if (data.battle.status === 'active' && data.battle.time_limit) {
        setTimeLeft(data.battle.time_limit);
      }
    });
    socket.on('battle:finished', (data) => {
      setWinner(data);
      setTimeout(() => { setWinner(null); setBattle(null); setParticipants([]); }, 8000);
    });
    return () => { socket.off('battle:update'); socket.off('battle:finished'); };
  }, [socketRef.current]);

  // Countdown timer
  useEffect(() => {
    if (battle?.status !== 'active' || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000);
    return () => clearInterval(interval);
  }, [battle?.status, timeLeft]);

  if (winner) {
    return (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
        className="fixed inset-0 flex items-center justify-center">
        <div className={`text-center p-12 rounded-2xl ${theme.card} border-2 border-yellow-500`}>
          <div className="text-6xl mb-4">🏆</div>
          <p className="text-yellow-400 text-2xl font-bold">승자!</p>
          <p className={`text-4xl font-bold mt-2 ${theme.text}`}>{winner.winner}</p>
          <p className={`text-lg mt-3 ${theme.accent}`}>베네핏: {winner.benefit}</p>
        </div>
      </motion.div>
    );
  }

  if (!battle) return null;

  if (battle.status === 'recruiting') {
    return (
      <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
        <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }}
          className={`p-6 rounded-2xl ${theme.card} border-2 ${theme.border} text-center`}>
          <p className={`text-2xl font-bold ${theme.accent}`}>⚔️ 배틀 모집 중!</p>
          <p className={`text-lg mt-2 ${theme.text}`}>도네로 참가하세요!</p>
          <p className="text-yellow-400 mt-2 font-bold">베네핏: {battle.benefit}</p>
          <p className="text-gray-400 mt-1">최소 {battle.min_amount.toLocaleString()}원</p>
          <div className="mt-4 space-y-1">
            {participants.map((p, i) => (
              <div key={i} className={`${theme.text} font-bold`}>✅ {p.nickname} 참가!</div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Active battle
  const maxAmount = Math.max(...participants.map(p => p.amount || 1), 1);

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <div className={`p-6 rounded-2xl ${theme.card} border-2 border-red-500`}>
        <div className="flex justify-between items-center mb-4">
          <span className="text-red-400 font-bold text-xl">⚔️ 배틀 진행 중!</span>
          <span className="text-2xl font-mono font-bold text-white">
            {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
          </span>
        </div>
        <div className="space-y-3">
          {participants.map((p, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold ${theme.text}`}>{p.nickname}</span>
                <span className={`font-bold ${theme.accent}`}>{(p.amount || 0).toLocaleString()}원</span>
              </div>
              <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${i === 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                  animate={{ width: `${((p.amount || 0) / maxAmount) * 100}%` }}
                  transition={{ type: 'spring' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Implement TeamBattle**

```tsx
// src/components/overlay/TeamBattle.tsx
'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSocket } from '@/hooks/useSocket';
import { themes } from '@/lib/themes';
import type { Widget } from '@/types';

const TEAM_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

export default function TeamBattle({ widget }: { widget: Widget }) {
  const [teams, setTeams] = useState<Record<number, { total: number; members: any[] }>>({});
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const socketRef = useSocket(widget.id);
  const theme = themes[widget.theme];

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.on('team_battle:update', (data) => {
      setTeams(data.teams);
      setTeamNames(data.battle.team_names || []);
    });
    return () => { socket.off('team_battle:update'); };
  }, [socketRef.current]);

  const maxTotal = Math.max(...Object.values(teams).map(t => t.total || 1), 1);

  return (
    <div className={`p-6 ${theme.bg} ${theme.fontClass}`}>
      <div className={`p-6 rounded-2xl ${theme.card} border ${theme.border}`}>
        <p className={`text-xl font-bold mb-4 ${theme.text}`}>⚔️ 팀 대결</p>
        <div className="space-y-3">
          {Object.entries(teams).map(([idx, team]) => (
            <div key={idx}>
              <div className="flex justify-between mb-1">
                <span className={`font-bold ${theme.text}`}>
                  {teamNames[Number(idx)] || `팀 ${Number(idx) + 1}`}
                </span>
                <span className={`font-bold ${theme.accent}`}>{(team.total || 0).toLocaleString()}원</span>
              </div>
              <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${TEAM_COLORS[Number(idx)] || 'bg-gray-500'}`}
                  animate={{ width: `${((team.total || 0) / maxTotal) * 100}%` }}
                  transition={{ type: 'spring' }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/components/overlay/BattleArena.tsx fanclash/src/components/overlay/TeamBattle.tsx
git commit -m "feat: add battle arena and team battle overlay widgets"
```

---

## Chunk 5: Landing Page + Final Wiring (Task 18)

### Task 18: Landing Page + Donation Goal Dashboard Setup

**Files:**
- Modify: `fanclash/src/app/page.tsx`

- [ ] **Step 1: Create landing page**

```tsx
// src/app/page.tsx
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-purple-400">FanClash</h1>
        <div className="flex gap-4">
          <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white">로그인</Link>
          <Link href="/signup" className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">시작하기</Link>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto text-center pt-24 px-6">
        <h2 className="text-5xl font-bold mb-6">
          팬들의 <span className="text-purple-400">경쟁</span>이<br/>
          당신의 <span className="text-yellow-400">수익</span>이 됩니다
        </h2>
        <p className="text-xl text-gray-400 mb-12">
          후원 랭킹, 왕좌 쟁탈전, 배틀 시스템으로<br/>
          시청자 참여와 후원을 극대화하세요
        </p>
        <Link href="/signup"
          className="inline-block px-8 py-4 bg-purple-600 rounded-xl text-xl font-bold hover:bg-purple-700 transition">
          무료로 시작하기
        </Link>
        <div className="grid grid-cols-3 gap-8 mt-24">
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">👑</div>
            <h3 className="font-bold text-lg mb-2">왕좌 쟁탈전</h3>
            <p className="text-gray-400 text-sm">1등이 바뀔 때마다 풀스크린 알림. 경쟁심 폭발!</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">⚔️</div>
            <h3 className="font-bold text-lg mb-2">후원 배틀</h3>
            <p className="text-gray-400 text-sm">베네핏을 걸고 시청자끼리 후원 대결. 3중 수익화!</p>
          </div>
          <div className="bg-gray-900 rounded-xl p-6">
            <div className="text-4xl mb-3">💕</div>
            <h3 className="font-bold text-lg mb-2">호감도 시스템</h3>
            <p className="text-gray-400 text-sm">후원할수록 칭호가 올라가는 팬 등급 시스템</p>
          </div>
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify full flow end-to-end**

```bash
# Terminal 1
cd fanclash && npm run dev

# Terminal 2
cd fanclash && npm run server
```

Test: signup → create widgets → copy OBS URL → open overlay in new tab → input donation → see overlay update in real time

- [ ] **Step 3: Commit**

```bash
git add fanclash/src/app/page.tsx
git commit -m "feat: add landing page and complete MVP wiring"
```

---

## Summary

| Chunk | Tasks | Description |
|-------|-------|-------------|
| 1 | 1-3 | Project setup, DB schema, auth |
| 2 | 4-7 | Ranking/affinity/battle services (TDD), Socket.io server |
| 3 | 8-11 | Dashboard: layout, widgets, donations, battle management |
| 4 | 12-17 | Overlay: theme system, 6 widget components |
| 5 | 18 | Landing page, end-to-end wiring |

**Total: 18 tasks, ~5 chunks**
