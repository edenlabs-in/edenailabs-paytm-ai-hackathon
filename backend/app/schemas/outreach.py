"""WF-02 AI outreach schemas."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

Channel = Literal["whatsapp", "sms", "email"]


class GenerateOutreachRequest(BaseModel):
    lead_id: str
    channel: Channel = "whatsapp"
    language: str = "english"
    tone: str | None = None


class OutreachScript(BaseModel):
    variant: int
    angle: str
    content: str


class OutreachScripts(BaseModel):
    """Structured LLM output target."""
    scripts: list[OutreachScript]


class GenerateOutreachResponse(BaseModel):
    success: bool = True
    scripts: list[OutreachScript]
