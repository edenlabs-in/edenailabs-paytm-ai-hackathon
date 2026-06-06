"""Test harness: a fake in-memory Supabase + dependency overrides so endpoints run with no network.

The fake honours user scoping (update only matches when user_id matches), which is exactly what the
security-fix tests rely on.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.core.auth import CurrentUser, get_current_user
from app.integrations.supabase import get_supabase
from app.main import app


class FakeSupabase:
    def __init__(self):
        self.tables: dict[str, list[dict]] = {"leads": [], "activities": [], "outreach": [],
                                              "strategies": [], "call_logs": [], "kb_documents": [],
                                              "agent_runs": [], "greeting_cards": [],
                                              "greeting_schedule": [], "crm_contacts": []}
        self._seq = 0

    def _next_id(self) -> str:
        self._seq += 1
        return f"id-{self._seq}"

    # ---- helpers used by tests to seed data ----
    def seed(self, table: str, row: dict):
        self.tables.setdefault(table, []).append(row)

    # ---- SupabaseREST-compatible async surface ----
    async def select(self, table, *, eq=None, select="*", order=None, limit=None):
        rows = self.tables.get(table, [])
        for col, val in (eq or {}).items():
            rows = [r for r in rows if r.get(col) == val]
        return [dict(r) for r in (rows[:limit] if limit else rows)]

    async def insert(self, table, rows, *, returning=True):
        items = rows if isinstance(rows, list) else [rows]
        for r in items:
            r.setdefault("id", self._next_id())   # mimic DB-assigned uuid PK
        self.tables.setdefault(table, []).extend(items)
        return [dict(r) for r in items] if returning else []

    async def update(self, table, *, eq, patch, returning=True):
        matched = []
        for r in self.tables.get(table, []):
            if all(r.get(col) == val for col, val in eq.items()):
                r.update(patch)
                matched.append(dict(r))
        return matched if returning else []

    async def rpc(self, fn, args):
        if fn == "match_kb_documents":
            rows = self.tables.get("kb_documents", [])
            kind = args.get("filter_kind")
            if kind:
                rows = [r for r in rows if r.get("kind") == kind]
            count = args.get("match_count", 4)
            return [{"id": r.get("id"), "kind": r.get("kind"), "content": r.get("content"),
                     "metadata": r.get("metadata", {}), "similarity": 0.9} for r in rows[:count]]
        return []

    async def upsert(self, table, rows, *, on_conflict, returning=True):
        items = rows if isinstance(rows, list) else [rows]
        store = self.tables.setdefault(table, [])
        keys = [k.strip() for k in on_conflict.split(",")]  # supports composite keys
        out = []
        for item in items:
            existing = next(
                (r for r in store if all(r.get(k) == item.get(k) for k in keys)), None
            )
            if existing:
                existing.update(item)
                out.append(dict(existing))
            else:
                store.append(item)
                out.append(dict(item))
        return out if returning else []


@pytest.fixture(autouse=True)
def _offline_embedder(monkeypatch):
    """Force the deterministic hashing embedder in tests so no model is ever downloaded."""
    import app.rag.embeddings as emb
    monkeypatch.setattr(emb, "_embedder", emb.HashingEmbedder())


@pytest.fixture(autouse=True)
def _isolate_ml_model(monkeypatch, tmp_path):
    """Point the lead-scoring model at a temp path so a trained model never leaks across tests."""
    from app.ml import model_store
    monkeypatch.setattr(model_store, "MODEL_DIR", tmp_path)
    monkeypatch.setattr(model_store, "MODEL_PATH", tmp_path / "lead_scorer.joblib")
    model_store.reset_cache()
    yield
    model_store.reset_cache()


@pytest.fixture
def fake_db() -> FakeSupabase:
    return FakeSupabase()


@pytest.fixture
def client(fake_db):
    app.dependency_overrides[get_supabase] = lambda: fake_db
    app.dependency_overrides[get_current_user] = lambda: CurrentUser(id="user-1", role="test")
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def as_user():
    """Swap the authenticated user mid-test (for ownership-scoping tests)."""
    def _set(uid: str):
        app.dependency_overrides[get_current_user] = lambda: CurrentUser(id=uid, role="test")
    return _set
