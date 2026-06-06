"""WF-03: Website Generator (draft).

Generates SEO + landing copy for a converted lead and stores a draft. Actual deploy (Vercel) is
behind a flag and lands later; this produces the content + record the builder UI consumes.
"""
from __future__ import annotations

from app.core import llm
from app.core.errors import NotFoundError
from app.integrations.supabase import SupabaseREST
from app.schemas.website import GenerateWebsiteRequest, WebsiteSeo


# Maps a lead category to a seeded template id (see templates table in 001_initial_schema.sql).
_TEMPLATE_BY_CATEGORY = {
    "restaurant": "restaurant-01", "cafe": "restaurant-01", "bakery": "restaurant-01",
    "beauty_salon": "salon-01", "spa": "salon-01", "doctor": "clinic-01", "clinic": "clinic-01",
    "dentist": "clinic-01", "gym": "gym-01", "store": "retail-01", "hardware_store": "retail-01",
}


def _default_template(category: str | None) -> str:
    return _TEMPLATE_BY_CATEGORY.get((category or "").lower(), "generic-01")


async def generate_website(db: SupabaseREST, user_id: str, req: GenerateWebsiteRequest) -> dict:
    rows = await db.select("leads", eq={"id": req.lead_id, "user_id": user_id})
    if not rows:
        raise NotFoundError("Lead not found or not owned by this user", code="lead_not_found")
    lead = rows[0]

    prompt = (
        "Write SEO + landing-page copy for a small Indian business getting its first website. "
        "Use a NEIGHBOURING colour-palette tone of the category leader — never copy a brand exactly.\n"
        f"Business: {lead.get('business_name')} | Category: {lead.get('category')} | "
        f"City: {lead.get('city')} | Rating: {lead.get('google_rating') or 'N/A'}."
    )
    seo = await llm.complete_json("bulk", [{"role": "user", "content": prompt}], WebsiteSeo)

    # websites requires business_name + template_id (both NOT NULL in the schema).
    inserted = await db.insert("websites", {
        "lead_id": req.lead_id, "user_id": user_id,
        "template_id": req.template_id or _default_template(lead.get("category")),
        "business_name": lead.get("business_name") or "Business",
        "business_details": {"name": lead.get("business_name"), "category": lead.get("category"),
                             "city": lead.get("city")},
        "content_json": seo.model_dump(), "seo_meta": {"title": seo.title,
                                                       "meta_description": seo.meta_description},
        "status": "draft",
    })
    website_id = inserted[0].get("id") if inserted else None
    return {"success": True, "website_id": website_id, "status": "draft",
            "message": "Website draft generated"}
