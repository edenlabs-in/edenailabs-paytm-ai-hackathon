"""Phase 3 RAG: embeddings, ingestion, retrieval, and outreach grounding."""
import pytest

import app.rag.embeddings as emb
from app.rag.embeddings import DIM, HashingEmbedder
from app.rag import store as rag_store
from app.rag.ingest import seed_knowledge_base


@pytest.fixture(autouse=True)
def force_hashing_embedder(monkeypatch):
    """Force the offline embedder so tests never download a model."""
    monkeypatch.setattr(emb, "_embedder", HashingEmbedder())


def test_hashing_embedder_shape_and_determinism():
    e = HashingEmbedder()
    a = e.embed(["chai tea stall mumbai"])[0]
    b = e.embed(["chai tea stall mumbai"])[0]
    assert len(a) == DIM == 384
    assert a == b                       # deterministic
    assert abs(sum(x * x for x in a) - 1.0) < 1e-6   # L2-normalized


@pytest.mark.asyncio
async def test_seed_and_retrieve(fake_db):
    n = await seed_knowledge_base(fake_db)
    assert n >= 6
    assert len(fake_db.tables["kb_documents"]) == n
    assert all("embedding" in d and len(d["embedding"]) == DIM for d in fake_db.tables["kb_documents"])

    rows = await rag_store.retrieve(fake_db, "restaurant doesn't need a website", kind="objection")
    assert rows and all(r["kind"] == "objection" for r in rows)
    ctx = rag_store.format_context(rows)
    assert "Objection" in ctx


def test_outreach_uses_rag_context(client, fake_db, monkeypatch):
    """The retrieved KB context should be injected into the LLM prompt."""
    import app.services.outreach as outreach_svc
    fake_db.seed("leads", {"id": "lead-1", "user_id": "user-1", "business_name": "Tea Stall",
                           "category": "restaurant", "city": "Mumbai"})
    fake_db.seed("kb_documents", {"id": "k1", "kind": "objection",
                                  "content": "Objection: word of mouth is enough.", "metadata": {}})

    captured = {}

    async def fake_json(task, messages, schema, **kw):
        captured["prompt"] = messages[-1]["content"]
        from app.schemas.outreach import OutreachScript, OutreachScripts
        return OutreachScripts(scripts=[OutreachScript(variant=1, angle="x", content="c")])
    monkeypatch.setattr(outreach_svc.llm, "complete_json", fake_json)

    resp = client.post("/webhook/generate-outreach", json={"lead_id": "lead-1", "channel": "sms"})
    assert resp.status_code == 200
    assert "word of mouth" in captured["prompt"]   # RAG context made it into the prompt
