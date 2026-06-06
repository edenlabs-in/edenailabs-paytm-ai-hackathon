"""Text embeddings for the knowledge base.

Primary: `fastembed` (BAAI/bge-small-en-v1.5, ONNX, 384-dim) — local, free, no torch.
Fallback: a deterministic hashing embedder (also 384-dim) so tests and offline/dev runs work with
zero downloads. Same dimension either way, so the pgvector column never changes.
"""
from __future__ import annotations

import hashlib
import logging
import math
from typing import Protocol

from app.core.config import settings

log = logging.getLogger("embeddings")

DIM = 384  # must match the vector(384) column in migrations


class Embedder(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class HashingEmbedder:
    """Deterministic bag-of-hashed-tokens embedding, L2-normalized. Cheap, offline, good enough
    for tests and a sensible fallback. Not as semantically rich as a real model."""

    name = "hashing"

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [self._one(t) for t in texts]

    def _one(self, text: str) -> list[float]:
        vec = [0.0] * DIM
        for tok in text.lower().split():
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            vec[h % DIM] += 1.0
        norm = math.sqrt(sum(v * v for v in vec)) or 1.0
        return [v / norm for v in vec]


class FastEmbedEmbedder:
    name = "fastembed"

    def __init__(self):
        from fastembed import TextEmbedding  # lazy import; downloads model on first use
        self._model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

    def embed(self, texts: list[str]) -> list[list[float]]:
        return [list(map(float, v)) for v in self._model.embed(texts)]


_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    global _embedder
    if _embedder is not None:
        return _embedder
    choice = settings.embedder.lower()
    if choice in ("auto", "fastembed"):
        try:
            _embedder = FastEmbedEmbedder()
            log.info("Using FastEmbed embeddings (bge-small-en-v1.5)")
            return _embedder
        except Exception as e:  # not installed, or model download blocked
            if choice == "fastembed":
                raise
            log.warning("FastEmbed unavailable (%s); falling back to hashing embedder", e)
    _embedder = HashingEmbedder()
    return _embedder


def embed_one(text: str) -> list[float]:
    return get_embedder().embed([text])[0]
