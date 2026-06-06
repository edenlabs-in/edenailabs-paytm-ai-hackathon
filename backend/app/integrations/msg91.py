"""MSG91 SMS client. Returns a real provider message id + status, or raises ProviderError.

This is the core of the "no false success" fix: the caller only logs `sent` when MSG91 actually
accepted the message (HTTP 2xx + type != error).
"""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.core.errors import ProviderError

_ENDPOINT = "https://control.msg91.com/api/v5/flow/"


async def send_sms(phone: str, message: str, *, client: httpx.AsyncClient | None = None) -> dict:
    if not settings.msg91_auth_key:
        raise ProviderError("MSG91 not configured (MSG91_AUTH_KEY missing)",
                            code="sms_unconfigured", status_code=500)

    # MSG91 expects E.164-ish digits; assume Indian numbers, strip non-digits, prefix 91.
    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 10:
        digits = "91" + digits

    own = client is None
    client = client or httpx.AsyncClient(timeout=20.0)
    payload = {
        "template_id": settings.msg91_sms_template_id,
        "sender": settings.msg91_sender_id,
        "short_url": "0",
        "recipients": [{"mobiles": digits, "var1": message}],
    }
    try:
        resp = await client.post(_ENDPOINT, json=payload,
                                 headers={"authkey": settings.msg91_auth_key,
                                          "Content-Type": "application/json"})
    except httpx.HTTPError as e:
        raise ProviderError(f"MSG91 unreachable: {e}", code="sms_error") from e
    finally:
        if own:
            await client.aclose()

    data = _safe_json(resp)
    if resp.status_code >= 400 or str(data.get("type", "")).lower() == "error":
        raise ProviderError(f"MSG91 rejected the SMS: {data or resp.text[:200]}", code="sms_rejected",
                            details={"status": resp.status_code, "body": data})
    return {"provider_message_id": data.get("request_id") or data.get("message"),
            "delivery_status": "sent"}


def _safe_json(resp: httpx.Response) -> dict:
    try:
        return resp.json()
    except ValueError:
        return {}
