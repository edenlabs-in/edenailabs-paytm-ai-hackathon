"""Background scheduler — replaces n8n's cron workflows (WF-10/11) + greetings + Reddit mining.

Run as its own process:  python -m app.workers.scheduler
Keep it separate from the API so a slow nightly job never blocks request handling.
"""
from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.agents.growth_advisor import generate_analytics_insights, generate_daily_plan
from app.integrations.supabase import SupabaseREST, get_supabase
from app.ml.trainer import train_lead_model
from app.rag.reddit_miner import mine_pain_points
from app.workers.greetings import schedule_greetings

log = logging.getLogger("workers.scheduler")


async def _distinct_user_ids(db: SupabaseREST) -> list[str]:
    leads = await db.select("leads", select="user_id", limit=10000)
    return sorted({l["user_id"] for l in leads if l.get("user_id")})


async def job_retrain_leads() -> None:
    log.info("[job] retraining lead model")
    await train_lead_model(get_supabase())


async def job_daily_growth() -> None:
    db = get_supabase()
    today = datetime.now(timezone.utc).date().isoformat()
    for uid in await _distinct_user_ids(db):
        try:
            await generate_daily_plan(db, uid, date=today)
            await generate_analytics_insights(db, uid)
            await schedule_greetings(db, uid, today)
        except Exception as e:  # one user's failure shouldn't stop the batch
            log.warning("daily growth failed for %s: %s", uid, e)


async def job_mine_pain_points() -> None:
    log.info("[job] mining Reddit pain points")
    await mine_pain_points(get_supabase())


def build_scheduler() -> AsyncIOScheduler:
    """Configure (but don't start) the scheduler. Separated out so tests can assert the job set."""
    sched = AsyncIOScheduler(timezone="Asia/Kolkata")
    sched.add_job(job_retrain_leads, CronTrigger(hour=2, minute=0), id="retrain_leads")
    sched.add_job(job_daily_growth, CronTrigger(hour=7, minute=30), id="daily_growth")
    sched.add_job(job_mine_pain_points, CronTrigger(day_of_week="mon", hour=3), id="mine_pain_points")
    return sched


async def _main() -> None:
    logging.basicConfig(level="INFO")
    sched = build_scheduler()
    sched.start()
    log.info("Scheduler started with jobs: %s", [j.id for j in sched.get_jobs()])
    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        sched.shutdown()


if __name__ == "__main__":
    asyncio.run(_main())
