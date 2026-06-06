"""Spend tracking + soft budget cap so the $20 OpenRouter credit can't be blown silently.

Cost is read from OpenRouter's `usage` field when present (OpenRouter returns actual USD cost when
the request includes `usage: {include: true}`). Falls back to a tiny price table otherwise. The
running total is process-local; persistence to `agent_runs` is added in Phase 4.
"""
from __future__ import annotations

import logging
import threading

from app.core.config import settings
from app.core.errors import BudgetExceededError

log = logging.getLogger("budget")

# Approx USD per 1M tokens (prompt, completion) — only used when OpenRouter omits cost.
_FALLBACK_PRICES: dict[str, tuple[float, float]] = {
    "deepseek/deepseek-chat": (0.14, 0.28),
    "openai/gpt-4o-mini": (0.15, 0.60),
    "anthropic/claude-3.5-sonnet": (3.0, 15.0),
    "meta-llama/llama-3.1-8b-instruct": (0.02, 0.03),
}


class BudgetTracker:
    def __init__(self, cap_usd: float):
        self._cap = cap_usd
        self._spent = 0.0
        self._lock = threading.Lock()

    @property
    def spent(self) -> float:
        return self._spent

    @property
    def remaining(self) -> float:
        return max(0.0, self._cap - self._spent)

    def check(self) -> None:
        """Call before an LLM request; refuse once the cap is hit."""
        if self._spent >= self._cap:
            raise BudgetExceededError(
                f"OpenRouter budget cap of ${self._cap:.2f} reached (spent ${self._spent:.4f})"
            )

    def record(self, model: str, prompt_tokens: int, completion_tokens: int,
               cost_usd: float | None = None) -> float:
        if cost_usd is None:
            p_in, p_out = _FALLBACK_PRICES.get(model, (0.0, 0.0))
            cost_usd = (prompt_tokens * p_in + completion_tokens * p_out) / 1_000_000
        with self._lock:
            self._spent += cost_usd
        log.info("llm cost model=%s in=%d out=%d cost=$%.5f spent=$%.4f/%.2f",
                 model, prompt_tokens, completion_tokens, cost_usd, self._spent, self._cap)
        return cost_usd


budget = BudgetTracker(settings.budget_usd_cap)
