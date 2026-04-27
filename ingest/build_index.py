"""Build FAISS + BM25 indices from the JSONL knowledge base.

Usage:
    python -m ontime_plus.ingest.build_index
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path

import faiss
import numpy as np

from ..config import settings
from ..schemas import KBDoc
from .chunker import split_long_documents
from .embedder import get_embedder
from .loader import load_kb


def _doc_to_text(doc: KBDoc) -> str:
    """Compose the text we embed and BM25-tokenise.

    We deliberately concatenate title, route and content so route names and
    stop names show up in lexical (BM25) matching even if they are not in the
    free-form content field.
    """
    parts = []
    if doc.title:
        parts.append(doc.title)
    if doc.route:
        parts.append(f"route={doc.route}")
    parts.append(doc.content)
    return " | ".join(parts)


def _bm25_tokenise(text: str) -> list[str]:
    return [t.lower() for t in text.replace("/", " ").split() if t.strip()]


def build_index() -> None:
    settings.ensure_dirs()
    docs = split_long_documents(load_kb())
    if not docs:
        raise RuntimeError("No KB documents found. Did you populate data/raw and data/simulated?")

    texts = [_doc_to_text(d) for d in docs]

    embedder = get_embedder()
    embed_id = (
        settings.openai_embed_model
        if embedder.name == "openai"
        else settings.local_embed_model
    )
    print(f"[index] Embedding {len(texts)} docs with {embedder.name}::{embed_id} ...")
    vectors = embedder.embed(texts)
    faiss.normalize_L2(vectors)

    dim = vectors.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)
    faiss.write_index(index, str(settings.index_dir / "faiss.index"))

    bm25_corpus = [_bm25_tokenise(t) for t in texts]

    docs_payload = [d.model_dump() for d in docs]
    with (settings.index_dir / "docs.json").open("w", encoding="utf-8") as f:
        json.dump(docs_payload, f, ensure_ascii=False, indent=2)
    with (settings.index_dir / "bm25_corpus.pkl").open("wb") as f:
        pickle.dump({"corpus": bm25_corpus, "ids": [d.id for d in docs]}, f)
    np.save(settings.index_dir / "embeddings.npy", vectors)

    meta = {
        "n_docs": len(docs),
        "embedding_provider": embedder.name,
        "embedding_model": embed_id,
        "dim": dim,
    }
    with (settings.index_dir / "index_meta.json").open("w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    print(f"[index] Wrote FAISS + BM25 indices to {settings.index_dir}")
    print(f"[index] Meta: {meta}")


if __name__ == "__main__":
    build_index()
