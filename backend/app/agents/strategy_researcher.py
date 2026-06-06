"""WF-05 upgrade: an agentic strategy researcher built on LangGraph.

Instead of n8n's single Gemini call, this runs a small agent loop:

    gather_evidence ─► synthesize ─► critique ─┬─(incomplete & < max)─► gather_evidence (refined)
                                               └─(complete or capped)─► END

`gather_evidence` uses two tools — RAG over the knowledge base and Google CSE for live competitor
research — so the resulting `Strategy` is grounded in real evidence. Orchestration is deterministic
(we drive the tools) for reliability across the cheaper OpenRouter models, while still expressing the
plan-act-reflect loop as a graph.
"""
from __future__ import annotations

import logging
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.core import llm
from app.integrations import cse
from app.integrations.supabase import SupabaseREST
from app.rag import store as rag_store
from app.schemas.strategy import Strategy

log = logging.getLogger("agent.strategy")

MAX_ITERATIONS = 2


class AgentState(TypedDict, total=False):
    lead: dict
    evidence: list[str]
    strategy: Strategy | None
    iterations: int
    refine_query: str | None


def _build_prompt(lead: dict, evidence: list[str]) -> str:
    ev = "\n".join(f"- {e}" for e in evidence) or "- (no external context available)"
    return (
        "You are a PAYTM merchant-growth strategist (relationship manager) for the Indian market. "
        "Create a concrete plan to (1) get this merchant to COMPLETE their KYC and become RBI-compliant, "
        "and (2) cross-sell PAYTM ecosystem products at a premium discount, matched to their likely "
        "transaction profile (pay-in / pay-out). Products to draw from: KYC completion, Postpaid/BNPL, "
        "merchant credit line / working-capital loan, higher transaction limits, merchant insurance, and "
        "a PAYTM-ecosystem merchant rating (a Paytm-only CIBIL-style score). Anchor everything to a "
        "30-day completion deadline from first contact. Use INR.\n\n"
        f"MERCHANT:\n- Name: {lead.get('business_name')}\n- Category: {lead.get('category')}\n"
        f"- City: {lead.get('city')}\n- Rating: {lead.get('google_rating') or 'N/A'}\n"
        f"- Phone on file: {'yes' if lead.get('phone') else 'no'}\n\n"
        f"CONTEXT/EVIDENCE:\n{ev}\n\n"
        "Return a complete strategy, mapping fields like this:\n"
        "- pitch_angle = the KYC-completion + cross-sell angle.\n"
        "- competitor_insight = what similar merchants gain from being KYC-compliant + using these products.\n"
        "- service_package.recommended_services = the specific PAYTM products to offer THIS merchant; "
        "starter_price/growth_price = the incentive/offer (e.g. '0% processing fee for 3 months', "
        "'₹50,000 instant credit line'); timeline = '30 days'.\n"
        "- outreach_plan = best channel + best time (PREFER the merchant's business DOWN-TIME), an exact "
        "opening_line, and key_talking_points.\n"
        "- objections_and_handlers = at least 2 (e.g. 'KYC takes too long', 'why share my documents').\n"
        "- revenue_estimate = value to PAYTM (cross-sell revenue + GMV / float).\n"
        "- difficulty_score (1-5) and the single next_best_action."
    )


def _make_gather(db: SupabaseREST):
    async def gather_evidence(state: AgentState) -> dict:
        lead = state["lead"]
        category = lead.get("category") or "local business"
        city = lead.get("city") or "India"
        query = state.get("refine_query") or f"pitching a website to a {category}"

        kb_rows = await rag_store.retrieve(db, query, k=4)
        competitors = await cse.search(f"{category} in {city} website")

        evidence = list(state.get("evidence", []))
        evidence += [f"KB ({r.get('kind')}): {r.get('content')}" for r in kb_rows]
        evidence += [f"WEB: {c['title']} — {c['snippet']}" for c in competitors[:3]]
        return {"evidence": evidence, "iterations": state.get("iterations", 0) + 1}

    return gather_evidence


async def _synthesize(state: AgentState) -> dict:
    prompt = _build_prompt(state["lead"], state.get("evidence", []))
    strategy = await llm.complete_json("agent", [{"role": "user", "content": prompt}], Strategy,
                                       temperature=0.5, max_tokens=2048)
    return {"strategy": strategy}


async def _critique(state: AgentState) -> dict:
    strategy = state.get("strategy")
    if strategy and not strategy.is_complete():
        cat = state["lead"].get("category") or "local business"
        log.info("strategy incomplete — refining (iteration %d)", state.get("iterations", 0))
        return {"refine_query": f"objection handling and a strong opening line for a {cat}"}
    return {}


def _route_after_critique(state: AgentState) -> str:
    strategy = state.get("strategy")
    if (strategy and strategy.is_complete()) or state.get("iterations", 0) >= MAX_ITERATIONS:
        return "done"
    return "refine"


def _build_graph(db: SupabaseREST):
    g = StateGraph(AgentState)
    g.add_node("gather", _make_gather(db))
    g.add_node("synthesize", _synthesize)
    g.add_node("critique", _critique)
    g.set_entry_point("gather")
    g.add_edge("gather", "synthesize")
    g.add_edge("synthesize", "critique")
    g.add_conditional_edges("critique", _route_after_critique, {"refine": "gather", "done": END})
    return g.compile()


async def run_strategy_agent(db: SupabaseREST, lead: dict) -> tuple[Strategy, dict]:
    """Returns (strategy, trace). `trace` is persisted to agent_runs for observability."""
    graph = _build_graph(db)
    final: AgentState = await graph.ainvoke(
        {"lead": lead, "evidence": [], "strategy": None, "iterations": 0, "refine_query": None}
    )
    trace = {"iterations": final.get("iterations", 0),
             "evidence_count": len(final.get("evidence", [])),
             "evidence": final.get("evidence", [])}
    return final["strategy"], trace
