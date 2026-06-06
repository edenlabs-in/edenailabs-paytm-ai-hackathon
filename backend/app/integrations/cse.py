"""Google Custom Search — used by the strategy agent to research local competitors. Best-effort:
returns [] if not configured, so the agent still produces a strategy from RAG + lead data alone.
"""
from __future__ import annotations

import logging

import httpx

from app.core.config import settings

log = logging.getLogger("cse")


async def search(query: str, *, num: int = 5, client: httpx.AsyncClient | None = None) -> list[dict]:
    """Returns [{title, snippet, link}]. Empty list when CSE isn't configured or on error."""
    if not settings.google_api_key or not settings.google_cse_id:
        log.info("CSE not configured — skipping web search for %r", query)
        return []

    own = client is None
    client = client or httpx.AsyncClient(timeout=20.0)
    try:
        resp = await client.get("https://www.googleapis.com/customsearch/v1", params={
            "key": settings.google_api_key, "cx": settings.google_cse_id,
            "q": query, "num": min(num, 10),
        })
        if resp.status_code >= 400:
            log.warning("CSE error %s for %r", resp.status_code, query)
            return []
        items = resp.json().get("items", [])
        return [{"title": i.get("title", ""), "snippet": i.get("snippet", ""),
                 "link": i.get("link", "")} for i in items]
    except httpx.HTTPError as e:
        log.warning("CSE request failed (%s)", e)
        return []
    finally:
        if own:
            await client.aclose()
