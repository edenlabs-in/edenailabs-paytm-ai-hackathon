"""Gallabox WhatsApp client. Returns a real provider message id + status, or raises ProviderError."""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.core.errors import ProviderError

_ENDPOINT = "https://server.gallabox.com/devapi/messages/whatsapp"


async def send_whatsapp(phone: str, message: str, *, image_url: str | None = None,
                        client: httpx.AsyncClient | None = None) -> dict:
    if not settings.gallabox_api_key or not settings.gallabox_channel_id:
        raise ProviderError("Gallabox not configured (API key / channel id missing)",
                            code="whatsapp_unconfigured", status_code=500)

    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 10:
        digits = "91" + digits

    own = client is None
    client = client or httpx.AsyncClient(timeout=20.0)
    payload: dict = {
        "channelId": settings.gallabox_channel_id,
        "channelType": "whatsapp",
        "recipient": {"phone": digits},
        "whatsapp": {"type": "text", "text": {"body": message}},
    }
    if image_url:
        payload["whatsapp"] = {"type": "image",
                               "image": {"link": image_url, "caption": message}}
    try:
        resp = await client.post(_ENDPOINT, json=payload,
                                 headers={"apiKey": settings.gallabox_api_key,
                                          "apiSecret": settings.gallabox_api_secret,
                                          "Content-Type": "application/json"})
    except httpx.HTTPError as e:
        raise ProviderError(f"Gallabox unreachable: {e}", code="whatsapp_error") from e
    finally:
        if own:
            await client.aclose()

    if resp.status_code >= 400:
        raise ProviderError(f"Gallabox rejected the message: {resp.text[:200]}",
                            code="whatsapp_rejected", details={"status": resp.status_code})
    data = resp.json() if resp.content else {}
    return {"provider_message_id": data.get("id") or data.get("messageId"),
            "delivery_status": "sent"}
