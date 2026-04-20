from pydantic import BaseModel
from typing import Optional, List


class VideoOut(BaseModel):
    video_id: str
    title: Optional[str] = None
    thumbnail_url: Optional[str] = None
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    published_at: Optional[str] = None
    duration: Optional[str] = None
    engagement_rate: float = 0.0


class CreatorOut(BaseModel):
    channel_id: str
    name: str
    description: Optional[str] = None
    platform: str = "youtube"
    topic: Optional[str] = None
    subscriber_count: int = 0
    total_view_count: int = 0
    video_count: int = 0
    avg_views_per_video: float = 0.0
    avg_likes_per_video: float = 0.0
    avg_comments_per_video: float = 0.0
    engagement_rate: float = 0.0
    country: Optional[str] = None
    language: Optional[str] = None
    thumbnail_url: Optional[str] = None
    channel_url: Optional[str] = None
    custom_url: Optional[str] = None
    emails: List[str] = []


class CreatorDetail(CreatorOut):
    videos: List[VideoOut] = []


class TopPerformer(BaseModel):
    name: str
    channel_id: str
    engagement_rate: float
    subscriber_count: int
    avg_views_per_video: float
    thumbnail_url: Optional[str] = None
    topic: Optional[str] = None


class AnalyticsOut(BaseModel):
    total_creators: int
    avg_engagement_rate: float
    top_performers: List[TopPerformer]
    topic_breakdown: List[dict]
