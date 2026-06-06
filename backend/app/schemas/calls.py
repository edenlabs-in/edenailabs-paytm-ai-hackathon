"""WF-08 call-log schemas."""
from __future__ import annotations

from pydantic import BaseModel

CALL_OUTCOMES = ("answered", "interested", "callback", "not_interested", "voicemail", "no_answer")


class LogCallRequest(BaseModel):
    lead_id: str
    outcome: str
    duration_seconds: int | None = None
    notes: str | None = None
    follow_up_date: str | None = None
    script_id: str | None = None

    def outcome_is_valid(self) -> bool:
        return self.outcome in CALL_OUTCOMES


class LogCallResponse(BaseModel):
    success: bool = True
    message: str = "Call logged"
