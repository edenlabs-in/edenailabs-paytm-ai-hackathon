"""Predictive next-best-action — learns simple patterns from a user's own history, with sensible
cold-start defaults. Powers the analytics + daily-plan workers (Phase 6) and the /insights endpoint.
"""
from __future__ import annotations

from collections import defaultdict

from app.integrations.supabase import SupabaseREST

_POSITIVE_CALL = {"answered", "interested", "callback"}
_ACTIVE = {"new", "contacted", "interested"}

# Cold-start best-time windows by category (used until enough call data accumulates).
_DEFAULT_WINDOW = {
    "restaurant": "2:00–4:00 PM", "cafe": "2:00–4:00 PM", "bakery": "11:00 AM–1:00 PM",
    "beauty_salon": "11:00 AM–1:00 PM", "gym": "6:00–8:00 PM", "doctor": "10:00 AM–12:00 PM",
}
_DEFAULT_WINDOW_FALLBACK = "11:00 AM–1:00 PM"


def _hour_of(ts: str | None) -> int | None:
    if not ts or len(ts) < 13:
        return None
    try:
        return int(ts[11:13])
    except ValueError:
        return None


async def best_time_to_contact(db: SupabaseREST, user_id: str, category: str | None = None) -> dict:
    logs = await db.select("call_logs", eq={"user_id": user_id})
    by_hour_pos: dict[int, int] = defaultdict(int)
    by_hour_total: dict[int, int] = defaultdict(int)
    for log in logs:
        h = _hour_of(log.get("called_at"))
        if h is None:
            continue
        by_hour_total[h] += 1
        if log.get("outcome") in _POSITIVE_CALL:
            by_hour_pos[h] += 1

    # Need a few data points before trusting the learned window.
    if sum(by_hour_total.values()) >= 8 and by_hour_pos:
        best_h = max(by_hour_pos, key=lambda h: by_hour_pos[h] / max(by_hour_total[h], 1))
        return {"window": f"{best_h:02d}:00–{(best_h + 2) % 24:02d}:00", "based_on": "your call history"}

    cat = (category or "").lower()
    return {"window": _DEFAULT_WINDOW.get(cat, _DEFAULT_WINDOW_FALLBACK), "based_on": "category default"}


async def recommend_channel(db: SupabaseREST, user_id: str) -> dict:
    rows = await db.select("outreach", eq={"user_id": user_id})
    sent: dict[str, int] = defaultdict(int)
    good: dict[str, int] = defaultdict(int)
    for r in rows:
        ch = r.get("channel")
        if not ch:
            continue
        sent[ch] += 1
        if r.get("response_status") in {"replied", "read", "delivered", "sent"}:
            good[ch] += 1

    if sum(sent.values()) >= 5:
        best = max(sent, key=lambda c: good[c] / max(sent[c], 1))
        return {"channel": best, "based_on": "your response rates"}
    return {"channel": "whatsapp", "based_on": "default"}


async def rank_focus_leads(db: SupabaseREST, user_id: str, n: int = 5) -> list[dict]:
    leads = await db.select("leads", eq={"user_id": user_id})
    active = [l for l in leads if l.get("status") in _ACTIVE]
    active.sort(key=lambda l: (l.get("score") or l.get("priority") or 0), reverse=True)
    return [{"id": l.get("id"), "business_name": l.get("business_name"),
             "score": l.get("score") or l.get("priority") or 0, "status": l.get("status")}
            for l in active[:n]]


async def next_best_action(db: SupabaseREST, user_id: str, category: str | None = None) -> dict:
    return {
        "best_time": await best_time_to_contact(db, user_id, category),
        "recommended_channel": await recommend_channel(db, user_id),
        "focus_leads": await rank_focus_leads(db, user_id),
    }
