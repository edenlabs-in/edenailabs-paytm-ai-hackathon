"""POST /webhook/generate-outreach  (replaces n8n WF-02)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.outreach import GenerateOutreachRequest, GenerateOutreachResponse
from app.services.outreach import generate_outreach

router = APIRouter(prefix="/webhook", tags=["outreach"])


@router.post("/generate-outreach", response_model=GenerateOutreachResponse)
async def generate_outreach_endpoint(
    req: GenerateOutreachRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await generate_outreach(db, user.id, req)
