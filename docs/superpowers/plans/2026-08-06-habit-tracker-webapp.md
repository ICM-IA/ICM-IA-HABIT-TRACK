# Habit Tracker Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, multi-device habit tracker PWA that replaces a Google Sheets template, with Google login and real-time sync.

**Architecture:** React + TypeScript (Vite) single-page PWA talking directly to Supabase (Postgres + Auth + Realtime) via `@supabase/supabase-js`, protected by Row Level Security. Streaks and stats are computed client-side from two tables (`habits`, `completions`). Deployed on Vercel.

**Tech Stack:** React 18, TypeScript, Vite, `@supabase/supabase-js`, Chart.js + react-chartjs-2, `vite-plugin-pwa`, Vitest + React Testing Library, Vercel.

**Design tokens (dark, black/white/red):** bg `#0a0a0a`, card `#141414`, border `#242424`, text `#f5f5f5`, muted `#8a8a8a`, accent `#e11d2a`.

---

## Prerequisite (manual, done by the user — not by the agent)

Before Task 6 (auth) can be tested end-to-end, the user must:
1. Create a free Supabase project at https://supabase.com.
2. In **Authentication → Providers → Google**, enable Google and paste a Google OAuth Client ID/Secret (from Google Cloud Console), with the Supabase callback URL added as an authorized redirect URI.
3. Copy the project **URL** and **anon public key** into `.env.local` (see Task 2).

The SQL for the tables and RLS is provided in Task 3 and the user runs it in the Supabase SQL editor. Tasks 1–5 and all pure logic (Task 4) can be built and tested without a live Supabase project.

---

## File Structure

```
habit-tracker/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts              # Vite + PWA plugin config
├── .env.local                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (gitignored)
├── .env.example                # committed template
├── public/
│   └── icons/                  # PWA icons (192, 512)
├── supabase/
│   └── schema.sql              # tables + RLS (run in Supabase SQL editor)
└── src/
    ├── main.tsx                # React entry
    ├── App.tsx                 # top-level: auth gate + tab router
    ├── index.css               # design tokens + base styles
    ├── lib/
    │   ├── supabase.ts         # supabase client singleton
    │   └── types.ts            # Habit, Completion, HabitType
    ├── logic/
    │   ├── streaks.ts          # computeDailyStreak, computeWeeklyStreak
    │   ├── stats.ts            # dashboard stats + top habits
    │   └── dates.ts            # date helpers (YYYY-MM-DD, month grid, week)
    ├── data/
    │   ├── useAuth.ts          # session state + signInWithGoogle + signOut
    │   ├── useHabits.ts        # CRUD habits + realtime
    │   └── useCompletions.ts   # toggle completion + realtime + resetMonth
    ├── components/
    │   ├── AuthGate.tsx        # login screen (Sign in with Google)
    │   ├── TabBar.tsx          # bottom nav (4 tabs)
    │   ├── MonthSelector.tsx
    │   ├── HabitCalendar.tsx   # per-habit month calendar
    │   ├── HabitFormModal.tsx  # create/edit habit
    │   ├── ProgressChart.tsx   # Chart.js line chart
    │   └── SettingsSheet.tsx   # export JSON, reset month, sign out
    └── screens/
        ├── Dashboard.tsx
        ├── DailyHabits.tsx
        ├── WeeklyHabits.tsx
        └── MonthlyView.tsx
```

**Responsibility split:** pure logic (`src/logic/*`) has zero React/Supabase imports so it is unit-testable in isolation. Data hooks (`src/data/*`) own all Supabase I/O. Screens/components are presentational and consume hooks + logic.

---

## Task 1: Scaffold Vite + React + TS project

**Files:**
- Create: `habit-tracker/` (via scaffolder)
- Modify: `package.json`, `index.html`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold**

Run from `C:\Users\ciroc\Track habitos`:
```bash
npm create vite@latest habit-tracker -- --template react-ts
cd habit-tracker
npm install
```

- [ ] **Step 2: Install runtime + dev deps**

```bash
npm install @supabase/supabase-js chart.js react-chartjs-2
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom vite-plugin-pwa
```

- [ ] **Step 3: Add test script + jsdom config**

In `package.json`, add to `"scripts"`: `"test": "vitest run"`, `"test:watch": "vitest"`.

In `vite.config.ts`, add a `test` block:
```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/setupTests.ts' },
})
```
Create `src/setupTests.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Verify dev server boots**

Run: `npm run dev`
Expected: Vite prints a `http://localhost:5173` URL with no errors. Stop it with Ctrl+C.

- [ ] **Step 5: Ensure `.env.local` is gitignored**

Confirm `.gitignore` (created by Vite) contains `.env.local` and `*.local`. If not, add `.env.local`.

- [ ] **Step 6: Commit**

```bash
git add habit-tracker
git commit -m "chore: scaffold vite react-ts habit tracker"
```

---

## Task 2: Environment config + Supabase client

**Files:**
- Create: `habit-tracker/.env.example`
- Create: `habit-tracker/.env.local` (gitignored — user fills real values)
- Create: `src/lib/supabase.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 1: Create `.env.example`**

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

- [ ] **Step 2: Create `.env.local`**

Copy `.env.example` to `.env.local`. The user pastes real values from their Supabase project (Prerequisite step 3). Placeholder values are fine for building non-auth tasks.

- [ ] **Step 3: Define shared types (`src/lib/types.ts`)**

```ts
export type HabitType = 'daily' | 'weekly'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  goal: number
  color: string
  sort_order: number
  archived: boolean
  created_at: string
}

