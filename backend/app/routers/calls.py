"""POST /webhook/log-call  (replaces n8n WF-08)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.calls import LogCallRequest, LogCallResponse
from app.services.calls import log_call

router = APIRouter(prefix="/webhook", tags=["calls"])


@router.post("/log-call", response_model=LogCallResponse)
async def log_call_endpoint(
    req: LogCallRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await log_call(db, user.id, req)
