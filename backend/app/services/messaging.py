"""WF-06 / WF-07: SMS & WhatsApp sending.

Correctness fix vs n8n: we only report success when the provider actually accepted the message.
On rejection we log a `failed` outreach row (honest history) and raise a 502 — the UI can no longer
show a green "sent" for a message that never went out.
"""
from __future__ import annotations

from app.core.errors import AppError, NotFoundError, ProviderError
from app.integrations import gallabox, msg91
from app.integrations.supabase import SupabaseREST
from app.schemas.messaging import SendSmsRequest, SendWhatsAppRequest

_DEFAULT_SMS = ("Hi! We help local businesses like yours get found online with a professional "
                "website. Free demo? Reply YES.")
_DEFAULT_WA = ("Hi {name}! 👋 I help local businesses build a professional online presence. "
               "9 in 10 customers search online before visiting — a website brings more walk-ins. "
               "Want a quick demo?")


async def _resolve(db: SupabaseREST, user_id: str, req: SendSmsRequest, default: str) -> tuple[dict, str, str]:
    rows = await db.select("leads", eq={"id": req.lead_id, "user_id": user_id})
    if not rows:
        raise NotFoundError("Lead not found or not owned by this user", code="lead_not_found")
    lead = rows[0]
    phone = req.phone or lead.get("phone")
    if not phone:
        raise AppError("No phone number for this lead", code="missing_phone")

    message = req.custom_message
    if not message and req.script_id:
        scr = await db.select("scripts", eq={"id": req.script_id})
        if scr:
            message = scr[0].get("content")
    if not message:
        message = default.replace("{name}", lead.get("business_name") or "there")
    return lead, phone, message


async def _log(db: SupabaseREST, user_id: str, req: SendSmsRequest, channel: str, message: str,
               *, sent: bool, delivery_status: str, provider_id: str | None = None,
               error: str | None = None):
    # response_status is a constrained enum (no 'failed'); delivery_status is free-text from us.
    response_status = "sent" if sent else "no_response"
    await db.insert("outreach", {
        "lead_id": req.lead_id, "user_id": user_id, "channel": channel, "content": message,
        "sent": sent, "response_status": response_status, "delivery_status": delivery_status,
        "provider_message_id": provider_id, "error": error,
    }, returning=False)


async def send_sms(db: SupabaseREST, user_id: str, req: SendSmsRequest) -> dict:
    _, phone, message = await _resolve(db, user_id, req, _DEFAULT_SMS)
    try:
        result = await msg91.send_sms(phone, message)
    except ProviderError as e:
        await _log(db, user_id, req, "sms", message, sent=False, delivery_status="failed", error=str(e))
        raise
    await _log(db, user_id, req, "sms", message, sent=True, delivery_status=result["delivery_status"],
               provider_id=result.get("provider_message_id"))
    return {"success": True, "channel": "sms", "delivery_status": result["delivery_status"],
            "provider_message_id": result.get("provider_message_id"), "message": "SMS sent"}


async def send_whatsapp(db: SupabaseREST, user_id: str, req: SendWhatsAppRequest) -> dict:
    _, phone, message = await _resolve(db, user_id, req, _DEFAULT_WA)
    try:
        result = await gallabox.send_whatsapp(phone, message,
                                              image_url=None if not req.include_image else None)
    except ProviderError as e:
        await _log(db, user_id, req, "whatsapp", message, sent=False, delivery_status="failed",
                   error=str(e))
        raise
    await _log(db, user_id, req, "whatsapp", message, sent=True,
               delivery_status=result["delivery_status"], provider_id=result.get("provider_message_id"))
    return {"success": True, "channel": "whatsapp", "delivery_status": result["delivery_status"],
            "provider_message_id": result.get("provider_message_id"), "message": "WhatsApp sent"}
