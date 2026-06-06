"""WF-08: Call Log Manager. Records call outcomes — feeds the best-time-to-contact model (Phase 5)."""
from __future__ import annotations

from app.core.errors import AppError, NotFoundError
from app.integrations.supabase import SupabaseREST
from app.schemas.calls import LogCallRequest, CALL_OUTCOMES


async def log_call(db: SupabaseREST, user_id: str, req: LogCallRequest) -> dict:
    if not req.outcome_is_valid():
        raise AppError(f"Invalid outcome. Allowed: {', '.join(CALL_OUTCOMES)}", code="invalid_outcome")

    owned = await db.select("leads", eq={"id": req.lead_id, "user_id": user_id}, select="id")
    if not owned:
        raise NotFoundError("Lead not found or not owned by this user", code="lead_not_found")

    await db.insert("call_logs", {
        "lead_id": req.lead_id, "user_id": user_id, "script_id": req.script_id,
        "outcome": req.outcome, "duration_seconds": req.duration_seconds,
        "notes": req.notes, "follow_up_date": req.follow_up_date,
    }, returning=False)

    await db.insert("activities", {
        "lead_id": req.lead_id, "user_id": user_id, "action": "call_logged",
        "details": f"Call outcome: {req.outcome}",
    }, returning=False)

    return {"success": True, "message": "Call logged"}
