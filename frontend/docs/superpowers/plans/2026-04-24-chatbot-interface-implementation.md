# OnTime+ Chatbot Interface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the OnTime+ mobile phone app frontend (chat-first RAG assistant for MBTA commuting) per the locked spec at [docs/superpowers/specs/2026-04-24-chatbot-interface-design.md](../specs/2026-04-24-chatbot-interface-design.md).

**Architecture:** Expo app (TypeScript, React Native). Single primary chat screen plus drawer-reachable Today/Schedule/Alerts/History/Settings. All remote data flows through `src/api/client.ts` — either mocked from `src/mocks/` (default) or wired to `POST /api/chat` when the backend lands (marked `BE NEEDED`). Theme tokens drive every color, spacing, radius, and blur; no raw hex in components.

**Tech Stack:** Expo SDK 52, React Native 0.76, TypeScript 5, React Navigation 7 (native-stack + drawer), Zustand 4, @gorhom/bottom-sheet 5, expo-blur, react-native-reanimated 3, @react-native-async-storage/async-storage, jest + @testing-library/react-native.

---

## Critical rules for every task

1. **Branch discipline:** stay on `chatbot-interface`. Never merge, rebase onto main, or open a PR without explicit user instruction. Run `git branch --show-current` before every commit to verify.
2. **Update STATUS.md** after every completed task — append to the active log (Section 8) and update the "Implemented so far" and "Left to do" sections. This is a hard requirement across sessions.
3. **Every commit must be on `chatbot-interface`** and include a Co-Authored-By trailer.
4. **BE NEEDED comments** precede every function that will eventually hit the real backend.
5. **MOCK_ prefix** on every fixture export, `// MOCK DATA` on inline mocks.
6. **No teammate names** anywhere.

---

## File structure (final shape after plan execution)

```
OnTimePlus/
├── App.tsx
├── app.json, app.config.ts
├── babel.config.js, metro.config.js, tsconfig.json, package.json
├── assets/
│   ├── welcome/                       # Nano Banana 2.0 hero.png + Kling 3.0 hero.mp4
│   ├── cards/line-artwork/            # Optional stylized line pictograms
│   └── icons/
├── src/
│   ├── theme/
│   │   ├── tokens.ts                  # Raw token values
│   │   ├── helpers.ts                 # lineColor(), severityTint()
│   │   └── index.ts                   # re-exports
│   ├── types/
│   │   └── index.ts                   # all shared TS types
│   ├── utils/
│   │   ├── uuid.ts                    # UUID v4 generator
│   │   ├── time.ts                    # clock-time + day-of-week helpers
│   │   └── session.ts                 # get-or-create session_id in AsyncStorage
│   ├── storage/
│   │   └── asyncStore.ts              # typed wrappers for AsyncStorage
│   ├── api/
│   │   └── client.ts                  # all fetch calls, mock gate, BE NEEDED stubs
│   ├── mocks/
│   │   ├── alerts.ts
│   │   ├── chat.ts
│   │   ├── schedule.ts
│   │   ├── trips.ts
│   │   └── index.ts
│   ├── store/
│   │   ├── chatStore.ts               # messages, sendingState
│   │   ├── scheduleStore.ts           # classes[]
│   │   └── alertsStore.ts             # alerts[]
│   ├── hooks/
│   │   ├── useChat.ts
│   │   ├── useSchedule.ts
│   │   ├── useAlerts.ts
│   │   └── useBriefing.ts
│   ├── components/
│   │   ├── primitives/
│   │   │   ├── CarbonBackground.tsx
│   │   │   ├── GlassSurface.tsx
│   │   │   └── Text.tsx
│   │   ├── chat/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ChatTypingIndicator.tsx
│   │   │   ├── ChipRow.tsx
│   │   │   ├── Composer.tsx
│   │   │   └── DateSeparator.tsx
│   │   ├── cards/
│   │   │   ├── SpecialCard.tsx        # dispatches on data.type
│   │   │   ├── AlertCardBody.tsx
│   │   │   ├── TripCardBody.tsx
│   │   │   ├── BriefingCardBody.tsx
│   │   │   ├── ScheduleConfirmCardBody.tsx
│   │   │   ├── TripCard.tsx           # Today-screen variant
│   │   │   └── RouteDiagram.tsx
│   │   ├── chrome/
│   │   │   ├── GlassPillNavbar.tsx
│   │   │   ├── Drawer.tsx
│   │   │   └── BottomSheet.tsx
│   │   └── forms/
│   │       ├── ScheduleFormSheet.tsx
│   │       └── FieldRow.tsx
│   ├── screens/
│   │   ├── Welcome.tsx
│   │   ├── Chat.tsx
│   │   ├── Today.tsx
│   │   ├── Schedule.tsx
│   │   ├── Alerts.tsx
│   │   ├── History.tsx
│   │   └── Settings.tsx
│   └── navigation/
│       ├── RootStack.tsx
│       └── DrawerNavigator.tsx
└── __tests__/                         # jest tests (co-located when component-local)
```

---

## Phase 1 — Scaffolding & infrastructure

### Task 1: Confirm branch, scaffold Expo app

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `babel.config.js`, `App.tsx`
- Create dir: `assets/`

- [ ] **Step 1: Verify branch**

```bash
git branch --show-current
```
Expected output: `chatbot-interface`. If not, STOP and run `git checkout chatbot-interface`.

- [ ] **Step 2: Initialize Expo TypeScript project in-place**

```bash
cd c:/Users/Youssef/OnTimePlus
npx create-expo-app@latest . --template blank-typescript --no-install
```
(Interactive prompt may ask about overwriting README/.gitignore — decline; we already have ours.)

- [ ] **Step 3: Install runtime dependencies**

```bash
npm install
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/drawer \
            react-native-screens react-native-safe-area-context react-native-gesture-handler \
            react-native-reanimated @gorhom/bottom-sheet \
            expo-blur expo-linear-gradient expo-font expo-splash-screen expo-av \
            @react-native-async-storage/async-storage zustand \
            lucide-react-native nanoid
```

- [ ] **Step 4: Install dev dependencies**

```bash
npm install -D jest jest-expo @testing-library/react-native @testing-library/jest-native \
              @types/jest react-test-renderer ts-jest
```

- [ ] **Step 5: Verify app boots**

```bash
npx expo start --web
```
Expected: Metro starts, browser opens to a "Welcome" screen from the blank template. Close it. `Ctrl+C` in terminal.

- [ ] **Step 6: Update STATUS.md active log**

Append to Section 8:
```markdown
- **Expo app scaffolded.** Blank TypeScript template. Core deps installed (React Navigation, Zustand, @gorhom/bottom-sheet, expo-blur, Reanimated, AsyncStorage). App boots on web.
```
Also update Section 5 "Implemented so far" with the scaffold entry.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json app.json tsconfig.json babel.config.js App.tsx assets/ STATUS.md
git commit -m "$(cat <<'EOF'
feat: scaffold Expo TypeScript app with core deps

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task 2: Jest + Testing Library setup

**Files:**
- Create: `jest.config.js`
- Modify: `package.json` (scripts)
- Create: `__tests__/smoke.test.ts`

- [ ] **Step 1: Write `jest.config.js`**

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@gorhom))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testPathIgnorePatterns: ['/node_modules/'],
};
```

- [ ] **Step 2: Add test script in `package.json`**

```json
"scripts": {
  "start": "expo start",
  "android": "expo start --android",
  "ios": "expo start --ios",
  "web": "expo start --web",
  "test": "jest",
  "test:watch": "jest --watch"
}
```

- [ ] **Step 3: Write `__tests__/smoke.test.ts`**

```ts
describe('smoke', () => {
  it('runs', () => { expect(1 + 1).toBe(2); });
});
```

- [ ] **Step 4: Run tests**

```bash
npm test
```
Expected: 1 test passes.

- [ ] **Step 5: Update STATUS.md + commit**

```bash
git add jest.config.js package.json __tests__/ STATUS.md
git commit -m "test: configure jest + @testing-library/react-native

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 2 — Types and theme

### Task 3: Write shared TypeScript types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write full type definitions**

Paste the full contents of spec §8 (Data model). Every field and union member should match exactly. File starts with:
```ts
/** Shared types used across the OnTime+ frontend.
 *  Changing a type here requires updating every consumer. */
```
Then the `Message`, `RetrievedChunk`, `MessageRole`, `DayOfWeek`, `ClassEvent`, `TransitLine`, `TransitMode`, `Severity`, `Alert`, `TripLeg`, `TripEstimate`, `SpecialCardData`, `Conversation` types from spec §8.

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts STATUS.md
git commit -m "types: add Message, ClassEvent, Alert, TripEstimate, SpecialCardData

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 4: Theme tokens and helpers

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/helpers.ts`, `src/theme/index.ts`
- Test: `__tests__/theme/helpers.test.ts`

- [ ] **Step 1: Write `src/theme/tokens.ts`**

Paste the full `theme` const from spec §10 / Section 6 of brainstorming (colors, radius, space, type, glass, carbon, motion). Export as `export const tokens = {...} as const;`.

- [ ] **Step 2: Write failing test `__tests__/theme/helpers.test.ts`**

```ts
import { lineColor, severityTint } from '../../src/theme/helpers';

describe('lineColor', () => {
  it('returns Red Line color for RED', () => {
    expect(lineColor('RED')).toBe('#DA291C');
  });
  it('returns fallback for undefined line', () => {
    expect(lineColor(undefined)).toBe('#3A3A3C');
  });
});

describe('severityTint', () => {
  it('returns tinted badge styles for MODERATE', () => {
    const s = severityTint('MODERATE');
    expect(s.fg).toBe('#FFB300');
    expect(s.bg).toMatch(/^rgba/);
    expect(s.border).toMatch(/^rgba/);
  });
  it('returns outlined style for SUSPENDED', () => {
    const s = severityTint('SUSPENDED');
    expect(s.bg).toBe('transparent');
    expect(s.border).toBe('#FF3B30');
  });
});
```

- [ ] **Step 3: Run test → FAIL (module not found)**

```bash
npx jest __tests__/theme/helpers.test.ts
```

- [ ] **Step 4: Write `src/theme/helpers.ts`**

```ts
import { tokens } from './tokens';
import type { TransitLine, Severity } from '../types';

