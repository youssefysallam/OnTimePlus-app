"""Evaluation metrics for OnTime+.

Three families of metrics, mirroring the three reasoning steps:

1. Intent extraction (slot-level F1 + exact-match)
2. Retrieval (Recall@k, Precision@k, MRR)
3. Risk labelling (accuracy + macro-F1 + confusion matrix)
"""

from __future__ import annotations

from collections import Counter
from typing import Sequence

from sklearn.metrics import f1_score


def _norm(x: str | None) -> str:
    return (x or "").strip().lower()


# ---------- 1. Intent ----------

INTENT_SLOTS = ["origin", "destination", "deadline", "depart_time", "high_stakes"]


def intent_metrics(preds: list[dict], golds: list[dict]) -> dict:
    assert len(preds) == len(golds)
    per_slot_correct: dict[str, int] = {s: 0 for s in INTENT_SLOTS}
    full_match = 0
    for p, g in zip(preds, golds):
        all_ok = True
        for slot in INTENT_SLOTS:
            pv = p.get(slot)
            gv = g.get(slot)
            if isinstance(gv, bool) or isinstance(pv, bool):
                ok = bool(pv) == bool(gv)
            else:
                ok = _norm(pv) == _norm(gv) if gv is not None else (pv is None or _norm(pv) == "")
            if ok:
                per_slot_correct[slot] += 1
            else:
                all_ok = False
        if all_ok:
            full_match += 1

    n = len(preds)
    return {
        "n": n,
        "exact_match": full_match / max(1, n),
        "per_slot_accuracy": {s: per_slot_correct[s] / max(1, n) for s in INTENT_SLOTS},
    }


# ---------- 2. Retrieval ----------

def _rank_of(target: str, ranked_ids: Sequence[str]) -> int | None:
    for i, rid in enumerate(ranked_ids):
        if rid == target:
            return i + 1
    return None


def retrieval_metrics(
    preds: list[list[str]],          # ranked list of doc ids per query
    golds: list[list[str]],          # set of relevant doc ids per query
    ks: Sequence[int] = (3, 5, 10),
) -> dict:
    n = len(preds)
    out = {"n": n}

    for k in ks:
        recalls = []
        precisions = []
        for ranked, gold in zip(preds, golds):
            top = ranked[:k]
            if not gold:
                continue
            hits = sum(1 for g in gold if g in top)
            recalls.append(hits / len(gold))
            precisions.append(hits / max(1, len(top)))
        out[f"recall@{k}"] = sum(recalls) / max(1, len(recalls))
        out[f"precision@{k}"] = sum(precisions) / max(1, len(precisions))

    rrs = []
    for ranked, gold in zip(preds, golds):
        if not gold:
            continue
        ranks = [r for r in (_rank_of(g, ranked) for g in gold) if r is not None]
        rrs.append(1.0 / min(ranks) if ranks else 0.0)
    out["mrr"] = sum(rrs) / max(1, len(rrs))
    return out


# ---------- 3. Risk labelling ----------

RISK_LABELS = ["reliable", "caution", "risky"]


def risk_metrics(preds: list[str], golds: list[str]) -> dict:
    assert len(preds) == len(golds)
    n = len(preds)
    correct = sum(1 for p, g in zip(preds, golds) if p == g)
    accuracy = correct / max(1, n)

    f1_macro = f1_score(golds, preds, labels=RISK_LABELS, average="macro", zero_division=0)
    f1_per_class = f1_score(
        golds, preds, labels=RISK_LABELS, average=None, zero_division=0
    )

    confusion: dict[str, dict[str, int]] = {g: {p: 0 for p in RISK_LABELS} for g in RISK_LABELS}
    for g, p in zip(golds, preds):
        if g in confusion and p in confusion[g]:
            confusion[g][p] += 1

    return {
        "n": n,
        "accuracy": accuracy,
        "f1_macro": float(f1_macro),
        "f1_per_class": {lbl: float(v) for lbl, v in zip(RISK_LABELS, f1_per_class)},
        "confusion": confusion,
        "support": dict(Counter(golds)),
    }
