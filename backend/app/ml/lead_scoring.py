"""Lead scoring.

Phase 2 ships the **cold-start heuristic** — transparent, explainable, needs no training data. It
ranks no-website leads 0–100 so the pipeline surfaces the best prospects first. Phase 5 swaps the
internals for a LightGBM model trained on real `new→client` outcomes, keeping this same signature.
"""
from __future__ import annotations

from dataclasses import dataclass

# Rough prior: how readily each category buys a website (0–1). Tunable; learned later.
_CATEGORY_PRIOR: dict[str, float] = {
    "restaurant": 0.8, "cafe": 0.8, "bakery": 0.75, "beauty_salon": 0.75, "spa": 0.7,
    "gym": 0.65, "doctor": 0.6, "clinic": 0.6, "dentist": 0.6, "hardware_store": 0.5,
    "store": 0.45, "pharmacy": 0.5, "school": 0.4, "general": 0.4,
}
_DEFAULT_PRIOR = 0.4


@dataclass
class ScoreResult:
    score: int                 # 0–100
    factors: dict[str, float]  # explainable contribution breakdown


def score_lead(*, category: str | None, rating: float | None, rating_count: int | None,
               area_saturation: int = 0, has_phone: bool = True) -> ScoreResult:
    """Heuristic blend. Higher = hotter lead.

    - category prior: some verticals convert better
    - rating: a *decent* rating (3.5–4.5) = healthy business that can afford services, but a perfect
      5.0 with few reviews is noisy → mild discount
    - reviews: more reviews = more established/contactable
    - saturation: many no-website peers nearby = an under-served pocket worth working
    - reachability: a phone number to act on
    """
    cat = (category or "general").lower()
    prior = _CATEGORY_PRIOR.get(cat, _DEFAULT_PRIOR)

    r = rating if rating is not None else 3.5
    rating_fit = 1.0 - min(abs(r - 4.2), 2.0) / 2.0          # peaks around 4.2★
    review_factor = min((rating_count or 0) / 100.0, 1.0)     # saturates at 100 reviews
    saturation_factor = min(area_saturation / 15.0, 1.0)      # saturates at 15 peers
    reach = 1.0 if has_phone else 0.3

    weights = {"category": 0.30, "rating_fit": 0.25, "reviews": 0.15,
               "saturation": 0.15, "reach": 0.15}
    parts = {
        "category": prior * weights["category"],
        "rating_fit": rating_fit * weights["rating_fit"],
        "reviews": review_factor * weights["reviews"],
        "saturation": saturation_factor * weights["saturation"],
        "reach": reach * weights["reach"],
    }
    heuristic_score = max(0, min(100, round(sum(parts.values()) * 100)))
    factors = {k: round(v, 4) for k, v in parts.items()}

    # If a model has been trained on real outcomes, prefer its probability; keep the heuristic
    # breakdown alongside for explainability and as a graceful fallback.
    model = _maybe_model()
    if model is not None:
        try:
            from app.ml.features import feature_vector
            vec = feature_vector(category=category, rating=rating,
                                 rating_count=rating_count, has_phone=has_phone)
            prob = float(model.predict_proba([vec])[0][1])
            factors = {"model_probability": round(prob, 4), "heuristic": factors}
            return ScoreResult(score=max(0, min(100, round(prob * 100))), factors=factors)
        except Exception:
            pass  # any model issue -> heuristic
    return ScoreResult(score=heuristic_score, factors=factors)


def _maybe_model():
    """Lazy import to avoid a circular import (features -> lead_scoring)."""
    try:
        from app.ml import model_store
        return model_store.get_model()
    except Exception:
        return None
