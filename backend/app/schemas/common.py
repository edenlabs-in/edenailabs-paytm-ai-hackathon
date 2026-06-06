"""Shared response helpers. Mirrors the envelope the frontend `n8n.ts` already expects."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class Ok(BaseModel):
    """Generic success envelope; endpoints extend it with their own fields."""
    success: bool = True
    message: str | None = None


def ok(**fields: Any) -> dict[str, Any]:
    return {"success": True, **fields}