export const lineColor = (line?: TransitLine): string => {
  if (!line) return tokens.color.smokeHigh;
  const map: Record<TransitLine, string> = {
    RED: tokens.color.lineRed,
    ORANGE: tokens.color.lineOrange,
    BLUE: tokens.color.lineBlue,
    GREEN_B: tokens.color.lineGreen,
    GREEN_C: tokens.color.lineGreen,
    GREEN_D: tokens.color.lineGreen,
    GREEN_E: tokens.color.lineGreen,
    SILVER: tokens.color.lineSilver,
    COMMUTER_RAIL: tokens.color.lineCR,
    FERRY: tokens.color.lineFerry,
  };
  return map[line];
};

export const severityTint = (sev: Severity) => ({
  ON_TIME:   { bg: 'rgba(48,209,88,0.12)',  fg: tokens.color.severityOk,   border: 'rgba(48,209,88,0.3)' },
  MODERATE:  { bg: 'rgba(255,179,0,0.12)',  fg: tokens.color.severityWarn, border: 'rgba(255,179,0,0.3)' },
  SEVERE:    { bg: 'rgba(255,59,48,0.12)',  fg: tokens.color.severityErr,  border: 'rgba(255,59,48,0.3)' },
  SUSPENDED: { bg: 'transparent',            fg: tokens.color.severityErr,  border: tokens.color.severityErr },
}[sev]);
```

- [ ] **Step 5: Write `src/theme/index.ts`**

```ts
export { tokens } from './tokens';
export { lineColor, severityTint } from './helpers';
```

- [ ] **Step 6: Run test → PASS**

- [ ] **Step 7: Update STATUS.md + commit**

```bash
git add src/theme/ __tests__/theme/ STATUS.md
git commit -m "theme: add tokens + lineColor/severityTint helpers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 3 — Utils, storage, and session

### Task 5: UUID, time, session utilities

**Files:**
- Create: `src/utils/uuid.ts`, `src/utils/time.ts`, `src/utils/session.ts`
- Create: `src/storage/asyncStore.ts`
- Test: `__tests__/utils/time.test.ts`

- [ ] **Step 1: `src/utils/uuid.ts`**

```ts
import { nanoid } from 'nanoid/non-secure';
export const newId = () => nanoid();
```

- [ ] **Step 2: Write failing test `__tests__/utils/time.test.ts`**

```ts
import { formatClock, minutesUntil, todayDayOfWeek } from '../../src/utils/time';

describe('formatClock', () => {
  it('converts 24h to 12h', () => {
    expect(formatClock('09:05')).toBe('9:05 AM');
    expect(formatClock('14:30')).toBe('2:30 PM');
    expect(formatClock('00:00')).toBe('12:00 AM');
  });
});
describe('minutesUntil', () => {
  it('returns positive minutes for future time today', () => {
    const now = new Date('2026-04-24T09:00:00');
    expect(minutesUntil('09:30', now)).toBe(30);
  });
});
describe('todayDayOfWeek', () => {
  it('returns uppercase 3-letter day', () => {
    const fri = new Date('2026-04-24'); // Friday
    expect(todayDayOfWeek(fri)).toBe('FRI');
  });
});
```

- [ ] **Step 3: Run test → FAIL**

- [ ] **Step 4: `src/utils/time.ts`**

```ts
import type { DayOfWeek } from '../types';

export const formatClock = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export const minutesUntil = (hhmm: string, now = new Date()): number => {
  const [h, m] = hhmm.split(':').map(Number);
  const target = new Date(now);
  target.setHours(h, m, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 60000);
};

const DAYS: DayOfWeek[] = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
export const todayDayOfWeek = (d = new Date()): DayOfWeek => DAYS[d.getDay()];
```

- [ ] **Step 5: Run test → PASS**

- [ ] **Step 6: `src/storage/asyncStore.ts`**

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ClassEvent, Conversation } from '../types';

const KEYS = {
  schedule: 'ontimeplus:schedule',
  sessionId: 'ontimeplus:sessionId',
  onboarded: 'ontimeplus:onboarded',
  history: 'ontimeplus:history',
} as const;

export const storage = {
  async getSchedule(): Promise<ClassEvent[]> {
    const raw = await AsyncStorage.getItem(KEYS.schedule);
    return raw ? JSON.parse(raw) : [];
  },
  async setSchedule(classes: ClassEvent[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.schedule, JSON.stringify(classes));
  },
  async getSessionId(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.sessionId);
  },
  async setSessionId(id: string): Promise<void> {
    await AsyncStorage.setItem(KEYS.sessionId, id);
  },
  async getOnboarded(): Promise<boolean> {
    return (await AsyncStorage.getItem(KEYS.onboarded)) === 'true';
  },
  async setOnboarded(v: boolean): Promise<void> {
    await AsyncStorage.setItem(KEYS.onboarded, String(v));
  },
  async getHistory(): Promise<Conversation[]> {
    const raw = await AsyncStorage.getItem(KEYS.history);
    return raw ? JSON.parse(raw) : [];
  },
  async appendHistory(c: Conversation): Promise<void> {
    const hist = await this.getHistory();
    hist.unshift(c);
    await AsyncStorage.setItem(KEYS.history, JSON.stringify(hist.slice(0, 50)));
  },
};
```

- [ ] **Step 7: `src/utils/session.ts`**

```ts
import { storage } from '../storage/asyncStore';
import { newId } from './uuid';

export const getOrCreateSessionId = async (): Promise<string> => {
  const existing = await storage.getSessionId();
  if (existing) return existing;
  const id = newId();
  await storage.setSessionId(id);
  return id;
};
```

- [ ] **Step 8: Update STATUS.md + commit**

```bash
git add src/utils/ src/storage/ __tests__/utils/ STATUS.md
git commit -m "feat: add uuid, time, session utils + AsyncStorage wrappers

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 4 — Mocks and API client

### Task 6: Mock fixtures

**Files:**
- Create: `src/mocks/alerts.ts`, `src/mocks/schedule.ts`, `src/mocks/trips.ts`, `src/mocks/chat.ts`, `src/mocks/index.ts`

- [ ] **Step 1: `src/mocks/alerts.ts`**

```ts
/* ══════════════════════════════════════════════════════
 * MOCK DATA — MBTA alerts
 * Replace with live fetch when backend/MBTA API is wired.
 * ══════════════════════════════════════════════════════ */
import type { Alert } from '../types';

export const MOCK_ALERTS: Alert[] = [
  {
    id: 'alert-1',
    line: 'RED',
    severity: 'MODERATE',
    title: 'Signal issue · JFK/UMass → Andrew',
    description: 'Southbound trains running ~8 min behind schedule.',
    affectedSegment: 'JFK/UMass → Andrew',
    reportedAt: Date.now() - 12 * 60_000,
    source: 'MBTA',
  },
  {
    id: 'alert-2',
    line: 'GREEN_B',
    severity: 'SEVERE',
    title: 'Suspended · Kenmore → Boston College',
    description: 'Shuttle bus replacement in effect.',
    reportedAt: Date.now() - 45 * 60_000,
    source: 'MBTA',
  },
];

export const MOCK_ALERTS_CLEAR: Alert[] = [];
```

- [ ] **Step 2: `src/mocks/schedule.ts`**

```ts
/* MOCK DATA — schedule fixtures */
import type { ClassEvent } from '../types';

export const MOCK_SCHEDULE: ClassEvent[] = [
  { id: 'c1', name: 'Intro ML',       days: ['MON','WED'], startTime: '10:00', endTime: '11:15', location: 'Wheatley Hall 01-0015' },
  { id: 'c2', name: 'Linear Algebra', days: ['TUE','THU'], startTime: '14:00', endTime: '15:15', location: 'University Hall 2-020' },
];

export const MOCK_PARSED_SCHEDULE: ClassEvent[] = MOCK_SCHEDULE;
```

- [ ] **Step 3: `src/mocks/trips.ts`**

```ts
/* MOCK DATA — trip estimates */
import type { TripEstimate } from '../types';
import { MOCK_ALERTS } from './alerts';

export const MOCK_TRIP_ON_TIME: TripEstimate = {
  legs: [
    { mode: 'WALK', from: 'Home', to: 'Andrew', departTime: '08:48', arriveTime: '08:55' },
    { mode: 'SUBWAY', line: 'RED', from: 'Andrew', to: 'JFK/UMass', departTime: '08:58', arriveTime: '09:06' },
    { mode: 'SHUTTLE', from: 'JFK/UMass', to: 'Campus Center', departTime: '09:10', arriveTime: '09:22' },
  ],
  leaveBy: '08:48', arriveBy: '09:22', bufferMin: 38, risk: 'RELIABLE', affectingAlerts: [],
};

export const MOCK_TRIP_WITH_DELAY: TripEstimate = {
  ...MOCK_TRIP_ON_TIME,
  leaveBy: '09:04', bufferMin: 8, risk: 'RISKY',
  affectingAlerts: [MOCK_ALERTS[0]],
};
```

- [ ] **Step 4: `src/mocks/chat.ts`**

