"""Document chunker.

Most KB items in OnTime+ are short (1-3 sentences) and already represent a
coherent unit of knowledge, so the default behaviour is a pass-through.
For longer-form sources you may add later (e.g. PDF dumps), use
``split_long_documents`` to break them into ~400-token windows.
"""

from __future__ import annotations

from ..schemas import KBDoc


def split_long_documents(
    docs: list[KBDoc], max_chars: int = 1200, overlap: int = 150
) -> list[KBDoc]:
    out: list[KBDoc] = []
    for d in docs:
        if len(d.content) <= max_chars:
            out.append(d)
            continue
        text = d.content
        start = 0
        idx = 0
        while start < len(text):
            end = min(len(text), start + max_chars)
            chunk_text = text[start:end]
            chunk = KBDoc(
                id=f"{d.id}__chunk{idx}",
                type=d.type,
                route=d.route,
                title=d.title,
                content=chunk_text,
                metadata={**d.metadata, "parent_id": d.id, "chunk_index": idx},
                source=d.source,
            )
            out.append(chunk)
            idx += 1
            if end == len(text):
                break
            start = end - overlap
    return out