export interface Completion {
  id: string
  user_id: string
  habit_id: string
  date: string // YYYY-MM-DD
  created_at: string
}
```

- [ ] **Step 4: Create supabase client (`src/lib/supabase.ts`)**

```ts
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !anonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(url, anonKey)
```

- [ ] **Step 5: Commit**

```bash
git add habit-tracker/.env.example src/lib
git commit -m "feat: add env config, supabase client and shared types"
```

---

## Task 3: Database schema + RLS (SQL)

**Files:**
- Create: `habit-tracker/supabase/schema.sql`

- [ ] **Step 1: Write schema SQL**

```sql
-- habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('daily','weekly')),
  goal int not null default 1 check (goal >= 1),
  color text not null default '#e11d2a',
  sort_order int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

-- completions (existence of a row == done that day)
create table if not exists public.completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, date)
);

create index if not exists completions_user_date_idx on public.completions (user_id, date);

-- Row Level Security
alter table public.habits enable row level security;
alter table public.completions enable row level security;

create policy "own habits" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own completions" on public.completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

- [ ] **Step 2: User runs it**

Instruct the user: open Supabase → SQL Editor → paste `supabase/schema.sql` → Run. Verify in Table Editor that `habits` and `completions` exist with RLS enabled.

- [ ] **Step 3: Commit**

```bash
git add habit-tracker/supabase/schema.sql
git commit -m "feat: add postgres schema and RLS policies"
```

---

## Task 4: Pure logic — dates, streaks, stats (TDD)

**Files:**
- Create: `src/logic/dates.ts`, `src/logic/streaks.ts`, `src/logic/stats.ts`
- Test: `src/logic/dates.test.ts`, `src/logic/streaks.test.ts`, `src/logic/stats.test.ts`

### 4a. Date helpers

