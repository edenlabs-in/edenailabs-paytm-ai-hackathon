"""Phase 5 learned lead scoring: trains on outcomes, then scoring uses the model."""
from app.ml import lead_scoring
from app.ml.trainer import train_lead_model


def _seed_outcomes(fake_db):
    # 15 "good" leads that converted, 15 "bad" that were lost — clean separable signal.
    for i in range(15):
        fake_db.seed("leads", {"id": f"g{i}", "user_id": "user-1", "category": "cafe",
                               "google_rating": 4.4, "userRatingCount": 120, "phone": "9999999999",
                               "status": "client"})
    for i in range(15):
        fake_db.seed("leads", {"id": f"b{i}", "user_id": "user-1", "category": "school",
                               "google_rating": 2.5, "userRatingCount": 3, "phone": "",
                               "status": "lost"})


async def test_train_then_score_uses_model(fake_db):
    _seed_outcomes(fake_db)
    res = await train_lead_model(fake_db)
    assert res["trained"] is True and res["samples"] == 30

    scored = lead_scoring.score_lead(category="cafe", rating=4.5, rating_count=150, has_phone=True)
    assert "model_probability" in scored.factors        # came from the model, not the heuristic
    assert 0 <= scored.score <= 100


async def test_insufficient_data_keeps_heuristic(fake_db):
    fake_db.seed("leads", {"id": "x", "user_id": "user-1", "status": "new", "category": "cafe"})
    res = await train_lead_model(fake_db)
    assert res["trained"] is False

    scored = lead_scoring.score_lead(category="cafe", rating=4.2, rating_count=50, has_phone=True)
    assert "category" in scored.factors                 # heuristic breakdown
