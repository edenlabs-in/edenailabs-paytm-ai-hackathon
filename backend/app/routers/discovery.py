"""POST /webhook/discover-leads  (replaces n8n WF-01)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.discovery import DiscoverLeadsRequest, DiscoverLeadsResponse
from app.services.discovery import discover_leads

router = APIRouter(prefix="/webhook", tags=["discovery"])


@router.post("/discover-leads", response_model=DiscoverLeadsResponse)
async def discover_leads_endpoint(
    req: DiscoverLeadsRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await discover_leads(db, user.id, req)
