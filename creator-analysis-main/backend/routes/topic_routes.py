"""
Topic Routes

Contains endpoints related to creator topic categories.
These endpoints expose the available creator niches that
can be used to query the system.

This module registers routes directly onto the FastAPI app.
"""

from services.youtube_service import TOPIC_KEYWORDS


def register_topic_routes(app):
    """
    Register topic related routes to the FastAPI application.
    """

    @app.get("/api/topics", tags=["topics"])
    def list_topics():
        """
        Returns all available topic categories.
        """
        return {
            "topics": [
                {"id": k, "label": k.replace("_", " ").title()}
                for k in TOPIC_KEYWORDS
            ]
        }