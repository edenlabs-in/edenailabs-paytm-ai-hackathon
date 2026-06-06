"""pgvector-backed knowledge store in Supabase.

`retrieve()` is intentionally best-effort: if the KB isn't set up yet (RPC/table missing) it logs and
returns [], so outreach/strategy generation degrades gracefully instead of failing.
"""
from __future__ import annotations

import logging

from app.core.errors import ProviderError
from app.integrations.supabase import SupabaseREST
from app.rag.embeddings import embed_one, get_embedder

log = logging.getLogger("rag.store")


async def upsert_documents(db: SupabaseREST, docs: list[dict]) -> int:
    """docs: [{kind, content, metadata}] — embeds content and writes to kb_documents."""
    if not docs:
        return 0
    embedder = get_embedder()
    vectors = embedder.embed([d["content"] for d in docs])
    rows = [{
        "kind": d["kind"],
        "content": d["content"],
        "metadata": d.get("metadata", {}),
        "embedding": vec,
    } for d, vec in zip(docs, vectors)]
    await db.insert("kb_documents", rows, returning=False)
    return len(rows)


async def retrieve(db: SupabaseREST, query: str, *, kind: str | None = None, k: int = 4) -> list[dict]:
    """Semantic search. Returns [{content, kind, metadata, similarity}], or [] if unavailable."""
    try:
        embedding = embed_one(query)
        rows = await db.rpc("match_kb_documents", {
            "query_embedding": embedding,
            "match_count": k,
            "filter_kind": kind,
        })
        return rows
    except ProviderError as e:
        log.warning("KB retrieve unavailable (%s) — continuing without RAG context", e.code)
        return []
    except Exception as e:  # embedder or unexpected
        log.warning("KB retrieve failed (%s) — continuing without RAG context", e)
        return []


def format_context(rows: list[dict], *, max_chars: int = 1200) -> str:
    """Compact retrieved docs into a prompt-ready bullet list."""
    out, used = [], 0
    for r in rows:
        line = f"- ({r.get('kind', 'kb')}) {r.get('content', '').strip()}"
        if used + len(line) > max_chars:
            break
        out.append(line)
        used += len(line)
    return "\n".join(out)
