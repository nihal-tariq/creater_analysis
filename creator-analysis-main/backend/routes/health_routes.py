"""
Health Routes

Basic system health monitoring endpoints.
Used for uptime monitoring and service checks.
"""

from datetime import datetime


def register_health_routes(app, _cache):
    """
    Register health check endpoints.
    """

    @app.get("/api/health", tags=["health"])
    def health():
        """
        Returns service health status and cache metadata.
        """

        return {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "cached_topics": list(_cache.keys())
        }