"""WF-05 strategy schemas. The `Strategy` shape matches what the frontend Strategy.tsx renders."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ServicePackage(BaseModel):
    recommended_services: list[str]
    starter_price: str
    growth_price: str | None = None
    timeline: str


class OutreachPlan(BaseModel):
    best_channel: str
    best_time: str
    opening_line: str
    key_talking_points: list[str] = Field(default_factory=list)


class ObjectionHandler(BaseModel):
    objection: str
    response: str


class RevenueEstimate(BaseModel):
    initial_deal: str
    recurring_monthly: str


class Strategy(BaseModel):
    """Structured agent output. Grounded in retrieved evidence, not hallucinated."""
    executive_summary: str
    pitch_angle: str
    competitor_insight: str
    service_package: ServicePackage
    outreach_plan: OutreachPlan
    objections_and_handlers: list[ObjectionHandler]
    revenue_estimate: RevenueEstimate
    difficulty_score: int = Field(ge=1, le=5)
    next_best_action: str

    def is_complete(self) -> bool:
        """Completeness gate used by the agent's critique step."""
        return bool(
            self.pitch_angle.strip()
            and self.outreach_plan.opening_line.strip()
            and len(self.objections_and_handlers) >= 2
        )


class GenerateStrategyRequest(BaseModel):
    lead_id: str


class GenerateStrategyResponse(BaseModel):
    success: bool = True
    strategy: Strategy | None = None
    message: str = "Strategy generated"
