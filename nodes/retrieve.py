"""Node 2: retrieve evidence from the hybrid index.

We craft a focused query string from the structured intent so retrieval
matches travel-time docs, alerts, and policy docs that mention the actual
origin / destination instead of just the user's free-form question.
"""

from __future__ import annotations

from ..config import settings
from ..retriever.hybrid import HybridRetriever
from ..schemas import RetrievedDoc, TimeConstraint


def build_retrieval_query(intent: TimeConstraint) -> str:
    parts: list[str] = []
    if intent.origin:
        parts.append(f"from {intent.origin}")
    if intent.destination:
        parts.append(f"to {intent.destination}")
    if intent.deadline:
        parts.append(f"arrive by {intent.deadline}")
    if intent.user_constraints:
        parts.append(" ".join(intent.user_constraints))
    parts.append(intent.raw_query)
    return " ".join(p for p in parts if p)


_ALERT_HINTS = (
    # weather
    "rain", "raining", "storm", "wet", "downpour", "thunderstorm", "drizzle",
    "snow", "snowing", "snowstorm", "blizzard", "icy", "ice",
    "wind", "windy", "gust", "gale",
    "cold", "freezing", "subzero", "frigid",
    "heat", "heatwave", "hot", "humid",
    # service / disruption
    "holiday", "weekend", "saturday", "sunday",
    "signal", "delay", "delayed", "delays", "slow",
    "detour", "construction", "disabled", "stuck", "broken",
    "shuttle reduced", "reduced shuttle", "running reduced",
    "finals", "midterm",
)


def retrieve_evidence(
    intent: TimeConstraint,
    retriever: HybridRetriever | None = None,
    top_k: int | None = None,
) -> list[RetrievedDoc]:
    retriever = retriever or HybridRetriever()
    query = build_retrieval_query(intent)
    docs = retriever.search(query, top_k=top_k or settings.top_k_final)

    # Targeted alert search: if the user mentions a known weather /
    # disruption keyword, do a second alert-only retrieval pass so that
    # the relevant alert always lands in evidence (without this pass we
    # routinely missed `alert-red-rain`, `alert-heatwave`, and
    # `alert-red-signal-...` because hybrid RRF buried them under
    # closer-to-stop docs).
    raw = (intent.raw_query or "").lower()
    if any(k in raw for k in _ALERT_HINTS):
        try:
            alert_hits = retriever.search(
                intent.raw_query or query, top_k=4, type_filter=["alert"]
            )
            docs.extend(alert_hits)
        except Exception:
            pass

    have_alert = any(d.doc.type == "alert" for d in docs)
    have_policy = any(d.doc.type == "policy" for d in docs)
    if not have_alert:
        docs.extend(retriever.search(f"alert {intent.origin or ''} {intent.destination or ''}", top_k=2))
    if not have_policy:
        docs.extend(retriever.search("buffer policy risk label peak", top_k=2))

    seen: set[str] = set()
    deduped: list[RetrievedDoc] = []
    for d in docs:
        if d.doc.id in seen:
            continue
        seen.add(d.doc.id)
        deduped.append(d)
    return deduped
