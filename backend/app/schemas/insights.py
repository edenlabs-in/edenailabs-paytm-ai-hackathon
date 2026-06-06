"""WF-10 analytics + WF-11 daily-plan structured outputs."""
from __future__ import annotations

from pydantic import BaseModel, Field


class Insight(BaseModel):
    type: str            # pattern | timing | lead_focus | channel
    content: str
    priority: str = "medium"   # high | medium | low


class AnalyticsInsights(BaseModel):
    summary: str
    insights: list[Insight]


class DailyPlan(BaseModel):
    focus: str                       # today's theme, e.g. "Restaurant outreach in Andheri West"
    tasks: list[str] = Field(default_factory=list)
    best_area: str | None = None
    ideal_time: str
    quick_win: str
