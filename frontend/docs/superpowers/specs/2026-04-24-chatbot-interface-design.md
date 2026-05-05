# OnTime+ · Chatbot Interface — Design Spec

**Status:** Draft · awaiting user review
**Date:** 2026-04-24
**Branch:** `chatbot-interface`
**Scope:** Mobile phone app frontend for the OnTime+ schedule-aware transit assistant. The app is the user-facing half of a seven-feature team project; this spec covers only the frontend (`chatbot-interface` branch) and its integration boundary with the rest of the system.

---

## 1 · Problem

UMass Boston students rely on the MBTA for commuting but existing tools don't combine a user's schedule with live transit conditions to produce a reliability-aware answer to "will I arrive on time, and what's the safest way?". The frontend's job is to make that conversation feel natural, fast, and trustworthy on a phone.

## 2 · Target user

A UMass Boston student on an iPhone or Android who opens the app in the morning and wants a one-glance answer for their next class, plus the ability to ask follow-ups in natural language.

## 3 · Core experience

1. **First launch:** single branded Welcome screen → chat with a greeting and a prompt to describe classes in plain English.
2. **Every subsequent launch:** drops straight into chat; bot has already auto-sent a proactive morning briefing card for the next class of the day.
3. **Everyday:** user types freely ("Red Line status?", "If I leave at 9:30 will I make it?"). Chat answers with either plain text or one of a family of specialized cards (alerts, trip estimates, briefings). All specialized cards are color-coded per MBTA line / mode, with severity shown as a separate tinted badge.
4. **Schedule:** entered primarily through chat (natural language), editable via a slide-up form sheet reached from the composer's "+" button or by tapping a parsed class.
5. **Other surfaces:** drawer from the hamburger icon in the glass-pill navbar exposes Today, Schedule, Alerts, History, and Settings.

## 4 · Design decisions (locked)

| # | Decision | Value |
| - | --- | --- |
| 1 | Framework | React Native + Expo (TypeScript) |
| 2 | Navigation | Chat-first. Single primary conversation screen; drawer for other features. |
| 3 | Schedule input | Hybrid — natural-language in chat (primary), slide-up form sheet (edit / escape hatch). Same `ScheduleFormSheet` serves both add and edit. |
| 4 | First-open behavior | Proactive morning briefing auto-sent on app open (computed client-side). Push notifications deferred to stretch. |
| 5 | Visual direction | Nightshift — dark, carbon fiber base, glassmorphism. |
| 6 | Base palette | `#1C1C1E` charcoal (primary/background) · `#2C2C2E` smoke (surfaces) · `#C8102E` Formula red (accent, Rosso Corsa tone). |
| 7 | Background texture | Subtle carbon fiber crosshatch weave over charcoal. |
| 8 | Navbar | Translucent glass pill. Idle = full-width with hamburger + title. Generating = 160px centered pill with shimmer "Thinking…" text. No status dots. |
| 9 | Drawer | Glass panel with high translucency (`rgba(255,255,255,0.05)` bg, 26px blur). Layout mirrors the user's fern reference: active-item pill, CAPS section header, pinned sub-items, profile row with avatar + chevron. |
| 10 | Chat bubbles | iOS Messages-style with CSS-clip-path tails. Bot = smoke gray with left tail. User = Formula red with right tail. **No box-shadow / glow on user bubbles.** |
| 11 | Specialized cards | No emoji. Color-coded per line/mode. Severity is a separate tinted badge (ok/warn/err). |
| 12 | App name | OnTime+ (retained from proposal). |
| 13 | Onboarding | Single branded Welcome screen (logo + one-line value prop + CTA) → chat. Permissions (location, notifications) requested inline when first needed. |
| 14 | Backend contract | **C-lean.** Frontend talks to a single endpoint `POST /api/chat`, mirroring the teammate's prior project `institute-rag-1/src/rag_v2/api.py`. Live MBTA alerts fetched from `api-v3.mbta.com` directly by the frontend. Schedule stored on-device in AsyncStorage. Briefing composed client-side. |
| 15 | API transport | Plain POST/JSON request/response. No SSE, no WebSockets. |
| 16 | Asset pipeline | Nano Banana 2.0 generates key art (hero image on Welcome, optional line pictograms). Kling 3.0 generates the optional looping video behind the Welcome CTA. Assets ship with the app under `assets/`. |

