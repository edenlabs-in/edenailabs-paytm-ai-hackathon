"""Loads/caches the trained lead-scoring model from disk. Absent model => callers use the heuristic."""
from __future__ import annotations

import logging
from pathlib import Path

import joblib

log = logging.getLogger("ml.model_store")

MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models_cache"
MODEL_PATH = MODEL_DIR / "lead_scorer.joblib"

_model = None
_loaded = False


def get_model():
    """Return the trained model, or None if it hasn't been trained yet."""
    global _model, _loaded
    if not _loaded:
        _loaded = True
        if MODEL_PATH.exists():
            try:
                _model = joblib.load(MODEL_PATH)
                log.info("Loaded lead-scoring model from %s", MODEL_PATH)
            except Exception as e:
                log.warning("Failed to load model (%s); using heuristic", e)
                _model = None
    return _model


def save_model(model) -> None:
    global _model, _loaded
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    _model, _loaded = model, True
    log.info("Saved lead-scoring model to %s", MODEL_PATH)


def reset_cache() -> None:
    global _model, _loaded
    _model, _loaded = None, False
