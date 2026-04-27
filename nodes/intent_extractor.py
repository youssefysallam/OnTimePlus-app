"""Node 1: turn natural-language query (+ optional schedule) into ``TimeConstraint``."""

from __future__ import annotations

import json
from typing import Any

from ..harness.llm_client import LLMClient
from ..prompts.templates import INTENT_SYSTEM, INTENT_USER
from ..schemas import TimeConstraint


def extract_intent(
    query: str,
    schedule: dict[str, Any] | None = None,
    llm: LLMClient | None = None,
) -> TimeConstraint:
    llm = llm or LLMClient()
    user = INTENT_USER.format(
        query=query,
        schedule=json.dumps(schedule or {}, ensure_ascii=False),
    )
    payload = llm.chat_json(INTENT_SYSTEM, user, temperature=0.0)

    try:
        intent = TimeConstraint(
            origin=payload.get("origin"),
            destination=payload.get("destination"),
            deadline=payload.get("deadline"),
            depart_time=payload.get("depart_time"),
            high_stakes=bool(payload.get("high_stakes", False)),
            user_constraints=list(payload.get("user_constraints", []) or []),
            raw_query=query,
        )
    except Exception:
        # Fall back to a minimal intent rather than crashing the graph.
        intent = TimeConstraint(raw_query=query)

    if not intent.destination and schedule and "destination" in schedule:
        intent.destination = schedule["destination"]
    if not intent.deadline and schedule and "time" in schedule:
        intent.deadline = schedule["time"]
    if not intent.destination:
        intent.destination = "UMass Boston"
    return intent
