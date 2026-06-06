"""WF-01 discovery: no-website filter, scoring, dedup, contract shape."""
import pytest

from app.services import discovery as svc


@pytest.fixture
def patch_places(monkeypatch):
    async def fake_geocode(pin, client=None):
        return (19.0, 72.8)

    async def fake_search(lat, lng, t, r, client=None, max_results=20):
        return [
            {"id": "p1", "displayName": {"text": "Corner Tea Stall"}, "types": ["cafe"],
             "nationalPhoneNumber": "9999999999", "rating": 4.2, "userRatingCount": 50,
             "formattedAddress": "Andheri", "googleMapsUri": "http://maps/p1"},
            {"id": "p2", "displayName": {"text": "Already Online"}, "types": ["restaurant"],
             "websiteUri": "https://hassite.example"},  # filtered out
        ]

    monkeypatch.setattr(svc.geocode, "geocode_pin", fake_geocode)
    monkeypatch.setattr(svc.places, "search_nearby", fake_search)


def test_discovery_filters_and_scores(client, fake_db, patch_places):
    resp = client.post("/webhook/discover-leads",
                       json={"pin_code": "400053", "business_types": ["cafe"]})
    assert resp.status_code == 200
    body = resp.json()
    assert body["leads_count"] == 1          # only the no-website business
    lead = fake_db.tables["leads"][0]
    assert lead["google_place_id"] == "p1"
    assert lead["has_website"] is False
    assert 0 <= lead["score"] <= 100
    assert "category" in lead["score_factors"]


def test_discovery_dedups_on_rerun(client, fake_db, patch_places):
    client.post("/webhook/discover-leads", json={"pin_code": "400053", "business_types": ["cafe"]})
    client.post("/webhook/discover-leads", json={"pin_code": "400053", "business_types": ["cafe"]})
    assert len(fake_db.tables["leads"]) == 1  # upsert on (user_id, google_place_id)


def test_discovery_rejects_bad_pin(client, patch_places):
    resp = client.post("/webhook/discover-leads", json={"pin_code": "abc"})
    assert resp.status_code == 422  # pydantic validation
