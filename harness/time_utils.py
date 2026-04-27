"""Time helpers used by the route estimator and risk analyser."""

from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Literal


def parse_hhmm(s: str | None) -> time | None:
    if not s:
        return None
    try:
        return datetime.strptime(s.strip(), "%H:%M").time()
    except ValueError:
        try:
            return datetime.strptime(s.strip(), "%I:%M %p").time()
        except ValueError:
            return None


def hhmm(t: time) -> str:
    return t.strftime("%H:%M")


def is_peak(t: time) -> bool:
    morning = time(7, 0) <= t < time(9, 30)
    evening = time(16, 30) <= t < time(19, 0)
    return morning or evening


def time_window(t: time) -> Literal["peak", "offpeak"]:
    return "peak" if is_peak(t) else "offpeak"


def add_minutes(t: time, minutes: float) -> time:
    base = datetime.combine(datetime.today(), t)
    return (base + timedelta(minutes=minutes)).time()


def subtract_minutes(t: time, minutes: float) -> time:
    base = datetime.combine(datetime.today(), t)
    return (base - timedelta(minutes=minutes)).time()
