"""POST /webhook/generate-website  (replaces n8n WF-03)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.website import GenerateWebsiteRequest, GenerateWebsiteResponse
from app.services.website import generate_website

router = APIRouter(prefix="/webhook", tags=["website"])


@router.post("/generate-website", response_model=GenerateWebsiteResponse)
async def generate_website_endpoint(
    req: GenerateWebsiteRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await generate_website(db, user.id, req)