## 5 · System architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     OnTime+ Expo App (RN + TS)                   │
│                                                                  │
│  Screens (React Navigation)                                      │
│   • Welcome (first-launch only)                                  │
│   • Chat (default route)                                         │
│   • Today, Schedule, Alerts, History, Settings (Drawer children) │
│                                                                  │
│  Components                                                      │
│   • Primitives: CarbonBackground, GlassSurface, Text             │
│   • Chat: ChatBubble, ChatTypingIndicator, ChipRow,              │
│           Composer, DateSeparator                                │
│   • Special cards: SpecialCard, TripCard, RouteDiagram           │
│   • Chrome: GlassPillNavbar, Drawer, BottomSheet                 │
│   • Forms: ScheduleFormSheet, FieldRow                           │
│                                                                  │
│  Theme tokens (src/theme/index.ts)                               │
│   • Colors (charcoal/smoke/Formula red + line/mode/severity)     │
│   • Glass recipes, carbon weave config                           │
│   • Radii, spacing, typography, motion                           │
│                                                                  │
│  Data layer                                                      │
│   • api/client.ts — the ONLY module that calls fetch             │
│   • mocks/ — rich UPPER_SNAKE_CASE fixtures                      │
│   • store/ — Zustand slices for chat, schedule, alerts           │
│   • storage/ — AsyncStorage wrappers (schedule, session_id,      │
│                conversation history)                             │
└──────────┬──────────────────────────────────────────────────┬────┘
           │                                                  │
           ▼                                                  ▼
  ┌──────────────────┐                          ┌──────────────────┐
  │  Team backend    │                          │  MBTA public API │
  │  POST /api/chat  │                          │  GET /alerts     │
  │  (BE NEEDED)     │                          │  GET /routes     │
  └──────────────────┘                          │  GET /predictions│
                                                └──────────────────┘
```

### Mapping to the team's seven features

| Feature branch | How frontend integrates |
| --- | --- |
| `data-collection` | Team's corpus feeds `/api/chat`. FE's MBTA-direct calls handle the *live* feed independently. |
| `data-processing` | No FE touch-point. |
| `embeddings` | No FE touch-point. |
| `retrieval` | Surfaces via the optional `retrieved` chunks in `/api/chat` responses. Rendered as collapsible "Sources" beneath bot messages when present. |
| `pipeline-integration` | The `/api/chat` endpoint itself. |
| `chatbot-interface` | **This spec.** |
| `evaluation` | Consumes chat-log JSON exported from AsyncStorage. |

## 6 · Information architecture

```
RootStack
├── Welcome                  (first launch only; gated by AsyncStorage flag)
└── Main (Drawer)
    ├── Chat                 (default route, 90% of app)
    ├── Today                (dashboard: next class, briefing recap)
    ├── Schedule             (list of classes, edit)
    ├── Alerts               (MBTA alert feed, filterable by line)
    ├── History              (past conversations)
    └── Settings             (notifications, home address, theme, privacy)
```

Two modal overlays that can appear from anywhere:

- **`ScheduleFormSheet`** — slides up from the bottom. Triggered by (a) tapping a parsed class bubble to edit, (b) the "+" in the composer, (c) "Add class" on the Schedule screen. One component, three entry points.
- **`Drawer`** — slides in from the left via hamburger. Close by tap-outside or swipe.

Gestures:

- Swipe right from left edge → opens drawer
- Swipe down on a sheet → dismisses
- Swipe left on a chat bubble → context menu (Copy / Quote / Regenerate)
- Long-press a bubble → same context menu (accessibility)
- Pull down on chat → scrolls to latest and refreshes briefing

Deep linking (stretch): `ontimeplus://chat?q=red+line+status` to open the chat with a pre-filled query (for future push-notification taps).

## 7 · Component library

### Primitives
| Component | Purpose |
| --- | --- |
| `CarbonBackground` | Full-bleed carbon-fiber weave (two crosshatched repeating gradients over charcoal). Wraps every screen so glass surfaces have texture to refract. |
| `GlassSurface` | Translucent base. Props: `tint: 'navbar' \| 'drawer' \| 'modal'` (maps to theme recipe). Internally: `expo-blur` + tint overlay + 1px highlight border. |
| `Text` | Typography wrapper with `variant` prop mapping to the type scale. |

### Chat
| Component | Purpose |
| --- | --- |
| `ChatBubble` | iOS-style bubble with tail. Props: `variant: 'bot' \| 'user'`, `text`, `timestamp`. Tail via `clip-path` on a pseudo-element (web) / SVG overlay (native). |
| `ChatTypingIndicator` | 3-dot pulsing animation inside a bot bubble. Used while `/api/chat` is in flight. |
| `ChipRow` | Horizontal scrollable row of suggested-reply chips. |
| `Composer` | Text input + send button + "+" (opens `ScheduleFormSheet`). Fires `onSend(text)`. Animates input expansion on multi-line. |
| `DateSeparator` | Centered "TODAY · 9:42 AM" divider between message groups. |