- [ ] **Step 1: Write failing test (`src/logic/dates.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { toISODate, daysInMonth, monthDates, weekKey } from './dates'

describe('dates', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 7, 6))).toBe('2026-08-06') // month is 0-based
  })
  it('counts days in a month (year, month 1-based)', () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
  })
  it('lists every ISO date of a month', () => {
    const d = monthDates(2026, 2)
    expect(d[0]).toBe('2026-02-01')
    expect(d.length).toBe(28)
    expect(d[27]).toBe('2026-02-28')
  })
  it('maps a date to its ISO week key (Mon-start)', () => {
    // Same week -> same key; different week -> different key
    expect(weekKey('2026-08-03')).toBe(weekKey('2026-08-06')) // Mon..Thu same week
    expect(weekKey('2026-08-03')).not.toBe(weekKey('2026-08-10'))
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm run test -- src/logic/dates.test.ts`
Expected: FAIL (module not found / undefined functions).

- [ ] **Step 3: Implement (`src/logic/dates.ts`)**

```ts
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** month is 1-based (1 = January). */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/** All ISO dates of a month; month is 1-based. */
export function monthDates(year: number, month: number): string[] {
  const n = daysInMonth(year, month)
  return Array.from({ length: n }, (_, i) => toISODate(new Date(year, month - 1, i + 1)))
}

/** ISO week key "YYYY-Www" with Monday as first day. */
export function weekKey(iso: string): string {
  const d = new Date(iso + 'T00:00:00')
  const day = (d.getDay() + 6) % 7 // Mon=0..Sun=6
  const monday = new Date(d)
  monday.setDate(d.getDate() - day)
  const thursday = new Date(monday)
  thursday.setDate(monday.getDate() + 3)
  const yearStart = new Date(thursday.getFullYear(), 0, 1)
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${thursday.getFullYear()}-W${String(week).padStart(2, '0')}`
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm run test -- src/logic/dates.test.ts`
Expected: PASS.

### 4b. Streaks

- [ ] **Step 5: Write failing test (`src/logic/streaks.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { computeDailyStreak, computeWeeklyStreak } from './streaks'

describe('computeDailyStreak', () => {
  it('counts consecutive days ending today', () => {
    const today = '2026-08-06'
    const done = new Set(['2026-08-06', '2026-08-05', '2026-08-04'])
    expect(computeDailyStreak(done, today)).toBe(3)
  })
  it('is 0 when today not done and yesterday not done', () => {
    expect(computeDailyStreak(new Set(['2026-08-01']), '2026-08-06')).toBe(0)
  })
  it('allows streak that ends yesterday if today not yet marked', () => {
    const done = new Set(['2026-08-05', '2026-08-04'])
    expect(computeDailyStreak(done, '2026-08-06')).toBe(2)
  })
})

describe('computeWeeklyStreak', () => {
  it('counts consecutive weeks meeting the goal', () => {
    // goal 2/week; two full weeks + current week met
    const done = new Set([
      '2026-08-04', '2026-08-06',       // week of Aug 3
      '2026-07-28', '2026-07-30',       // week of Jul 27
    ])
    expect(computeWeeklyStreak(done, 2, '2026-08-06')).toBe(2)
  })
  it('stops at the first week that missed the goal', () => {
    const done = new Set(['2026-08-04', '2026-08-06', '2026-07-28']) // prev week only 1
    expect(computeWeeklyStreak(done, 2, '2026-08-06')).toBe(1)
  })
})
```

- [ ] **Step 6: Run — expect FAIL**

Run: `npm run test -- src/logic/streaks.test.ts`
Expected: FAIL.

- [ ] **Step 7: Implement (`src/logic/streaks.ts`)**

```ts
import { weekKey } from './dates'

function addDays(iso: string, delta: number): string {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Consecutive completed days ending at today, or at yesterday if today unmarked. */
export function computeDailyStreak(done: Set<string>, today: string): number {
  let cursor = done.has(today) ? today : addDays(today, -1)
  let streak = 0
  while (done.has(cursor)) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Consecutive weeks (Mon-start) with at least `goal` completions, ending this week. */
export function computeWeeklyStreak(done: Set<string>, goal: number, today: string): number {
  const counts = new Map<string, number>()
  for (const iso of done) {
    const k = weekKey(iso)
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  let cursor = today
  let streak = 0
  // walk back one week at a time
  // guard against infinite loops with a generous cap (520 weeks = 10y)
  for (let i = 0; i < 520; i++) {
    const k = weekKey(cursor)
    if ((counts.get(k) ?? 0) >= goal) {
      streak++
      cursor = addDays(cursor, -7)
    } else {
      break
    }
  }
  return streak
}
```

- [ ] **Step 8: Run — expect PASS**

Run: `npm run test -- src/logic/streaks.test.ts`
Expected: PASS.

### 4c. Stats

- [ ] **Step 9: Write failing test (`src/logic/stats.test.ts`)**

```ts
import { describe, it, expect } from 'vitest'
import { monthCompletionCount, monthProgress, rankHabits } from './stats'
import type { Habit } from '../lib/types'

const habit = (over: Partial<Habit>): Habit => ({
  id: 'h1', user_id: 'u', name: 'H', type: 'daily', goal: 10,
  color: '#e11d2a', sort_order: 0, archived: false, created_at: '', ...over,
})

describe('stats', () => {
  it('counts completions within a given month', () => {
    const done = new Set(['2026-08-01', '2026-08-15', '2026-07-31'])
    expect(monthCompletionCount(done, 2026, 8)).toBe(2)
  })
  it('computes month progress as count/goal capped at 1', () => {
    const done = new Set(['2026-08-01', '2026-08-02'])
    expect(monthProgress(habit({ goal: 4 }), done, 2026, 8)).toBe(0.5)
    const full = new Set(['2026-08-01','2026-08-02','2026-08-03','2026-08-04','2026-08-05'])
    expect(monthProgress(habit({ goal: 4 }), full, 2026, 8)).toBe(1)
  })
  it('ranks habits by month progress descending', () => {
    const habits = [habit({ id: 'a', goal: 4 }), habit({ id: 'b', goal: 4 })]
    const byHabit = {
      a: new Set(['2026-08-01']),
      b: new Set(['2026-08-01','2026-08-02','2026-08-03']),
    }
    const ranked = rankHabits(habits, byHabit, 2026, 8)
    expect(ranked[0].habit.id).toBe('b')
    expect(ranked[1].habit.id).toBe('a')
  })
})
```

- [ ] **Step 10: Run — expect FAIL**

Run: `npm run test -- src/logic/stats.test.ts`
Expected: FAIL.

- [ ] **Step 11: Implement (`src/logic/stats.ts`)**

```ts
import type { Habit } from '../lib/types'

export function monthCompletionCount(done: Set<string>, year: number, month: number): number {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`
  let n = 0
  for (const iso of done) if (iso.startsWith(prefix)) n++
  return n
}

export function monthProgress(habit: Habit, done: Set<string>, year: number, month: number): number {
  const count = monthCompletionCount(done, year, month)
  return Math.min(1, count / habit.goal)
}

export interface RankedHabit { habit: Habit; progress: number }

export function rankHabits(
  habits: Habit[],
  byHabit: Record<string, Set<string>>,
  year: number,
  month: number,
): RankedHabit[] {
  return habits
    .map((h) => ({ habit: h, progress: monthProgress(h, byHabit[h.id] ?? new Set(), year, month) }))
    .sort((a, b) => b.progress - a.progress)
}
```

- [ ] **Step 12: Run — expect PASS**

Run: `npm run test -- src/logic/stats.test.ts`
Expected: PASS.

- [ ] **Step 13: Commit**

```bash
git add src/logic
git commit -m "feat: add date, streak and stats logic with tests"
```

---

## Task 5: Design tokens + base styles

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace `src/index.css` with tokens + reset**

```css
:root {
  --bg: #0a0a0a;
  --card: #141414;
  --border: #242424;
  --text: #f5f5f5;
  --muted: #8a8a8a;
  --accent: #e11d2a;
  --radius: 14px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
  color-scheme: dark;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); }
button { font: inherit; cursor: pointer; }
.card { background: var(--card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; }
.accent { color: var(--accent); }
.btn-accent { background: var(--accent); color: #fff; border: none; border-radius: var(--radius); padding: 12px 16px; }
.app { max-width: 640px; margin: 0 auto; padding: 16px 16px 88px; } /* bottom padding clears tab bar */
```

- [ ] **Step 2: Verify visually**

Run: `npm run dev`, open the URL. Expected: black background, white default text (Vite starter content restyled dark). Stop server.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add black/white/red dark design tokens"
```

---

## Task 6: Auth — Google login gate

**Files:**
- Create: `src/data/useAuth.ts`
- Create: `src/components/AuthGate.tsx`
- Modify: `src/App.tsx`
- Test: `src/data/useAuth.test.tsx`

- [ ] **Step 1: Write failing test (`src/data/useAuth.test.tsx`)**

Mock supabase auth so the hook is testable without network.
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const getSession = vi.fn()
const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }))
vi.mock('../lib/supabase', () => ({
  supabase: { auth: { getSession, onAuthStateChange, signInWithOAuth: vi.fn(), signOut: vi.fn() } },
}))

import { useAuth } from './useAuth'

describe('useAuth', () => {
  beforeEach(() => vi.clearAllMocks())
  it('starts loading then resolves to the current session user', async () => {
    getSession.mockResolvedValue({ data: { session: { user: { id: 'u1' } } } })
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.user?.id).toBe('u1')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm run test -- src/data/useAuth.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement (`src/data/useAuth.ts`)**

```ts
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
  const signOut = () => supabase.auth.signOut()

  return { user, loading, signInWithGoogle, signOut }
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm run test -- src/data/useAuth.test.tsx`
Expected: PASS.

- [ ] **Step 5: Implement `AuthGate.tsx`**

```tsx
type Props = { onSignIn: () => void }
export function AuthGate({ onSignIn }: Props) {
  return (
    <div className="app" style={{ display: 'grid', placeItems: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ textAlign: 'center', maxWidth: 320 }}>
        <h1 style={{ marginTop: 0 }}>ICM-IA</h1>
        <p style={{ margin: '0 0 4px', letterSpacing: 2, color: 'var(--accent)', fontSize: 13 }}>HABIT TRACK</p>
        <p style={{ color: 'var(--muted)' }}>Seguí tus hábitos, sincronizados en todos tus dispositivos.</p>
        <button className="btn-accent" style={{ width: '100%' }} onClick={onSignIn}>
          Entrar con Google
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Wire `App.tsx` to gate on auth**

```tsx
import { useAuth } from './data/useAuth'
import { AuthGate } from './components/AuthGate'

export default function App() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  if (loading) return <div className="app">Cargando…</div>
  if (!user) return <AuthGate onSignIn={signInWithGoogle} />
  return (
    <div className="app">
      <p>Sesión iniciada como {user.email}</p>
      <button onClick={signOut}>Cerrar sesión</button>
    </div>
  )
}
```

- [ ] **Step 7: Manual verify (requires Supabase prerequisite done)**

Run: `npm run dev`. Expected: login screen → "Entrar con Google" → Google flow → returns showing your email. If Supabase isn't set up yet, the button will error; that's expected until the prerequisite is complete.

- [ ] **Step 8: Commit**

```bash
git add src/data/useAuth.ts src/data/useAuth.test.tsx src/components/AuthGate.tsx src/App.tsx
git commit -m "feat: google auth gate"
```

---

## Task 7: Data hooks — habits & completions with realtime

**Files:**
- Create: `src/data/useHabits.ts`, `src/data/useCompletions.ts`
- Test: `src/data/useHabits.test.tsx`

Note: these hooks own all Supabase reads/writes and subscribe to Realtime. Full network behavior is verified manually; the unit test covers the derived-state shaping (grouping completions into `Set` per habit).

- [ ] **Step 1: Write failing test for completion grouping (`src/data/useCompletions.test.ts`)**

Extract the pure grouping helper so it is testable without React.
```ts
import { describe, it, expect } from 'vitest'
import { groupByHabit } from './useCompletions'
import type { Completion } from '../lib/types'

const c = (habit_id: string, date: string): Completion =>
  ({ id: date + habit_id, user_id: 'u', habit_id, date, created_at: '' })

describe('groupByHabit', () => {
  it('builds a Set of dates per habit id', () => {
    const rows = [c('a', '2026-08-01'), c('a', '2026-08-02'), c('b', '2026-08-01')]
    const g = groupByHabit(rows)
    expect([...g['a']].sort()).toEqual(['2026-08-01', '2026-08-02'])
    expect([...g['b']]).toEqual(['2026-08-01'])
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npm run test -- src/data/useCompletions.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement `useCompletions.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Completion } from '../lib/types'

export function groupByHabit(rows: Completion[]): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {}
  for (const r of rows) {
    ;(out[r.habit_id] ??= new Set()).add(r.date)
  }
  return out
}

export function useCompletions(userId: string) {
  const [rows, setRows] = useState<Completion[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase.from('completions').select('*').eq('user_id', userId)
    setRows(data ?? [])
  }, [userId])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('completions-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'completions', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, load])

  const toggle = useCallback(async (habitId: string, date: string, done: boolean) => {
    if (done) {
      await supabase.from('completions').delete().eq('habit_id', habitId).eq('date', date)
    } else {
      await supabase.from('completions').insert({ habit_id: habitId, date, user_id: userId })
    }
  }, [userId])

  const resetMonth = useCallback(async (year: number, month: number) => {
    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-31`
    await supabase.from('completions').delete().eq('user_id', userId).gte('date', from).lte('date', to)
  }, [userId])

  return { byHabit: groupByHabit(rows), rows, toggle, resetMonth }
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npm run test -- src/data/useCompletions.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `useHabits.ts`**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Habit, HabitType } from '../lib/types'

export interface HabitInput { name: string; type: HabitType; goal: number; color: string }

export function useHabits(userId: string) {
  const [habits, setHabits] = useState<Habit[]>([])

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('habits').select('*').eq('archived', false).order('sort_order')
    setHabits(data ?? [])
  }, [])

  useEffect(() => {
    load()
    const ch = supabase
      .channel('habits-' + userId)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${userId}` },
        () => load())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [userId, load])

  const create = useCallback(async (input: HabitInput) => {
    await supabase.from('habits').insert({ ...input, user_id: userId, sort_order: habits.length })
  }, [userId, habits.length])

  const update = useCallback(async (id: string, patch: Partial<HabitInput>) => {
    await supabase.from('habits').update(patch).eq('id', id)
  }, [])

  const archive = useCallback(async (id: string) => {
    await supabase.from('habits').update({ archived: true }).eq('id', id)
  }, [])

  return { habits, create, update, archive }
}
```

- [ ] **Step 6: Manual verify**

With Supabase set up and logged in, temporarily call `create({name:'Test',type:'daily',goal:10,color:'#e11d2a'})` from the console or a temp button; confirm the row appears in Supabase Table Editor and in a second browser tab (realtime). Remove any temp button after.

- [ ] **Step 7: Commit**

```bash
git add src/data/useHabits.ts src/data/useCompletions.ts src/data/useCompletions.test.ts
git commit -m "feat: habits & completions data hooks with realtime"
```

---

## Task 8: Shell — TabBar + screen routing

**Files:**
- Create: `src/components/TabBar.tsx`
- Modify: `src/App.tsx`
- Create: `src/screens/Dashboard.tsx`, `DailyHabits.tsx`, `WeeklyHabits.tsx`, `MonthlyView.tsx` (stubs)

- [ ] **Step 1: Create stub screens**

Each of the four screen files, e.g. `src/screens/Dashboard.tsx`:
```tsx
export function Dashboard() { return <h2>Dashboard</h2> }
```
(`DailyHabits`, `WeeklyHabits`, `MonthlyView` identical with their own names.)

- [ ] **Step 2: Implement `TabBar.tsx`**

```tsx
export type Tab = 'dashboard' | 'daily' | 'weekly' | 'monthly'
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'daily', label: 'Diarios', icon: '📅' },
  { id: 'weekly', label: 'Semanales', icon: '🗓️' },
  { id: 'monthly', label: 'Mensual', icon: '📆' },
]
export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, display: 'flex',
      background: 'var(--card)', borderTop: '1px solid var(--border)',
    }}>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          flex: 1, background: 'none', border: 'none', padding: '10px 0',
          color: active === t.id ? 'var(--accent)' : 'var(--muted)', fontSize: 12,
        }}>
          <div style={{ fontSize: 20 }}>{t.icon}</div>{t.label}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 3: Wire routing in `App.tsx`**

