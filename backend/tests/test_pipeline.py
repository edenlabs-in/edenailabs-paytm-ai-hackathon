"""WF-04 contract + security-fix tests."""


def _seed_lead(fake_db, lead_id="lead-1", owner="user-1"):
    fake_db.seed("leads", {"id": lead_id, "user_id": owner, "status": "new",
                           "business_name": "Test Biz"})


def test_update_pipeline_happy_path(client, fake_db):
    _seed_lead(fake_db)
    resp = client.post("/webhook/update-pipeline",
                       json={"lead_id": "lead-1", "new_stage": "contacted", "notes": "called"})
    assert resp.status_code == 200
    body = resp.json()
    # Contract the frontend reads: {success, new_stage, message}
    assert body == {"success": True, "new_stage": "contacted", "message": "Pipeline updated"}
    # Lead moved + activity logged
    assert fake_db.tables["leads"][0]["status"] == "contacted"
    assert fake_db.tables["activities"][0]["action"] == "pipeline_update"


def test_invalid_stage_rejected(client, fake_db):
    _seed_lead(fake_db)
    resp = client.post("/webhook/update-pipeline",
                       json={"lead_id": "lead-1", "new_stage": "banana"})
    assert resp.status_code == 400
    assert resp.json()["error"]["code"] == "invalid_stage"


def test_cannot_move_another_users_lead(client, fake_db):
    """Security fix: body can't override identity — caller (user-1) can't touch user-2's lead."""
    _seed_lead(fake_db, lead_id="lead-2", owner="user-2")
    resp = client.post("/webhook/update-pipeline",
                       json={"lead_id": "lead-2", "new_stage": "client"})
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "lead_not_found"
    # Untouched
    assert fake_db.tables["leads"][0]["status"] == "new"
