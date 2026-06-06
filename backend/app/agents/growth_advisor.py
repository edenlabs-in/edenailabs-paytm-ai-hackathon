"""WF-10 (analytics) + WF-11 (daily action plan) — the 'growth advisor' brain.

Run by the scheduler (Phase 6) and exposable on-demand via /insights. Both methods compute real
metrics first, then ask the LLM to turn numbers into plain, actionable guidance.
"""
from __future__ import annotations

from collections import Counter

from app.core import llm
from app.integrations.supabase import SupabaseREST
from app.ml import nba
from app.schemas.insights import AnalyticsInsights, DailyPlan

# ai_insights.insight_type is a constrained enum; map our finer types onto it.
_PRIORITIES = {"low", "medium", "high", "urgent"}
_INSIGHT_TYPE_MAP = {"pattern": "pattern", "timing": "suggestion", "channel": "suggestion",
                     "lead_focus": "suggestion", "alert": "alert"}


def _insight_type(t: str) -> str:
    return _INSIGHT_TYPE_MAP.get((t or "").lower(), "suggestion")


def _title(t: str) -> str:
    return (t or "insight").replace("_", " ").title()


async def compute_metrics(db: SupabaseREST, user_id: str) -> dict:
    leads = await db.select("leads", eq={"user_id": user_id})
    outreach = await db.select("outreach", eq={"user_id": user_id})
    by_status = Counter(l.get("status") for l in leads)
    total = len(leads)
    clients = by_status.get("client", 0) + by_status.get("delivered", 0)
    sent = sum(1 for o in outreach if o.get("sent"))
    by_channel = Counter(o.get("channel") for o in outreach if o.get("sent"))
    return {
        "total_leads": total,
        "by_status": dict(by_status),
        "contacted": by_status.get("contacted", 0) + by_status.get("interested", 0) + clients,
        "clients": clients,
        "conversion_rate": round(clients / total, 3) if total else 0.0,
        "messages_sent": sent,
        "by_channel": dict(by_channel),
    }


async def generate_analytics_insights(db: SupabaseREST, user_id: str) -> AnalyticsInsights:
    metrics = await compute_metrics(db, user_id)
    prompt = (
        "You are a growth advisor for a solo digital-services hustler in India. Given these metrics, "
        "write a one-line summary and 2-4 concrete, prioritized insights (what's working, what's not, "
        "and the single most useful next move). Be specific and encouraging.\n\n"
        f"METRICS: {metrics}"
    )
    result = await llm.complete_json("analytics", [{"role": "user", "content": prompt}],
                                     AnalyticsInsights)
    rows = [{"user_id": user_id, "insight_type": _insight_type(i.type),
             "title": _title(i.type), "content": i.content,
             "priority": i.priority if i.priority in _PRIORITIES else "medium",
             "is_read": False} for i in result.insights]
    if rows:
        await db.insert("ai_insights", rows, returning=False)
    return result


async def generate_daily_plan(db: SupabaseREST, user_id: str, *, date: str) -> DailyPlan:
    metrics = await compute_metrics(db, user_id)
    actions = await nba.next_best_action(db, user_id)
    prompt = (
        "You are a growth advisor. Turn this into a simple DAILY ACTION PLAN for today — clear tasks, "
        "not data. Tell them exactly what to do: which leads to contact, the offer to run, the best "
        "area, and the ideal time. Keep it short and motivating.\n\n"
        f"METRICS: {metrics}\nNEXT_BEST_ACTION: {actions}"
    )
    plan = await llm.complete_json("analytics", [{"role": "user", "content": prompt}], DailyPlan)
    # daily_plans has UNIQUE(user_id, date) -> upsert so re-running the same day is idempotent.
    await db.upsert("daily_plans", {
        "user_id": user_id, "date": date, "plan_json": plan.model_dump(),
        "focus_area": plan.focus, "best_area": plan.best_area, "best_time": plan.ideal_time,
        "offer_of_the_day": plan.quick_win,
    }, on_conflict="user_id,date", returning=False)
    return plan
