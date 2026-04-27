"""Run the full evaluation pipeline.

Outputs (to ``data/results/``):
- ``eval_predictions.jsonl``  one record per query with intent / retrieval /
  risk / answer
- ``eval_metrics.json``       aggregate metrics across the three families
- ``EVALUATION_REPORT.md``    human-readable report

Usage:
    python -m ontime_plus.eval.run_eval
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from tqdm import tqdm

from ..config import settings
from ..graph import OnTimeAgent
from .metrics import intent_metrics, retrieval_metrics, risk_metrics


def _load_test(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def run(test_path: Path | None = None, suffix: str = "") -> dict:
    settings.ensure_dirs()
    test_path = test_path or (Path(__file__).resolve().parent / "test_queries.jsonl")
    cases = _load_test(test_path)

    agent = OnTimeAgent()
    suffix = (f"_{suffix.strip('_')}" if suffix else "")

    pred_intents: list[dict] = []
    gold_intents: list[dict] = []
    pred_rankings: list[list[str]] = []
    gold_rankings: list[list[str]] = []
    pred_risks: list[str] = []
    gold_risks: list[str] = []
    rows: list[dict] = []

    for case in tqdm(cases, desc="Evaluating"):
        try:
            resp = agent.ask(case["query"], case.get("schedule"))
        except Exception as e:
            rows.append({"id": case["id"], "error": str(e)})
            continue

        intent_pred = resp.intent.model_dump()
        intent_pred = {
            "origin": intent_pred.get("origin"),
            "destination": intent_pred.get("destination"),
            "deadline": intent_pred.get("deadline"),
            "depart_time": intent_pred.get("depart_time"),
            "high_stakes": bool(intent_pred.get("high_stakes")),
        }
        pred_intents.append(intent_pred)
        gold_intents.append(case["gold_intent"])

        ranking = [r.doc.id for r in resp.retrieved]
        pred_rankings.append(ranking)
        gold_rankings.append(case["gold_relevant_doc_ids"])

        pred_risks.append(resp.answer.risk.label)
        gold_risks.append(case["gold_risk_label"])

        rows.append(
            {
                "id": case["id"],
                "theme": case.get("theme", ""),
                "query": case["query"],
                "intent_pred": intent_pred,
                "intent_gold": case["gold_intent"],
                "retrieved": ranking,
                "gold_relevant_doc_ids": case["gold_relevant_doc_ids"],
                "risk_pred": resp.answer.risk.label,
                "risk_gold": case["gold_risk_label"],
                "buffer_min": resp.answer.risk.buffer_min,
                "suggested_depart": resp.answer.suggested_depart_time,
                "answer": resp.answer.recommendation,
            }
        )

    overall = {
        "intent": intent_metrics(pred_intents, gold_intents) if pred_intents else {},
        "retrieval": retrieval_metrics(pred_rankings, gold_rankings) if pred_rankings else {},
        "risk": risk_metrics(pred_risks, gold_risks) if pred_risks else {},
    }

    # Per-theme breakdown
    themes: dict[str, dict] = {}
    by_theme: dict[str, list[int]] = {}
    for i, r in enumerate(rows):
        if "error" in r:
            continue
        by_theme.setdefault(r["theme"] or "_untagged_", []).append(i)
    for theme, idxs in by_theme.items():
        sub_pred_intents = [pred_intents[j] for j in idxs]
        sub_gold_intents = [gold_intents[j] for j in idxs]
        sub_pred_rank = [pred_rankings[j] for j in idxs]
        sub_gold_rank = [gold_rankings[j] for j in idxs]
        sub_pred_risk = [pred_risks[j] for j in idxs]
        sub_gold_risk = [gold_risks[j] for j in idxs]
        themes[theme] = {
            "n": len(idxs),
            "intent": intent_metrics(sub_pred_intents, sub_gold_intents),
            "retrieval": retrieval_metrics(sub_pred_rank, sub_gold_rank),
            "risk": risk_metrics(sub_pred_risk, sub_gold_risk),
        }

    out = {"overall": overall, "by_theme": themes}

    settings.results_dir.mkdir(parents=True, exist_ok=True)
    with (settings.results_dir / f"eval_predictions{suffix}.jsonl").open("w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    with (settings.results_dir / f"eval_metrics{suffix}.json").open("w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)

    _write_report(out, rows, suffix)
    return out


def _section_intent(label: str, m: dict) -> list[str]:
    if not m:
        return []
    out = [f"### Intent extraction ({label})",
           f"- Exact match: **{m['exact_match']*100:.1f}%**",
           "- Per-slot accuracy:"]
    for slot, acc in m["per_slot_accuracy"].items():
        out.append(f"  - `{slot}`: {acc*100:.1f}%")
    return out


def _section_retrieval(label: str, m: dict) -> list[str]:
    if not m:
        return []
    out = [f"### Retrieval ({label})",
           f"- MRR: **{m['mrr']:.3f}**"]
    for k in (3, 5, 10):
        if f"recall@{k}" in m:
            out.append(
                f"- Recall@{k}: {m[f'recall@{k}']*100:.1f}%   "
                f"Precision@{k}: {m[f'precision@{k}']*100:.1f}%"
            )
    return out


def _section_risk(label: str, m: dict) -> list[str]:
    if not m:
        return []
    out = [f"### Risk labelling ({label})",
           f"- Accuracy: **{m['accuracy']*100:.1f}%**",
           f"- Macro-F1: **{m['f1_macro']:.3f}**",
           "- Per-class F1:"]
    for cls, v in m["f1_per_class"].items():
        out.append(f"  - `{cls}`: {v:.3f}")
    out.append("- Confusion matrix (rows=gold, cols=pred):")
    out.append("")
    out.append("| gold \\ pred | reliable | caution | risky |")
    out.append("|---|---|---|---|")
    for g in ["reliable", "caution", "risky"]:
        row = m["confusion"].get(g, {})
        out.append(
            f"| {g} | {row.get('reliable', 0)} | {row.get('caution', 0)} | {row.get('risky', 0)} |"
        )
    return out


def _write_report(metrics: dict, rows: list[dict], suffix: str = "") -> None:
    overall = metrics.get("overall", {})
    by_theme = metrics.get("by_theme", {})

    lines: list[str] = []
    lines.append("# OnTime+ Evaluation Report")
    lines.append("")
    lines.append(f"Total queries evaluated: **{len(rows)}**")
    if by_theme:
        lines.append("")
        lines.append("Themes (n):  " + " · ".join(f"`{t}`={v['n']}" for t, v in by_theme.items()))
    lines.append("")
    lines.append("## 1. Overall metrics")
    lines.extend(_section_intent("overall", overall.get("intent", {})))
    lines.append("")
    lines.extend(_section_retrieval("overall", overall.get("retrieval", {})))
    lines.append("")
    lines.extend(_section_risk("overall", overall.get("risk", {})))
    lines.append("")

    if by_theme:
        lines.append("## 2. Per-theme breakdown")
        lines.append("")
        lines.append("| theme | n | intent EM | MRR | R@5 | risk acc | risk F1 |")
        lines.append("|---|---|---|---|---|---|---|")
        for t, m in sorted(by_theme.items()):
            lines.append(
                f"| `{t}` | {m['n']} | "
                f"{m['intent']['exact_match']*100:.1f}% | "
                f"{m['retrieval']['mrr']:.3f} | "
                f"{m['retrieval'].get('recall@5', 0)*100:.1f}% | "
                f"{m['risk']['accuracy']*100:.1f}% | "
                f"{m['risk']['f1_macro']:.3f} |"
            )
        lines.append("")
        for t, m in sorted(by_theme.items()):
            lines.append(f"### Theme: `{t}` (n={m['n']})")
            lines.extend(_section_intent(t, m["intent"]))
            lines.extend(_section_retrieval(t, m["retrieval"]))
            lines.extend(_section_risk(t, m["risk"]))
            lines.append("")

    lines.append("## 3. Per-query results")
    lines.append("")
    lines.append("| id | theme | risk_pred / gold | suggested_depart | first answer line |")
    lines.append("|---|---|---|---|---|")
    for r in rows:
        if "error" in r:
            lines.append(f"| {r['id']} | - | ERROR | - | {r['error']} |")
            continue
        first = (r.get("answer") or "").split("\n")[0][:90]
        lines.append(
            f"| {r['id']} | {r.get('theme','')} | {r['risk_pred']} / {r['risk_gold']} | "
            f"{r.get('suggested_depart', '-')} | {first} |"
        )

    out = settings.results_dir / f"EVALUATION_REPORT{suffix}.md"
    out.write_text("\n".join(lines), encoding="utf-8")
    print(f"[eval] Report -> {out}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", type=str, default=None)
    parser.add_argument(
        "--suffix", type=str, default="",
        help="Append to output file names, e.g. 'v2' -> EVALUATION_REPORT_v2.md",
    )
    args = parser.parse_args()
    metrics = run(Path(args.test) if args.test else None, suffix=args.suffix)
    print(json.dumps(metrics, indent=2, ensure_ascii=False))
