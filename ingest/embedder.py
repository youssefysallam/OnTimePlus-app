"""Embedding helpers.

Two backends are supported:

* ``OpenAIEmbedder`` - uses any OpenAI-compatible chat endpoint that exposes
  ``/embeddings`` (the real OpenAI API does; OpenRouter does not).
* ``LocalEmbedder`` - runs a sentence-transformers model on CPU. This is the
  fallback when the user's chat provider (e.g. OpenRouter) lacks embeddings.

The ``get_embedder()`` factory reads ``settings.embedding_provider`` so the
rest of the codebase never has to care which backend is in use.
"""

from __future__ import annotations

import os
from typing import Protocol, Sequence

import numpy as np

from ..config import settings


class Embedder(Protocol):
    name: str
    dim: int

    def embed(self, texts: Sequence[str], batch_size: int = 64) -> np.ndarray: ...


class OpenAIEmbedder:
    name = "openai"

    def __init__(
        self,
        model: str | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
    ) -> None:
        from openai import OpenAI

        key = api_key or settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
        if not key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Copy `.env.example` to `.env` and add your key."
            )
        kwargs = {"api_key": key}
        bu = base_url or settings.openai_base_url
        if bu:
            kwargs["base_url"] = bu
        self.client = OpenAI(**kwargs)
        self.model = model or settings.openai_embed_model

    def embed(self, texts: Sequence[str], batch_size: int = 64) -> np.ndarray:
        all_vectors: list[list[float]] = []
        texts = list(texts)
        for start in range(0, len(texts), batch_size):
            batch = texts[start : start + batch_size]
            resp = self.client.embeddings.create(model=self.model, input=batch)
            all_vectors.extend([d.embedding for d in resp.data])
        return np.asarray(all_vectors, dtype="float32")

    @property
    def dim(self) -> int:
        if "small" in self.model:
            return 1536
        if "large" in self.model:
            return 3072
        return self.embed(["dim probe"]).shape[1]


class LocalEmbedder:
    """Sentence-transformers embedder. Loads the model lazily."""

    name = "sentence_transformers"

    def __init__(self, model_name: str | None = None) -> None:
        self.model_name = model_name or settings.local_embed_model
        self._model = None

    def _ensure_model(self):
        if self._model is None:
            from sentence_transformers import SentenceTransformer

            self._model = SentenceTransformer(self.model_name)
        return self._model

    def embed(self, texts: Sequence[str], batch_size: int = 64) -> np.ndarray:
        m = self._ensure_model()
        emb = m.encode(
            list(texts),
            batch_size=batch_size,
            show_progress_bar=False,
            convert_to_numpy=True,
            normalize_embeddings=False,
        )
        return np.asarray(emb, dtype="float32")

    @property
    def dim(self) -> int:
        m = self._ensure_model()
        return int(m.get_sentence_embedding_dimension())


def get_embedder() -> Embedder:
    """Factory based on ``settings.embedding_provider``."""
    if settings.embedding_provider == "sentence_transformers":
        return LocalEmbedder()
    return OpenAIEmbedder()
