"""Supabase JWT verification.

THE security fix vs n8n: the authenticated user id comes from the *verified token*, never from
the request body. Every service scopes its DB writes to this id, so a caller can't act as another
user by passing a different `user_id` in the payload.

Supabase signs access tokens with HS256 using the project's JWT secret, with `aud="authenticated"`.
"""
from __future__ import annotations

from dataclasses import dataclass

import httpx
import jwt
from fastapi import Depends, Request

from app.core.config import settings
from app.core.errors import AuthError


@dataclass(frozen=True)
class CurrentUser:
    id: str
    email: str | None = None
    role: str | None = None


def _extract_bearer(request: Request) -> str:
    header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not header or not header.lower().startswith("bearer "):
        raise AuthError("Missing or malformed Authorization header")
    return header.split(" ", 1)[1].strip()


def _verify_hs256(token: str) -> CurrentUser:
    claims = jwt.decode(
        token, settings.supabase_jwt_secret, algorithms=["HS256"],
        audience="authenticated", options={"require": ["sub", "exp"]},
    )
    return CurrentUser(id=claims["sub"], email=claims.get("email"), role=claims.get("role"))


async def _verify_via_supabase(token: str) -> CurrentUser:
    """Validate the token by asking Supabase's auth API. Works regardless of the project's JWT
    signing scheme (legacy HS256 or new asymmetric keys) — only needs the URL + anon key."""
    if not settings.supabase_url or not settings.supabase_anon_key:
        raise AuthError("Server can't verify tokens: set SUPABASE_JWT_SECRET, or SUPABASE_URL + anon key")
    try:
        async with httpx.AsyncClient(timeout=10.0) as c:
            resp = await c.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={"Authorization": f"Bearer {token}", "apikey": settings.supabase_anon_key},
            )
    except httpx.HTTPError as e:
        raise AuthError(f"Could not reach Supabase to verify token: {e}") from e
    if resp.status_code != 200:
        raise AuthError("Invalid or expired token")
    data = resp.json()
    return CurrentUser(id=data["id"], email=data.get("email"), role=data.get("role"))


async def get_current_user(request: Request) -> CurrentUser:
    """FastAPI dependency. Returns the verified user or raises 401.

    Verification order: (1) AUTH_DISABLED debug escape hatch, (2) fast local HS256 check if a JWT
    secret is configured, (3) otherwise ask Supabase's auth API (needs only URL + anon key).

    `AUTH_DISABLED=true` is a local-only escape hatch; it still requires an `X-Debug-User` header.
    """
    if settings.auth_disabled:
        debug_user = request.headers.get("x-debug-user")
        if not debug_user:
            raise AuthError("AUTH_DISABLED is on but no X-Debug-User header was provided")
        return CurrentUser(id=debug_user, role="debug")

    token = _extract_bearer(request)

    if settings.supabase_jwt_secret:
        try:
            return _verify_hs256(token)
        except jwt.InvalidTokenError:
            pass  # fall through to the API check (e.g. project uses asymmetric signing keys)

    return await _verify_via_supabase(token)


CurrentUserDep = Depends(get_current_user)
