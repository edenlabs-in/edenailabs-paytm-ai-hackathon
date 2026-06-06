"""WF-04 pipeline update schemas. `user_id` is intentionally absent — it comes from the JWT."""
from __future__ import annotations

from pydantic import BaseModel, Field

# Lead lifecycle stages (matches the DB CHECK constraint on leads.status).
PIPELINE_STAGES = ("new", "contacted", "interested", "client", "delivered", "lost")


class UpdatePipelineRequest(BaseModel):
    lead_id: str
    new_stage: str = Field(..., description="Target pipeline stage")
    notes: str | None = None

    def stage_is_valid(self) -> bool:
        return self.new_stage in PIPELINE_STAGES


class UpdatePipelineResponse(BaseModel):
    success: bool = True
    new_stage: str
    message: str = "Pipeline updated"