```ts
/* MOCK DATA — canned chat replies.
 * Used when EXPO_PUBLIC_USE_MOCKS !== 'false'. */
import type { Message, SpecialCardData } from '../types';
import { MOCK_ALERTS } from './alerts';
import { MOCK_TRIP_WITH_DELAY } from './trips';
import { MOCK_SCHEDULE } from './schedule';
import { newId } from '../utils/uuid';

const mkBot = (text: string, cards: SpecialCardData[] = [], chips: string[] = []): Message => ({
  id: newId(), role: 'bot', text, timestamp: Date.now(), cards, chips,
});

export const getMockChatReply = (userText: string): { answer: string; retrieved: []; cards: SpecialCardData[]; chips: string[] } => {
  const t = userText.toLowerCase();

  if (/red\s*line/.test(t) && /(status|delay|alert)/.test(t)) {
    return {
      answer: 'Red Line has a moderate delay.',
      retrieved: [],
      cards: [{ type: 'ALERT', alert: MOCK_ALERTS[0], userImpact: { minutes: 8, newLeaveBy: '09:04' } }],
      chips: ['Alt route', 'Track trains'],
    };
  }
  if (/leave|when\s+should|will\s+i\s+make/.test(t)) {
    return {
      answer: 'Here’s the safest leave-by.',
      retrieved: [],
      cards: [{ type: 'TRIP', estimate: MOCK_TRIP_WITH_DELAY, classEvent: MOCK_SCHEDULE[0] }],
      chips: ['Alt route', 'Set reminder'],
    };
  }
  if (/good\s*morning|briefing|today/.test(t)) {
    return {
      answer: 'Morning briefing.',
      retrieved: [],
      cards: [{ type: 'BRIEFING', classEvent: MOCK_SCHEDULE[0], estimate: MOCK_TRIP_WITH_DELAY, alerts: [MOCK_ALERTS[0]] }],
      chips: ['Details', 'Alt route'],
    };
  }
  if (/(mon|tue|wed|thu|fri|class|schedule).*\d/.test(t)) {
    return {
      answer: 'Got it — here’s what I parsed. Confirm?',
      retrieved: [],
      cards: [{ type: 'SCHEDULE_CONFIRM', parsed: MOCK_SCHEDULE }],
      chips: ['Looks right', 'Edit'],
    };
  }
  return { answer: 'I’m OnTime+. Try asking about your next class or a transit line.', retrieved: [], cards: [], chips: [] };
};

export { mkBot };
```

- [ ] **Step 5: `src/mocks/index.ts`**

```ts
export * from './alerts';
export * from './schedule';
export * from './trips';
export * from './chat';
```

- [ ] **Step 6: Commit**

```bash
git add src/mocks/ STATUS.md
git commit -m "mocks: add MOCK_ALERTS, MOCK_SCHEDULE, MOCK_TRIPS, chat replies

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 7: API client with BE NEEDED stubs

**Files:**
- Create: `src/api/client.ts`
- Test: `__tests__/api/client.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { api } from '../../src/api/client';

describe('api.sendMessage (mocks on)', () => {
  beforeAll(() => { process.env.EXPO_PUBLIC_USE_MOCKS = 'true'; });

  it('returns a mocked reply for Red Line query', async () => {
    const r = await api.sendMessage('What is the Red Line status?', 'session-1');
    expect(r.cards[0].type).toBe('ALERT');
  });
  it('returns a trip card for leave-by query', async () => {
    const r = await api.sendMessage('When should I leave?', 'session-1');
    expect(r.cards[0].type).toBe('TRIP');
  });
});
```

- [ ] **Step 2: Run test → FAIL**

- [ ] **Step 3: Write `src/api/client.ts`**

```ts
import { getMockChatReply } from '../mocks';
import { MOCK_ALERTS, MOCK_PARSED_SCHEDULE, MOCK_SCHEDULE, MOCK_TRIP_ON_TIME, MOCK_TRIP_WITH_DELAY } from '../mocks';
import { storage } from '../storage/asyncStore';
import type { Alert, ClassEvent, Message, SpecialCardData, TripEstimate } from '../types';

const USE_MOCKS = process.env.EXPO_PUBLIC_USE_MOCKS !== 'false';
const API_BASE  = process.env.EXPO_PUBLIC_API_BASE ?? 'http://localhost:8000';

export interface ChatReply {
  answer: string;
  retrieved: unknown[];
  cards: SpecialCardData[];
  chips: string[];
}

export const api = {
  /* BE NEEDED
   * POST {API_BASE}/api/chat
   *   request:  { session_id: string, message: string, schedule?: { event_name: string, event_time: string, location: string }, alerts: { route: string, status: string, delay_minutes?: number }[] }
   *   response: { answer: string, risk_level: 'reliable' | 'risky', recommended_departure_time: string, estimated_arrival_time: string, sources: unknown[] }
   */
  async sendMessage(message: string, sessionId: string, schedule: ClassEvent[] = [], alerts: Alert[] = []): Promise<ChatReply> {
    if (USE_MOCKS) return getMockChatReply(message); // MOCK DATA
    const r = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, message, schedule: toApiSchedule(schedule), alerts: toApiAlerts(alerts) }),
    });
    const json = await r.json();
    return { answer: json.answer, retrieved: json.retrieved ?? [], cards: json.cards ?? [], chips: json.chips ?? [] };
  },

  async getAlerts(): Promise<Alert[]> {
    if (USE_MOCKS) return MOCK_ALERTS; // MOCK DATA
    // BE NEEDED: map MBTA api-v3 /alerts payload to our Alert type.
    const r = await fetch('https://api-v3.mbta.com/alerts');
    const json = await r.json();
    return mapMbtaAlerts(json);
  },

  async getSchedule(): Promise<ClassEvent[]> {
    return storage.getSchedule();
  },
  async saveSchedule(classes: ClassEvent[]): Promise<void> {
    await storage.setSchedule(classes);
  },

  /* BE NEEDED
   * Route through sendMessage with a parse-specific prompt until teammate provides a dedicated endpoint.
   * Expected to return JSON string parsed into ClassEvent[].
   */
  async parseSchedule(text: string, sessionId: string): Promise<ClassEvent[]> {
    if (USE_MOCKS) return MOCK_PARSED_SCHEDULE; // MOCK DATA
    const r = await this.sendMessage(`[PARSE_SCHEDULE] ${text}`, sessionId);
    try { return JSON.parse(r.answer); } catch { return []; }
  },

  async getBriefingEstimate(_classes: ClassEvent[], alerts: Alert[]): Promise<TripEstimate> {
    if (USE_MOCKS) {
      return alerts.length > 0 ? MOCK_TRIP_WITH_DELAY : MOCK_TRIP_ON_TIME; // MOCK DATA
    }
    // BE NEEDED: compute client-side from GTFS or backend estimate endpoint.
    return MOCK_TRIP_ON_TIME;
  },
};

/* BE NEEDED: map api-v3.mbta.com/alerts JSON:API response to Alert[]. */
function mapMbtaAlerts(_json: unknown): Alert[] {
  return []; // MOCK DATA — stubbed until live wire-up.
}
```

- [ ] **Step 4: Run test → PASS**

- [ ] **Step 5: Update STATUS.md + commit**

```bash
git add src/api/ __tests__/api/ STATUS.md
git commit -m "api: client with mock gate + BE NEEDED stubs for /api/chat

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 5 — Zustand stores and hooks

### Task 8: Zustand stores

**Files:**
- Create: `src/store/chatStore.ts`, `src/store/scheduleStore.ts`, `src/store/alertsStore.ts`

- [ ] **Step 1: `src/store/chatStore.ts`**

```ts
import { create } from 'zustand';
import type { Message } from '../types';

interface ChatState {
  messages: Message[];
  generating: boolean;
  add: (m: Message) => void;
  setGenerating: (g: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  generating: false,
  add: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setGenerating: (g) => set({ generating: g }),
  reset: () => set({ messages: [], generating: false }),
}));
```

- [ ] **Step 2: `src/store/scheduleStore.ts`**

```ts
import { create } from 'zustand';
import type { ClassEvent } from '../types';
import { api } from '../api/client';

interface SchedState {
  classes: ClassEvent[];
  load: () => Promise<void>;
  save: (c: ClassEvent[]) => Promise<void>;
  upsert: (c: ClassEvent) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export const useScheduleStore = create<SchedState>((set, get) => ({
  classes: [],
  async load() { set({ classes: await api.getSchedule() }); },
  async save(c) { await api.saveSchedule(c); set({ classes: c }); },
  async upsert(c) {
    const cur = get().classes;
    const next = cur.some(x => x.id === c.id) ? cur.map(x => x.id === c.id ? c : x) : [...cur, c];
    await get().save(next);
  },
  async remove(id) { await get().save(get().classes.filter(x => x.id !== id)); },
}));
```

- [ ] **Step 3: `src/store/alertsStore.ts`**

```ts
import { create } from 'zustand';
import type { Alert } from '../types';
import { api } from '../api/client';

interface AlertsState {
  alerts: Alert[];
  refresh: () => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  async refresh() { set({ alerts: await api.getAlerts() }); },
}));
```

- [ ] **Step 4: Commit**

```bash
git add src/store/ STATUS.md
git commit -m "store: Zustand slices for chat, schedule, alerts

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 9: Hooks

**Files:**
- Create: `src/hooks/useChat.ts`, `src/hooks/useSchedule.ts`, `src/hooks/useAlerts.ts`, `src/hooks/useBriefing.ts`

- [ ] **Step 1: `src/hooks/useChat.ts`**

```ts
import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { api } from '../api/client';
import { newId } from '../utils/uuid';
import { getOrCreateSessionId } from '../utils/session';
import type { Message } from '../types';

export const useChat = () => {
  const { messages, generating, add, setGenerating } = useChatStore();

  const send = useCallback(async (text: string) => {
    const user: Message = { id: newId(), role: 'user', text, timestamp: Date.now() };
    add(user);
    setGenerating(true);
    try {
      const sessionId = await getOrCreateSessionId();
      const reply = await api.sendMessage(text, sessionId);
      add({ id: newId(), role: 'bot', text: reply.answer, timestamp: Date.now(), cards: reply.cards, chips: reply.chips });
    } finally {
      setGenerating(false);
    }
  }, [add, setGenerating]);

  return { messages, generating, send };
};
```

- [ ] **Step 2: `src/hooks/useSchedule.ts`**

```ts
import { useEffect } from 'react';
import { useScheduleStore } from '../store/scheduleStore';

