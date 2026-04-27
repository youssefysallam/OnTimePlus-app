"""Load every JSONL file under ``data/raw`` and ``data/simulated`` into
``KBDoc`` objects so downstream modules can ignore on-disk layout.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable

from ..config import settings
from ..schemas import KBDoc


def _iter_jsonl(path: Path) -> Iterable[dict]:
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            yield json.loads(line)


def load_kb(extra_dirs: list[Path] | None = None) -> list[KBDoc]:
    dirs = [settings.raw_dir, settings.simulated_dir]
    if extra_dirs:
        dirs.extend(extra_dirs)

    docs: list[KBDoc] = []
    seen_ids: set[str] = set()
    for d in dirs:
        if not d.exists():
            continue
        for jsonl_file in sorted(d.glob("*.jsonl")):
            for record in _iter_jsonl(jsonl_file):
                doc = KBDoc(**record)
                if doc.id in seen_ids:
                    raise ValueError(
                        f"Duplicate KB document id={doc.id} in {jsonl_file}"
                    )
                seen_ids.add(doc.id)
                docs.append(doc)
    return docs


if __name__ == "__main__":
    kb = load_kb()
    print(f"Loaded {len(kb)} KB documents")
    counts: dict[str, int] = {}
    for d in kb:
        counts[d.type] = counts.get(d.type, 0) + 1
    for k, v in sorted(counts.items()):
        print(f"  {k:18s}: {v}")
