"""Node 3: turn evidence into a concrete RoutePlan.

This is intentionally rule-based + evidence-grounded rather than letting the
LLM hallucinate timings. Travel-time docs in the KB carry structured
``metadata`` (median, std, peak/off-peak), and alert docs carry ``added_min``.
The estimator walks the retrieved evidence, picks the best matching travel
time doc, and adds shuttle / alert delays.
"""

from __future__ import annotations

from ..harness.alert_filter import alert_applies_to_plan
from ..harness.time_utils import is_peak, parse_hhmm
from ..schemas import KBDoc, RetrievedDoc, RoutePlan, RouteSegment, TimeConstraint


def _is_peak_window(intent: TimeConstraint) -> bool:
    for s in (intent.depart_time, intent.deadline):
        t = parse_hhmm(s)
        if t and is_peak(t):
            return True
    return False


def _stop_match(text: str, target: str | None) -> bool:
    if not target:
        return False
    target = target.lower()
    text = text.lower()
    return target in text


def _pick_travel_time_doc(
    evidence: list[RetrievedDoc],
    intent: TimeConstraint,
) -> KBDoc | None:
    candidates = [d.doc for d in evidence if d.doc.type == "travel_time"]
    if not candidates:
        return None

    def score(doc: KBDoc) -> int:
        meta = doc.metadata
        s = 0
        if _stop_match(meta.get("origin", ""), intent.origin) or _stop_match(
            doc.content, intent.origin
        ):
            s += 2
        if _stop_match(meta.get("destination", ""), intent.destination) or _stop_match(
            doc.content, intent.destination
        ):
            s += 2
        if "UMass" in (intent.destination or "") and (
            "Campus Center" in doc.content or "JFK/UMass" in doc.content
        ):
            s += 1
        return s

    candidates.sort(key=score, reverse=True)
    return candidates[0]


def _plan_routes(plan_segments) -> set[str]:
    out: set[str] = set()
    for s in plan_segments:
        for r in s.mode.split(","):
            r = r.strip()
            if r:
                out.add(r)
    return out


def _alert_added_min(
    evidence: list[RetrievedDoc],
    intent: TimeConstraint,
    plan_routes: set[str],
) -> tuple[float, list[str]]:
    added = 0.0
    triggered: list[str] = []
    query_text = (intent.raw_query or "").lower()
    for d in evidence:
        if d.doc.type != "alert":
            continue
        meta = d.doc.metadata
        if "added_min" not in meta:
            continue
        if not alert_applies_to_plan(
            d.doc,
            plan_routes,
            query_text,
            intent.deadline,
            intent.depart_time,
        ):
            continue
        added += float(meta["added_min"])
        triggered.append(d.doc.id)
    return added, triggered


def estimate_route(
    intent: TimeConstraint,
    evidence: list[RetrievedDoc],
) -> RoutePlan:
    peak = _is_peak_window(intent)
    tt_doc = _pick_travel_time_doc(evidence, intent)

    segments: list[RouteSegment] = []

    if tt_doc:
        meta = tt_doc.metadata
        median = float(meta.get(f"median_min_{'peak' if peak else 'offpeak'}", 25))
        std = float(meta.get(f"std_min_{'peak' if peak else 'offpeak'}", 5))
        seg = RouteSegment(
            mode=tt_doc.route or "Transit",
            from_stop=meta.get("origin", intent.origin or "Origin"),
            to_stop=meta.get("destination", intent.destination or "Destination"),
            expected_min=median,
            std_min=std,
            citations=[tt_doc.id],
        )
        segments.append(seg)
    else:
        # Last-resort fallback so the graph does not crash when the user asks
        # about an obscure route. We pick a generous default with high std.
        segments.append(
            RouteSegment(
                mode="Transit",
                from_stop=intent.origin or "Origin",
                to_stop=intent.destination or "Destination",
                expected_min=30.0,
                std_min=8.0,
                citations=[],
            )
        )

    if intent.destination and "umass" in intent.destination.lower() and tt_doc:
        if "Campus Center" not in tt_doc.metadata.get("destination", "") and (
            "JFK/UMass" in tt_doc.metadata.get("destination", "")
        ):
            segments.append(
                RouteSegment(
                    mode="UMB Shuttle",
                    from_stop="JFK/UMass",
                    to_stop="UMB Campus Center",
                    expected_min=8.0,
                    std_min=2.0,
                    citations=["shuttle-jfk-campus"],
                )
            )

    plan_routes = _plan_routes(segments)
    alert_added, triggered = _alert_added_min(evidence, intent, plan_routes)
    if segments:
        segments[0].alert_added_min = alert_added

    total_expected = sum(s.expected_min for s in segments)
    total_std = (sum(s.std_min ** 2 for s in segments)) ** 0.5
    return RoutePlan(
        segments=segments,
        total_expected_min=total_expected,
        total_std_min=total_std,
        total_alert_added_min=alert_added,
    )