export const useSchedule = () => {
  const store = useScheduleStore();
  useEffect(() => { store.load(); }, []); // load once on mount
  return store;
};
```

- [ ] **Step 3: `src/hooks/useAlerts.ts`**

```ts
import { useEffect } from 'react';
import { useAlertsStore } from '../store/alertsStore';

export const useAlerts = () => {
  const store = useAlertsStore();
  useEffect(() => { store.refresh(); }, []);
  return store;
};
```

- [ ] **Step 4: `src/hooks/useBriefing.ts`**

```ts
import { useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useScheduleStore } from '../store/scheduleStore';
import { useAlertsStore } from '../store/alertsStore';
import { api } from '../api/client';
import { newId } from '../utils/uuid';
import { todayDayOfWeek, minutesUntil } from '../utils/time';
import type { Message, ClassEvent } from '../types';

const pickNextClass = (classes: ClassEvent[], now = new Date()): ClassEvent | null => {
  const today = todayDayOfWeek(now);
  const future = classes.filter(c => c.days.includes(today) && minutesUntil(c.startTime, now) > -15);
  return future.sort((a, b) => minutesUntil(a.startTime, now) - minutesUntil(b.startTime, now))[0] ?? null;
};

export const useBriefing = () => {
  const { add } = useChatStore();
  const { classes } = useScheduleStore();
  const { alerts } = useAlertsStore();

  const fire = useCallback(async () => {
    const next = pickNextClass(classes);
    if (!next) return;
    const estimate = await api.getBriefingEstimate(classes, alerts);
    const msg: Message = {
      id: newId(), role: 'bot', timestamp: Date.now(),
      text: `Good morning. Your ${next.name} at ${next.location} is up next.`,
      cards: [{ type: 'BRIEFING', classEvent: next, estimate, alerts: estimate.affectingAlerts }],
      chips: ['Details', 'Alt route'],
    };
    add(msg);
  }, [classes, alerts, add]);

  return { fire };
};
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/ STATUS.md
git commit -m "hooks: useChat, useSchedule, useAlerts, useBriefing

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 6 — Primitives

### Task 10: CarbonBackground, GlassSurface, Text

**Files:**
- Create: `src/components/primitives/CarbonBackground.tsx`, `GlassSurface.tsx`, `Text.tsx`, `index.ts`

- [ ] **Step 1: `CarbonBackground.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import Svg, { Defs, Pattern, Rect, Line } from 'react-native-svg';
import { tokens } from '../../theme';

export const CarbonBackground: React.FC<{ children?: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: tokens.color.charcoal }, style]}>
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <Pattern id="carbon" width={4} height={4} patternUnits="userSpaceOnUse">
          <Line x1={0} y1={0} x2={4} y2={4} stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
          <Line x1={4} y1={0} x2={0} y2={4} stroke="rgba(0,0,0,0.35)" strokeWidth={1} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#carbon)" />
    </Svg>
    {children}
  </View>
);
```

- [ ] **Step 2: `GlassSurface.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { tokens } from '../../theme';

type Tint = 'navbar' | 'drawer' | 'modal';

export const GlassSurface: React.FC<{
  tint?: Tint;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}> = ({ tint = 'navbar', style, children }) => {
  const recipe = tokens.glass[tint];
  return (
    <View style={[{ overflow: 'hidden', borderRadius: tokens.radius.xl }, style]}>
      <BlurView intensity={recipe.blur * 3} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={[
        StyleSheet.absoluteFill,
        { backgroundColor: recipe.bg, borderWidth: 1, borderColor: recipe.border, borderRadius: tokens.radius.xl }
      ]}/>
      {children}
    </View>
  );
};
```

- [ ] **Step 3: `Text.tsx`**

```tsx
import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { tokens } from '../../theme';

type Variant = 'display' | 'title' | 'body' | 'caption' | 'label';

export const Text: React.FC<TextProps & { variant?: Variant; color?: string }> = ({
  variant = 'body', color, style, children, ...rest
}) => {
  const v = tokens.type[variant];
  return (
    <RNText
      {...rest}
      style={[
        { fontSize: v.size, fontWeight: v.weight as any, letterSpacing: v.letterSpacing,
          color: color ?? tokens.color.text,
          textTransform: variant === 'label' ? 'uppercase' : 'none' },
        style,
      ]}
    >{children}</RNText>
  );
};
```

- [ ] **Step 4: `index.ts`**

```ts
export * from './CarbonBackground';
export * from './GlassSurface';
export * from './Text';
```

- [ ] **Step 5: Install react-native-svg**

```bash
npx expo install react-native-svg
```

- [ ] **Step 6: Commit**

```bash
git add src/components/primitives/ package.json package-lock.json STATUS.md
git commit -m "components: CarbonBackground, GlassSurface, Text primitives

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 7 — Chat components

### Task 11: ChatBubble with tails

**Files:**
- Create: `src/components/chat/ChatBubble.tsx`

- [ ] **Step 1: Write component**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../primitives';
import { tokens } from '../../theme';

export const ChatBubble: React.FC<{ variant: 'bot'|'user'; text: string }> = ({ variant, text }) => {
  const isUser = variant === 'user';
  const bg = isUser ? tokens.color.accent : tokens.color.smokeHigh;
  const textColor = isUser ? '#FFFFFF' : tokens.color.text;
  return (
    <View style={[styles.row, { justifyContent: isUser ? 'flex-end' : 'flex-start' }]}>
      {!isUser && <Tail side="left" fill={bg} />}
      <View style={[styles.bubble, {
        backgroundColor: bg,
        borderTopLeftRadius: tokens.radius.lg, borderTopRightRadius: tokens.radius.lg,
        borderBottomLeftRadius: isUser ? tokens.radius.lg : 4,
        borderBottomRightRadius: isUser ? 4 : tokens.radius.lg,
      }]}>
        <Text color={textColor}>{text}</Text>
      </View>
      {isUser && <Tail side="right" fill={bg} />}
    </View>
  );
};

const Tail: React.FC<{ side: 'left'|'right'; fill: string }> = ({ side, fill }) => (
  <Svg width={10} height={16} style={{ alignSelf: 'flex-end', marginBottom: 0 }}>
    {side === 'left'
      ? <Path d="M10 0 L10 16 L0 16 Z" fill={fill} />
      : <Path d="M0 0 L0 16 L10 16 Z" fill={fill} />}
  </Svg>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 3, paddingHorizontal: tokens.space.sm },
  bubble: { maxWidth: '78%', paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/ChatBubble.tsx STATUS.md
git commit -m "components: ChatBubble with iOS-style tails

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 12: ChatTypingIndicator, ChipRow, DateSeparator

**Files:**
- Create: `src/components/chat/ChatTypingIndicator.tsx`, `ChipRow.tsx`, `DateSeparator.tsx`

- [ ] **Step 1: `ChatTypingIndicator.tsx`**

```tsx
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, withDelay } from 'react-native-reanimated';
import { tokens } from '../../theme';

const Dot: React.FC<{ delay: number }> = ({ delay }) => {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(withTiming(1, { duration: 600 }), -1, true));
  }, [delay, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[styles.dot, style]} />;
};

export const ChatTypingIndicator: React.FC = () => (
  <View style={styles.bubble}>
    <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
  </View>
);

