"""Thin LLM client used by every reasoning node.

Wrapping the OpenAI SDK behind a small interface lets us:
- swap in a local model later (set ``USE_LOCAL_LLM=true``);
- mock the LLM cleanly in tests;
- inject schema-enforced JSON output for structured nodes.
"""

from __future__ import annotations

import json
import os
from typing import Any

from ..config import settings


class LLMClient:
    def __init__(self, model: str | None = None, base_url: str | None = None) -> None:
        from openai import OpenAI

        api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY", "")
        if not api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Copy `.env.example` to `.env` and add your key."
            )
        kwargs = {"api_key": api_key}
        bu = base_url or settings.openai_base_url
        if bu:
            kwargs["base_url"] = bu
        self.client = OpenAI(**kwargs)
        self.model = model or settings.openai_model

    def chat(
        self,
        system: str,
        user: str,
        temperature: float = 0.2,
        max_tokens: int = 800,
    ) -> str:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return resp.choices[0].message.content or ""

    def chat_json(
        self,
        system: str,
        user: str,
        temperature: float = 0.0,
        max_tokens: int = 800,
    ) -> dict[str, Any]:
        resp = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},
        )
        text = resp.choices[0].message.content or "{}"
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"_raw": text, "_error": "json_decode_failed"}
