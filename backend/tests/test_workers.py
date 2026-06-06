"""Phase 6: growth advisor (analytics + daily plan), greetings, scheduler wiring, reddit skip."""
import app.agents.growth_advisor as ga
from app.schemas.insights import AnalyticsInsights, DailyPlan, Insight
from app.workers.greetings import schedule_greetings, upcoming_holidays
from app.workers.scheduler import build_scheduler
from app.rag.reddit_miner import mine_pain_points


def _patch_growth_llm(monkeypatch):
    async def fake_json(task, messages, schema, **kw):
        if schema is DailyPlan:
            return DailyPlan(focus="Restaurant outreach", tasks=["Call A", "WhatsApp B"],
                             best_area="Andheri West", ideal_time="2-4 PM", quick_win="Post a reel")
        return AnalyticsInsights(summary="Steady progress",
                                 insights=[Insight(type="timing", content="WhatsApp converts best",
                                                   priority="high")])
    monkeypatch.setattr(ga.llm, "complete_json", fake_json)


def test_daily_plan_endpoint(client, fake_db, monkeypatch):
    _patch_growth_llm(monkeypatch)
    fake_db.seed("leads", {"id": "l1", "user_id": "user-1", "status": "new", "score": 80,
                           "business_name": "Cafe"})
    resp = client.get("/insights/daily-plan")
    assert resp.status_code == 200
    body = resp.json()
    assert body["plan"]["focus"] == "Restaurant outreach"
    assert len(fake_db.tables["daily_plans"]) == 1


def test_analytics_endpoint_writes_insights(client, fake_db, monkeypatch):
    _patch_growth_llm(monkeypatch)
    fake_db.seed("leads", {"id": "l1", "user_id": "user-1", "status": "client"})
    resp = client.get("/insights/analytics")
    assert resp.status_code == 200
    assert resp.json()["summary"] == "Steady progress"
    assert len(fake_db.tables["ai_insights"]) == 1


def test_upcoming_holidays_window():
    hols = upcoming_holidays("2026-11-01", within_days=30)
    names = [n for _, n in hols]
    assert any("Diwali" in n for n in names)
    assert not any("Christmas" in n for n in names)   # Dec 25 is outside the 30-day window


async def test_greetings_scheduled_and_idempotent(fake_db):
    fake_db.seed("crm_contacts", {"id": "c1", "user_id": "user-1", "name": "Ravi"})
    fake_db.seed("crm_contacts", {"id": "c2", "user_id": "user-1", "name": "Sita"})
    n1 = await schedule_greetings(fake_db, "user-1", "2026-11-01")
    assert n1 == 2                                     # one per-contact send for Diwali
    assert len(fake_db.tables["greeting_cards"]) == 1   # single card for the holiday
    assert len(fake_db.tables["greeting_schedule"]) == 2
    n2 = await schedule_greetings(fake_db, "user-1", "2026-11-01")
    assert n2 == 0                                     # already scheduled -> no duplicates


def test_scheduler_has_expected_jobs():
    sched = build_scheduler()
    assert {j.id for j in sched.get_jobs()} == {"retrain_leads", "daily_growth", "mine_pain_points"}


async def test_reddit_miner_skips_without_creds(fake_db):
    assert await mine_pain_points(fake_db) == 0
