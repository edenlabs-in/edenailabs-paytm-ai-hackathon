"""WF-02 outreach: 3 variants generated + saved, contract shape."""
import pytest

from app.services import outreach as svc
from app.schemas.outreach import OutreachScript, OutreachScripts


@pytest.fixture
def patch_llm(monkeypatch):
    async def fake_json(task, messages, schema, **kw):
        return OutreachScripts(scripts=[
            OutreachScript(variant=1, angle="social proof", content="msg1"),
            OutreachScript(variant=2, angle="loss aversion", content="msg2"),
            OutreachScript(variant=3, angle="opportunity", content="msg3"),
        ])
    monkeypatch.setattr(svc.llm, "complete_json", fake_json)


def test_generate_outreach(client, fake_db, patch_llm):
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1", "business_name": "Tea Stall",
                           "category": "cafe", "city": "Mumbai"})
    resp = client.post("/webhook/generate-outreach",
                       json={"lead_id": "lead-1", "channel": "whatsapp"})
    assert resp.status_code == 200
    scripts = resp.json()["scripts"]
    assert len(scripts) == 3 and scripts[0]["content"] == "msg1"
    assert len(fake_db.tables["outreach"]) == 3
    assert all(r["sent"] is False for r in fake_db.tables["outreach"])


def test_outreach_unknown_lead_404(client, patch_llm):
    resp = client.post("/webhook/generate-outreach", json={"lead_id": "nope", "channel": "sms"})
    assert resp.status_code == 404
