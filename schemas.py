"""Pydantic schemas shared across the OnTime+ pipeline.

Keeping every node's input/output strongly typed makes the LangGraph easier to
debug and gives the FastAPI / Streamlit / mobile clients a clean contract.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field

DocType = Literal[
    "route_overview",
    "stop",
    "shuttle_schedule",
    "travel_time",
    "alert",
    "policy",
    "scenario",
]

RiskLabel = Literal["reliable", "caution", "risky", "unknown"]


class KBDoc(BaseModel):
    """A single document in the knowledge base."""

    id: str
    type: DocType
    route: str = ""
    title: str = ""
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    source: str = ""


class RetrievedDoc(BaseModel):
    doc: KBDoc
    score: float
    retriever: str  # "bm25" | "vector" | "hybrid"


class TimeConstraint(BaseModel):
    """Structured intent extracted from the natural-language query."""

    origin: str | None = None
    destination: str | None = None
    deadline: str | None = None              # ISO time string e.g. "10:00"
    depart_time: str | None = None           # ISO time string e.g. "09:30"
    high_stakes: bool = False                # exam / interview / flight
    user_constraints: list[str] = Field(default_factory=list)
    raw_query: str = ""


class RouteSegment(BaseModel):
    mode: str                # "Red Line", "UMB Shuttle", "Walk", ...
    from_stop: str
    to_stop: str
    expected_min: float
    std_min: float = 0.0
    alert_added_min: float = 0.0
    citations: list[str] = Field(default_factory=list)


class RoutePlan(BaseModel):
    segments: list[RouteSegment]
    total_expected_min: float
    total_std_min: float
    total_alert_added_min: float = 0.0

    @property
    def adjusted_total_min(self) -> float:
        return self.total_expected_min + self.total_alert_added_min


class RiskAnalysis(BaseModel):
    label: RiskLabel
    buffer_min: float
    sigma_used: float
    explanation: str
    triggered_alerts: list[str] = Field(default_factory=list)


class Answer(BaseModel):
    recommendation: str
    risk: RiskAnalysis
    plan: RoutePlan | None = None
    suggested_depart_time: str | None = None
    citations: list[str] = Field(default_factory=list)
    raw_response: str = ""
    generated_at: datetime = Field(default_factory=datetime.utcnow)


class ChatRequest(BaseModel):
    query: str
    schedule: dict[str, Any] | None = None   # e.g. {"event": "class", "time": "10:00"}


class ChatResponse(BaseModel):
    answer: Answer
    intent: TimeConstraint
    retrieved: list[RetrievedDoc] = Field(default_factory=list)
