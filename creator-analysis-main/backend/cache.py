from datetime import datetime, timedelta
from typing import Optional, Any


_cache: dict[str, dict[str, Any]] = {}
CACHE_TTL_MINUTES = 30

def get_cached(topic: str) -> Optional[list]:
    entry = _cache.get(topic)
    if entry and (datetime.utcnow() - entry["fetched_at"]) < timedelta(minutes=CACHE_TTL_MINUTES):
        return entry["creators"]
    return None

def set_cached(topic: str, creators: list):
    _cache[topic] = {"creators": creators, "fetched_at": datetime.utcnow()}

def get_full_cache():
    return _cache

def clear_cache_entry(topic: str):
    _cache.pop(topic, None)