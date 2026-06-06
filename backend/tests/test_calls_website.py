"""WF-08 call logging + WF-03 website draft."""
import pytest

from app.services import website as web_svc
from app.schemas.website import WebsiteSeo


def test_log_call_happy(client, fake_db):
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1"})
    resp = client.post("/webhook/log-call",
                       json={"lead_id": "lead-1", "outcome": "interested", "notes": "keen"})
    assert resp.status_code == 200
    assert fake_db.tables["call_logs"][0]["outcome"] == "interested"
    assert fake_db.tables["activities"][0]["action"] == "call_logged"


def test_log_call_bad_outcome(client, fake_db):
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1"})
    resp = client.post("/webhook/log-call", json={"lead_id": "lead-1", "outcome": "vibes"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "invalid_outcome"


def test_generate_website(client, fake_db, monkeypatch):
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1", "business_name": "Tea Stall",
                           "category": "cafe", "city": "Mumbai"})

    async def fake_json(task, messages, schema, **kw):
        return WebsiteSeo(title="Tea Stall", meta_description="Best chai", headline="Fresh Chai",
                          subheadline="Daily", about="We brew", services=["dine-in"],
                          keywords=["chai", "mumbai"])
    monkeypatch.setattr(web_svc.llm, "complete_json", fake_json)

    resp = client.post("/webhook/generate-website", json={"lead_id": "lead-1"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "draft"
    assert fake_db.tables["websites"][0]["content_json"]["title"] == "Tea Stall"
