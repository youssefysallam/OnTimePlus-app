"""Centralised configuration for OnTime+.

All paths are absolute and resolved against the project root so the package
works the same whether you launch it from CLI, FastAPI, Streamlit, or tests.
"""

from __future__ import annotations

from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

PROJECT_ROOT = Path(__file__).resolve().parent


def _resolve_path(value: str | Path) -> Path:
    """Resolve relative paths against PROJECT_ROOT.

    This avoids the trap of `.env` containing ``ONTIME_DATA_DIR=./data`` and
    breaking whenever the process is launched from a different working dir
    (e.g. running pytest from the repo root vs. from inside ontime_plus/).
    """
    p = Path(value)
    if not p.is_absolute():
        p = (PROJECT_ROOT / p).resolve()
    return p


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_base_url: str = Field(default="", alias="OPENAI_BASE_URL")
    openai_model: str = Field(default="gpt-4o-mini", alias="OPENAI_MODEL")
    openai_embed_model: str = Field(
        default="text-embedding-3-small", alias="OPENAI_EMBED_MODEL"
    )

    # "openai" or "sentence_transformers" - lets us run with providers
    # (e.g. OpenRouter) that do not expose an embeddings endpoint.
    embedding_provider: Literal["openai", "sentence_transformers"] = Field(
        default="openai", alias="EMBEDDING_PROVIDER"
    )
    local_embed_model: str = Field(
        default="BAAI/bge-small-en-v1.5", alias="LOCAL_EMBED_MODEL"
    )

    use_local_llm: bool = Field(default=False, alias="USE_LOCAL_LLM")

    api_host: str = Field(default="127.0.0.1", alias="API_HOST")
    api_port: int = Field(default=8000, alias="API_PORT")

    data_dir: Path = Field(default=PROJECT_ROOT / "data", alias="ONTIME_DATA_DIR")
    index_dir: Path = Field(
        default=PROJECT_ROOT / "data" / "index", alias="ONTIME_INDEX_DIR"
    )

    @field_validator("data_dir", "index_dir", "eval_dir", mode="before")
    @classmethod
    def _coerce_paths(cls, v):
        return _resolve_path(v) if v is not None else v

    # Retrieval hyperparameters
    top_k_bm25: int = 8
    top_k_vector: int = 8
    top_k_final: int = 6

    # Risk-analysis thresholds (in minutes)
    reliable_buffer_min: float = 10.0  # buffer >= 10 min and no alert -> reliable
    risky_buffer_min: float = 3.0      # buffer < 3 min  -> risky regardless of alert

    # Evaluation
    eval_dir: Path = Field(default=PROJECT_ROOT / "eval")

    @property
    def kb_dir(self) -> Path:
        return self.data_dir / "kb"

    @property
    def raw_dir(self) -> Path:
        return self.data_dir / "raw"

    @property
    def simulated_dir(self) -> Path:
        return self.data_dir / "simulated"

    @property
    def results_dir(self) -> Path:
        return self.data_dir / "results"

    def ensure_dirs(self) -> None:
        for p in [
            self.data_dir,
            self.index_dir,
            self.kb_dir,
            self.raw_dir,
            self.simulated_dir,
            self.results_dir,
        ]:
            p.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()


RiskLabel = Literal["reliable", "risky", "unknown"]