Replace the authed branch of `App.tsx`:
```tsx
import { useState } from 'react'
import { TabBar, type Tab } from './components/TabBar'
import { Dashboard } from './screens/Dashboard'
import { DailyHabits } from './screens/DailyHabits'
import { WeeklyHabits } from './screens/WeeklyHabits'
import { MonthlyView } from './screens/MonthlyView'
// ...inside authed return:
const [tab, setTab] = useState<Tab>('dashboard')
return (
  <>
    <div className="app">
      {tab === 'dashboard' && <Dashboard />}
      {tab === 'daily' && <DailyHabits />}
      {tab === 'weekly' && <WeeklyHabits />}
      {tab === 'monthly' && <MonthlyView />}
    </div>
    <TabBar active={tab} onChange={setTab} />
  </>
)
```

- [ ] **Step 4: Verify**

Run: `npm run dev`. Expected: bottom tab bar; tapping switches the four stub headings; active tab is red. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/TabBar.tsx src/screens src/App.tsx
git commit -m "feat: bottom tab bar and screen routing"
```

---

## Task 9: Habit creation modal + shared app state

**Files:**
- Create: `src/components/HabitFormModal.tsx`
- Modify: `src/App.tsx` (instantiate hooks once, pass down; add floating + button)

- [ ] **Step 1: Lift data hooks into `App.tsx`**

In the authed branch, after `const [tab,...]`:
```tsx
import { useHabits } from './data/useHabits'
import { useCompletions } from './data/useCompletions'
// ...
const habitsApi = useHabits(user.id)
const completionsApi = useCompletions(user.id)
const [showForm, setShowForm] = useState(false)
```
Pass `habitsApi` / `completionsApi` as props to each screen (define screen props accordingly as they are built in Tasks 10–13).

- [ ] **Step 2: Implement `HabitFormModal.tsx`**

```tsx
import { useState } from 'react'
import type { HabitType } from '../lib/types'
import type { HabitInput } from '../data/useHabits'

