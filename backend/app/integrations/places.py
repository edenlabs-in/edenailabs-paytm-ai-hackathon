"""Google Places API (New) — Nearby Search. Returns raw place dicts for the discovery service."""
from __future__ import annotations

import httpx

from app.core.config import settings
from app.core.errors import ProviderError

_FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,"
    "places.googleMapsUri,places.rating,places.userRatingCount,places.types,places.websiteUri"
)


async def search_nearby(lat: float, lng: float, included_types: list[str], radius_m: int, *,
                        max_results: int = 20, client: httpx.AsyncClient | None = None) -> list[dict]:
    if not settings.google_api_key:
        raise ProviderError("GOOGLE_API_KEY not configured", code="places_unconfigured", status_code=500)

    own = client is None
    client = client or httpx.AsyncClient(timeout=30.0)
    body = {
        "includedTypes": included_types,
        "maxResultCount": max_results,
        "locationRestriction": {
            "circle": {"center": {"latitude": lat, "longitude": lng}, "radius": radius_m}
        },
    }
    try:
        resp = await client.post(
            "https://places.googleapis.com/v1/places:searchNearby",
            json=body,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": settings.google_api_key,
                "X-Goog-FieldMask": _FIELD_MASK,
            },
        )
    except httpx.HTTPError as e:
        raise ProviderError(f"Google Places unreachable: {e}", code="places_error") from e
    finally:
        if own:
            await client.aclose()

    if resp.status_code >= 400:
        raise ProviderError(f"Google Places error {resp.status_code}", code="places_error",
                            details={"body": resp.text[:400]})
    return resp.json().get("places", [])
