"""POST /webhook/send-sms and /webhook/send-whatsapp  (replaces n8n WF-06 / WF-07)."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import SupabaseREST, get_supabase
from app.schemas.messaging import SendMessageResponse, SendSmsRequest, SendWhatsAppRequest
from app.services.messaging import send_sms, send_whatsapp

router = APIRouter(prefix="/webhook", tags=["messaging"])


@router.post("/send-sms", response_model=SendMessageResponse)
async def send_sms_endpoint(
    req: SendSmsRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await send_sms(db, user.id, req)


@router.post("/send-whatsapp", response_model=SendMessageResponse)
async def send_whatsapp_endpoint(
    req: SendWhatsAppRequest,
    user: CurrentUser = Depends(get_current_user),
    db: SupabaseREST = Depends(get_supabase),
) -> dict:
    return await send_whatsapp(db, user.id, req)
