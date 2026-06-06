"""Reddit pain-point miner (wish-list feature).

Scrapes a few local-business subreddits, clusters the posts, and asks the LLM to summarize the top
pain points per cluster — stored as kind='pain_point' in the knowledge base for the agents to use.

Best-effort: if PRAW isn't configured, it logs and skips (returns 0) so nothing else breaks. To stay
within Reddit's rules, it only *reads* — it never posts.
"""
from __future__ import annotations

import logging

from app.core import llm
from app.core.config import settings
from app.integrations.supabase import SupabaseREST
from app.rag.embeddings import get_embedder
from app.rag.store import upsert_documents
from app.schemas.insights import AnalyticsInsights  # reuse {summary, insights[]} shape

log = logging.getLogger("rag.reddit_miner")

DEFAULT_SUBREDDITS = ["smallbusiness", "Entrepreneur", "india", "IndianStreetBets"]


def _reddit_client():
    cid = getattr(settings, "reddit_client_id", "") or ""
    if not cid:
        return None
    try:
        import praw
        return praw.Reddit(client_id=cid,
                           client_secret=settings.reddit_client_secret,
                           user_agent="PAYTM/1.0 pain-point-miner")
    except Exception as e:  # praw missing / bad creds
        log.warning("Reddit client unavailable: %s", e)
        return None


async def mine_pain_points(db: SupabaseREST, *, subreddits: list[str] | None = None,
                           query: str = "small business website", limit: int = 40,
                           n_clusters: int = 3) -> int:
    reddit = _reddit_client()
    if reddit is None:
        log.info("Reddit not configured — skipping pain-point mining")
        return 0

    docs = []
    for sub in (subreddits or DEFAULT_SUBREDDITS):
        try:
            for post in reddit.subreddit(sub).search(query, limit=limit // len(subreddits or [1])):
                text = f"{post.title}. {getattr(post, 'selftext', '')[:500]}"
                docs.append(text)
        except Exception as e:
            log.warning("subreddit %s failed: %s", sub, e)

    if len(docs) < n_clusters:
        return 0

    # Cluster the posts, then summarize each cluster's pain points with the LLM.
    from sklearn.cluster import KMeans
    vectors = get_embedder().embed(docs)
    labels = KMeans(n_clusters=n_clusters, n_init=10, random_state=0).fit_predict(vectors)

    kb_rows = []
    for c in range(n_clusters):
        cluster_docs = [d for d, lab in zip(docs, labels) if lab == c][:8]
        prompt = ("From these real online posts by/about small businesses, extract the top 3 concrete "
                  "PAIN POINTS as short phrases. Be specific.\n\n" + "\n---\n".join(cluster_docs))
        result = await llm.complete_json("analytics", [{"role": "user", "content": prompt}],
                                         AnalyticsInsights)
        for ins in result.insights[:3]:
            kb_rows.append({"kind": "pain_point", "content": ins.content,
                            "metadata": {"source": "reddit", "cluster": c}})

    return await upsert_documents(db, kb_rows)
