"""Thin async Supabase PostgREST client (the single server-side data client).

Uses the service-role key, so RLS is bypassed — which means **every call must be scoped by
`user_id` in application code**. Helpers below make that the default ergonomic path.
"""
from __future__ import annotations

from typing import Any

import httpx
from fastapi import Request

from app.core.config import settings
from app.core.errors import ProviderError

JSON = dict[str, Any]


class SupabaseREST:
    def __init__(self, url: str, apikey: str, bearer: str | None = None,
                 client: httpx.AsyncClient | None = None):
        self._base = f"{url.rstrip('/')}/rest/v1"
        self._headers = {
            "apikey": apikey,
            "Authorization": f"Bearer {bearer or apikey}",
            "Content-Type": "application/json",
        }
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def aclose(self) -> None:
        await self._client.aclose()

    async def _request(self, method: str, table: str, *, params: dict | None = None,
                       json: Any | None = None, prefer: str | None = None) -> list[JSON]:
        headers = dict(self._headers)
        if prefer:
            headers["Prefer"] = prefer
        try:
            resp = await self._client.request(
                method, f"{self._base}/{table}", params=params, json=json, headers=headers
            )
        except httpx.HTTPError as e:
            raise ProviderError(f"Supabase request failed: {e}", code="supabase_unreachable") from e
        if resp.status_code >= 400:
            raise ProviderError(
                f"Supabase {method} {table} -> {resp.status_code}",
                code="supabase_error",
                details={"status": resp.status_code, "body": resp.text[:500]},
            )
        if resp.status_code == 204 or not resp.content:
            return []
        data = resp.json()
        return data if isinstance(data, list) else [data]

    async def select(self, table: str, *, eq: dict | None = None, select: str = "*",
                     order: str | None = None, limit: int | None = None) -> list[JSON]:
        params: dict[str, str] = {"select": select}
        for col, val in (eq or {}).items():
            params[col] = f"eq.{val}"
        if order:
            params["order"] = order
        if limit:
            params["limit"] = str(limit)
        return await self._request("GET", table, params=params)

    async def insert(self, table: str, rows: JSON | list[JSON], *, returning: bool = True) -> list[JSON]:
        prefer = "return=representation" if returning else "return=minimal"
        return await self._request("POST", table, json=rows, prefer=prefer)

    async def update(self, table: str, *, eq: dict, patch: JSON, returning: bool = True) -> list[JSON]:
        params = {col: f"eq.{val}" for col, val in eq.items()}
        prefer = "return=representation" if returning else "return=minimal"
        return await self._request("PATCH", table, params=params, json=patch, prefer=prefer)

    async def upsert(self, table: str, rows: JSON | list[JSON], *, on_conflict: str,
                     returning: bool = True) -> list[JSON]:
        params = {"on_conflict": on_conflict}
        prefer = ("return=representation" if returning else "return=minimal") + ",resolution=merge-duplicates"
        return await self._request("POST", table, params=params, json=rows, prefer=prefer)

    async def rpc(self, fn: str, args: JSON) -> list[JSON]:
        """Call a Postgres function via PostgREST (used for pgvector similarity search)."""
        try:
            resp = await self._client.post(f"{self._base}/rpc/{fn}", json=args, headers=self._headers)
        except httpx.HTTPError as e:
            raise ProviderError(f"Supabase rpc {fn} failed: {e}", code="supabase_unreachable") from e
        if resp.status_code >= 400:
            raise ProviderError(f"Supabase rpc {fn} -> {resp.status_code}", code="supabase_error",
                                details={"body": resp.text[:500]})
        data = resp.json() if resp.content else []
        return data if isinstance(data, list) else [data]


_singleton: SupabaseREST | None = None
_user_http: httpx.AsyncClient | None = None


def get_service_supabase() -> SupabaseREST:
    """Service-role client (bypasses RLS). Used by workers / ingest / training."""
    global _singleton
    if _singleton is None:
        if not settings.supabase_url or not settings.supabase_service_role_key:
            raise ProviderError("Supabase not configured (URL / service role key missing)",
                                code="supabase_unconfigured", status_code=500)
        _singleton = SupabaseREST(settings.supabase_url, settings.supabase_service_role_key)
    return _singleton


def get_supabase(request: Request = None) -> SupabaseREST:
    """FastAPI dependency. Acts AS the calling user (anon key + their JWT) so writes pass through
    RLS — no service key needed. Falls back to the service client for non-request callers (workers)
    or when there's no bearer token (e.g. AUTH_DISABLED)."""
    global _user_http
    if request is not None and settings.supabase_anon_key:
        auth = request.headers.get("authorization") or request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1].strip()
            if _user_http is None:
                _user_http = httpx.AsyncClient(timeout=30.0)
            return SupabaseREST(settings.supabase_url, settings.supabase_anon_key,
                                bearer=token, client=_user_http)
    return get_service_supabase()


async def close_supabase() -> None:
    global _singleton, _user_http
    if _singleton is not None:
        await _singleton.aclose()
        _singleton = None
    if _user_http is not None:
        await _user_http.aclose()
        _user_http = None
