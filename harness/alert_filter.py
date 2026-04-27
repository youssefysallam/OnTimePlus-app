"""Unified alert relevance filter.

An alert document is considered "active for this query" iff it passes BOTH
gates:

1. **Activation gate** -- determines whether the alert is *currently* in
   force, based on its declared ``activation`` mode:
     - ``time``     : check ``active_from``/``active_until`` against the
                       query's deadline / depart_time.
     - ``trigger``  : require at least one ``trigger_keywords`` token to
                       appear in the user's free-text query.
     - ``always``   : always in force (e.g. ongoing track work).
   Legacy alerts without an ``activation`` field default to ``always``.

2. **Route gate** -- requires that the alert's route(s) overlap with the
   planned trip's routes, OR that the alert is a wildcard ("*") AND the
   user's query references it (so a system-wide holiday alert applies only
   when the user actually mentioned "holiday").

This single helper replaces the duplicated ad-hoc filtering that previously
lived in ``risk_analyzer.py`` and ``route_estimator.py``, and adds explicit
time-window awareness for the v3 evaluation.
"""

from __future__ import annotations

from datetime import time
from typing import Iterable

from ..schemas import KBDoc
from .time_utils import parse_hhmm


def _split_routes(route_field: str) -> set[str]:
    return {r.strip() for r in (route_field or "").split(",") if r.strip()}


def _time_in_window(t: time, start: time, end: time) -> bool:
    """Inclusive-on-start, exclusive-on-end window check that supports
    windows spanning midnight (e.g. 23:00 -> 01:00)."""
    if start <= end:
        return start <= t < end
    return t >= start or t < end


def _query_time(intent_deadline: str | None, intent_depart: str | None) -> time | None:
    return parse_hhmm(intent_deadline) or parse_hhmm(intent_depart)


def _query_keywords(query_text: str, keywords: Iterable[str]) -> bool:
    q = query_text.lower()
    return any(k.lower() in q for k in keywords if k)


def alert_is_active(
    doc: KBDoc,
    query_text: str,
    deadline: str | None,
    depart_time: str | None,
) -> bool:
    """Activation gate only -- ignores route overlap. Pure on metadata."""
    meta = doc.metadata or {}
    activation = (meta.get("activation") or "always").lower()

    if activation == "always":
        return True

    if activation == "time":
        # Explicit trigger keyword in the query overrides the time window:
        # if the user is *telling us* an alert is happening right now
        # ("there is a disabled train at Copley"), respect that signal even
        # if our scheduled window has already closed.
        triggers = meta.get("trigger_keywords") or []
        if triggers and _query_keywords(query_text, triggers):
            return True
        af = parse_hhmm(meta.get("active_from"))
        au = parse_hhmm(meta.get("active_until"))
        qt = _query_time(deadline, depart_time)
        if af is None or au is None:
            return True
        if qt is None:
            return True
        return _time_in_window(qt, af, au)

    if activation == "trigger":
        triggers = meta.get("trigger_keywords") or []
        if _query_keywords(query_text, triggers):
            return True
        weather = meta.get("weather", "")
        if weather and weather != "n/a" and weather.lower() in query_text.lower():
            return True
        return False

    return True


_FALLBACK_TITLE_KW = (
    "snow", "rain", "wind", "heat", "cold", "holiday",
    "weekend", "signal", "disabled", "detour", "shuttle",
    "delay", "delayed",
)


def alert_applies_to_plan(
    doc: KBDoc,
    plan_routes: set[str],
    query_text: str,
    deadline: str | None,
    depart_time: str | None,
) -> bool:
    """Full check: activation gate + route gate."""
    if not alert_is_active(doc, query_text, deadline, depart_time):
        return False

    alert_routes = _split_routes(doc.route)
    wildcard = "*" in alert_routes

    if plan_routes & alert_routes:
        return True

    if wildcard:
        triggers = (doc.metadata or {}).get("trigger_keywords") or []
        if _query_keywords(query_text, triggers):
            return True
        title_lower = doc.title.lower()
        if any(tok in query_text.lower() and tok in title_lower for tok in _FALLBACK_TITLE_KW):
            return True
        return False

    triggers = (doc.metadata or {}).get("trigger_keywords") or []
    if triggers and _query_keywords(query_text, triggers):
        return True

    return False