const COLORS = ['#e11d2a', '#ff7a00', '#ffd000', '#39d353', '#3aa0ff', '#a259ff']

export function HabitFormModal({ onClose, onSave }: {
  onClose: () => void
  onSave: (input: HabitInput) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<HabitType>('daily')
  const [goal, setGoal] = useState(20)
  const [color, setColor] = useState(COLORS[0])

  const save = async () => {
    if (!name.trim()) return
    await onSave({ name: name.trim(), type, goal, color })
    onClose()
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'grid', placeItems: 'end center',
    }}>
      <div className="card" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, borderRadius: '16px 16px 0 0' }}>
        <h3 style={{ marginTop: 0 }}>Nuevo hábito</h3>
        <input placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: 12, marginBottom: 12, background: 'var(--bg)',
            color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {(['daily', 'weekly'] as HabitType[]).map((t) => (
            <button key={t} onClick={() => setType(t)} style={{
              flex: 1, padding: 10, borderRadius: 10, border: '1px solid var(--border)',
              background: type === t ? 'var(--accent)' : 'var(--bg)',
              color: type === t ? '#fff' : 'var(--text)',
            }}>{t === 'daily' ? 'Diario' : 'Semanal'}</button>
          ))}
        </div>
        <label style={{ color: 'var(--muted)', fontSize: 13 }}>
          Meta ({type === 'daily' ? 'días por mes' : 'días por semana'})
        </label>
        <input type="number" min={1} value={goal} onChange={(e) => setGoal(Number(e.target.value))}
          style={{ width: '100%', padding: 12, margin: '6px 0 12px', background: 'var(--bg)',
            color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} aria-label={c} style={{
              width: 28, height: 28, borderRadius: '50%', background: c,
              border: color === c ? '2px solid #fff' : '2px solid transparent',
            }} />
          ))}
        </div>
        <button className="btn-accent" style={{ width: '100%' }} onClick={save}>Guardar</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add floating + button and render modal in `App.tsx`**

```tsx
import { HabitFormModal } from './components/HabitFormModal'
// ...in the authed return, inside the fragment:
<button className="btn-accent" onClick={() => setShowForm(true)} aria-label="Nuevo hábito"
  style={{ position: 'fixed', right: 16, bottom: 84, width: 56, height: 56,
    borderRadius: '50%', fontSize: 28, lineHeight: 1 }}>+</button>
{showForm && <HabitFormModal onClose={() => setShowForm(false)} onSave={habitsApi.create} />}
```

- [ ] **Step 4: Verify**

Run: `npm run dev`. Create a habit; confirm it appears in Supabase. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/HabitFormModal.tsx src/App.tsx
git commit -m "feat: create-habit modal and floating action button"
```

---

## Task 10: Daily & Weekly habit screens + calendar

**Files:**
- Create: `src/components/HabitCalendar.tsx`
- Modify: `src/screens/DailyHabits.tsx`, `src/screens/WeeklyHabits.tsx`

Screen props (both screens):
```ts
import type { useHabits } from '../data/useHabits'
import type { useCompletions } from '../data/useCompletions'
type Props = {
  habitsApi: ReturnType<typeof useHabits>
  completionsApi: ReturnType<typeof useCompletions>
  year: number
  month: number // 1-based
}
```

- [ ] **Step 1: Implement `HabitCalendar.tsx`**

```tsx
import { monthDates } from '../logic/dates'

