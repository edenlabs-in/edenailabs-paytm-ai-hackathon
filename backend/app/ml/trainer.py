"""Trains the lead-scoring model on real outcomes.

Cold-start safe: if there isn't enough labelled data (or only one class), it skips training and the
system keeps using the explainable heuristic. Run nightly by the Phase 6 worker, or manually:
    python -m app.ml.trainer
"""
from __future__ import annotations

import asyncio
import logging

from app.integrations.supabase import close_supabase, get_supabase
from app.ml import features, model_store

log = logging.getLogger("ml.trainer")

MIN_SAMPLES = 20
MIN_PER_CLASS = 5


async def train_lead_model(db=None) -> dict:
    db = db or get_supabase()
    leads = await db.select("leads", select="*", limit=5000)

    X = [features.feature_vector_from_lead(l) for l in leads]
    y = [features.label_for(l) for l in leads]

    n, pos = len(y), sum(y)
    if n < MIN_SAMPLES or pos < MIN_PER_CLASS or (n - pos) < MIN_PER_CLASS:
        msg = f"insufficient data (n={n}, positives={pos}) — keeping heuristic"
        log.info("Lead model not trained: %s", msg)
        return {"trained": False, "reason": msg, "samples": n}

    from sklearn.ensemble import GradientBoostingClassifier
    model = GradientBoostingClassifier(random_state=0)
    model.fit(X, y)
    acc = model.score(X, y)
    model_store.save_model(model)
    log.info("Trained lead model on %d samples (train_acc=%.3f)", n, acc)
    return {"trained": True, "samples": n, "positives": pos, "train_accuracy": round(acc, 3)}


async def _main() -> None:
    logging.basicConfig(level="INFO")
    try:
        print(await train_lead_model())
    finally:
        await close_supabase()


if __name__ == "__main__":
    asyncio.run(_main())
