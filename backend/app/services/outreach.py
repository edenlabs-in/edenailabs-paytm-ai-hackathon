"""WF-02: AI Outreach Generator.

Generates 3 channel-specific outreach variants (social-proof / loss-aversion / opportunity) via the
LLM and saves them to `outreach`. Phase 3 enriches the prompt with RAG-retrieved objection handlers
and category pain points; the seam is `_build_messages()`.
"""
from __future__ import annotations

from app.core import llm
from app.core.errors import NotFoundError
from app.integrations.supabase import SupabaseREST
from app.rag import store as rag_store
from app.schemas.outreach import GenerateOutreachRequest, OutreachScripts


async def _fetch_lead(db: SupabaseREST, user_id: str, lead_id: str) -> dict:
    rows = await db.select("leads", eq={"id": lead_id, "user_id": user_id})
    if not rows:
        raise NotFoundError("Lead not found or not owned by this user", code="lead_not_found")
    return rows[0]


def _build_messages(lead: dict, req: GenerateOutreachRequest, kb_context: str = "") -> list[dict]:
    prompt = (
        f"You are an expert business-development copywriter for digital services in India.\n"
        f"Generate EXACTLY 3 different {req.channel.upper()} outreach messages pitching website "
        f"creation to:\n"
        f"- Business: {lead.get('business_name')}\n"
        f"- Category: {lead.get('category') or 'business'}\n"
        f"- City: {lead.get('city') or 'India'}\n"
        f"- Google rating: {lead.get('google_rating') or 'N/A'}\n"
        f"- Currently has NO website.\n"
        f"Language: {req.language}. Tone: {req.tone or 'warm, professional'}.\n"
        f"Use a different angle per variant: (1) social proof, (2) loss aversion, (3) opportunity.\n"
    )
    if kb_context:
        prompt += f"\nGround the messaging in these real insights:\n{kb_context}\n"
    return [{"role": "user", "content": prompt}]


async def generate_outreach(db: SupabaseREST, user_id: str, req: GenerateOutreachRequest) -> dict:
    lead = await _fetch_lead(db, user_id, req.lead_id)

    # RAG: ground the copy in real objection handlers + case studies for this category (best-effort).
    category = lead.get("category") or "local business"
    kb_rows = await rag_store.retrieve(db, f"pitching a website to a {category}", k=4)
    kb_context = rag_store.format_context(kb_rows)

    result = await llm.complete_json("bulk", _build_messages(lead, req, kb_context), OutreachScripts,
                                     temperature=0.8)

    records = [{
        "lead_id": req.lead_id,
        "user_id": user_id,
        "channel": req.channel,
        "content": s.content,
        "language": req.language,
        "variant": s.variant,
        "sent": False,
        "response_status": "pending",
    } for s in result.scripts]
    if records:
        await db.insert("outreach", records, returning=False)

    return {"success": True, "scripts": [s.model_dump() for s in result.scripts]}
