"""FastAPI backend.

This is the ONE entry point that any client (Streamlit, mobile app, curl)
should talk to. Keeping the chatbot logic behind an HTTP API makes it
straightforward to ship a mobile app later: the mobile app just hits the same
``/chat`` endpoint.

Run:
    uvicorn ontime_plus.app.api:app --reload --port 8000
"""

from __future__ import annotations

import hashlib
import json
import logging
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ..config import settings
from ..graph import OnTimeAgent
from ..schemas import ChatRequest, ChatResponse

log = logging.getLogger("ontime_plus.api")

app = FastAPI(
    title="OnTime+ API",
    description="Schedule-aware MBTA transit assistant for UMass Boston students.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


_agent: OnTimeAgent | None = None

_CACHE_TTL = 300  # seconds
_cache: dict[str, tuple[float, ChatResponse]] = {}
_executor = ThreadPoolExecutor(max_workers=4)
_CHAT_TIMEOUT = 30  # seconds


def _cache_key(query: str, schedule: dict | None) -> str:
    payload = json.dumps({"q": query, "s": schedule}, sort_keys=True)
    return hashlib.md5(payload.encode()).hexdigest()


def _evict_expired() -> None:
    now = time.monotonic()
    expired = [k for k, (ts, _) in _cache.items() if now - ts > _CACHE_TTL]
    for k in expired:
        _cache.pop(k, None)


def _get_agent() -> OnTimeAgent:
    global _agent
    if _agent is None:
        log.info("Initialising OnTimeAgent ...")
        _agent = OnTimeAgent()
    return _agent


class HealthResponse(BaseModel):
    status: str
    model: str
    base_url: str
    embedding_provider: str
    embed_model: str
    n_docs: int


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    n_docs = 0
    try:
        agent = _get_agent()
        n_docs = len(agent.retriever.docs)
    except Exception as e:
        log.warning("Agent not ready: %s", e)
    embed_model = (
        settings.local_embed_model
        if settings.embedding_provider == "sentence_transformers"
        else settings.openai_embed_model
    )
    return HealthResponse(
        status="ok",
        model=settings.openai_model,
        base_url=settings.openai_base_url or "https://api.openai.com/v1",
        embedding_provider=settings.embedding_provider,
        embed_model=embed_model,
        n_docs=n_docs,
    )


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    if not req.query.strip():
        raise HTTPException(400, "query must be non-empty")

    _evict_expired()
    key = _cache_key(req.query, req.schedule)
    if key in _cache:
        _, cached = _cache[key]
        log.debug("cache hit for query: %.60s", req.query)
        return cached

    try:
        agent = _get_agent()
        future = _executor.submit(agent.ask, req.query, req.schedule)
        result: ChatResponse = future.result(timeout=_CHAT_TIMEOUT)
    except FuturesTimeoutError:
        raise HTTPException(504, "request timed out — try a shorter or simpler query")
    except Exception as e:
        log.exception("chat failed")
        raise HTTPException(500, f"chat failed: {e}") from e

    _cache[key] = (time.monotonic(), result)
    return result


@app.get("/example_queries")
def example_queries() -> dict[str, list[str]]:
    return {
        "examples": [
            "My class starts at 10 AM at UMass Boston, when should I leave from Alewife?",
            "If I leave at 9:30 from Harvard, will I make it to UMB Campus Center by 10:00?",
            "The Red Line is delayed, what should I do if I have a midterm at 9:00 at UMass Boston?",
            "What is the safest way for me to get from Quincy Center to UMB by 8:45?",
        ]
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "ontime_plus.app.api:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=False,
    )
