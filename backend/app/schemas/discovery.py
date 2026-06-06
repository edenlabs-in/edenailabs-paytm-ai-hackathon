"""WF-01 lead discovery schemas. Mirrors the frontend `discoverLeads()` payload."""
from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class DiscoverLeadsRequest(BaseModel):
    pin_code: str
    city: str | None = None
    business_types: list[str] | None = None
    radius_km: float = Field(default=5, ge=1, le=25)

    @field_validator("pin_code")
    @classmethod
    def _valid_pin(cls, v: str) -> str:
        v = v.strip()
        if not (v.isdigit() and len(v) == 6):
            raise ValueError("pin_code must be a 6-digit Indian PIN code")
        return v

    @property
    def primary_type(self) -> str:
        return (self.business_types or ["restaurant"])[0] or "restaurant"

    @property
    def included_types(self) -> list[str]:
        """Types to search. A specific pick -> just that; 'All Types' (empty) -> a broad mix."""
        picked = [t for t in (self.business_types or []) if t]
        return picked or ["restaurant", "cafe", "bakery", "beauty_salon", "gym", "doctor",
                          "store", "hardware_store", "pharmacy"]


class DiscoverLeadsResponse(BaseModel):
    success: bool = True
    leads_count: int
    message: str