export function HabitCalendar({ year, month, done, color, onToggle }: {
  year: number; month: number; done: Set<string>; color: string
  onToggle: (date: string, isDone: boolean) => void
}) {
  const dates = monthDates(year, month)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 8 }}>
      {dates.map((iso) => {
        const isDone = done.has(iso)
        const day = Number(iso.slice(-2))
        return (
          <button key={iso} onClick={() => onToggle(iso, isDone)} style={{
            aspectRatio: '1', borderRadius: 8, fontSize: 12,
            border: '1px solid var(--border)',
            background: isDone ? color : 'var(--bg)',
            color: isDone ? '#fff' : 'var(--muted)',
          }}>{day}</button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Implement `DailyHabits.tsx`**

```tsx
import { HabitCalendar } from '../components/HabitCalendar'
import { computeDailyStreak } from '../logic/streaks'
import { monthCompletionCount } from '../logic/stats'
import { toISODate } from '../logic/dates'
// Props type as above

export function DailyHabits({ habitsApi, completionsApi, year, month }: Props) {
  const today = toISODate(new Date())
  const daily = habitsApi.habits.filter((h) => h.type === 'daily')
  if (daily.length === 0) return <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito diario con el botón +.</p>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {daily.map((h) => {
        const done = completionsApi.byHabit[h.id] ?? new Set<string>()
        const streak = computeDailyStreak(done, today)
        const count = monthCompletionCount(done, year, month)
        return (
          <div key={h.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{h.name}</strong>
              <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{count}/{h.goal} este mes</div>
            <HabitCalendar year={year} month={month} done={done} color={h.color}
              onToggle={(date, isDone) => completionsApi.toggle(h.id, date, isDone)} />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Implement `WeeklyHabits.tsx`**

Same as DailyHabits but filter `type === 'weekly'`, use `computeWeeklyStreak(done, h.goal, today)` for the streak, and label the goal as `{count}/{h.goal} por semana` (still show the month calendar for marking). Full code:
```tsx
import { HabitCalendar } from '../components/HabitCalendar'
import { computeWeeklyStreak } from '../logic/streaks'
import { toISODate, weekKey } from '../logic/dates'
// Props type as above

export function WeeklyHabits({ habitsApi, completionsApi, year, month }: Props) {
  const today = toISODate(new Date())
  const thisWeek = weekKey(today)
  const weekly = habitsApi.habits.filter((h) => h.type === 'weekly')
  if (weekly.length === 0) return <p style={{ color: 'var(--muted)' }}>Creá tu primer hábito semanal con el botón +.</p>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {weekly.map((h) => {
        const done = completionsApi.byHabit[h.id] ?? new Set<string>()
        const streak = computeWeeklyStreak(done, h.goal, today)
        const thisWeekCount = [...done].filter((d) => weekKey(d) === thisWeek).length
        return (
          <div key={h.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{h.name}</strong>
              <span style={{ color: 'var(--accent)' }}>🔥 {streak}</span>
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{thisWeekCount}/{h.goal} esta semana</div>
            <HabitCalendar year={year} month={month} done={done} color={h.color}
              onToggle={(date, isDone) => completionsApi.toggle(h.id, date, isDone)} />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 4: Pass props from `App.tsx`**

Add month state in `App.tsx`: `const now = new Date(); const [year, setYear] = useState(now.getFullYear()); const [month, setMonth] = useState(now.getMonth() + 1)`. Pass `habitsApi`, `completionsApi`, `year`, `month` to `<DailyHabits/>` and `<WeeklyHabits/>`.

- [ ] **Step 5: Verify**

Run: `npm run dev`. On Diarios/Semanales, tap calendar days to mark; confirm streak and counts update and a second tab syncs. Stop server.

- [ ] **Step 6: Commit**

```bash
git add src/components/HabitCalendar.tsx src/screens/DailyHabits.tsx src/screens/WeeklyHabits.tsx src/App.tsx
git commit -m "feat: daily and weekly habit screens with interactive calendar"
```

---

## Task 11: Dashboard — Today quick-check, stats, chart, top 10

**Files:**
- Create: `src/components/ProgressChart.tsx`
- Modify: `src/screens/Dashboard.tsx`

- [ ] **Step 1: Implement `ProgressChart.tsx`**

```tsx
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip,
} from 'chart.js'
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

export function ProgressChart({ labels, values }: { labels: string[]; values: number[] }) {
  return (
    <Line
      data={{
        labels,
        datasets: [{ data: values, borderColor: '#e11d2a', backgroundColor: '#e11d2a',
          tension: 0.3, pointRadius: 0 }],
      }}
      options={{
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { color: '#8a8a8a' }, grid: { color: '#242424' } },
          y: { ticks: { color: '#8a8a8a' }, grid: { color: '#242424' }, beginAtZero: true },
        },
      }}
    />
  )
}
```

- [ ] **Step 2: Implement `Dashboard.tsx`**

```tsx
import { ProgressChart } from '../components/ProgressChart'
import { computeDailyStreak, computeWeeklyStreak } from '../logic/streaks'
import { rankHabits } from '../logic/stats'
import { toISODate, monthDates } from '../logic/dates'
// Props type identical to Task 10

export function Dashboard({ habitsApi, completionsApi, year, month }: Props) {
  const today = toISODate(new Date())
  const habits = habitsApi.habits
  const byHabit = completionsApi.byHabit

  const completedToday = habits.filter((h) => (byHabit[h.id] ?? new Set()).has(today)).length
  const maxStreak = habits.reduce((m, h) => {
    const done = byHabit[h.id] ?? new Set<string>()
    const s = h.type === 'daily' ? computeDailyStreak(done, today) : computeWeeklyStreak(done, h.goal, today)
    return Math.max(m, s)
  }, 0)

  // month progress line: cumulative completions per day across all habits
  const dates = monthDates(year, month)
  const values = dates.map((d) => habits.reduce((n, h) => n + ((byHabit[h.id] ?? new Set()).has(d) ? 1 : 0), 0))
  const cumulative = values.reduce<number[]>((acc, v, i) => [...acc, (acc[i - 1] ?? 0) + v], [])
  const labels = dates.map((d) => d.slice(-2))
  const monthTotal = values.reduce((a, b) => a + b, 0)
  const monthGoal = habits.reduce((a, h) => a + (h.type === 'daily' ? h.goal : 0), 0)

  const top = rankHabits(habits, byHabit, year, month).slice(0, 10)

  const Stat = ({ label, value }: { label: string; value: string | number }) => (
    <div className="card" style={{ textAlign: 'center', padding: 12 }}>
      <div style={{ fontSize: 22, color: 'var(--accent)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div className="card">
        <strong>Hoy</strong>
        <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
          {habits.length === 0 && <span style={{ color: 'var(--muted)' }}>Creá tu primer hábito con +.</span>}
          {habits.map((h) => {
            const done = (byHabit[h.id] ?? new Set()).has(today)
            return (
              <button key={h.id} onClick={() => completionsApi.toggle(h.id, today, done)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)',
                background: done ? h.color : 'var(--bg)', color: done ? '#fff' : 'var(--text)',
              }}>
                <span>{h.name}</span><span>{done ? '✓' : ''}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Stat label="Hábitos" value={habits.length} />
        <Stat label="Hoy" value={completedToday} />
        <Stat label="Racha máx" value={maxStreak} />
        <Stat label="Mes" value={monthGoal ? `${Math.round((monthTotal / monthGoal) * 100)}%` : '—'} />
      </div>

      <div className="card">
        <strong>Progreso del mes</strong>
        <ProgressChart labels={labels} values={cumulative} />
      </div>

      <div className="card">
        <strong>Top 10 hábitos</strong>
        <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
          {top.map((r) => (
            <li key={r.habit.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{r.habit.name}</span>
              <span style={{ color: 'var(--accent)' }}>{Math.round(r.progress * 100)}%</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Pass props to `<Dashboard/>` in `App.tsx`** (same four props as the habit screens).

- [ ] **Step 4: Verify**

Run: `npm run dev`. Dashboard shows Today toggles, four stat tiles, a red cumulative line chart, and Top 10. Marking from Today updates stats live. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressChart.tsx src/screens/Dashboard.tsx src/App.tsx
git commit -m "feat: dashboard with today check, stats, chart and top 10"
```

---

## Task 12: Monthly view + month selector

**Files:**
- Create: `src/components/MonthSelector.tsx`
- Modify: `src/screens/MonthlyView.tsx`, `src/App.tsx`

- [ ] **Step 1: Implement `MonthSelector.tsx`**

```tsx
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
export function MonthSelector({ year, month, onChange }: {
  year: number; month: number; onChange: (year: number, month: number) => void
}) {
  const prev = () => month === 1 ? onChange(year - 1, 12) : onChange(year, month - 1)
  const next = () => month === 12 ? onChange(year + 1, 1) : onChange(year, month + 1)
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <button onClick={prev} className="card" style={{ padding: '6px 12px' }}>‹</button>
      <strong>{MONTHS[month - 1]} {year}</strong>
      <button onClick={next} className="card" style={{ padding: '6px 12px' }}>›</button>
    </div>
  )
}
```

- [ ] **Step 2: Implement `MonthlyView.tsx`** (grid: habits × days)

```tsx
import { MonthSelector } from '../components/MonthSelector'
import { monthDates } from '../logic/dates'
// Props: same four + onMonthChange
type Props = {
  habitsApi: ReturnType<typeof import('../data/useHabits').useHabits>
  completionsApi: ReturnType<typeof import('../data/useCompletions').useCompletions>
  year: number; month: number
  onMonthChange: (year: number, month: number) => void
}

export function MonthlyView({ habitsApi, completionsApi, year, month, onMonthChange }: Props) {
  const dates = monthDates(year, month)
  const days = dates.map((d) => Number(d.slice(-2)))
  return (
    <div>
      <MonthSelector year={year} month={month} onChange={onMonthChange} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg)', textAlign: 'left' }}>Hábito</th>
              {days.map((d) => <th key={d} style={{ padding: 2, color: 'var(--muted)' }}>{d}</th>)}
            </tr>
          </thead>
          <tbody>
            {habitsApi.habits.map((h) => {
              const done = completionsApi.byHabit[h.id] ?? new Set<string>()
              return (
                <tr key={h.id}>
                  <td style={{ position: 'sticky', left: 0, background: 'var(--bg)',
                    whiteSpace: 'nowrap', paddingRight: 8 }}>{h.name}</td>
                  {dates.map((iso) => {
                    const isDone = done.has(iso)
                    return (
                      <td key={iso} onClick={() => completionsApi.toggle(h.id, iso, isDone)}
                        style={{ width: 16, height: 16, textAlign: 'center', cursor: 'pointer',
                          background: isDone ? h.color : 'transparent',
                          border: '1px solid var(--border)' }}>{isDone ? '' : ''}</td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Wire `App.tsx`**

Pass `onMonthChange={(y, m) => { setYear(y); setMonth(m) }}` to `<MonthlyView/>` along with the four props.

- [ ] **Step 4: Verify**

Run: `npm run dev`. Monthly tab shows a scrollable habits×days grid; tapping a cell toggles it; month arrows change the visible month everywhere. Stop server.

- [ ] **Step 5: Commit**

```bash
git add src/components/MonthSelector.tsx src/screens/MonthlyView.tsx src/App.tsx
git commit -m "feat: monthly grid view with month selector"
```

---

## Task 13: Settings — export JSON, reset month, sign out

**Files:**
- Create: `src/components/SettingsSheet.tsx`
- Modify: `src/App.tsx` (header with gear button)

- [ ] **Step 1: Implement `SettingsSheet.tsx`**

```tsx
import type { Habit, Completion } from '../lib/types'

export function SettingsSheet({ habits, completions, year, month, onResetMonth, onSignOut, onClose }: {
  habits: Habit[]; completions: Completion[]
  year: number; month: number
  onResetMonth: () => Promise<void>
  onSignOut: () => void
  onClose: () => void
}) {
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ habits, completions }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `habitos-${year}-${String(month).padStart(2, '0')}.json`
    a.click(); URL.revokeObjectURL(url)
  }
  const resetMonth = async () => {
    if (confirm(`¿Borrar todas las marcas de ${month}/${year}? Esta acción no se puede deshacer.`)) {
      await onResetMonth()
    }
  }
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)',
      display: 'grid', placeItems: 'end center' }}>
      <div className="card" onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, borderRadius: '16px 16px 0 0', display: 'grid', gap: 10 }}>
        <h3 style={{ margin: 0 }}>Ajustes</h3>
        <button className="card" onClick={exportJson}>Exportar datos (JSON)</button>
        <button className="card" style={{ color: 'var(--accent)' }} onClick={resetMonth}>Reset del mes</button>
        <button className="card" onClick={onSignOut}>Cerrar sesión</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add gear button + sheet in `App.tsx`**

Add a header row above the screens with the app title (`ICM-IA` with a small red `HABIT TRACK` subtitle, matching the AuthGate branding) and a ⚙️ button that sets `showSettings`. Render:
```tsx
{showSettings && (
  <SettingsSheet
    habits={habitsApi.habits}
    completions={completionsApi.rows}
    year={year} month={month}
    onResetMonth={() => completionsApi.resetMonth(year, month)}
    onSignOut={signOut}
    onClose={() => setShowSettings(false)}
  />
)}
```

- [ ] **Step 3: Verify**

Run: `npm run dev`. Gear opens settings; Export downloads a JSON file; Reset asks confirmation then clears the month; Sign out returns to the login screen. Stop server.

- [ ] **Step 4: Commit**

```bash
git add src/components/SettingsSheet.tsx src/App.tsx
git commit -m "feat: settings sheet with export, reset month and sign out"
```

---

## Task 14: PWA — installable on phone

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (simple red-on-black icon)

- [ ] **Step 1: Configure `vite-plugin-pwa`**

```ts
import { VitePWA } from 'vite-plugin-pwa'
// add to plugins array:
VitePWA({
  registerType: 'autoUpdate',
  manifest: {
    name: 'ICM-IA Habit Track',
    short_name: 'Habit Track',
    theme_color: '#0a0a0a',
    background_color: '#0a0a0a',
    display: 'standalone',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
})
```

- [ ] **Step 2: Add icons**

Create two solid black PNGs with a red circle/checkmark at 192×192 and 512×512 in `public/icons/`. (Any simple placeholder is fine; can be refined later.)

- [ ] **Step 3: Build + preview**

Run: `npm run build && npm run preview`
Expected: build succeeds; preview serves the app; browser devtools → Application → Manifest shows "ICM-IA Habit Track" with icons, and the app is installable.

- [ ] **Step 4: Commit**

```bash
git add vite.config.ts public/icons
git commit -m "feat: PWA manifest and icons for phone install"
```

---

## Task 15: Deploy to Vercel

**Files:** none (dashboard config)

- [ ] **Step 1: Push repo to GitHub**

Create a GitHub repo and push. Provide the commands to the user:
```bash
git remote add origin https://github.com/<user>/habit-tracker.git
git push -u origin main
```

- [ ] **Step 2: Import in Vercel**

User: vercel.com → New Project → import the repo. Framework preset: Vite. Add env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (same values as `.env.local`).

- [ ] **Step 3: Add production URL to Supabase + Google**

User: in Supabase → Authentication → URL Configuration, add the Vercel production URL to allowed redirect URLs. In Google Cloud OAuth, add the Supabase callback (already set) — no change unless custom domain.

- [ ] **Step 4: Verify end-to-end on phone**

Open the Vercel URL on the phone, "Entrar con Google", add a habit, mark today; open the same on desktop and confirm it syncs. Install the PWA from the phone browser menu ("Add to Home Screen").

- [ ] **Step 5: Final commit / tag**

```bash
git commit --allow-empty -m "chore: deployed to vercel"
```

---

## Self-Review Notes

- **Spec coverage:** unlimited dynamic habits (Task 9), daily/weekly types + goals (Tasks 9–10), mark day (Tasks 10–12), streak 🔥 (Task 4/10/11), dashboard stats + chart + top 10 (Task 11), 4 tabs (Task 8), month selector (Task 12), per-habit calendar (Task 10), cloud persistence + realtime sync (Tasks 3/7), export JSON (Task 13), reset month (Tasks 7/13), Google login (Task 6), dark black/white/red design (Task 5 + inline styles), responsive/mobile-first + PWA (Task 14). Migration of history is explicitly out of scope per spec.
- **Type consistency:** `Habit`/`Completion` (Task 2) used everywhere; `HabitInput` (Task 7) used by modal (Task 9); `byHabit`/`toggle`/`resetMonth`/`rows` (Task 7) used by screens/settings; logic fn names (`computeDailyStreak`, `computeWeeklyStreak`, `monthCompletionCount`, `monthProgress`, `rankHabits`, `monthDates`, `toISODate`, `weekKey`) consistent across Tasks 4/10/11/12.
- **Placeholders:** none — all steps contain concrete code/commands. PWA icons are the only intentionally-refinable asset.
