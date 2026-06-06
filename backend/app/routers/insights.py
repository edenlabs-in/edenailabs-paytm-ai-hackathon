"""Net-new intelligence endpoints (not part of the original n8n set).

GET  /insights/next-best-action  — best time, channel, and which leads to focus on today.
POST /insights/retrain-leads     — retrain the lead-scoring model on real outcomes (idempotent).
"""
from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.agents.growth_advisor import generate_analytics_insights, generate_daily_plan
from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.ml import nba
from app.ml.trainer import train_lead_model

router = APIRouter(prefix="/insights", tags=["insights"])


@router.get("/next-best-action")
async def next_best_action_endpoint(
    category: str | None = None,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return {"success": True, **await nba.next_best_action(db, user.id, category)}


@router.post("/retrain-leads")
async def retrain_leads_endpoint(
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    result = await train_lead_model(db)
    return {"success": True, **result}


@router.get("/daily-plan")
async def daily_plan_endpoint(
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    today = datetime.now(timezone.utc).date().isoformat()
    plan = await generate_daily_plan(db, user.id, date=today)
    return {"success": True, "date": today, "plan": plan.model_dump()}


@router.get("/analytics")
async def analytics_endpoint(
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    result = await generate_analytics_insights(db, user.id)
    return {"success": True, **result.model_dump()}
