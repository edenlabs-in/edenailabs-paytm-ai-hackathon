"""WF-05 agentic strategy researcher: contract, persistence, and the refine loop."""
import app.agents.strategy_researcher as agent
from app.schemas.strategy import (ObjectionHandler, OutreachPlan, RevenueEstimate, ServicePackage,
                                  Strategy)


def make_strategy(complete: bool = True) -> Strategy:
    return Strategy(
        executive_summary="Needs a website to capture local search.",
        pitch_angle="digital visibility" if complete else "",
        competitor_insight="Nearby cafes rank on Google Maps.",
        service_package=ServicePackage(recommended_services=["website", "google_maps"],
                                       starter_price="₹4,999", growth_price="₹9,999", timeline="5 days"),
        outreach_plan=OutreachPlan(best_channel="whatsapp", best_time="2-4 PM",
                                   opening_line="Hi, I noticed you don't have a website yet" if complete else "",
                                   key_talking_points=["found online", "more walk-ins"]),
        objections_and_handlers=([ObjectionHandler(objection="o1", response="r1"),
                                  ObjectionHandler(objection="o2", response="r2")] if complete else []),
        revenue_estimate=RevenueEstimate(initial_deal="₹4,999", recurring_monthly="₹1,000"),
        difficulty_score=3, next_best_action="Send a WhatsApp demo",
    )


async def _no_web(q, **kw):
    return []


def _seed_lead(fake_db):
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1", "business_name": "Corner Cafe",
                           "category": "cafe", "city": "Mumbai", "phone": "9999999999"})


def test_generate_strategy_persists_and_returns(client, fake_db, monkeypatch):
    _seed_lead(fake_db)

    async def fake_json(task, messages, schema, **kw):
        return make_strategy(True)
    monkeypatch.setattr(agent.llm, "complete_json", fake_json)
    monkeypatch.setattr(agent.cse, "search", _no_web)

    resp = client.post("/webhook/generate-strategy", json={"lead_id": "lead-1"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["strategy"]["pitch_angle"] == "digital visibility"

    # strategies row matches the frontend contract
    srow = fake_db.tables["strategies"][0]
    assert srow["pricing_suggestion"] == "₹4,999"
    assert srow["recommended_services"] == ["website", "google_maps"]

    # observability trace logged
    run = fake_db.tables["agent_runs"][0]
    assert run["agent"] == "strategy_researcher"
    assert "iterations" in run["steps"]


def test_agent_refines_until_complete(client, fake_db, monkeypatch):
    _seed_lead(fake_db)
    calls = {"n": 0}

    async def flaky_json(task, messages, schema, **kw):
        calls["n"] += 1
        return make_strategy(complete=calls["n"] >= 2)  # 1st incomplete -> loop -> 2nd complete
    monkeypatch.setattr(agent.llm, "complete_json", flaky_json)
    monkeypatch.setattr(agent.cse, "search", _no_web)

    resp = client.post("/webhook/generate-strategy", json={"lead_id": "lead-1"})
    assert resp.status_code == 200
    assert calls["n"] == 2                                  # it refined once
    assert fake_db.tables["agent_runs"][0]["steps"]["iterations"] == 2


def test_strategy_unknown_lead_404(client, monkeypatch):
    monkeypatch.setattr(agent.cse, "search", _no_web)
    resp = client.post("/webhook/generate-strategy", json={"lead_id": "nope"})
    assert resp.status_code == 404
