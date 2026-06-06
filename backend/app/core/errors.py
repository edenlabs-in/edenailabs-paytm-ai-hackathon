"""Uniform error handling.

The cardinal rule (a bug in the n8n version): NEVER report success the app can't confirm.
Service code raises `AppError` / `ProviderError` on real failure; the handler converts it to a
structured envelope `{success: false, error: {...}}` with the right HTTP status.
"""
from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    """Base application error -> structured JSON response."""

    status_code: int = 400
    code: str = "app_error"

    def __init__(self, message: str, *, code: str | None = None, status_code: int | None = None,
                 details: dict | None = None):
        super().__init__(message)
        self.message = message
        if code:
            self.code = code
        if status_code:
            self.status_code = status_code
        self.details = details or {}


class AuthError(AppError):
    status_code = 401
    code = "unauthorized"


class NotFoundError(AppError):
    status_code = 404
    code = "not_found"


class ProviderError(AppError):
    """A downstream provider (Google, MSG91, Gallabox, OpenRouter, Supabase) failed.

    Raised so we surface a real failure instead of a false 'sent'/'success'.
    """
    status_code = 502
    code = "provider_error"


class BudgetExceededError(AppError):
    status_code = 402
    code = "budget_exceeded"


def install_exception_handlers(app) -> None:
    @app.exception_handler(AppError)
    async def _handle_app_error(_: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={"success": False, "error": {"code": exc.code, "message": exc.message,
                                                 "details": exc.details}},
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception):
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": "internal_error",
                                                 "message": "Unexpected server error"}},
        )
