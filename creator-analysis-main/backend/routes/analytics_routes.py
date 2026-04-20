"""
Analytics Routes

Provides aggregated analytics across cached creators.
Includes engagement statistics, top performers,
and topic level breakdowns.
"""

from typing import Optional
from fastapi import Query
from schemas import AnalyticsOut, TopPerformer


def register_analytics_routes(app, _cache, _get_cached):
    """
    Register analytics endpoints to the FastAPI application.
    """

    @app.get("/api/analytics", response_model=AnalyticsOut, tags=["analytics"])
    def get_analytics(topic: Optional[str] = Query(None)):
        """
        Returns aggregated analytics across cached topics.
        """

        if topic:
            cached = _get_cached(topic)
            creators = cached if cached else []
        else:
            creators = []
            for entry in _cache.values():
                creators.extend(entry["creators"])

        if not creators:
            return AnalyticsOut(
                total_creators=0,
                avg_engagement_rate=0.0,
                top_performers=[],
                topic_breakdown=[],
            )

        total = len(creators)
        avg_eng = sum(c["engagement_rate"] for c in creators) / total

        top = sorted(
            [c for c in creators if c["subscriber_count"] >= 1000],
            key=lambda c: c["engagement_rate"],
            reverse=True,
        )[:10]

        top_performers = [
            TopPerformer(
                name=c["name"],
                channel_id=c["channel_id"],
                engagement_rate=c["engagement_rate"],
                subscriber_count=c["subscriber_count"],
                avg_views_per_video=c["avg_views_per_video"],
                thumbnail_url=c.get("thumbnail_url"),
                topic=c.get("topic"),
            )
            for c in top
        ]

        topic_counts = {}

        for c in creators:
            t = c.get("topic", "unknown")
            topic_counts.setdefault(t, []).append(c["engagement_rate"])

        topic_breakdown = [
            {
                "topic": t,
                "count": len(rates),
                "avg_engagement": round(sum(rates) / len(rates), 4),
            }
            for t, rates in sorted(topic_counts.items(), key=lambda x: len(x[1]), reverse=True)
        ]

        return AnalyticsOut(
            total_creators=total,
            avg_engagement_rate=round(avg_eng, 4),
            top_performers=top_performers,
            topic_breakdown=topic_breakdown,
        )