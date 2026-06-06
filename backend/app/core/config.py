"""Centralized settings. Reads .env once and exposes a cached `settings` singleton.

All secrets and the task→model routing live here so nothing is hard-coded in services.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Reads the repo-root .env (when run from backend/) first, then an optional backend/.env override.
    model_config = SettingsConfigDict(
        env_file=("../.env", ".env"), env_file_encoding="utf-8", extra="ignore",
        case_sensitive=False,
        protected_namespaces=(),  # allow model_bulk / model_agent / model_analytics field names
    )

    # App
    env: Literal["dev", "prod"] = "dev"
    log_level: str = "INFO"
    cors_origins: str = "*"
    auth_disabled: bool = False

    # Supabase
    supabase_url: str = ""
    # Accept the frontend/Next key names too, so one .env serves everything.
    supabase_anon_key: str = Field("", validation_alias=AliasChoices(
        "supabase_anon_key", "vite_supabase_publishable_key", "next_public_supabase_anon_key"))
    supabase_service_role_key: str = ""
    supabase_jwt_secret: str = ""

    # OpenRouter — also accepts OPENAI_API_KEY / OPENAI_BASE_URL (common OpenRouter-via-OpenAI setup).
    openrouter_api_key: str = Field("", validation_alias=AliasChoices(
        "openrouter_api_key", "openai_api_key"))
    openrouter_base_url: str = Field("https://openrouter.ai/api/v1", validation_alias=AliasChoices(
        "openrouter_base_url", "openai_base_url"))
    openrouter_app_url: str = "https://PAYTM.app"
    openrouter_app_name: str = "PAYTM"

    # Model routing (task → model slug). Defaulting all to Gemini 2.5 Flash Lite — cheap + reliable
    # JSON, good fit for this app. Override any of them per-task via the MODEL_* env vars.
    model_bulk: str = "google/gemini-2.5-flash-lite"
    model_agent: str = "google/gemini-2.5-flash-lite"
    model_analytics: str = "google/gemini-2.5-flash-lite"
    budget_usd_cap: float = 20.0

    # Google
    google_api_key: str = ""
    google_cse_id: str = ""

    # RAG embeddings: "auto" (fastembed if installed, else hashing), "fastembed", or "hashing"
    embedder: str = "auto"

    # Reddit (optional, for the pain-point miner)
    reddit_client_id: str = ""
    reddit_client_secret: str = ""

    # Messaging
    msg91_auth_key: str = ""
    msg91_sender_id: str = ""
    msg91_sms_template_id: str = ""
    gallabox_api_key: str = ""
    gallabox_api_secret: str = ""
    gallabox_channel_id: str = ""

    @property
    def is_prod(self) -> bool:
        return self.env == "prod"

    @property
    def cors_origin_list(self) -> list[str]:
        raw = self.cors_origins.strip()
        if raw == "*" or not raw:
            return ["*"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    def model_for(self, task: Literal["bulk", "agent", "analytics"]) -> str:
        return {
            "bulk": self.model_bulk,
            "agent": self.model_agent,
            "analytics": self.model_analytics,
        }[task]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
