"""Offline smoke tests that do NOT require an OpenAI API key.

These exercise the pure-Python parts of the pipeline (loader, schemas,
route_estimator, risk_analyzer) and verify wiring is correct. End-to-end
tests that hit OpenAI live in ``test_e2e.py``.
"""

from __future__ import annotations

import json
from datetime import time

import pytest

from ontime_plus.harness.time_utils import (
    add_minutes,
    is_peak,
    parse_hhmm,
    subtract_minutes,
)
from ontime_plus.ingest.loader import load_kb
from ontime_plus.nodes.risk_analyzer import analyze_risk
from ontime_plus.nodes.route_estimator import estimate_route
from ontime_plus.schemas import KBDoc, RetrievedDoc, TimeConstraint


def test_load_kb_non_empty():
    kb = load_kb()
    assert len(kb) >= 15
    types = {d.type for d in kb}
    assert {"route_overview", "stop", "shuttle_schedule", "travel_time", "alert", "policy"}.issubset(types)


def test_time_helpers():
    t = parse_hhmm("09:30")
    assert t == time(9, 30)
    assert is_peak(time(8, 0))
    assert not is_peak(time(11, 0))
    assert add_minutes(time(9, 30), 30) == time(10, 0)
    assert subtract_minutes(time(10, 0), 45) == time(9, 15)


def _wrap(doc: KBDoc, score: float = 1.0) -> RetrievedDoc:
    return RetrievedDoc(doc=doc, score=score, retriever="hybrid")


def _evidence_for_route(origin: str, destination: str) -> list[RetrievedDoc]:
    kb = load_kb()
    by_id = {d.id: d for d in kb}
    out: list[RetrievedDoc] = []

    for d in kb:
        if d.type == "travel_time":
            if origin.lower() in d.content.lower() and destination.lower() in d.content.lower():
                out.append(_wrap(d))

    for pid in ("policy-buffer", "policy-risk-label"):
        if pid in by_id:
            out.append(_wrap(by_id[pid]))
    if "shuttle-jfk-campus" in by_id and "umass" in destination.lower():
        out.append(_wrap(by_id["shuttle-jfk-campus"]))
    return out


def test_route_estimator_alewife_to_umb():
    intent = TimeConstraint(
        origin="Alewife",
        destination="UMass Boston",
        deadline="10:00",
        depart_time=None,
        high_stakes=False,
        raw_query="If I leave from Alewife, when should I leave for class at 10?",
    )
    evidence = _evidence_for_route("Alewife", "JFK/UMass")
    plan = estimate_route(intent, evidence)
    assert plan.total_expected_min > 20
    assert plan.total_expected_min < 60
    assert any("Red" in s.mode for s in plan.segments)


def test_risk_analyzer_reliable_case():
    intent = TimeConstraint(
        origin="Quincy Center",
        destination="UMass Boston",
        deadline="08:45",
        depart_time=None,
        high_stakes=False,
        raw_query="safe route to UMB by 8:45 from Quincy Center",
    )
    evidence = _evidence_for_route("Quincy Center", "JFK/UMass")
    plan = estimate_route(intent, evidence)
    risk, depart = analyze_risk(intent, plan, evidence)
    assert risk.label in {"reliable", "caution"}
    assert depart is not None


def test_risk_analyzer_risky_when_buffer_negative():
    intent = TimeConstraint(
        origin="Harvard",
        destination="UMass Boston",
        deadline="10:00",
        depart_time="09:30",
        high_stakes=False,
        raw_query="leave at 9:30 from Harvard to UMB by 10",
    )
    evidence = _evidence_for_route("Harvard", "JFK/UMass")
    plan = estimate_route(intent, evidence)
    risk, _ = analyze_risk(intent, plan, evidence)
    assert risk.buffer_min < 5  # Harvard->UMB at peak ~34 min, depart 9:30 leaves <=5 min buffer
    assert risk.label in {"risky", "caution"}
