"""Shared feature engineering for lead scoring — used by both the heuristic and the learned model so
training and inference see identical inputs."""
from __future__ import annotations

import math

from app.ml.lead_scoring import _CATEGORY_PRIOR, _DEFAULT_PRIOR

FEATURE_NAMES = ["rating", "log_reviews", "has_phone", "category_prior"]


def feature_vector(*, category: str | None, rating: float | None, rating_count: int | None,
                   has_phone: bool) -> list[float]:
    cat = (category or "general").lower()
    return [
        float(rating) if rating is not None else 3.5,
        math.log1p(rating_count or 0),
        1.0 if has_phone else 0.0,
        _CATEGORY_PRIOR.get(cat, _DEFAULT_PRIOR),
    ]


def feature_vector_from_lead(lead: dict) -> list[float]:
    return feature_vector(
        category=lead.get("category"),
        rating=lead.get("google_rating"),
        rating_count=lead.get("rating_count") or lead.get("userRatingCount"),
        has_phone=bool(lead.get("phone")),
    )


# A lead "converted" (positive label) once it progressed past first contact.
POSITIVE_STATUSES = {"interested", "client", "delivered"}


def label_for(lead: dict) -> int:
    return 1 if lead.get("status") in POSITIVE_STATUSES else 0
