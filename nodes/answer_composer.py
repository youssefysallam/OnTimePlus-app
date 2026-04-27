"""Node 5: compose the final natural-language answer.

The LLM here is constrained: it MUST use the structured plan + risk values we
just computed, and MUST cite doc IDs. We pass the policy in the system prompt
so it cannot invent train lines or alerts.
"""

from __future__ import annotations

import json

from ..harness.llm_client import LLMClient
from ..prompts.templates import ANSWER_SYSTEM, ANSWER_USER
from ..schemas import (
    Answer,
    RetrievedDoc,
    RiskAnalysis,
    RoutePlan,
    TimeConstraint,
)


def _format_evidence(evidence: list[RetrievedDoc], limit: int = 8) -> str:
    lines = []
    for r in evidence[:limit]:
        d = r.doc
        snippet = d.content if len(d.content) <= 280 else d.content[:280] + "..."
        lines.append(f"[{d.id}] :: {d.title} :: {snippet}")
    return "\n".join(lines)


def compose_answer(
    intent: TimeConstraint,
    plan: RoutePlan,
    risk: RiskAnalysis,
    suggested_depart: str | None,
    evidence: list[RetrievedDoc],
    llm: LLMClient | None = None,
) -> Answer:
    llm = llm or LLMClient()

    user = ANSWER_USER.format(
        query=intent.raw_query,
        intent=intent.model_dump_json(indent=2),
        plan=plan.model_dump_json(indent=2),
        risk=risk.model_dump_json(indent=2),
        evidence=_format_evidence(evidence),
    )

    raw = llm.chat(ANSWER_SYSTEM, user, temperature=0.3, max_tokens=600)
    citations = [r.doc.id for r in evidence]
    label_token = {
        "reliable": "[Reliable]",
        "caution": "[Caution]",
        "risky": "[Risky]",
        "unknown": "[Unknown]",
    }[risk.label]
    if label_token not in raw:
        raw = raw.rstrip() + f"\n\n{label_token}"

    return Answer(
        recommendation=raw.strip(),
        risk=risk,
        plan=plan,
        suggested_depart_time=suggested_depart,
        citations=citations,
        raw_response=raw,
    )
