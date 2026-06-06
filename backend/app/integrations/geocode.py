"""PIN-code geocoding via OpenStreetMap Nominatim (free, same source WF-01 used)."""
from __future__ import annotations

import httpx

# Mumbai fallback (matches the n8n default) when geocoding fails.
_FALLBACK = (19.076, 72.877)


async def geocode_pin(pin_code: str, *, client: httpx.AsyncClient | None = None) -> tuple[float, float]:
    own = client is None
    client = client or httpx.AsyncClient(timeout=15.0)
    try:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": f"{pin_code} India", "format": "json", "limit": 1},
            headers={"User-Agent": "PAYTM/1.0"},
        )
        if resp.status_code == 200:
            data = resp.json()
            if data:
                return float(data[0]["lat"]), float(data[0]["lon"])
        return _FALLBACK
    except (httpx.HTTPError, KeyError, ValueError, IndexError):
        return _FALLBACK
    finally:
        if own:
            await client.aclose()