### Specialized cards (rendered inline in chat; reused on Alerts/Today screens)
| Component | Purpose |
| --- | --- |
| `SpecialCard` | Generic frame — colored top stripe + badge row (line + severity) + title + meta + optional impact footer. Accepts `SpecialCardData` (discriminated union). Dispatches to the right internal renderer based on `type`. |
| `TripCard` | Today-screen variant: next class + leave-by time + route summary + risk label. Tapping it opens chat with a pre-filled focused question. |
| `RouteDiagram` | Inline mini diagram of line segments (colored pill chain e.g. `[Red Line]→[Shuttle]→[Wheatley]`). Used inside `TripCard` and `SpecialCard`. |

### Chrome
| Component | Purpose |
| --- | --- |
| `GlassPillNavbar` | Top nav. Two animated states: `idle` (full-width, hamburger + title + spacer) and `generating` (shrunk 160px centered pill with shimmer-animated "Thinking…" text). Animates via Reanimated `withSpring`. |
| `Drawer` | Left-slide glass panel. Built on React Navigation's Drawer with a custom content component. Items are `<DrawerItem active />`. Section headers + profile row at bottom. |
| `BottomSheet` | Modal sheet primitive based on `@gorhom/bottom-sheet`. |

### Forms
| Component | Purpose |
| --- | --- |
| `ScheduleFormSheet` | Add/edit class. Fields: name, days (MTWTF toggle group), start time, end time, location (with autocomplete stub). |
| `FieldRow` | Label + input pair styled to the theme. |

**Component philosophy:** no component owns remote data. Every component takes data via props. Data fetching lives in screens through hooks (`useChat`, `useAlerts`, `useSchedule`). Components are trivially testable.

## 8 · Data model

See `src/types/index.ts` in the implementation. Summary:

- **`Message`** — a single chat message. Fields: `id`, `role ('user'|'bot'|'system')`, `text`, `timestamp`, optional `cards`, `chips`, `retrieved`.
- **`RetrievedChunk`** — a source chunk from the RAG retrieval layer. Mirrors `institute-rag-1`'s `retrieved` field.
- **`ClassEvent`** — a class in the user's schedule (`name`, `days`, `startTime`, `endTime`, `location`, optional `locationCoords`).
- **`Alert`** — an MBTA or UMB shuttle alert (`line?`, `mode?`, `severity`, `title`, `description`, `affectedSegment?`, `reportedAt`, `source`).
- **`TripEstimate`** — result of a leave-by calculation (`legs[]`, `leaveBy`, `arriveBy`, `bufferMin`, `risk`, `affectingAlerts[]`).
- **`SpecialCardData`** — discriminated union with `type: 'ALERT' | 'TRIP' | 'BRIEFING' | 'SCHEDULE_CONFIRM'`. Adding a new card type later is one new case in the union + one new renderer in `SpecialCard`.
- **`Conversation`** — a persisted chat thread (`id`, `sessionId`, `startedAt`, `messages`). `sessionId` is what we POST to `/api/chat` for backend memory.

All timestamps Unix ms. All clock-time strings are 24h (`"10:00"`); the UI formats for display.

## 9 · API boundary and mocks

### The client — `src/api/client.ts`

The single point of contact with all remote data. Every UI hook calls into `api.*`. Each method is either fully mocked or has a `BE NEEDED` block comment pointing at the real endpoint.

Methods:

| Method | Implementation path |
| --- | --- |
| `sendMessage(text, sessionId, schedule?, alerts)` | **BE NEEDED** → `POST /api/chat`. Request `{ session_id, message, schedule?: { event_name, event_time, location }, alerts: [{ route, status, delay_minutes? }] }` → response `{ answer, risk_level, recommended_departure_time, estimated_arrival_time, sources }`. |
| `getAlerts()` | MBTA public API — `GET https://api-v3.mbta.com/alerts`. Response mapped to `Alert[]`. |
| `getBriefing(schedule, alerts, sessionId)` | Client-side composition: picks next class, filters relevant alerts, computes a `TripEstimate`, and optionally hits `sendMessage` once for friendly wording. Returns a single `Message` with a `BRIEFING` card. |
| `getSchedule()` / `saveSchedule(classes)` | AsyncStorage CRUD. No backend. |
| `parseSchedule(text)` | **BE NEEDED** → routes through `sendMessage` with a `[PARSE_SCHEDULE]` prompt prefix until the backend team specifies otherwise. Response expected to be JSON string parsed into `ClassEvent[]`. |

### Environment flags

```
EXPO_PUBLIC_USE_MOCKS=true     # default during development
EXPO_PUBLIC_API_BASE=http://localhost:8000
```

