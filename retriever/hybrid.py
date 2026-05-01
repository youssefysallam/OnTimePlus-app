"""Hybrid retriever combining BM25 (lexical) and FAISS (dense) scores.

Why both?
- Vector retrieval handles paraphrasing ("when should I leave?") well.
- BM25 catches exact route names and stop names ("Red Line", "JFK/UMass")
  that dense models sometimes blur.
- Combining them via Reciprocal Rank Fusion (RRF) is robust without needing
  tuning per query.
"""

from __future__ import annotations

import json
import pickle
from pathlib import Path

import faiss
import numpy as np
from rank_bm25 import BM25Okapi

from ..config import settings
from ..ingest.embedder import Embedder, get_embedder
from ..schemas import KBDoc, RetrievedDoc


def _bm25_tokenise(text: str) -> list[str]:
    return [t.lower() for t in text.replace("/", " ").split() if t.strip()]


class HybridRetriever:
    def __init__(self, embedder: Embedder | None = None) -> None:
        self.index_dir: Path = settings.index_dir

        index_path = self.index_dir / "faiss.index"
        docs_path = self.index_dir / "docs.json"
        bm25_path = self.index_dir / "bm25_corpus.pkl"
        if not (index_path.exists() and docs_path.exists() and bm25_path.exists()):
            raise FileNotFoundError(
                f"Indices not found in {self.index_dir}. "
                "Run `python -m ontime_plus.ingest.build_index` first."
            )

        self.faiss_index = faiss.read_index(str(index_path))
        with docs_path.open("r", encoding="utf-8") as f:
            self.docs = [KBDoc(**d) for d in json.load(f)]
        with bm25_path.open("rb") as f:
            payload = pickle.load(f)
        self.bm25 = BM25Okapi(payload["corpus"])
        assert payload["ids"] == [d.id for d in self.docs], "doc/bm25 ordering drift"

        self.embedder = embedder or get_embedder()

    # ------------------------------------------------------------------
    # Single-strategy retrievers (exposed for ablation / debugging)
    # ------------------------------------------------------------------

    def bm25_search(self, query: str, top_k: int) -> list[tuple[int, float]]:
        scores = self.bm25.get_scores(_bm25_tokenise(query))
        idx = np.argsort(-scores)[:top_k]
        return [(int(i), float(scores[i])) for i in idx if scores[i] > 0]

    def vector_search(self, query: str, top_k: int) -> list[tuple[int, float]]:
        vec = self.embedder.embed([query])
        faiss.normalize_L2(vec)
        scores, idx = self.faiss_index.search(vec, top_k)
        return [(int(i), float(s)) for i, s in zip(idx[0], scores[0]) if i != -1]

    # ------------------------------------------------------------------
    # Hybrid via Reciprocal Rank Fusion
    # ------------------------------------------------------------------

    def search(
        self,
        query: str,
        top_k: int | None = None,
        type_filter: list[str] | None = None,
        route_filter: list[str] | None = None,
    ) -> list[RetrievedDoc]:
        top_k = top_k or settings.top_k_final

        bm25 = self.bm25_search(query, settings.top_k_bm25)
        vec = self.vector_search(query, settings.top_k_vector)

        rrf_k = 60
        scores: dict[int, float] = {}
        sources: dict[int, list[str]] = {}
        for rank, (i, _s) in enumerate(bm25):
            scores[i] = scores.get(i, 0.0) + 1.0 / (rrf_k + rank)
            sources.setdefault(i, []).append("bm25")
        for rank, (i, _s) in enumerate(vec):
            scores[i] = scores.get(i, 0.0) + 1.0 / (rrf_k + rank)
            sources.setdefault(i, []).append("vector")

        # Apply query-aware score adjustments BEFORE ranking
        adjusted_scores = {}

        DISRUPTION_KEYWORDS = ["delay", "rain", "snow", "storm"]

        for i, score in scores.items():
            doc = self.docs[i]

            # Boost alerts and priortize delay-specific alerts; penalize non-delay alerts
            if any(k in query.lower() for k in DISRUPTION_KEYWORDS):
                if doc.type == "alert":
                    score += 0.02

                    # Extra boost for specific delay alerts
                    if any(k in doc.id for k in ["signal", "delay", "rain", "snow"]):
                        score += 0.03
                    else:
                        score -= 0.01 # Penalize alerts not about delay (e.g. snow)

                elif doc.type == "stop":
                    score -= 0.01
                
            # Boost shuttle-related results for shuttle queries
            if "shuttle" in query.lower():
                if doc.type in ["shuttle_schedule", "alert"]:
                    score += 0.02

            # Penalize generic alerts for shuttle queries
            if "shuttle" in query.lower():
                if doc.type == "alert":
                    if not any(k in doc.id for k in ["shuttle", "delay", "signal"]):
                        score -= 0.02
            
            adjusted_scores[i] = score

        ranked = sorted(adjusted_scores.items(), key=lambda kv: -kv[1])

        results: list[RetrievedDoc] = []
        for i, score in ranked:
            doc = self.docs[i]

            if type_filter and doc.type not in type_filter:
                continue
            if route_filter:
                doc_routes = {r.strip() for r in doc.route.split(",") if r.strip()}
                if not doc_routes & set(route_filter) and doc.route != "*":
                    continue
            retriever = "hybrid" if len(sources[i]) > 1 else sources[i][0]
            results.append(RetrievedDoc(doc=doc, score=score, retriever=retriever))
            if len(results) >= top_k:
                break
        return results
