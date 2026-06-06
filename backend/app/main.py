"""FastAPI entrypoint.

Mounts every endpoint on the SAME `/webhook/*` paths n8n used, so the React frontend only needs
its `VITE_N8N_WEBHOOK_URL` pointed here — no `src/lib/n8n.ts` changes.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.core.config import settings
from app.core.errors import install_exception_handlers
from app.integrations.supabase import close_supabase
from app.routers import (calls, discovery, health, insights, messaging, outreach, pipeline,
                         strategy, website)

logging.basicConfig(level=settings.log_level,
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    logging.getLogger("app").info("PAYTM backend v%s starting (env=%s)", __version__, settings.env)
    yield
    await close_supabase()


app = FastAPI(
    title="PAYTM API",
    version=__version__,
    summary="Agentic Python backend replacing the n8n workflows.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

install_exception_handlers(app)

# Routers — add new endpoint routers here as each phase lands.
app.include_router(health.router)
app.include_router(pipeline.router)
app.include_router(discovery.router)
app.include_router(outreach.router)
app.include_router(messaging.router)
app.include_router(calls.router)
app.include_router(website.router)
app.include_router(strategy.router)
app.include_router(insights.router)
