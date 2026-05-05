# OnTime+ — A Schedule-Aware Transit Assistant

RAG-based chatbot that answers **"will I arrive on time, and what is the safest way?"**
for UMass Boston students using MBTA + UMB shuttle.

This `demo` branch contains the **integrated demo build** — backend + mobile
frontend in one repo, both verified end-to-end on 2026-05-05.

---

## What's in here

```
ontime_plus/                       <-- repo root (the BACKEND lives at the root)
├── app/api.py                     FastAPI: POST /chat, GET /health, GET /example_queries
├── graph.py                       LangGraph orchestration (5-node pipeline)
├── schemas.py                     Pydantic contracts shared with the frontend
├── nodes/                         intent / retrieve / route / risk / answer
├── retriever/hybrid.py            BM25 + dense (BGE-small) + RRF fusion
├── ingest/                        JSONL -> KBDoc -> FAISS + BM25 index
├── harness/                       LLM client, time utils, alert filter
├── prompts/templates.py           Intent + answer prompts
├── data/raw/                      MBTA routes / stops / UMB shuttle (curated subset)
├── data/simulated/                Travel times, disruption + weather alerts, policy KB
├── eval/                          20-query labelled set, metrics harness
├── tests/                         Offline pytest smoke tests
│
├── frontend/                      <-- the FRONTEND (Expo / React Native, TypeScript)
│   ├── App.tsx, src/, assets/, __tests__/
│   ├── package.json, tsconfig.json, app.json
│   ├── babel.config.js, jest.config.js
│   ├── metro.config.js            <-- white-screen fix (zustand ESM redirect)
│   └── FRONTEND_README.md         frontend-specific README
│
├── REPORT_V1.md                   Full technical report (rubric-aligned)
├── FRONTEND_INTEGRATION.md        How the frontend talks to the backend
├── DEMO_SPEECH.md                 Verbatim live demo speech
└── OnTimePlus_Proposal.pdf        Original project proposal
```

---

## Quick start

### Backend (one terminal)

```powershell
# 1) Install deps
pip install -r requirements.txt

# 2) Configure secrets (one-time)
copy .env.example .env
# then edit .env and put your OPENAI_API_KEY

# 3) Build the index (FAISS + BM25, ~30 s for 48 docs)
python -m ontime_plus.ingest.build_index

# 4) Run offline smoke tests (no API key needed)
pytest tests -v

# 5) Start the FastAPI backend
uvicorn ontime_plus.app.api:app --port 8000
# Health check: http://127.0.0.1:8000/health
# OpenAPI docs: http://127.0.0.1:8000/docs
```

### Frontend (second terminal)

```powershell
cd frontend
npm install                            # one-time

$env:EXPO_PUBLIC_USE_MOCKS = "false"   # talk to real backend, not mocks
$env:EXPO_PUBLIC_API_BASE  = "http://127.0.0.1:8000"
npx expo start --web --port 19006
# Web app: http://localhost:19006
```

For iOS/Android via Expo Go: `npx expo start --lan` and scan the QR. Set
`EXPO_PUBLIC_API_BASE` to your machine's LAN IP so the phone can reach
the backend.

### Run the evaluation harness

```powershell
python -m ontime_plus.eval.run_eval --test eval/test_queries_v2.jsonl --suffix v3
# Outputs land in data/results/:
#   eval_predictions_v3.jsonl  (per-query trace)
#   eval_metrics_v3.json       (aggregate numbers)
#   EVALUATION_REPORT_v3.md    (human summary)
```

---

## Architecture (one diagram)

```
   User Query (+ optional schedule)
              |
              v
   [1] Intent Extraction       <-- LLM, JSON-mode
              |  TimeConstraint{origin, destination, deadline, depart_time, high_stakes}
              v
   [2] Hybrid Retrieval        <-- BM25 + BGE + RRF + targeted alert pass
              |  list[RetrievedDoc]
              v
   [3] Route Estimation        <-- rule-based (NOT the LLM)
              |  RoutePlan{segments, total_min, std_min, alert_added_min}
              v
   [4] Risk Analysis           <-- rule-based, two-mode buffer policy
              |  RiskAnalysis{label in reliable/caution/risky, buffer_min, suggested_depart}
              v
   [5] Answer Composition      <-- LLM, constrained to use evidence + structured plan
              |
              v
   Final Answer (recommendation + risk label + citations to doc IDs)
```

**Design discipline:** the LLM is used at only two points — converting
free-form text into typed JSON (Node 1) and verbalising a structured
plan (Node 5). Numerical decisions and risk labels are computed by
deterministic Python so every answer is auditable.

---

## Knowledge base summary (48 docs, JSONL)

| Type               | n  | Source                       | Examples                                  |
|--------------------|----|------------------------------|-------------------------------------------|
| `route_overview`   | 9  | MBTA GTFS subset             | Red, Orange, Blue, Green B/C/D/E, SL1     |
| `stop`             | 10 | MBTA GTFS subset             | Alewife, Park St, JFK/UMass, ...          |
| `shuttle_schedule` | 2  | UMass Boston Transportation  | JFK/UMass <-> Campus Center               |
| `travel_time`      | 11 | Simulated (median + std)     | Per-segment peak / off-peak distributions |
| `alert`            | 13 | Simulated MBTA / UMB alerts  | Signal failures, weather, holiday service |
| `policy`           | 3  | OnTime+ rules                | Buffer policy, risk thresholds, peak hrs  |

To extend, drop another JSONL into `data/raw/` or `data/simulated/`
with a unique `id` and rerun `python -m ontime_plus.ingest.build_index`.

---

## Documents

- [REPORT_V1.md](REPORT_V1.md) — full technical report with evaluation
- [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md) — frontend/backend integration runbook
- [DEMO_SPEECH.md](DEMO_SPEECH.md) — verbatim live demo speech (~3 min 30 s)
- [OnTimePlus_Proposal.pdf](OnTimePlus_Proposal.pdf) — original project proposal

---

## Branch context

This is the `demo` branch — an integration cut combining:

- the backend RAG pipeline from `embeddings`
- the mobile chatbot UI from `chatbot-interface`

Both contributing branches remain untouched. See [FRONTEND_INTEGRATION.md](FRONTEND_INTEGRATION.md)
for the verified API contract match between the two.
