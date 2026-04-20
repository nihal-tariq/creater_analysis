import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Optional, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from services.youtube_service import fetch_creators_for_topic, fetch_channel_videos, TOPIC_KEYWORDS
from schemas import CreatorOut, CreatorDetail, AnalyticsOut, TopPerformer


from routes.topic_routes import register_topic_routes
from routes.creators_routes import register_creator_routes
from routes.analytics_routes import register_analytics_routes
from routes.debug_routes import register_debug_routes
from routes.health_routes import register_health_routes


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

_cache: dict[str, dict[str, Any]] = {}
CACHE_TTL_MINUTES = 30


def _get_cached(topic: str) -> Optional[list]:
    entry = _cache.get(topic)
    if entry and (datetime.utcnow() - entry["fetched_at"]) < timedelta(minutes=CACHE_TTL_MINUTES):
        return entry["creators"]
    return None


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creator Analytics API started — no DB, in-memory cache")
    yield


app = FastAPI(
    title="Creator Analytics API",
    description="Real-time YouTube creator analytics for brand partnerships",
    version="2.0.0",
    lifespan=lifespan,
)

cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:5174").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


register_topic_routes(app)
register_creator_routes(app, _cache, _get_cached, CACHE_TTL_MINUTES, logger)
register_analytics_routes(app, _cache, _get_cached)
register_debug_routes(app, _cache, CACHE_TTL_MINUTES)
register_health_routes(app, _cache)