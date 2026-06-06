"""WF-04: Pipeline Manager.

Updates a lead's stage and writes an activity log entry — but, unlike the n8n version, the update
is scoped to the authenticated user, so you can only move *your own* leads. Also emits the activity
that later feeds the lead-scoring / next-best-action models.
"""
from __future__ import annotations

from app.core.errors import NotFoundError, AppError
from app.integrations.supabase import SupabaseREST
from app.schemas.pipeline import UpdatePipelineRequest, PIPELINE_STAGES


async def update_pipeline(db: SupabaseREST, user_id: str, req: UpdatePipelineRequest) -> dict:
    if not req.stage_is_valid():
        raise AppError(
            f"Invalid stage '{req.new_stage}'. Allowed: {', '.join(PIPELINE_STAGES)}",
            code="invalid_stage",
        )

    patch: dict = {"status": req.new_stage}
    if req.notes is not None:
        patch["notes"] = req.notes

    # Scoped update: id == lead_id AND user_id == caller. Returns [] if the lead isn't theirs.
    updated = await db.update("leads", eq={"id": req.lead_id, "user_id": user_id}, patch=patch)
    if not updated:
        raise NotFoundError("Lead not found or not owned by this user", code="lead_not_found")

    await db.insert(
        "activities",
        {
            "lead_id": req.lead_id,
            "user_id": user_id,
            "action": "pipeline_update",
            "details": f"Stage changed to {req.new_stage}",
        },
        returning=False,
    )

    return {"success": True, "new_stage": req.new_stage, "message": "Pipeline updated"}
