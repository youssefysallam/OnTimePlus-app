# OnTime+ — A Schedule-Aware Transit Assistant

RAG-based chatbot that answers "**will I arrive on time, and what is the safest way?**"
for UMass Boston students using MBTA + UMB shuttle.

It combines:

- **Hybrid retrieval** (BM25 + OpenAI dense embeddings + RRF fusion) over a
  curated MBTA / UMB-shuttle / simulated-disruption knowledge base.
- **LLM intent extraction** that turns free-form questions into a typed
  `TimeConstraint` (origin, destination, deadline, depart_time, high_stakes).
- **Rule-based, evidence-grounded route estimator** that uses metadata
  (median, std, peak/off-peak, alerts) instead of letting the LLM hallucinate
  numbers.
- **Risk labeller** (`reliable` / `caution` / `risky`) computed from buffer
  vs. travel-time variance and active alerts.
- **FastAPI backend + Streamlit web UI**, wired so a future mobile app can
  use the exact same `/chat` endpoint.

---

## 1. Project layout

```
ontime_plus/
├── config.py                # Pydantic settings (.env aware)
├── schemas.py               # Typed contracts shared across nodes / API / UI
├── data/
│   ├── raw/                 # MBTA routes, stops, UMB shuttle (real subset)
│   ├── simulated/           # Travel times, disruption scenarios, policy
│   └── index/               # FAISS + BM25 + docs.json (built on demand)
├── ingest/
│   ├── loader.py            # JSONL -> KBDoc
│   ├── chunker.py           # Long-doc chunker (pass-through by default)
│   ├── embedder.py          # OpenAI text-embedding-3-small wrapper
│   └── build_index.py       # CLI: build FAISS + BM25 indices
├── retriever/
│   └── hybrid.py            # BM25 + vector + RRF + type/route filters
├── nodes/
│   ├── intent_extractor.py  # LLM JSON-mode -> TimeConstraint
│   ├── retrieve.py          # Composes a focused retrieval query
│   ├── route_estimator.py   # Rule-based RoutePlan from evidence
│   ├── risk_analyzer.py     # Buffer + alert -> RiskLabel
│   └── answer_composer.py   # LLM -> grounded final answer w/ citations
├── graph.py                 # LangGraph orchestration (intent -> answer)
├── harness/
│   ├── llm_client.py        # OpenAI chat / chat_json
│   └── time_utils.py        # peak windows, hh:mm parsing, add/sub minutes
├── prompts/templates.py     # All prompts in one file
├── app/
│   ├── api.py               # FastAPI: /chat /health /example_queries
│   └── streamlit_app.py     # Streamlit web UI calling the FastAPI backend
├── eval/
│   ├── test_queries.jsonl   # 10 labelled cases (intent + relevant docs + risk)
│   ├── metrics.py           # Intent / Retrieval / Risk metrics
│   └── run_eval.py          # CLI: run eval -> EVALUATION_REPORT.md
└── tests/test_offline.py    # Pure-Python smoke tests (no API key required)
```

## 2. Quick start

```powershell
# 1) Install dependencies
cd C:\
pip install -r ontime_plus\requirements.txt

# 2) Configure secrets
copy ontime_plus\.env.example ontime_plus\.env
# then edit ontime_plus\.env and put your OPENAI_API_KEY

# 3) Build the index (FAISS + BM25)
python -m ontime_plus.ingest.build_index

# 4) Run offline tests (no API key needed)
pytest ontime_plus\tests -v

# 5) Start the API backend
uvicorn ontime_plus.app.api:app --port 8000

# 6) In another terminal, start the web UI
streamlit run ontime_plus\app\streamlit_app.py
```

The Streamlit app talks to the FastAPI backend at `http://127.0.0.1:8000`
through the same JSON contract a future mobile app would use, so you can
swap front-ends without touching the agent code.

## 3. Architecture

```
User Query (+ optional schedule)
        │
        ▼
[1] Intent Extraction (LLM, JSON-mode)
        │  TimeConstraint{origin, destination, deadline, depart_time, high_stakes}
        ▼
[2] Hybrid Retrieval (BM25 + vector + RRF)
        │  list[RetrievedDoc] from KB (routes, stops, shuttle, travel times,
        │                              alerts, policy)
        ▼
[3] Route Estimation (rule-based, evidence-grounded)
        │  RoutePlan{segments, total_expected_min, total_std_min, alert_added_min}
        ▼
[4] Risk Analysis
        │  RiskAnalysis{label ∈ reliable/caution/risky, buffer_min, sigma_used}
        │  + suggested_depart_time
        ▼
[5] Answer Composition (LLM, constrained to use evidence + structured plan)
        │
        ▼
Final Answer (recommendation + risk label + citations to doc IDs)
```

The graph is built with **LangGraph** so every step's input and output is
inspectable (the Streamlit UI exposes intent / plan / risk / evidence panels
for transparency, which is also useful when grading or demoing).

## 4. Knowledge base

The KB is a set of **JSONL files** with a uniform schema (see `schemas.py::KBDoc`):

| Type                | Source            | Examples                                   |
|---------------------|-------------------|--------------------------------------------|
| `route_overview`    | MBTA GTFS subset  | Red Line, Green B/C/D/E, Orange, Blue, SL1 |
| `stop`              | MBTA GTFS subset  | JFK/UMass, Park Street, South Station ...  |
| `shuttle_schedule`  | UMB Transportation| JFK/UMass <-> Campus Center shuttle        |
| `travel_time`       | Simulated         | median + std for peak / off-peak           |
| `alert`             | Simulated         | Red Line signal, Green Line disabled, etc. |
| `policy`            | OnTime+ rules     | buffer policy, risk labelling thresholds   |

To extend: just drop another JSONL into `data/raw/` or `data/simulated/`,
keep IDs unique, and rerun `python -m ontime_plus.ingest.build_index`.

## 5. Evaluation

```powershell
python -m ontime_plus.eval.run_eval
```

This produces three families of metrics on `eval/test_queries.jsonl`:

1. **Intent extraction** — exact match + per-slot accuracy for
   `origin`, `destination`, `deadline`, `depart_time`, `high_stakes`.
2. **Retrieval** — Recall@k, Precision@k (k=3,5,10), MRR.
3. **Risk labelling** — accuracy, macro-F1, per-class F1, full
   confusion matrix.

Outputs land in `data/results/`:

- `eval_predictions.jsonl` — one row per test query
- `eval_metrics.json` — all aggregate numbers
- `EVALUATION_REPORT.md` — human-readable summary

The labelled test set is small but covers all four example queries from the
proposal plus six additional cases (high-stakes, active alert, weather,
shuttle reduction, etc.). Add more queries to `eval/test_queries.jsonl` as
the system matures.

## 6. Path to a mobile app

The split between FastAPI (`app/api.py`) and Streamlit (`app/streamlit_app.py`)
is deliberate:

- The Streamlit app **does not** import any agent code; it only does
  `requests.post("/chat", ...)`.
- A future mobile (React Native / Flutter) client uses the same JSON
  contract — `ChatRequest` in, `ChatResponse` out.
- All schemas are Pydantic models so the API generates an OpenAPI spec
  automatically at `http://127.0.0.1:8000/docs`, which most mobile codegen
  tools can consume directly.

## 7. Roadmap

- Real-time MBTA Alerts API integration (replace simulated alerts).
- LLM-as-judge for end-to-end answer quality.
- Multi-turn dialog (the user clarifying origin / preferences).
- Push notifications in the mobile app when an active alert affects a saved
  recurring trip ("class at 10 AM, MWF").