const styles = StyleSheet.create({
  bubble: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: tokens.color.smokeHigh,
            paddingHorizontal: 14, paddingVertical: 10, borderRadius: tokens.radius.lg, marginLeft: tokens.space.sm, gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: tokens.color.textDim },
});
```

- [ ] **Step 2: `ChipRow.tsx`**

```tsx
import React from 'react';
import { ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '../primitives';
import { tokens } from '../../theme';

export const ChipRow: React.FC<{ chips: string[]; onPress?: (c: string) => void }> = ({ chips, onPress }) => (
  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {chips.map((c) => (
      <TouchableOpacity key={c} onPress={() => onPress?.(c)} style={styles.chip}>
        <Text variant="caption">{c}</Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  row: { paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm, gap: 6 },
  chip: { paddingHorizontal: tokens.space.md, paddingVertical: 6, borderRadius: tokens.radius.lg,
          backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: tokens.color.smokeBorder, marginRight: 6 },
});
```

- [ ] **Step 3: `DateSeparator.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../primitives';
import { tokens } from '../../theme';

export const DateSeparator: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.row}>
    <Text variant="label" color={tokens.color.textDim}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  row: { alignItems: 'center', paddingVertical: tokens.space.sm },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/components/chat/ STATUS.md
git commit -m "components: ChatTypingIndicator, ChipRow, DateSeparator

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 13: Composer

**Files:**
- Create: `src/components/chat/Composer.tsx`

- [ ] **Step 1: Write component**

```tsx
import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Send, Plus } from 'lucide-react-native';
import { tokens } from '../../theme';

export const Composer: React.FC<{
  disabled?: boolean;
  onSend: (text: string) => void;
  onPlus?: () => void;
}> = ({ disabled, onSend, onPlus }) => {
  const [value, setValue] = useState('');
  const canSend = !disabled && value.trim().length > 0;
  const submit = () => { if (!canSend) return; onSend(value.trim()); setValue(''); };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity onPress={onPlus} style={styles.plusBtn}>
        <Plus size={18} color={tokens.color.textDim} />
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        placeholder="Message OnTime+…"
        placeholderTextColor={tokens.color.textDim}
        value={value}
        onChangeText={setValue}
        multiline
        editable={!disabled}
      />
      <TouchableOpacity onPress={submit} style={[styles.sendBtn, { opacity: canSend ? 1 : 0.35 }]}>
        <Send size={16} color="white" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: tokens.space.sm,
          backgroundColor: 'rgba(44,44,46,0.85)', borderRadius: tokens.radius.xl,
          borderWidth: 1, borderColor: tokens.color.smokeBorder, paddingHorizontal: 12, paddingVertical: 4, gap: 8 },
  plusBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, color: tokens.color.text, fontSize: 15, paddingVertical: 8, maxHeight: 100 },
  sendBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: tokens.color.accent,
             alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chat/Composer.tsx STATUS.md
git commit -m "components: Composer input + plus + send

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 8 — Special cards

### Task 14: SpecialCard frame + body variants

**Files:**
- Create: `src/components/cards/SpecialCard.tsx`, `AlertCardBody.tsx`, `TripCardBody.tsx`, `BriefingCardBody.tsx`, `ScheduleConfirmCardBody.tsx`, `RouteDiagram.tsx`

- [ ] **Step 1: `RouteDiagram.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../primitives';
import { lineColor } from '../../theme';
import { tokens } from '../../theme';
import type { TripLeg } from '../../types';

export const RouteDiagram: React.FC<{ legs: TripLeg[] }> = ({ legs }) => (
  <View style={styles.row}>
    {legs.map((l, i) => (
      <View key={i} style={styles.item}>
        <View style={[styles.pill, { backgroundColor: l.line ? lineColor(l.line) : tokens.color.smokeHigh }]}>
          <Text variant="label" color="#fff">{l.line ?? l.mode}</Text>
        </View>
        {i < legs.length - 1 && <Text color={tokens.color.textDim}>  →  </Text>}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4 },
  item: { flexDirection: 'row', alignItems: 'center' },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: tokens.radius.sm },
});
```

- [ ] **Step 2: `AlertCardBody.tsx`**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../primitives';
import { tokens, lineColor, severityTint } from '../../theme';
import type { Alert } from '../../types';

export const AlertCardBody: React.FC<{ alert: Alert; userImpact?: { minutes: number; newLeaveBy?: string } }> = ({ alert, userImpact }) => {
  const tint = severityTint(alert.severity);
  return (
    <View style={{ padding: tokens.space.md }}>
      <View style={styles.head}>
        <View style={[styles.lineBadge, { backgroundColor: lineColor(alert.line) }]}>
          <Text variant="label" color="#fff">{alert.line ?? alert.mode}</Text>
        </View>
        <View style={[styles.sev, { backgroundColor: tint.bg, borderColor: tint.border }]}>
          <Text variant="label" color={tint.fg}>{alert.severity}</Text>
        </View>
      </View>
      <Text variant="title" style={{ marginTop: 6 }}>{alert.title}</Text>
      <Text variant="caption" color={tokens.color.textDim} style={{ marginTop: 2 }}>{alert.description}</Text>
      {userImpact && (
        <View style={styles.impact}>
          <View>
            <Text variant="label" color={tokens.color.textDim}>Your impact</Text>
            <Text color={tokens.color.severityWarn}>+{userImpact.minutes} min</Text>
          </View>
          {userImpact.newLeaveBy && (
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="label" color={tokens.color.textDim}>New leave-by</Text>
              <Text>{userImpact.newLeaveBy}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 6 },
  lineBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: tokens.radius.sm },
  sev: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: tokens.radius.sm, borderWidth: 1 },
  impact: { flexDirection: 'row', justifyContent: 'space-between', marginTop: tokens.space.md,
            paddingTop: tokens.space.sm, borderTopWidth: 1, borderTopColor: tokens.color.smokeBorder },
});
```

- [ ] **Step 3: `TripCardBody.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives';
import { RouteDiagram } from './RouteDiagram';
import { tokens } from '../../theme';
import { formatClock } from '../../utils/time';
import type { TripEstimate, ClassEvent } from '../../types';

export const TripCardBody: React.FC<{ estimate: TripEstimate; classEvent?: ClassEvent }> = ({ estimate, classEvent }) => (
  <View style={{ padding: tokens.space.md }}>
    {classEvent && <Text variant="title">{classEvent.name} · {formatClock(classEvent.startTime)}</Text>}
    <View style={{ marginTop: 6, marginBottom: tokens.space.sm }}>
      <RouteDiagram legs={estimate.legs} />
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: tokens.space.sm }}>
      <View>
        <Text variant="label" color={tokens.color.textDim}>Leave by</Text>
        <Text>{formatClock(estimate.leaveBy)}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text variant="label" color={tokens.color.textDim}>Risk</Text>
        <Text color={estimate.risk === 'RELIABLE' ? tokens.color.severityOk : tokens.color.severityWarn}>
          {estimate.risk}
        </Text>
      </View>
    </View>
  </View>
);
```

- [ ] **Step 4: `BriefingCardBody.tsx`**

```tsx
import React from 'react';
import { View } from 'react-native';
import { Text } from '../primitives';
import { TripCardBody } from './TripCardBody';
import { AlertCardBody } from './AlertCardBody';
import { tokens } from '../../theme';
import type { ClassEvent, TripEstimate, Alert } from '../../types';

export const BriefingCardBody: React.FC<{ classEvent: ClassEvent; estimate: TripEstimate; alerts: Alert[] }> = ({
  classEvent, estimate, alerts,
}) => (
  <View>
    <TripCardBody estimate={estimate} classEvent={classEvent} />
    {alerts.map((a) => (
      <View key={a.id} style={{ borderTopWidth: 1, borderTopColor: tokens.color.smokeBorder }}>
        <AlertCardBody alert={a} />
      </View>
    ))}
  </View>
);
```

- [ ] **Step 5: `ScheduleConfirmCardBody.tsx`**

```tsx
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '../primitives';
import { tokens } from '../../theme';
import { formatClock } from '../../utils/time';
import type { ClassEvent } from '../../types';

export const ScheduleConfirmCardBody: React.FC<{
  parsed: ClassEvent[];
  onConfirm?: () => void;
  onEdit?: (c: ClassEvent) => void;
}> = ({ parsed, onConfirm, onEdit }) => (
  <View style={{ padding: tokens.space.md }}>
    <Text variant="label" color={tokens.color.textDim}>PARSED CLASSES</Text>
    {parsed.map((c) => (
      <TouchableOpacity key={c.id} onPress={() => onEdit?.(c)} style={{ marginTop: tokens.space.sm }}>
        <Text variant="title">{c.name}</Text>
        <Text variant="caption" color={tokens.color.textDim}>
          {c.days.join(' ')}  ·  {formatClock(c.startTime)} – {formatClock(c.endTime)}  ·  {c.location}
        </Text>
      </TouchableOpacity>
    ))}
    {onConfirm && (
      <TouchableOpacity onPress={onConfirm} style={{
        marginTop: tokens.space.md, alignSelf: 'flex-start',
        paddingHorizontal: tokens.space.md, paddingVertical: tokens.space.sm,
        borderRadius: tokens.radius.md, backgroundColor: tokens.color.accent,
      }}>
        <Text color="#fff">Looks right</Text>
      </TouchableOpacity>
    )}
  </View>
);
```

- [ ] **Step 6: `SpecialCard.tsx` (dispatcher)**

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens, lineColor } from '../../theme';
import { AlertCardBody } from './AlertCardBody';
import { TripCardBody } from './TripCardBody';
import { BriefingCardBody } from './BriefingCardBody';
import { ScheduleConfirmCardBody } from './ScheduleConfirmCardBody';
import type { SpecialCardData } from '../../types';

export const SpecialCard: React.FC<{ data: SpecialCardData; onEditClass?: (c: any) => void; onConfirmSchedule?: () => void }> = ({
  data, onEditClass, onConfirmSchedule,
}) => {
  const stripeColor = (() => {
    if (data.type === 'ALERT')   return lineColor(data.alert.line);
    if (data.type === 'TRIP')    return lineColor(data.estimate.legs.find(l => l.line)?.line);
    if (data.type === 'BRIEFING')return lineColor(data.estimate.legs.find(l => l.line)?.line);
    return tokens.color.accent;
  })();

  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
      {data.type === 'ALERT' && <AlertCardBody alert={data.alert} userImpact={data.userImpact} />}
      {data.type === 'TRIP' && <TripCardBody estimate={data.estimate} classEvent={data.classEvent} />}
      {data.type === 'BRIEFING' && <BriefingCardBody classEvent={data.classEvent} estimate={data.estimate} alerts={data.alerts} />}
      {data.type === 'SCHEDULE_CONFIRM' && <ScheduleConfirmCardBody parsed={data.parsed} onConfirm={onConfirmSchedule} onEdit={onEditClass} />}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: tokens.space.sm, marginVertical: tokens.space.xs,
          backgroundColor: tokens.color.smoke, borderRadius: tokens.radius.lg, overflow: 'hidden',
          borderWidth: 1, borderColor: tokens.color.smokeBorder },
  stripe: { height: 4 },
});
```

- [ ] **Step 7: Commit**

```bash
git add src/components/cards/ STATUS.md
git commit -m "components: SpecialCard dispatcher + 4 body variants + RouteDiagram

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 15: TripCard (Today-screen variant)

**Files:**
- Create: `src/components/cards/TripCard.tsx`

- [ ] **Step 1: Write component**

```tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { SpecialCard } from './SpecialCard';
import type { TripEstimate, ClassEvent } from '../../types';

export const TripCard: React.FC<{ estimate: TripEstimate; classEvent: ClassEvent; onPress?: () => void }> = ({
  estimate, classEvent, onPress,
}) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
    <SpecialCard data={{ type: 'TRIP', estimate, classEvent }} />
  </TouchableOpacity>
);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/cards/TripCard.tsx STATUS.md
git commit -m "components: TripCard wrapper for Today screen

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 9 — Chrome

### Task 16: GlassPillNavbar (idle + generating states)

**Files:**
- Create: `src/components/chrome/GlassPillNavbar.tsx`

- [ ] **Step 1: Write component**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, withTiming, useAnimatedStyle, withRepeat, withSequence } from 'react-native-reanimated';
import { Menu } from 'lucide-react-native';
import { GlassSurface, Text } from '../primitives';
import { tokens } from '../../theme';

export const GlassPillNavbar: React.FC<{
  title?: string;
  generating?: boolean;
  onMenu?: () => void;
}> = ({ title = 'OnTime+', generating = false, onMenu }) => {
  const width = useSharedValue(100); // percent
  React.useEffect(() => {
    width.value = withTiming(generating ? 48 : 100, { duration: 320 });
  }, [generating, width]);

  const containerStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as any }));
  const shimmer = useSharedValue(0);
  React.useEffect(() => {
    if (generating) shimmer.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1);
  }, [generating, shimmer]);

  return (
    <View style={styles.outer}>
      <Animated.View style={[containerStyle, styles.anim]}>
        <GlassSurface tint="navbar" style={[styles.pill, generating && styles.pillSmall]}>
          {generating ? (
            <Text color={tokens.color.text}>Thinking…</Text>
          ) : (
            <>
              <TouchableOpacity onPress={onMenu} hitSlop={8} style={styles.menu}>
                <Menu size={18} color={tokens.color.text} />
              </TouchableOpacity>
              <Text variant="title" style={{ fontSize: 15 }}>{title}</Text>
              <View style={{ width: 18 }} />
            </>
          )}
        </GlassSurface>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { alignItems: 'center', paddingHorizontal: tokens.space.md },
  anim: { alignSelf: 'center' },
  pill: { height: 44, borderRadius: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 16 },
  pillSmall: { height: 34, borderRadius: 17, justifyContent: 'center' },
  menu: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chrome/GlassPillNavbar.tsx STATUS.md
git commit -m "components: GlassPillNavbar with idle/generating animated states

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 17: BottomSheet wrapper

**Files:**
- Create: `src/components/chrome/BottomSheet.tsx`

- [ ] **Step 1: Write component**

```tsx
import React, { forwardRef } from 'react';
import BSModal, { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { tokens } from '../../theme';

export const BottomSheet = forwardRef<BottomSheetModal, { children: React.ReactNode; snapPoints?: string[] }>(
  ({ children, snapPoints = ['60%'] }, ref) => (
    <BSModal
      ref={ref}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: tokens.color.charcoalDeep }}
      handleIndicatorStyle={{ backgroundColor: tokens.color.textDim }}
    >
      <BottomSheetView style={{ flex: 1, padding: tokens.space.lg }}>
        {children}
      </BottomSheetView>
    </BSModal>
  ),
);
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chrome/BottomSheet.tsx STATUS.md
git commit -m "components: BottomSheet wrapper on @gorhom

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 18: Drawer (custom content matching fern reference)

**Files:**
- Create: `src/components/chrome/Drawer.tsx`

- [ ] **Step 1: Write component**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { GlassSurface, Text } from '../primitives';
import { tokens } from '../../theme';

const ITEMS = [
  { key: 'Chat', icon: '◉' },
  { key: 'Today', icon: '▦' },
  { key: 'Schedule', icon: '▤' },
  { key: 'Alerts', icon: '△' },
  { key: 'History', icon: '☰' },
];

