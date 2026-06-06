"""POST /webhook/generate-strategy  (replaces n8n WF-05 with the agentic researcher)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.strategy import GenerateStrategyRequest, GenerateStrategyResponse
from app.services.strategy import generate_strategy

router = APIRouter(prefix="/webhook", tags=["strategy"])


@router.post("/generate-strategy", response_model=GenerateStrategyResponse)
async def generate_strategy_endpoint(
    req: GenerateStrategyRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await generate_strategy(db, user.id, req)