Flipping `USE_MOCKS=false` is the only change needed to switch from mocks to live backend.

### Mock fixtures — `src/mocks/`

```
alerts.ts     MOCK_ALERTS, MOCK_ALERTS_CLEAR
chat.ts       getMockChatReply(), MOCK_CHAT_RESPONSES
schedule.ts   MOCK_SCHEDULE, MOCK_PARSED_SCHEDULE
trips.ts      MOCK_TRIPS, MOCK_TRIP_WITH_DELAY
index.ts      re-exports
```

Every fixture export is `UPPER_SNAKE_CASE` prefixed with `MOCK_`. Every file opens with a banner comment identifying it as mock data. Inline mocks in other files carry a `// MOCK DATA` trailing comment.

`MOCK_CHAT_RESPONSES` covers enough branches to demo every flow without a backend:
- `"red line status"` → `ALERT` card (Red Line moderate delay)
- `"leave by" | "when should I leave"` → `TRIP` card with risk label
- `"good morning" | opening bot message` → `BRIEFING` card
- `schedule-entry-looking messages` → `SCHEDULE_CONFIRM` card
- Fallback → plain text

### The `BE NEEDED` convention

Every function whose implementation changes when the real backend lands gets a `/* BE NEEDED: … */` block comment immediately above its signature. The comment states:

1. The endpoint (`POST /api/chat`).
2. The expected request shape.
3. The expected response shape.
4. Any upstream reference (e.g. "mirrors institute-rag-1 api.py").

A repository-wide grep for `BE NEEDED` gives the exact punch list of wires to connect when the backend is delivered.

## 10 · Theme system

All visual tokens live in `src/theme/index.ts`. Component code imports tokens only — no raw hex values. See [STATUS.md §3](../../../STATUS.md) for the locked token values; key groups:

- **Color:** charcoal / smoke palette, Formula red accent, text tiers, line colors (Red/Orange/Blue/Green/Silver/CR/Ferry), mode colors (Bus/Shuttle), severity tokens (ok/warn/err).
- **Radius:** `sm/md/lg/xl/pill` (6 / 12 / 18 / 22 / 999).
- **Space:** `xs/sm/md/lg/xl/xxl` (4 / 8 / 12 / 16 / 24 / 32).
- **Typography:** display / title / body / caption / label (CAPS) — SF Pro Text on iOS, Inter on Android.
- **Glass recipes:** `navbar / drawer / modal` with matched `bg / blur / saturation / border` values.
- **Carbon weave:** two repeating linear gradients at 45° and 135°, 4px period, highlight + shadow over charcoal base.
- **Motion:** spring configs for nav pill, bottom sheet, bubble entry.

Helpers:
- `lineColor(line)` → token color for an MBTA line.
- `severityTint(severity)` → `{ bg, fg, border }` for a severity badge.

### Asset slots

```
assets/
├── welcome/
│   ├── hero.png            Nano Banana 2.0 → splash / welcome hero
│   └── hero.mp4            Kling 3.0 → optional 4-6s looping video
├── cards/
│   └── line-artwork/       Optional stylized line pictograms
└── icons/                  lucide-react-native bundled icons
```

Welcome screen plays the video if present on device, falls back to the image otherwise.

## 11 · Conventions

- **Branch discipline (CRITICAL):** all work stays on `chatbot-interface` unless the user gives an explicit merge instruction. Never merge into `main`, never open a PR, never rebase onto `main` without that instruction.
- **BE NEEDED:** every placeholder for a backend call carries a `/* BE NEEDED: … */` block comment stating endpoint + shapes.
- **MOCK DATA:** every fixture and inline mock is clearly labeled.
- **No teammate names** in code, branches, commits, comments, or docs.
- **STATUS.md** at repo root is the single source of truth for project state and is updated after every meaningful step.

## 12 · Out of scope (for this spec)

- Push notifications (deferred to stretch — only the trigger point is stubbed).
- Calendar (.ics / Google Calendar) import.
- Multi-user accounts / auth.
- Real-time vehicle tracking maps.
- Multi-language support.
- iPad / tablet layouts.
- Deep linking wiring (schema reserved only).

## 13 · Success criteria

- All 16 locked decisions in §4 implemented exactly as specified.
- App runs end-to-end on a physical phone via Expo Go with `USE_MOCKS=true` and demos all four primary flows (morning briefing, schedule entry via chat, Red Line alert card, trip estimate).
- Every remote call routed through `src/api/client.ts` with either a mock fallback or a `BE NEEDED` block comment.
- Theme tokens used everywhere — no raw hex in component code.
- Zero teammate names anywhere in the codebase.
- STATUS.md kept current through every commit.
