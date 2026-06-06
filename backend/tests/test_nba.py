"""Phase 5 next-best-action: best time, channel, focus ranking, and the /insights endpoint."""
from app.ml import nba


async def test_best_time_falls_back_to_category_default(fake_db):
    out = await nba.best_time_to_contact(fake_db, "user-1", "restaurant")
    assert out["based_on"] == "category default"
    assert "PM" in out["window"]


async def test_best_time_learned_from_history(fake_db):
    # 8 calls at 14:00, all positive -> learned window should center on 14:00.
    for i in range(8):
        fake_db.seed("call_logs", {"user_id": "user-1", "outcome": "interested",
                                   "called_at": "2026-06-06T14:30:00Z"})
    out = await nba.best_time_to_contact(fake_db, "user-1")
    assert out["based_on"] == "your call history"
    assert out["window"].startswith("14:00")


async def test_recommend_channel_defaults_whatsapp(fake_db):
    out = await nba.recommend_channel(fake_db, "user-1")
    assert out["channel"] == "whatsapp"


async def test_focus_ranking_sorts_active_by_score(fake_db):
    fake_db.seed("leads", {"id": "a", "user_id": "user-1", "status": "new", "score": 40,
                           "business_name": "A"})
    fake_db.seed("leads", {"id": "b", "user_id": "user-1", "status": "contacted", "score": 90,
                           "business_name": "B"})
    fake_db.seed("leads", {"id": "c", "user_id": "user-1", "status": "lost", "score": 99,
                           "business_name": "C"})  # excluded (not active)
    focus = await nba.rank_focus_leads(fake_db, "user-1")
    assert [l["id"] for l in focus] == ["b", "a"]


def test_next_best_action_endpoint(client, fake_db):
    resp = client.get("/insights/next-best-action?category=cafe")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert "best_time" in body and "recommended_channel" in body and "focus_leads" in body
