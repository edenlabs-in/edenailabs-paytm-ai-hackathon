"""WF-03 website generator schemas."""
from __future__ import annotations

from pydantic import BaseModel


class GenerateWebsiteRequest(BaseModel):
    lead_id: str
    template_id: str | None = None


class WebsiteSeo(BaseModel):
    """Structured LLM output for SEO copy."""
    title: str
    meta_description: str
    headline: str
    subheadline: str
    about: str
    services: list[str]
    keywords: list[str]


class GenerateWebsiteResponse(BaseModel):
    success: bool = True
    website_id: str | None = None
    status: str = "draft"
    message: str = "Website draft generated"
