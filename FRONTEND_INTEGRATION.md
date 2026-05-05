# OnTime+ — Frontend + Backend Integration Runbook

**Status:** verified end-to-end on 2026-05-05.
**Frontend branch:** `chatbot-interface` (Expo / React Native, TypeScript).
**Backend branch:** `embeddings` (FastAPI + LangGraph + FAISS + BM25).

The frontend and backend live in two separate working trees so they can run side
by side.

| Component | Path                       | Branch              |
|-----------|----------------------------|---------------------|
| Backend   | `C:\ontime_plus`           | `embeddings`        |
| Frontend  | `C:\ontime_plus_frontend`  | `chatbot-interface` |

---

## 1. API contract (verified match)

The frontend's `src/types/index.ts` declares `BackendAnswer`,
`BackendIntent`, `BackendRetrievedDoc`, and `ChatResponse`. They are
**1:1 with the Pydantic models** in `ontime_plus/schemas.py`:

| Frontend type            | Backend type        | Field                                                                                         |
|--------------------------|---------------------|-----------------------------------------------------------------------------------------------|
| `ChatResponse`           | `ChatResponse`      | `answer`, `intent`, `retrieved`                                                               |
| `BackendAnswer`          | `Answer`            | `recommendation`, `risk`, `plan`, `suggested_depart_time`, `citations`, `raw_response`        |
| `BackendRiskAnalysis`    | `RiskAnalysis`      | `label` ∈ `reliable / caution / risky / unknown`, `buffer_min`, `sigma_used`, `explanation`   |
| `BackendIntent`          | `TimeConstraint`    | `origin`, `destination`, `deadline`, `depart_time`, `high_stakes`, `user_constraints`         |
| `ApiChatRequest`         | `ChatRequest`       | `query`, `schedule?`                                                                          |
| `ApiChatSchedule`        | `schedule` dict     | `event`, `time`, `destination`, `high_stakes`                                                 |

The frontend POSTs to `${API_BASE}/chat` with `{query, schedule}`. The
backend's `app/api.py` exposes `POST /chat` with the same shape, plus
permissive CORS (`allow_origins=["*"]`).

No bridging or adapter is needed.

---

## 2. One-time setup

```powershell
# (a) Backend dependencies + index (only if not already done)
pip install -r C:\ontime_plus\requirements.txt
python -m ontime_plus.ingest.build_index

# (b) Frontend dependencies (one-time)
cd C:\ontime_plus_frontend
npm install
```

---

## 3. Running both together

Open two terminals.

**Terminal A — backend (FastAPI + LangGraph):**

```powershell
uvicorn ontime_plus.app.api:app --host 127.0.0.1 --port 8000
# Health check: http://127.0.0.1:8000/health
```

**Terminal B — frontend (Expo web):**

```powershell
cd C:\ontime_plus_frontend
$env:EXPO_PUBLIC_USE_MOCKS = "false"
$env:EXPO_PUBLIC_API_BASE  = "http://127.0.0.1:8000"
npx expo start --web --port 19006
# Web app: http://localhost:19006
```

> The frontend defaults to **mock mode** (`EXPO_PUBLIC_USE_MOCKS=true`).
> Setting `EXPO_PUBLIC_USE_MOCKS=false` switches `src/api/client.ts`
> to talk to the real `/chat` endpoint.

For iOS/Android via Expo Go, replace `--web --port 19006` with `--lan`
and scan the QR code; set `EXPO_PUBLIC_API_BASE` to your machine's LAN
IP (e.g. `http://192.168.1.50:8000`) so the phone can reach the
backend.

---

## 4. End-to-end smoke test

```powershell
curl -X POST http://127.0.0.1:8000/chat `
  -H "Content-Type: application/json" `
  -d '{\"query\":\"My class starts at 9 AM at UMass Boston, when should I leave from JFK/UMass?\",\"schedule\":{\"event\":\"class\",\"time\":\"09:00\",\"destination\":\"UMass Boston\"}}'
```

