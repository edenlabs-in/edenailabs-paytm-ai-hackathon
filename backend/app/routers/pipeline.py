"""POST /webhook/update-pipeline  (replaces n8n WF-04, identical path & response shape)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.pipeline import UpdatePipelineRequest, UpdatePipelineResponse
from app.services.pipeline import update_pipeline

router = APIRouter(prefix="/webhook", tags=["pipeline"])


@router.post("/update-pipeline", response_model=UpdatePipelineResponse)
async def update_pipeline_endpoint(
    req: UpdatePipelineRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await update_pipeline(db, user.id, req)
