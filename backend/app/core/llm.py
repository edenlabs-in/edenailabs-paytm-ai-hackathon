"""OpenRouter LLM gateway with task→model routing and structured-output helpers.

Every LLM call in the codebase goes through here, so model choice, cost tracking, and the budget
cap are enforced in one place. OpenRouter is OpenAI-API-compatible, so we use the official SDK
pointed at the OpenRouter base URL.
"""
from __future__ import annotations

import json
import logging
from typing import Any, Literal, TypeVar

from openai import AsyncOpenAI
from pydantic import BaseModel, ValidationError

from app.core.budget import budget
from app.core.config import settings
from app.core.errors import ProviderError

log = logging.getLogger("llm")

Task = Literal["bulk", "agent", "analytics"]
T = TypeVar("T", bound=BaseModel)

_client: AsyncOpenAI | None = None


def get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not settings.openrouter_api_key:
            raise ProviderError("OPENROUTER_API_KEY not set", code="llm_unconfigured", status_code=500)
        _client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url=settings.openrouter_base_url,
            default_headers={
                "HTTP-Referer": settings.openrouter_app_url,
                "X-Title": settings.openrouter_app_name,
            },
        )
    return _client


def _record_usage(model: str, resp: Any) -> None:
    usage = getattr(resp, "usage", None)
    if not usage:
        return
    # OpenRouter returns real cost in usage.cost when available.
    cost = getattr(usage, "cost", None)
    if cost is None and isinstance(usage, dict):
        cost = usage.get("cost")
    budget.record(
        model,
        getattr(usage, "prompt_tokens", 0) or 0,
        getattr(usage, "completion_tokens", 0) or 0,
        cost_usd=cost,
    )


async def complete(task: Task, messages: list[dict[str, str]], *, temperature: float = 0.7,
                   max_tokens: int = 1024, model: str | None = None) -> str:
    """Plain text completion. Returns the assistant message content."""
    budget.check()
    model = model or settings.model_for(task)
    try:
        resp = await get_client().chat.completions.create(
            model=model, messages=messages, temperature=temperature, max_tokens=max_tokens,
            extra_body={"usage": {"include": True}},
        )
    except Exception as e:  # openai.APIError and friends
        raise ProviderError(f"OpenRouter call failed: {e}", code="llm_error") from e
    _record_usage(model, resp)
    return (resp.choices[0].message.content or "").strip()


async def complete_json(task: Task, messages: list[dict[str, str]], schema: type[T], *,
                        temperature: float = 0.4, max_tokens: int = 2048,
                        model: str | None = None) -> T:
    """JSON-mode completion validated into a Pydantic model. Retries once on parse/validation error."""
    budget.check()
    model = model or settings.model_for(task)
    sys_hint = {
        "role": "system",
        "content": (
            "Respond ONLY with a single valid JSON object matching this schema (no markdown, no prose):\n"
            + json.dumps(schema.model_json_schema())
        ),
    }
    convo = [sys_hint, *messages]
    last_err: Exception | None = None
    for attempt in range(2):
        try:
            resp = await get_client().chat.completions.create(
                model=model, messages=convo, temperature=temperature, max_tokens=max_tokens,
                response_format={"type": "json_object"},
                extra_body={"usage": {"include": True}},
            )
        except Exception as e:
            raise ProviderError(f"OpenRouter call failed: {e}", code="llm_error") from e
        _record_usage(model, resp)
        raw = (resp.choices[0].message.content or "").strip()
        try:
            return schema.model_validate_json(raw)
        except (ValidationError, json.JSONDecodeError) as e:
            last_err = e
            log.warning("JSON validation failed (attempt %d): %s", attempt + 1, e)
            convo.append({"role": "assistant", "content": raw})
            convo.append({"role": "user",
                          "content": f"That did not validate ({e}). Return corrected JSON only."})
    raise ProviderError(f"LLM did not return schema-valid JSON: {last_err}", code="llm_bad_json")
