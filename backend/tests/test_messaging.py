"""WF-06/07 messaging: the 'no false success' correctness fix."""
import pytest

from app.core.errors import ProviderError
from app.services import messaging as svc


def _seed_lead(fake_db):
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1", "business_name": "Tea Stall",
                           "phone": "9999999999"})


def test_sms_success_logs_sent(client, fake_db, monkeypatch):
    _seed_lead(fake_db)

    async def ok_send(phone, message, client=None):
        return {"provider_message_id": "MSG123", "delivery_status": "sent"}
    monkeypatch.setattr(svc.msg91, "send_sms", ok_send)

    resp = client.post("/webhook/send-sms", json={"lead_id": "lead-1", "custom_message": "hi"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["delivery_status"] == "sent" and body["provider_message_id"] == "MSG123"
    row = fake_db.tables["outreach"][0]
    assert row["sent"] is True and row["delivery_status"] == "sent"


def test_sms_provider_failure_is_honest(client, fake_db, monkeypatch):
    """If the provider rejects, we must NOT report success — 502 + a 'failed' row, no 'sent' row."""
    _seed_lead(fake_db)

    async def bad_send(phone, message, client=None):
        raise ProviderError("MSG91 rejected", code="sms_rejected")
    monkeypatch.setattr(svc.msg91, "send_sms", bad_send)

    resp = client.post("/webhook/send-sms", json={"lead_id": "lead-1", "custom_message": "hi"})
    assert resp.status_code == 502
    assert resp.json()["success"] is False
    row = fake_db.tables["outreach"][0]
    assert row["sent"] is False and row["delivery_status"] == "failed" and row["error"]


def test_sms_missing_phone(client, fake_db, monkeypatch):
    fake_db.seed("leads", {"id": "lead-2", "user_id": "user-1", "business_name": "No Phone"})
    monkeypatch.setattr(svc.msg91, "send_sms",
                        lambda *a, **k: (_ for _ in ()).throw(AssertionError("should not send")))
    resp = client.post("/webhook/send-sms", json={"lead_id": "lead-2", "custom_message": "hi"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "missing_phone"
