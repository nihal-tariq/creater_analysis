"""
Debug Routes

Provides visibility into the internal in-memory cache.
Useful during development and troubleshooting.
"""

from datetime import datetime


def register_debug_routes(app, _cache, CACHE_TTL_MINUTES):
    """
    Register debugging endpoints to inspect cache state.
    """

    @app.get("/api/cache/status", tags=["debug"])
    def cache_status():
        """
        Shows cached topics, number of creators,
        cache age and expiration timing.
        """

        return {
            topic: {
                "creators": len(entry["creators"]),
                "age_minutes": round(
                    (datetime.utcnow() - entry["fetched_at"]).total_seconds() / 60,
                    1
                ),
                "expires_in_minutes": max(
                    0,
                    round(
                        CACHE_TTL_MINUTES
                        - (datetime.utcnow() - entry["fetched_at"]).total_seconds() / 60,
                        1
                    ),
                ),
            }
            for topic, entry in _cache.items()
        }