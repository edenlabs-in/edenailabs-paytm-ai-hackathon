"""Liveness + readiness."""
from __future__ import annotations

from fastapi import APIRouter

from app import __version__
from app.core.budget import budget
from app.core.config import settings

router = APIRouter(tags=["meta"])


@router.get("/health")
async def health() -> dict:
    return {
        "status": "ok",
        "version": __version__,
        "env": settings.env,
        "budget": {"spent_usd": round(budget.spent, 4), "remaining_usd": round(budget.remaining, 2)},
    }