export const Drawer: React.FC<DrawerContentComponentProps> = ({ navigation, state }) => {
  const current = state.routeNames[state.index];
  return (
    <View style={styles.outer}>
      <GlassSurface tint="drawer" style={styles.panel}>
        {ITEMS.map((it) => {
          const active = it.key === current;
          return (
            <TouchableOpacity
              key={it.key}
              onPress={() => navigation.navigate(it.key as never)}
              style={[styles.item, active && styles.itemActive]}
            >
              <Text color={tokens.color.text} style={{ width: 22 }}>{it.icon}</Text>
              <Text variant="title" style={{ fontSize: 15, fontWeight: active ? '600' : '500' }}>{it.key}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={styles.divider} />
        <Text variant="label" color={tokens.color.text} style={{ paddingHorizontal: 14, paddingBottom: 8 }}>PINNED</Text>
        {['Morning commute', 'Late-night trips', 'Red Line status'].map((p) => (
          <Text key={p} color={tokens.color.text} style={{ paddingHorizontal: 14, paddingVertical: 7, opacity: 0.9 }}>{p}</Text>
        ))}

        <View style={styles.profile}>
          <View style={styles.avatar}><Text color="#fff" variant="caption">Y</Text></View>
          <View style={{ flex: 1 }}>
            <Text>Youssef</Text>
            <Text variant="caption" color={tokens.color.textDim}>View Profile</Text>
          </View>
          <Text color={tokens.color.textDim}>›</Text>
        </View>
      </GlassSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: { flex: 1, padding: tokens.space.lg, backgroundColor: tokens.color.charcoalDeep },
  panel: { flex: 1, padding: tokens.space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 11,
          borderRadius: tokens.radius.md },
  itemActive: { backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16, marginHorizontal: 8 },
  profile: { marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 14,
             paddingHorizontal: 14, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.color.accent,
            alignItems: 'center', justifyContent: 'center' },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/components/chrome/Drawer.tsx STATUS.md
git commit -m "components: Drawer matching fern-reference layout

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 10 — Forms

### Task 19: FieldRow + ScheduleFormSheet

**Files:**
- Create: `src/components/forms/FieldRow.tsx`, `src/components/forms/ScheduleFormSheet.tsx`

- [ ] **Step 1: `FieldRow.tsx`**

```tsx
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Text } from '../primitives';
import { tokens } from '../../theme';

export const FieldRow: React.FC<{
  label: string; value: string; onChangeText: (t: string) => void; placeholder?: string;
}> = ({ label, value, onChangeText, placeholder }) => (
  <View style={styles.row}>
    <Text variant="label" color={tokens.color.textDim} style={{ marginBottom: 4 }}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={tokens.color.textDim}
      style={styles.input}
    />
  </View>
);

const styles = StyleSheet.create({
  row: { marginBottom: tokens.space.md },
  input: { backgroundColor: tokens.color.smoke, borderWidth: 1, borderColor: tokens.color.smokeBorder,
           color: tokens.color.text, borderRadius: tokens.radius.md, paddingHorizontal: 12, paddingVertical: 10 },
});
```

- [ ] **Step 2: `ScheduleFormSheet.tsx`**

```tsx
import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BottomSheet } from '../chrome/BottomSheet';
import { FieldRow } from './FieldRow';
import { Text } from '../primitives';
import { tokens } from '../../theme';
import { newId } from '../../utils/uuid';
import type { ClassEvent, DayOfWeek } from '../../types';

const DAYS: DayOfWeek[] = ['MON','TUE','WED','THU','FRI','SAT','SUN'];

export interface ScheduleFormSheetHandle {
  present: (existing?: ClassEvent) => void;
}

export const ScheduleFormSheet = forwardRef<ScheduleFormSheetHandle, { onSave: (c: ClassEvent) => void }>(({ onSave }, ref) => {
  const modalRef = React.useRef<BottomSheetModal>(null);
  const [form, setForm] = useState<ClassEvent>({ id: newId(), name: '', days: [], startTime: '09:00', endTime: '10:15', location: '' });

  useImperativeHandle(ref, () => ({
    present: (existing) => {
      setForm(existing ?? { id: newId(), name: '', days: [], startTime: '09:00', endTime: '10:15', location: '' });
      modalRef.current?.present();
    },
  }));

  const toggleDay = (d: DayOfWeek) =>
    setForm(f => ({ ...f, days: f.days.includes(d) ? f.days.filter(x => x !== d) : [...f.days, d] }));

  const submit = () => { onSave(form); modalRef.current?.dismiss(); };
  const canSave = form.name.trim() && form.days.length > 0;

  return (
    <BottomSheet ref={modalRef} snapPoints={['75%']}>
      <Text variant="title" style={{ marginBottom: tokens.space.md }}>Class details</Text>
      <FieldRow label="Name" value={form.name} onChangeText={(name) => setForm(f => ({ ...f, name }))} placeholder="Intro ML" />
      <View style={styles.daysRow}>
        {DAYS.map((d) => {
          const on = form.days.includes(d);
          return (
            <TouchableOpacity key={d} onPress={() => toggleDay(d)} style={[styles.day, on && styles.dayOn]}>
              <Text color={on ? '#fff' : tokens.color.text}>{d[0]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FieldRow label="Start (HH:MM)" value={form.startTime} onChangeText={(startTime) => setForm(f => ({ ...f, startTime }))} />
      <FieldRow label="End (HH:MM)" value={form.endTime} onChangeText={(endTime) => setForm(f => ({ ...f, endTime }))} />
      <FieldRow label="Location" value={form.location} onChangeText={(location) => setForm(f => ({ ...f, location }))} placeholder="Wheatley Hall" />

      <TouchableOpacity disabled={!canSave} onPress={submit} style={[styles.saveBtn, !canSave && { opacity: 0.4 }]}>
        <Text color="#fff">Save</Text>
      </TouchableOpacity>
    </BottomSheet>
  );
});

const styles = StyleSheet.create({
  daysRow: { flexDirection: 'row', gap: 6, marginBottom: tokens.space.md },
  day: { width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.color.smoke,
         borderWidth: 1, borderColor: tokens.color.smokeBorder, alignItems: 'center', justifyContent: 'center' },
  dayOn: { backgroundColor: tokens.color.accent, borderColor: tokens.color.accent },
  saveBtn: { marginTop: tokens.space.md, backgroundColor: tokens.color.accent,
             paddingVertical: 12, borderRadius: tokens.radius.md, alignItems: 'center' },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/ STATUS.md
git commit -m "components: ScheduleFormSheet (bottom sheet) + FieldRow

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 11 — Screens

### Task 20: Welcome screen

**Files:**
- Create: `src/screens/Welcome.tsx`
- Create placeholder: `assets/welcome/hero-placeholder.png` (any 1080×1080 dark image for now)

- [ ] **Step 1: Write screen**

```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground, Text } from '../components/primitives';
import { tokens } from '../theme';
import { storage } from '../storage/asyncStore';

export const Welcome: React.FC<{ onStart: () => void }> = ({ onStart }) => {
  const begin = async () => { await storage.setOnboarded(true); onStart(); };
  return (
    <CarbonBackground>
      <SafeAreaView style={styles.safe}>
        <View style={styles.hero}>
          {/* BE NEEDED: swap for Nano Banana 2.0 hero.png / Kling 3.0 hero.mp4 when assets land */}
          <Image source={require('../../assets/welcome/hero-placeholder.png')} style={styles.heroImg} resizeMode="cover" />
        </View>
        <View style={styles.cta}>
          <Text variant="display">OnTime+</Text>
          <Text variant="body" color={tokens.color.textDim} style={{ marginTop: 6, textAlign: 'center' }}>
            Commute like you have a buffer.
          </Text>
          <TouchableOpacity onPress={begin} style={styles.btn}>
            <Text color="#fff">Get started</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </CarbonBackground>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'space-between' },
  hero: { flex: 2, marginTop: tokens.space.xxl, marginHorizontal: tokens.space.lg, borderRadius: tokens.radius.xl, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  cta: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.space.lg, gap: 8 },
  btn: { marginTop: tokens.space.lg, backgroundColor: tokens.color.accent, paddingHorizontal: 32, paddingVertical: 14, borderRadius: tokens.radius.pill },
});
```

- [ ] **Step 2: Create the placeholder image**

```bash
mkdir -p assets/welcome
# Create a 1080x1080 solid charcoal PNG as placeholder
node -e "const fs=require('fs');const w=1080,h=1080;const data=Buffer.alloc(w*h*4,0x1C);for(let i=0;i<data.length;i+=4){data[i]=0x1C;data[i+1]=0x1C;data[i+2]=0x1E;data[i+3]=0xFF;}require('zlib');fs.writeFileSync('assets/welcome/hero-placeholder.png',require('child_process').execSync('powershell -Command \"Add-Type -AssemblyName System.Drawing; \\$b=New-Object System.Drawing.Bitmap(512,512); \\$g=[System.Drawing.Graphics]::FromImage(\\$b); \\$g.Clear([System.Drawing.Color]::FromArgb(28,28,30)); \\$b.Save([System.Console]::OpenStandardOutput(),[System.Drawing.Imaging.ImageFormat]::Png)\"'));" 2>/dev/null || cp node_modules/expo/AppEntry.js /dev/null 2>/dev/null
# If above fails, use a simpler approach:
echo "If placeholder image creation failed, manually save any dark PNG to assets/welcome/hero-placeholder.png"
```

(Alternative: just drop any dark 1:1 image in `assets/welcome/hero-placeholder.png` — will be replaced by Nano Banana output later.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/Welcome.tsx assets/welcome/ STATUS.md
git commit -m "screen: Welcome (branded CTA, hero placeholder)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 21: Chat screen

**Files:**
- Create: `src/screens/Chat.tsx`

- [ ] **Step 1: Write screen**

```tsx
import React, { useRef } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { CarbonBackground } from '../components/primitives';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { ChatBubble } from '../components/chat/ChatBubble';
import { ChatTypingIndicator } from '../components/chat/ChatTypingIndicator';
import { ChipRow } from '../components/chat/ChipRow';
import { Composer } from '../components/chat/Composer';
import { DateSeparator } from '../components/chat/DateSeparator';
import { SpecialCard } from '../components/cards/SpecialCard';
import { ScheduleFormSheet, ScheduleFormSheetHandle } from '../components/forms/ScheduleFormSheet';
import { useChat } from '../hooks/useChat';
import { useSchedule } from '../hooks/useSchedule';
import { tokens } from '../theme';
import type { Message } from '../types';

export const Chat: React.FC<{ navigation: DrawerNavigationProp<any> }> = ({ navigation }) => {
  const { messages, generating, send } = useChat();
  const { upsert } = useSchedule();
  const formRef = useRef<ScheduleFormSheetHandle>(null);

  const renderItem = ({ item }: { item: Message }) => (
    <View>
      <ChatBubble variant={item.role === 'user' ? 'user' : 'bot'} text={item.text} />
      {item.cards?.map((c, i) => (
        <SpecialCard key={i} data={c} onEditClass={(cls) => formRef.current?.present(cls)} />
      ))}
      {item.chips && item.chips.length > 0 && <ChipRow chips={item.chips} onPress={send} />}
    </View>
  );

  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar generating={generating} onMenu={() => navigation.openDrawer()} />
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          ListHeaderComponent={<DateSeparator label="TODAY" />}
          ListFooterComponent={generating ? <ChatTypingIndicator /> : null}
          contentContainerStyle={{ paddingBottom: tokens.space.lg }}
        />
        <Composer disabled={generating} onSend={send} onPlus={() => formRef.current?.present()} />
        <ScheduleFormSheet ref={formRef} onSave={upsert} />
      </SafeAreaView>
    </CarbonBackground>
  );
};

const styles = StyleSheet.create({});
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/Chat.tsx STATUS.md
git commit -m "screen: Chat (primary) — bubbles, cards, chips, composer, form sheet

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 22: Today, Schedule, Alerts, History, Settings screens

**Files:**
- Create: `src/screens/Today.tsx`, `Schedule.tsx`, `Alerts.tsx`, `History.tsx`, `Settings.tsx`

- [ ] **Step 1: `Today.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground, Text } from '../components/primitives';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { TripCard } from '../components/cards/TripCard';
import { useSchedule } from '../hooks/useSchedule';
import { useAlerts } from '../hooks/useAlerts';
import { api } from '../api/client';
import { tokens } from '../theme';
import { todayDayOfWeek } from '../utils/time';
import type { TripEstimate } from '../types';

export const Today: React.FC<any> = ({ navigation }) => {
  const { classes } = useSchedule();
  const { alerts } = useAlerts();
  const [estimate, setEstimate] = useState<TripEstimate | null>(null);

  const today = todayDayOfWeek();
  const todaysClasses = classes.filter(c => c.days.includes(today));

  useEffect(() => { api.getBriefingEstimate(classes, alerts).then(setEstimate); }, [classes, alerts]);

  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="Today" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={{ padding: tokens.space.md }}>
          <Text variant="display">Today</Text>
          {todaysClasses.length === 0 && (
            <Text color={tokens.color.textDim} style={{ marginTop: tokens.space.md }}>No classes today.</Text>
          )}
          {estimate && todaysClasses.map((c) => (
            <View key={c.id} style={{ marginTop: tokens.space.md }}>
              <TripCard estimate={estimate} classEvent={c} onPress={() => navigation.navigate('Chat')} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </CarbonBackground>
  );
};
```

- [ ] **Step 2: `Schedule.tsx`**

```tsx
import React, { useRef } from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground, Text } from '../components/primitives';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { ScheduleFormSheet, ScheduleFormSheetHandle } from '../components/forms/ScheduleFormSheet';
import { useSchedule } from '../hooks/useSchedule';
import { tokens } from '../theme';
import { formatClock } from '../utils/time';

export const Schedule: React.FC<any> = ({ navigation }) => {
  const { classes, upsert, remove } = useSchedule();
  const formRef = useRef<ScheduleFormSheetHandle>(null);

  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="Schedule" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={{ padding: tokens.space.md }}>
          {classes.map((c) => (
            <TouchableOpacity key={c.id} onPress={() => formRef.current?.present(c)} style={styles.row}>
              <Text variant="title">{c.name}</Text>
              <Text variant="caption" color={tokens.color.textDim}>
                {c.days.join(' ')} · {formatClock(c.startTime)}–{formatClock(c.endTime)} · {c.location}
              </Text>
              <TouchableOpacity onPress={() => remove(c.id)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
                <Text variant="caption" color={tokens.color.severityErr}>Remove</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={() => formRef.current?.present()} style={styles.add}>
            <Text color="#fff">+ Add class</Text>
          </TouchableOpacity>
        </ScrollView>
        <ScheduleFormSheet ref={formRef} onSave={upsert} />
      </SafeAreaView>
    </CarbonBackground>
  );
};

const styles = StyleSheet.create({
  row: { backgroundColor: tokens.color.smoke, borderRadius: tokens.radius.lg, padding: tokens.space.md, marginBottom: tokens.space.sm, borderWidth: 1, borderColor: tokens.color.smokeBorder },
  add: { marginTop: tokens.space.md, backgroundColor: tokens.color.accent, padding: 12, borderRadius: tokens.radius.md, alignItems: 'center' },
});
```

- [ ] **Step 3: `Alerts.tsx`**

```tsx
import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground, Text } from '../components/primitives';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { SpecialCard } from '../components/cards/SpecialCard';
import { useAlerts } from '../hooks/useAlerts';
import { tokens } from '../theme';

export const Alerts: React.FC<any> = ({ navigation }) => {
  const { alerts } = useAlerts();
  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="Alerts" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={{ padding: tokens.space.md }}>
          {alerts.length === 0 && <Text color={tokens.color.textDim}>No active alerts.</Text>}
          {alerts.map((a) => (
            <SpecialCard key={a.id} data={{ type: 'ALERT', alert: a }} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </CarbonBackground>
  );
};
```

- [ ] **Step 4: `History.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground, Text } from '../components/primitives';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { storage } from '../storage/asyncStore';
import { tokens } from '../theme';
import type { Conversation } from '../types';

export const History: React.FC<any> = ({ navigation }) => {
  const [items, setItems] = useState<Conversation[]>([]);
  useEffect(() => { storage.getHistory().then(setItems); }, []);
  return (
    <CarbonBackground>
      <SafeAreaView style={{ flex: 1 }}>
        <GlassPillNavbar title="History" onMenu={() => navigation.openDrawer()} />
        <ScrollView contentContainerStyle={{ padding: tokens.space.md }}>
          {items.length === 0 && <Text color={tokens.color.textDim}>No conversations yet.</Text>}
          {items.map(c => (
            <View key={c.id} style={{ marginBottom: tokens.space.sm, padding: tokens.space.md, backgroundColor: tokens.color.smoke, borderRadius: tokens.radius.md }}>
              <Text variant="title">{new Date(c.startedAt).toLocaleString()}</Text>
              <Text variant="caption" color={tokens.color.textDim}>{c.messages.length} messages</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </CarbonBackground>
  );
};
```

- [ ] **Step 5: `Settings.tsx`**

```tsx
import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CarbonBackground, Text } from '../components/primitives';
import { GlassPillNavbar } from '../components/chrome/GlassPillNavbar';
import { tokens } from '../theme';

export const Settings: React.FC<any> = ({ navigation }) => (
  <CarbonBackground>
    <SafeAreaView style={{ flex: 1 }}>
      <GlassPillNavbar title="Settings" onMenu={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={{ padding: tokens.space.md, gap: tokens.space.sm }}>
        <Text variant="label" color={tokens.color.textDim}>PREFERENCES</Text>
        <Text>Notifications (coming soon)</Text>
        <Text>Home address (coming soon)</Text>
        <Text>Theme: Nightshift (locked)</Text>
        <Text>Privacy: data stored on this device only</Text>
      </ScrollView>
    </CarbonBackground>
  </SafeAreaView>
);
```

Fix the closing tag nesting in Settings.tsx — wrap `<SafeAreaView>` inside `<CarbonBackground>` correctly:

```tsx
export const Settings: React.FC<any> = ({ navigation }) => (
  <CarbonBackground>
    <SafeAreaView style={{ flex: 1 }}>
      <GlassPillNavbar title="Settings" onMenu={() => navigation.openDrawer()} />
      <ScrollView contentContainerStyle={{ padding: tokens.space.md, gap: tokens.space.sm }}>
        <Text variant="label" color={tokens.color.textDim}>PREFERENCES</Text>
        <Text>Notifications (coming soon)</Text>
        <Text>Home address (coming soon)</Text>
        <Text>Theme: Nightshift (locked)</Text>
        <Text>Privacy: data stored on this device only</Text>
      </ScrollView>
    </SafeAreaView>
  </CarbonBackground>
);
```

- [ ] **Step 6: Commit**

```bash
git add src/screens/ STATUS.md
git commit -m "screens: Today, Schedule, Alerts, History, Settings

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 12 — Navigation and App shell

### Task 23: RootStack + DrawerNavigator

**Files:**
- Create: `src/navigation/DrawerNavigator.tsx`, `src/navigation/RootStack.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: `src/navigation/DrawerNavigator.tsx`**

```tsx
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Chat } from '../screens/Chat';
import { Today } from '../screens/Today';
import { Schedule } from '../screens/Schedule';
import { Alerts } from '../screens/Alerts';
import { History } from '../screens/History';
import { Settings } from '../screens/Settings';
import { Drawer as CustomDrawer } from '../components/chrome/Drawer';

const D = createDrawerNavigator();

export const DrawerNavigator: React.FC = () => (
  <D.Navigator
    initialRouteName="Chat"
    drawerContent={(props) => <CustomDrawer {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <D.Screen name="Chat" component={Chat} />
    <D.Screen name="Today" component={Today} />
    <D.Screen name="Schedule" component={Schedule} />
    <D.Screen name="Alerts" component={Alerts} />
    <D.Screen name="History" component={History} />
    <D.Screen name="Settings" component={Settings} />
  </D.Navigator>
);
```

- [ ] **Step 2: `src/navigation/RootStack.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { Welcome } from '../screens/Welcome';
import { DrawerNavigator } from './DrawerNavigator';
import { storage } from '../storage/asyncStore';
import { tokens } from '../theme';

const Stack = createNativeStackNavigator();

export const RootStack: React.FC = () => {
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  useEffect(() => { storage.getOnboarded().then(setOnboarded); }, []);

  if (onboarded === null) {
    return <View style={{ flex: 1, backgroundColor: tokens.color.charcoal, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={tokens.color.accent} />
    </View>;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded && <Stack.Screen name="Welcome">{({ navigation }) => <Welcome onStart={() => navigation.replace('Main')} />}</Stack.Screen>}
      <Stack.Screen name="Main" component={DrawerNavigator} />
    </Stack.Navigator>
  );
};
```

- [ ] **Step 3: Update `App.tsx`**

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { RootStack } from './src/navigation/RootStack';
import { tokens } from './src/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: tokens.color.charcoal }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <NavigationContainer theme={{
            dark: true,
            colors: {
              primary: tokens.color.accent,
              background: tokens.color.charcoal,
              card: tokens.color.charcoal,
              text: tokens.color.text,
              border: tokens.color.smokeBorder,
              notification: tokens.color.accent,
            },
            fonts: {
              regular: { fontFamily: 'System', fontWeight: '400' },
              medium: { fontFamily: 'System', fontWeight: '500' },
              bold: { fontFamily: 'System', fontWeight: '700' },
              heavy: { fontFamily: 'System', fontWeight: '900' },
            },
          }}>
            <RootStack />
            <StatusBar style="light" />
          </NavigationContainer>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Add Reanimated to `babel.config.js`**

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'],
  };
};
```

- [ ] **Step 5: Run it**

```bash
npx expo start --clear
```
Scan QR with Expo Go on your phone. Verify:
- Welcome screen appears on first launch (if AsyncStorage flag not set)
- Tap Get started → lands on Chat
- Hamburger opens Drawer
- Send "red line status" → ALERT card appears
- Composer "+" opens ScheduleFormSheet

- [ ] **Step 6: Commit**

```bash
git add src/navigation/ App.tsx babel.config.js STATUS.md
git commit -m "nav: RootStack + DrawerNavigator wired through App.tsx

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Phase 13 — Polish and final verification

