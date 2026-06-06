"""WF-05: AI Strategy. Runs the agentic researcher, saves the strategy (frontend contract) and an
observability trace into agent_runs (with this run's $ cost)."""
from __future__ import annotations

from app.agents.strategy_researcher import run_strategy_agent
from app.core.budget import budget
from app.core.errors import NotFoundError
from app.integrations.supabase import SupabaseREST
from app.schemas.strategy import GenerateStrategyRequest


async def generate_strategy(db: SupabaseREST, user_id: str, req: GenerateStrategyRequest) -> dict:
    rows = await db.select("leads", eq={"id": req.lead_id, "user_id": user_id})
    if not rows:
        raise NotFoundError("Lead not found or not owned by this user", code="lead_not_found")
    lead = rows[0]

    cost_before = budget.spent
    strategy, trace = await run_strategy_agent(db, lead)
    run_cost = round(budget.spent - cost_before, 6)

    content = strategy.model_dump()
    await db.insert("strategies", {
        "lead_id": req.lead_id, "user_id": user_id, "content_json": content,
        "executive_summary": strategy.executive_summary, "pitch_angle": strategy.pitch_angle,
        "recommended_services": strategy.service_package.recommended_services,
        "pricing_suggestion": strategy.service_package.starter_price,
        "difficulty_score": strategy.difficulty_score, "status": "draft",
    }, returning=False)

    await db.insert("agent_runs", {
        "agent": "strategy_researcher", "user_id": user_id, "input": {"lead_id": req.lead_id},
        "steps": trace, "output": content, "cost_usd": run_cost,
    }, returning=False)

    return {"success": True, "strategy": content, "message": "Strategy generated"}
