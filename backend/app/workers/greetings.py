"""Feature 8: holiday greeting scheduler.

On a schedule, finds upcoming Indian festivals and queues a greeting card per contact. Cards are
created in 'scheduled' state; the messaging worker (or a future job) sends them on the day via
WhatsApp. Dates are explicit (festivals move yearly), so callers pass `today` — no hidden clock.
"""
from __future__ import annotations

from app.integrations.supabase import SupabaseREST

# Major Indian festivals for 2026 (ISO date, name). Extend yearly.
HOLIDAYS_2026: list[tuple[str, str]] = [
    ("2026-01-14", "Makar Sankranti / Pongal"),
    ("2026-01-26", "Republic Day"),
    ("2026-03-04", "Holi"),
    ("2026-03-21", "Eid al-Fitr"),
    ("2026-08-15", "Independence Day"),
    ("2026-08-26", "Raksha Bandhan"),
    ("2026-09-14", "Ganesh Chaturthi"),
    ("2026-10-20", "Dussehra"),
    ("2026-11-08", "Diwali"),
    ("2026-12-25", "Christmas"),
]


def upcoming_holidays(today: str, *, within_days: int = 30) -> list[tuple[str, str]]:
    """Holidays whose date is in [today, today+within_days]. String compare works for ISO dates."""
    from datetime import date, timedelta
    start = date.fromisoformat(today)
    end = (start + timedelta(days=within_days)).isoformat()
    return [(d, n) for d, n in HOLIDAYS_2026 if today <= d <= end]


async def schedule_greetings(db: SupabaseREST, user_id: str, today: str, *, within_days: int = 30) -> int:
    """For each upcoming holiday, ensure one greeting_card (per user) and one greeting_schedule row
    per CRM contact. Matches the 002 schema (cards + per-contact schedule). Idempotent: skips holidays
    and (card, contact) pairs that already exist. Returns the number of per-contact sends scheduled.
    """
    holidays = upcoming_holidays(today, within_days=within_days)
    if not holidays:
        return 0
    contacts = await db.select("crm_contacts", eq={"user_id": user_id})
    if not contacts:
        return 0

    existing_cards = await db.select("greeting_cards", eq={"user_id": user_id})
    card_by_date = {str(c.get("holiday_date")): c for c in existing_cards}

    scheduled = 0
    for hol_date, hol_name in holidays:
        card = card_by_date.get(hol_date)
        if card is None:
            created = await db.insert("greeting_cards", {
                "user_id": user_id, "holiday_name": hol_name, "holiday_date": hol_date,
                "message": f"Happy {hol_name}! 🎉", "status": "scheduled",
            })
            card = created[0]
            card_by_date[hol_date] = card

        already = await db.select("greeting_schedule", eq={"card_id": card.get("id")})
        seen_contacts = {s.get("contact_id") for s in already}
        rows = [{
            "card_id": card.get("id"), "contact_id": c.get("id"), "channel": "whatsapp",
            "scheduled_at": hol_date, "status": "pending",
        } for c in contacts if c.get("id") not in seen_contacts]
        if rows:
            await db.insert("greeting_schedule", rows, returning=False)
            scheduled += len(rows)
    return scheduled