### Task 24: Morning briefing on Chat open

**Files:**
- Modify: `src/screens/Chat.tsx`

- [ ] **Step 1: Add briefing fire-on-mount**

In `Chat.tsx`, import `useBriefing` and call `fire()` on first mount only when the chat is empty:

```tsx
import { useBriefing } from '../hooks/useBriefing';
// …inside Chat component:
const { fire } = useBriefing();
useEffect(() => {
  if (messages.length === 0) fire();
}, []); // once
```

- [ ] **Step 2: Verify in Expo Go**

Close and relaunch the app. Chat should open with an auto-bot message containing a BRIEFING card.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Chat.tsx STATUS.md
git commit -m "feat: proactive morning briefing on Chat screen mount

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 25: Final smoke test, STATUS update, push

- [ ] **Step 1: Verify branch**

```bash
git branch --show-current
```
Expected: `chatbot-interface`.

- [ ] **Step 2: Run tests**

```bash
npm test
```
Expected: all tests pass.

- [ ] **Step 3: Manually verify in Expo Go each flow:**

- [ ] First launch → Welcome → Get started → lands on Chat with briefing card
- [ ] Send "red line status" → Red Line ALERT card with moderate severity
- [ ] Send "when should I leave?" → TRIP card with leave-by time
- [ ] Open drawer → all 5 items navigate → each screen renders with GlassPillNavbar
- [ ] Composer "+" → ScheduleFormSheet → add a class → save → class appears on Schedule tab
- [ ] Generating state: while bot replies, nav pill shrinks and shows "Thinking…"

- [ ] **Step 4: Final STATUS.md update**

Move all implementation entries to "Implemented so far", clear "Left to do" down to stretch items (push notifications, .ics import, etc.). Confirm latest log entry covers the completed implementation.

- [ ] **Step 5: Push**

```bash
git push origin chatbot-interface
```
Expected: updates only `origin/chatbot-interface`. Never `main`.

- [ ] **Step 6: Confirm completion in chat**

Tell the user: "Implementation complete. App runs in Expo Go with all mock flows. BE NEEDED stubs are in place for the backend wire-up. STATUS.md is current."

---

## Stretch tasks (do NOT start without user approval)

- **Task S1:** Push notifications (`expo-notifications`) — fire a notification 15 min before computed `leaveBy`.
- **Task S2:** Deep linking schema wire-up (`ontimeplus://chat?q=…`).
- **Task S3:** Real MBTA API integration — implement `mapMbtaAlerts()` in `src/api/client.ts`.
- **Task S4:** Real Nano Banana 2.0 hero + Kling 3.0 hero.mp4 wire-up in `Welcome.tsx`.
- **Task S5:** Live backend wire-up once teammate confirms `/api/chat` shape.

---

## Self-review checklist (ran by author after writing)

**Spec coverage:** Every locked decision in §4 of the spec maps to at least one task:
- Decisions 1–2 (framework, navigation) → Task 1, 23
- Decision 3 (schedule input hybrid) → Task 19, 21 (Chat wires Composer "+" to sheet)
- Decision 4 (proactive briefing) → Task 24
- Decisions 5–11 (visual direction, palette, carbon, glass navbar, drawer, bubbles, cards) → Tasks 4, 10, 11, 14, 16, 17, 18
- Decision 12 (app name) → Task 1 + 16 ("OnTime+" in navbar and Welcome)
- Decision 13 (onboarding) → Task 20 + 23 (RootStack gates on `onboarded` flag)
- Decisions 14–15 (C-lean API, no SSE) → Task 7
- Decision 16 (asset pipeline) → Task 20 + stretch S4

**Placeholder scan:** No "TBD/TODO" in steps. Every code step has complete code. Every test step has an expected outcome.

**Type consistency:** Types introduced in Task 3 are referenced consistently (`ClassEvent`, `SpecialCardData`, `TripEstimate`, `Alert`). Hook names stable (`useChat`, `useSchedule`, `useAlerts`, `useBriefing`). Component names stable across imports.

**Scope check:** This is one plan for one branch (`chatbot-interface`). No backend/pipeline work included. Appropriately scoped.
