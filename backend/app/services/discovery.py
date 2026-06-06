"""WF-01: Lead Discovery.

Pipeline: geocode PIN → Google Places nearby → keep only businesses WITHOUT a website → score each
→ dedup-upsert into `leads` scoped to the user. Upgrades over n8n: explainable lead scoring and
idempotent dedup on (user_id, google_place_id) so re-running a PIN won't create duplicates.
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.integrations import geocode, places
from app.integrations.supabase import SupabaseREST
from app.ml.lead_scoring import score_lead
from app.schemas.discovery import DiscoverLeadsRequest

# Demo sample businesses (used when GOOGLE_API_KEY isn't set) — realistic local Indian shops with no
# website, so the full Discover → Strategy → Outreach → Pipeline flow is demoable with zero API keys.
_DEMO_NAMES: dict[str, list[str]] = {
    "restaurant": ["Sharma Bhojnalaya", "Andheri Spice Kitchen", "Gokul Veg Corner",
                   "Tandoori Nights", "Madras Tiffin House", "Punjab Da Dhaba"],
    "cafe": ["Chai Sutta Adda", "Brew & Bites", "Coffee Katta", "Sunrise Cafe"],
    "beauty_salon": ["Glow Beauty Studio", "Style Lounge", "Sparsh Salon", "Trendz Unisex"],
    "doctor": ["City Care Clinic", "Aarogya Polyclinic", "LifeLine Medical"],
    "gym": ["Iron Paradise Gym", "FitZone Fitness", "Muscle Factory"],
    "store": ["Verma General Store", "Daily Needs Mart", "Apna Kirana"],
    "hardware_store": ["Shree Hardware", "Buildwell Traders", "Patel Hardware"],
    "pharmacy": ["Wellness Pharmacy", "Apollo Chemist", "MedPlus Corner"],
}
_DEMO_RATINGS = [4.5, 3.8, 4.2, 3.5, 4.7, 4.0]


def _demo_places(req: DiscoverLeadsRequest) -> list[dict]:
    cat = req.primary_type
    names = _DEMO_NAMES.get(cat, ["Local Business A", "Local Business B", "Local Business C",
                                  "Local Business D"])
    out = []
    for i, name in enumerate(names):
        out.append({
            "id": f"demo-{req.pin_code}-{cat}-{i}",          # deterministic -> dedups on re-run
            "displayName": {"text": name},
            "types": [cat],
            "nationalPhoneNumber": f"+91 9{req.pin_code}{i:02d}0",
            "rating": _DEMO_RATINGS[i % len(_DEMO_RATINGS)],
            "userRatingCount": 20 + i * 17,
            "formattedAddress": f"Shop {i + 1}, Near {req.pin_code}, India",
            "googleMapsUri": "https://maps.google.com",
            # no websiteUri -> qualifies as a lead
        })
    return out


async def discover_leads(db: SupabaseREST, user_id: str, req: DiscoverLeadsRequest) -> dict:
    if settings.google_api_key:
        async with httpx.AsyncClient(timeout=30.0) as http:
            lat, lng = await geocode.geocode_pin(req.pin_code, client=http)
            found = await places.search_nearby(
                lat, lng, req.included_types, int(req.radius_km * 1000), client=http
            )
    else:
        found = _demo_places(req)   # demo mode: no Google key needed

    # Keep only no-website businesses — the entire product wedge.
    no_site = [p for p in found if not p.get("websiteUri")]
    saturation = len(no_site)

    rows: list[dict] = []
    for p in no_site:
        name = (p.get("displayName") or {}).get("text") or "Unknown"
        category = (p.get("types") or ["general"])[0]
        phone = p.get("nationalPhoneNumber") or ""
        rating = p.get("rating")
        result = score_lead(category=category, rating=rating,
                            rating_count=p.get("userRatingCount"),
                            area_saturation=saturation, has_phone=bool(phone))
        rows.append({
            "user_id": user_id,
            "business_name": name,
            "category": category,
            "address": p.get("formattedAddress") or "",
            "city": req.city or "",
            "pin_code": req.pin_code,
            "phone": phone,
            "google_rating": rating,
            "google_place_id": p.get("id") or "",
            "google_maps_url": p.get("googleMapsUri") or "",
            "has_website": False,
            "source": "google_places" if settings.google_api_key else "demo",
            "status": "new",
            # leads.priority has CHECK BETWEEN 0 AND 5, so bucket the 0-100 score into it;
            # the full score lives in the dedicated `score` column.
            "priority": max(0, min(5, round(result.score / 20))),
            "score": result.score,
            "score_factors": result.factors,
        })

    inserted = rows
    if rows:
        # App-level dedup: skip places this user already has. (The partial unique index can't be used
        # by ON CONFLICT, so we filter in code — and this avoids 23505 errors on repeat searches.)
        existing = await db.select("leads", eq={"user_id": user_id}, select="google_place_id")
        have = {e.get("google_place_id") for e in existing}
        inserted = [r for r in rows if r["google_place_id"] and r["google_place_id"] not in have]
        if inserted:
            await db.insert("leads", inserted, returning=False)

    return {"success": True, "leads_count": len(inserted),
            "message": (f"{len(inserted)} new businesses added to your pipeline" if inserted
                        else "These businesses are already in your pipeline")}
