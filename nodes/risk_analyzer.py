"""Node 4: produce a Risk label and suggested departure time.

The label uses a two-mode policy that reflects WHO is choosing the departure
time:

A. **User-chosen depart_time**: we measure the literal slack
       buffer = deadline - depart_time - adjusted_travel_time
   and apply the buffer thresholds from the policy KB (defaults: < 3 min
   = risky, < 10 min = caution, otherwise reliable). Active alerts can
   escalate the label.

B. **System-suggested depart_time** (only `deadline` given, or neither):
   we already build the safety margin (sigma * std + alert_added) into
   the suggested departure, so the user, *if they follow the advice*,
   has that margin by construction. The label therefore reflects the
   alert profile rather than a fixed buffer threshold:
       - any high-severity active alert -> risky
       - moderate-severity AND (high_stakes OR cumulative added_min >= 10) -> risky
       - any active alert (low / moderate, otherwise) -> caution
       - no active alert -> reliable

This fixes the v3 regression where short, alert-free trips
(e.g. JFK -> Campus Center, ~7 min) were always labelled `caution`
because `sigma * std ~= 5 min` is below the 10-minute threshold.
"""

from __future__ import annotations

from ..config import settings
from ..harness.alert_filter import alert_applies_to_plan
from ..harness.time_utils import (
    add_minutes,
    hhmm,
    parse_hhmm,
    subtract_minutes,
)
from ..schemas import RetrievedDoc, RiskAnalysis, RoutePlan, TimeConstraint


def _sigma_from_policy(intent: TimeConstraint, evidence: list[RetrievedDoc]) -> float:
    high = 1.5
    normal = 1.0
    for d in evidence:
        if d.doc.type == "policy" and "sigma" in d.doc.content.lower():
            meta = d.doc.metadata
            high = float(meta.get("high_stakes_sigma", high))
            normal = float(meta.get("default_sigma", normal))
            break
    return high if intent.high_stakes else normal


def _thresholds_from_policy(evidence: list[RetrievedDoc]) -> tuple[float, float]:
    reliable_t = settings.reliable_buffer_min
    risky_t = settings.risky_buffer_min
    for d in evidence:
        if d.doc.type == "policy" and "label" in d.doc.title.lower():
            reliable_t = float(d.doc.metadata.get("reliable_buffer", reliable_t))
            risky_t = float(d.doc.metadata.get("risky_buffer", risky_t))
            break
    return reliable_t, risky_t


def _collect_active_alerts(
    evidence: list[RetrievedDoc],
    plan_routes: set[str],
    intent: TimeConstraint,
) -> tuple[list[str], dict[str, float], set[str]]:
    triggered: list[str] = []
    severity_added: dict[str, float] = {"low": 0.0, "moderate": 0.0, "high": 0.0}
    severities: set[str] = set()
    query_text = (intent.raw_query or "").lower()

    for d in evidence:
        if d.doc.type != "alert":
            continue
        if float(d.doc.metadata.get("added_min", 0)) <= 0:
            continue
        if not alert_applies_to_plan(
            d.doc, plan_routes, query_text, intent.deadline, intent.depart_time,
        ):
            continue
        triggered.append(d.doc.id)
        sev = (d.doc.metadata.get("severity") or "low").lower()
        if sev not in severity_added:
            sev = "low"
        severity_added[sev] += float(d.doc.metadata.get("added_min", 0))
        severities.add(sev)
    return triggered, severity_added, severities


def analyze_risk(
    intent: TimeConstraint,
    plan: RoutePlan,
    evidence: list[RetrievedDoc],
) -> tuple[RiskAnalysis, str | None]:
    sigma_mult = _sigma_from_policy(intent, evidence)
    reliable_thr, risky_thr = _thresholds_from_policy(evidence)

    deadline = parse_hhmm(intent.deadline)
    depart = parse_hhmm(intent.depart_time)

    suggested_depart: str | None = None
    buffer_min = 0.0
    user_chose_depart = deadline is not None and depart is not None

    if user_chose_depart:
        eta = add_minutes(depart, plan.adjusted_total_min)
        delta = (
            (deadline.hour - eta.hour) * 60 + (deadline.minute - eta.minute)
        )
        buffer_min = float(delta)
    elif deadline is not None:
        total_min = plan.adjusted_total_min + sigma_mult * plan.total_std_min
        suggested_depart = hhmm(subtract_minutes(deadline, total_min))
        buffer_min = sigma_mult * plan.total_std_min + plan.total_alert_added_min
    elif depart is not None:
        suggested_depart = hhmm(depart)
        buffer_min = sigma_mult * plan.total_std_min
    else:
        buffer_min = sigma_mult * plan.total_std_min

    plan_routes: set[str] = set()
    for s in plan.segments:
        for r in s.mode.split(","):
            plan_routes.add(r.strip())

    triggered, sev_added, sev_set = _collect_active_alerts(evidence, plan_routes, intent)
    has_high = "high" in sev_set
    has_moderate = "moderate" in sev_set
    has_low = "low" in sev_set
    has_blocking = has_high or has_moderate
    total_alert_added = sum(sev_added.values())

    if user_chose_depart:
        if buffer_min < risky_thr or has_high:
            label = "risky"
        elif (
            has_moderate
            or has_low
            or buffer_min < reliable_thr
        ):
            label = "caution"
        else:
            label = "reliable"
    else:
        if has_high:
            label = "risky"
        elif has_moderate and (intent.high_stakes or total_alert_added >= 10):
            label = "risky"
        elif has_blocking or has_low:
            label = "caution"
        else:
            label = "reliable"

    explanation = (
        f"mode={'user_depart' if user_chose_depart else 'system_depart'}, "
        f"buffer={buffer_min:.1f} min, sigma_mult={sigma_mult}, "
        f"reliable_thr={reliable_thr}, risky_thr={risky_thr}, "
        f"alerts_active={len(triggered)} "
        f"(high={int(has_high)}, mod={int(has_moderate)}, low={int(has_low)}, "
        f"added={total_alert_added:.0f}min)"
    )

    risk = RiskAnalysis(
        label=label,  # type: ignore[arg-type]
        buffer_min=buffer_min,
        sigma_used=sigma_mult,
        explanation=explanation,
        triggered_alerts=triggered,
    )
    return risk, suggested_depart
