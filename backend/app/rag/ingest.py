"""Seed the knowledge base.

Curated objection-handling bank + case studies that the outreach and strategy agents retrieve from.
The Reddit pain-point miner (Phase 6) appends to the same `kb_documents` table with kind='pain_point'.

Run as a script:  python -m app.rag.ingest
"""
from __future__ import annotations

import asyncio
import logging

from app.integrations.supabase import close_supabase, get_supabase
from app.rag.store import upsert_documents

log = logging.getLogger("rag.ingest")

# kind='objection' — common B.O pushbacks + a proven response.
OBJECTIONS: list[dict] = [
    {"content": "Objection: 'I don't need a website, my customers come from word of mouth.' "
                "Response: Word of mouth now happens online — 9 in 10 customers Google a place before "
                "visiting. A simple website + Google profile makes you the one they find and trust.",
     "metadata": {"category": "general"}},
    {"content": "Objection: 'It's too expensive.' Response: It's the price of a few days' sales, one "
                "time. We start at a starter package and you can grow later — most clients recover the "
                "cost within the first month from new walk-ins.",
     "metadata": {"category": "general"}},
    {"content": "Objection: 'I tried online before and it didn't work.' Response: Most cheap sites are "
                "just brochures. We focus on getting you found on Google Maps and search for your area, "
                "which is what actually drives footfall for local businesses.",
     "metadata": {"category": "general"}},
    {"content": "Objection: 'I don't have time for this.' Response: That's exactly why we do it for you "
                "— you share a few photos and details once, we handle the rest and keep it updated.",
     "metadata": {"category": "general"}},
    {"content": "Objection (restaurant): 'People already know my food.' Response: New residents and "
                "office crowds don't yet — a website with your menu, timings and photos captures the "
                "Zomato/Google searches you're invisible to today.",
     "metadata": {"category": "restaurant"}},
    {"content": "Objection (salon/clinic): 'Bookings come by phone.' Response: Online booking reduces "
                "no-shows and captures customers who search at 11pm. We add a simple WhatsApp/booking "
                "button so you never miss an enquiry.",
     "metadata": {"category": "beauty_salon"}},
]

# kind='case_study' — short, credible local wins (set realistic expectations: organic, not overnight).
CASE_STUDIES: list[dict] = [
    {"content": "A family-run South Indian restaurant in Andheri added a website + Google profile with "
                "menu and photos. Over 3 months, weekday lunch orders from nearby offices rose ~25% as "
                "they started appearing in 'restaurants near me' searches.",
     "metadata": {"category": "restaurant", "platform": "google"}},
    {"content": "A neighbourhood salon posted before/after reels on Instagram and linked them to a "
                "one-page booking site. Consistent weekly posting (not one viral hit) grew bookings "
                "steadily over 4 months — proof that organic growth compounds, it isn't overnight.",
     "metadata": {"category": "beauty_salon", "platform": "instagram"}},
    {"content": "A hardware store created a simple catalogue website with WhatsApp enquiry. Contractors "
                "started checking stock online before driving over, lifting bulk orders and cutting "
                "wasted trips.",
     "metadata": {"category": "hardware_store", "platform": "whatsapp"}},
]


async def seed_knowledge_base(db=None) -> int:
    db = db or get_supabase()
    docs = ([{"kind": "objection", **o} for o in OBJECTIONS]
            + [{"kind": "case_study", **c} for c in CASE_STUDIES])
    n = await upsert_documents(db, docs)
    log.info("Seeded %d knowledge-base documents", n)
    return n


async def _main() -> None:
    logging.basicConfig(level="INFO")
    try:
        n = await seed_knowledge_base()
        print(f"Seeded {n} documents into kb_documents")
    finally:
        await close_supabase()


if __name__ == "__main__":
    asyncio.run(_main())