Expected (truncated):

```json
{
  "answer": {
    "recommendation": "I recommend leaving JFK/UMass by 8:30 AM ...",
    "risk": { "label": "caution", "buffer_min": ..., "explanation": "..." },
    "suggested_depart_time": "08:18",
    "citations": ["shuttle-jfk-campus", "stop-jfk-umass", "policy-buffer", "policy-risk-label", ...]
  },
  "intent": { "origin": "JFK/UMass", "destination": "UMass Boston", "deadline": "09:00", ... },
  "retrieved": [ ... ]
}
```

The Expo web UI calls this same endpoint via `api.sendMessage()` in
`src/api/client.ts` and renders the answer through the chat bubble +
retrieved-evidence panel.

---

## 5. Notes on the frontend (chatbot-interface branch)

- **Stack:** Expo SDK 54 · React Native 0.81 · TypeScript · Zustand
  stores · React Navigation drawer · Reanimated.
- **Design:** dark "Nightshift" theme · carbon-fibre background ·
  glass pill navbar · iOS-Messages-style chat bubbles with tails.
- **Screens:** Welcome → Chat (primary) + drawer to Today / Schedule /
  Alerts / History / Settings.
- **Tests:** `npm test` (3 suites, 6 tests — all pass).
- **Typecheck:** `npm run typecheck` — passes.

The `useChat` hook (`src/hooks/useChat.ts`) consumes the backend
response via `reply.answer.recommendation` for the chat bubble and
`reply.retrieved[]` for the per-message evidence list. The next
iteration will also surface `reply.answer.risk.label`,
`suggested_depart_time`, and `citations` directly on the bubble (the
fields are already in scope, just not yet rendered).

---

## 6. Verified state (2026-05-05)

- Backend `/health` returns `status=ok`, `n_docs=38`, model
  `openai/gpt-4o-mini`.
- Backend `/chat` returns full `ChatResponse` with `risk.label` ∈
  {reliable, caution, risky}, suggested depart time, and citation IDs.
- Frontend `npm install` (903 packages), `npm run typecheck` (clean),
  and `npm test` (6/6 pass).
- Expo web builds and serves at `http://localhost:19006`.
- Frontend talks to the live backend with `EXPO_PUBLIC_USE_MOCKS=false`
  (no contract changes were needed).
- Welcome screen renders in headless Chrome (verified via CDP screenshot).

---

## 7. Gotcha: `import.meta` white-screen on Expo SDK 54 web

If you see a blank page on `http://localhost:19006/` and DevTools shows
`SyntaxError: Cannot use 'import.meta' outside a module`, the cause is
that **zustand v4/v5 ships `import.meta.env.MODE` in its ESM build**
(`zustand/esm/*.mjs`) for dev-mode detection. Expo SDK 54 enables
Package Exports by default, so Metro picks the ESM entry and emits
`import.meta` verbatim into the bundle — but the bundle is loaded as a
classic `<script>` (not `type="module"`), so the browser refuses it
and the whole React tree never mounts.

**Fix (already applied):** [metro.config.js](../ontime_plus_frontend/metro.config.js)
adds a `resolveRequest` that redirects `zustand`, `zustand/middleware`,
`zustand/shallow`, `zustand/vanilla`, `zustand/react`, and
`zustand/traditional` to the package's CJS files (e.g. `zustand/index.js`).
The CJS build does not use `import.meta`, so the bundle parses cleanly.

If you upgrade zustand or notice a related new dependency triggering the
same error, run:

```powershell
curl http://localhost:19006/node_modules/expo/AppEntry.bundle?platform=web -o bundle.js
findstr /C:"import.meta" bundle.js
```

The lines that come back point you to the offending package; add it to
the `redirects` map in `metro.config.js` (or upgrade past the offending
version once upstream patches it).
