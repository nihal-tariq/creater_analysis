"""
Creator Routes

Handles endpoints for listing creators and retrieving
detailed creator information including videos.

These endpoints fetch data from the YouTube service layer
and utilize the in-memory cache defined in main.py.
"""

from datetime import datetime
from typing import Optional

from fastapi import HTTPException, Query

from services.youtube_service import fetch_creators_for_topic, fetch_channel_videos, TOPIC_KEYWORDS
from schemas import CreatorOut, CreatorDetail


def register_creator_routes(app, _cache, _get_cached, CACHE_TTL_MINUTES, logger):
    """
    Register creator related routes on the FastAPI application.
    """

    @app.get("/api/creators", response_model=list[CreatorOut], tags=["creators"])
    def list_creators(
        topic: str = Query(..., description="Topic to load creators for"),
        min_subscribers: Optional[int] = Query(None),
        min_engagement: Optional[float] = Query(None),
        max_engagement: Optional[float] = Query(None),
        has_email: Optional[bool] = Query(None),
        sort_by: str = Query("engagement_rate"),
        order: str = Query("desc"),
        page: int = Query(1, ge=1),
        limit: int = Query(20, ge=1, le=50),
        force_refresh: bool = Query(False, description="Bypass cache and re-fetch from YouTube"),
    ):
        """
        Returns creators for a topic.

        The first request fetches creators directly from the YouTube API
        and stores them in the in-memory cache. Subsequent requests
        will be served from cache until the TTL expires.

        Setting force_refresh=true bypasses the cache.
        """

        if topic not in TOPIC_KEYWORDS:
            raise HTTPException(status_code=400, detail=f"Unknown topic '{topic}'. Valid: {list(TOPIC_KEYWORDS)}")

        if force_refresh:
            _cache.pop(topic, None)

        cached = _get_cached(topic)

        if cached is None:
            try:
                creators = fetch_creators_for_topic(topic)
                _cache[topic] = {"creators": creators, "fetched_at": datetime.utcnow()}
            except RuntimeError as e:
                raise HTTPException(status_code=503, detail=str(e))
        else:
            creators = cached


        if min_subscribers is not None:
            creators = [c for c in creators if c["subscriber_count"] >= min_subscribers]

        if min_engagement is not None:
            creators = [c for c in creators if c["engagement_rate"] >= min_engagement]

        if max_engagement is not None:
            creators = [c for c in creators if c["engagement_rate"] <= max_engagement]

        if has_email:
            creators = [c for c in creators if c.get("emails")]


        valid_sorts = {"engagement_rate", "subscriber_count", "avg_views_per_video", "total_view_count", "name"}

        if sort_by in valid_sorts:
            creators = sorted(
                creators,
                key=lambda c: c.get(sort_by) or 0,
                reverse=(order == "desc")
            )

        # Pagination
        start = (page - 1) * limit
        return creators[start: start + limit]

    @app.get("/api/creators/{channel_id}", response_model=CreatorDetail, tags=["creators"])
    def get_creator(channel_id: str):
        """
        Returns a full creator profile including their recent videos.
        """

        creator = None

        for entry in _cache.values():
            for c in entry["creators"]:
                if c["channel_id"] == channel_id:
                    creator = c
                    break
            if creator:
                break

        if not creator:
            raise HTTPException(
                status_code=404,
                detail="Creator not found in cache. Please load their topic first.",
            )

        upload_playlist_id = creator.get("_upload_playlist_id")

        try:
            videos = fetch_channel_videos(channel_id, upload_playlist_id)
        except Exception as e:
            logger.warning(f"Could not fetch videos for {channel_id}: {e}")
            videos = creator.get("videos", [])

        return {**creator, "videos": videos}