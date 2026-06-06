"""WF-06 / WF-07 messaging schemas."""
from __future__ import annotations

from pydantic import BaseModel


class SendSmsRequest(BaseModel):
    lead_id: str
    phone: str | None = None          # falls back to the lead's stored phone
    custom_message: str | None = None  # falls back to the chosen script
    script_id: str | None = None


class SendWhatsAppRequest(SendSmsRequest):
    include_image: bool = False


class SendMessageResponse(BaseModel):
    success: bool = True
    channel: str
    delivery_status: str               # real status from the provider (e.g. "sent")
    provider_message_id: str | None = None
    message: str = "Message sent"
