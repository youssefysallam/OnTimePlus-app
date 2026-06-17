# OnTime+

A schedule-aware transit assistant for UMass Boston students. Ask it in plain English, "Will I make it to my 10 AM class if I leave Alewife at 9:30?" — and it answers with a risk label, a departure recommendation, and citations to the evidence it used.

---

## How it works

```
User query (+ optional schedule)
         │
         ▼
[1] Intent Extraction     ← LLM, JSON-mode → TimeConstraint{origin, dest, deadline, …}
         │
         ▼
[2] Hybrid Retrieval      ← BM25 + BGE-small-en + Reciprocal Rank Fusion
         │                   + targeted MBTA alert pass
         │  list[RetrievedDoc]
         ▼
[3] Route Estimation      ← deterministic rule-based (NOT the LLM)
         │  RoutePlan{segments, total_min, std_min, alert_added_min}
         ▼
[4] Risk Analysis         ← deterministic two-mode buffer policy
         │  RiskAnalysis{reliable | caution | risky, buffer_min, suggested_depart}
         ▼
[5] Answer Composition    ← LLM, constrained to structured plan + citations
         │
         ▼
Final answer + risk label + doc citations
```

**Design discipline:** the LLM touches only nodes 1 and 5. Numerical decisions and risk labels come from deterministic Python so every answer is auditable and reproducible.

---

## Key Features

- **Hybrid retrieval** — BM25 sparse + BGE-small dense embeddings fused with Reciprocal Rank Fusion for high-recall document retrieval
- **Risk-aware answers** — three-tier risk model (reliable / caution / risky) with computed departure buffers based on historical travel-time variance
- **MBTA alert awareness** — live alert docs in the knowledge base automatically add delay minutes to route estimates
- **Response caching** — 5-minute MD5-keyed cache on `/chat` cuts repeat-query latency to zero
- **Timeout protection** — 30-second thread-pool timeout returns HTTP 504 instead of hanging indefinitely
- **Mobile frontend** — Expo React Native chatbot UI with streaming typing indicator

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI + LangGraph (5-node pipeline) |
| Retrieval | BM25 + BGE-small-en + FAISS (Reciprocal Rank Fusion) |
| LLM | OpenAI-compatible (configurable model/base URL) |
| Schema | Pydantic v2 |
| Frontend | Expo (React Native + TypeScript) |
| Language | Python 3.11+ |

---

## Project Structure

```
ontime_plus/
  app/api.py          FastAPI: /chat (cached), /health, /example_queries
  graph.py            LangGraph 5-node orchestration
  nodes/              intent / retrieve / route / risk / answer
  retriever/hybrid.py BM25 + BGE + RRF fusion
  ingest/             JSONL → KBDoc → FAISS + BM25 index
  data/raw/           MBTA routes, stops, UMB shuttle (48 docs)
  data/simulated/     Travel times, alerts, policy KB
tests/
  test_retrieval.py   Offline pytest smoke tests (no API key needed)
frontend/
  App.tsx, src/       Expo React Native chatbot UI
```

---

## Quick Start

### Backend

```bash
pip install -e .

cp .env.example .env        # add your OPENAI_API_KEY

# Build the FAISS + BM25 index (~30s for 48 docs)
python -m ontime_plus.ingest.build_index

# Smoke tests (no API key needed)
pytest tests/ -v

# Start the API
uvicorn ontime_plus.app.api:app --port 8000
# → http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install

EXPO_PUBLIC_API_BASE=http://127.0.0.1:8000 npx expo start --web
```

---

## Knowledge Base

| Type | Count | Source |
|---|---|---|
| `route_overview` | 9 | MBTA GTFS subset |
| `stop` | 10 | MBTA GTFS subset |
| `shuttle_schedule` | 2 | UMass Boston Transportation |
| `travel_time` | 11 | Simulated (median + std dev) |
| `alert` | 13 | Simulated MBTA / UMB alerts |
| `policy` | 3 | OnTime+ buffer rules |

To add documents: drop a JSONL file in `data/raw/` or `data/simulated/` and rerun `build_index`.

---

## Example Queries

- *"My class starts at 10 AM at UMass Boston — when should I leave from Alewife?"*
- *"If I leave Harvard at 9:30, will I make it to the Campus Center by 10:00?"*
- *"The Red Line is delayed — what should I do if I have a midterm at 9:00?"*
- *"What is the safest way to get from Quincy Center to UMB by 8:45?"*
