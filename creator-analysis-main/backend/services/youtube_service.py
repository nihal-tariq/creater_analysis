import os
import re
import logging
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

TOPIC_KEYWORDS = {
    "travel": "travel vlog creator",
    "food": "food blogger cooking channel",
    "makeup": "makeup tutorial beauty",
    "grwm": "get ready with me grwm",
    "fitness": "fitness workout gym",
    "tech": "tech review gadgets",
    "fashion": "fashion style ootd",
    "gaming": "gaming channel let's play",
    "lifestyle": "lifestyle vlog daily",
    "finance": "personal finance investing",
    "comedy": "comedy skits funny videos",
    "music": "music cover original songs",
    "education": "educational explainer learn",
    "art": "art drawing painting tutorial",
    "parenting": "parenting family vlogs",
    "pets": "pets animals cute",
    "diy": "diy crafts how to make",
    "sports": "sports training highlights",
    "motivation": "motivation self improvement mindset",
    "vlogs": "daily vlog life routine",
    "skincare": "skincare routine review",
    "cooking": "cooking recipes home chef",
    "dance": "dance tutorial choreography",
    "photography": "photography tips camera",
    "cars": "cars automotive review",
}


def _get_client():
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        raise ValueError("YOUTUBE_API_KEY environment variable not set")
    return build("youtube", "v3", developerKey=api_key)


def _safe_int(value, default: int = 0) -> int:
    try:
        return int(value or default)
    except (ValueError, TypeError):
        return default


def _extract_emails(text: str) -> list[str]:
    if not text:
        return []
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    found = re.findall(pattern, text)
    bad_exts = {'.png', '.jpg', '.gif', '.mp4', '.svg', '.webp'}
    return list({e for e in found if not any(e.endswith(x) for x in bad_exts)})[:5]


def _engagement_rate(avg_likes: float, avg_comments: float, avg_views: float) -> float:
    if avg_views <= 0:
        return 0.0
    return round(((avg_likes + avg_comments) / avg_views) * 100, 4)


def _build_creator(channel_id: str, channel_data: dict, topic: str, videos_data: list) -> dict:
    snippet = channel_data.get("snippet", {})
    stats = channel_data.get("statistics", {})
    branding = channel_data.get("brandingSettings", {}).get("channel", {})
    content_details = channel_data.get("contentDetails", {})

    subscriber_count = _safe_int(stats.get("subscriberCount"))
    total_view_count = _safe_int(stats.get("viewCount"))
    video_count = _safe_int(stats.get("videoCount"))

    description = snippet.get("description", "") or ""
    emails = list({*_extract_emails(description), *_extract_emails(branding.get("description", ""))})[:5]

    views = [_safe_int(v.get("statistics", {}).get("viewCount")) for v in videos_data]
    likes = [_safe_int(v.get("statistics", {}).get("likeCount")) for v in videos_data]
    comments_list = [_safe_int(v.get("statistics", {}).get("commentCount")) for v in videos_data]

    avg_views = sum(views) / len(views) if views else 0.0
    avg_likes_val = sum(likes) / len(likes) if likes else 0.0
    avg_comments_val = sum(comments_list) / len(comments_list) if comments_list else 0.0

    videos = []
    for v in videos_data:
        vs = v.get("statistics", {})
        vs_snippet = v.get("snippet", {})
        v_views = _safe_int(vs.get("viewCount"))
        v_likes = _safe_int(vs.get("likeCount"))
        v_comments = _safe_int(vs.get("commentCount"))
        videos.append({
            "video_id": v["id"],
            "title": vs_snippet.get("title"),
            "thumbnail_url": (
                vs_snippet.get("thumbnails", {}).get("high", {}).get("url")
                or vs_snippet.get("thumbnails", {}).get("default", {}).get("url")
            ),
            "view_count": v_views,
            "like_count": v_likes,
            "comment_count": v_comments,
            "published_at": vs_snippet.get("publishedAt"),
            "duration": v.get("contentDetails", {}).get("duration"),
            "engagement_rate": _engagement_rate(v_likes, v_comments, v_views),
        })

    thumbnails = snippet.get("thumbnails", {})
    thumbnail_url = (
        thumbnails.get("high", {}).get("url")
        or thumbnails.get("medium", {}).get("url")
        or thumbnails.get("default", {}).get("url")
    )

    return {
        "channel_id": channel_id,
        "name": snippet.get("title", "Unknown"),
        "description": description[:2000] or None,
        "platform": "youtube",
        "topic": topic,
        "subscriber_count": subscriber_count,
        "total_view_count": total_view_count,
        "video_count": video_count,
        "avg_views_per_video": round(avg_views, 2),
        "avg_likes_per_video": round(avg_likes_val, 2),
        "avg_comments_per_video": round(avg_comments_val, 2),
        "engagement_rate": _engagement_rate(avg_likes_val, avg_comments_val, avg_views),
        "country": snippet.get("country"),
        "language": branding.get("defaultLanguage") or snippet.get("defaultAudioLanguage"),
        "thumbnail_url": thumbnail_url,
        "channel_url": f"https://www.youtube.com/channel/{channel_id}",
        "custom_url": snippet.get("customUrl"),
        "emails": emails,
        "_upload_playlist_id": content_details.get("relatedPlaylists", {}).get("uploads"),
        "videos": videos,
    }


def fetch_creators_for_topic(topic: str) -> list[dict]:
    """Search YouTube for top creators in a given topic. Costs ~102 quota units."""
    if topic not in TOPIC_KEYWORDS:
        raise ValueError(f"Unknown topic: {topic}")

    keyword = TOPIC_KEYWORDS[topic]
    youtube = _get_client()

    try:
        search_resp = youtube.search().list(
            part="snippet",
            q=keyword,
            type="video",
            maxResults=25,
            order="viewCount",
            relevanceLanguage="en",
        ).execute()
    except HttpError as e:
        logger.error(f"YouTube search error for '{topic}': {e}")
        raise RuntimeError(f"YouTube API error: {e.reason}") from e

    items = search_resp.get("items", [])
    if not items:
        return []

    channel_ids = list({item["snippet"]["channelId"] for item in items})
    video_ids = [item["id"]["videoId"] for item in items if item["id"].get("videoId")]

    try:
        channels_resp = youtube.channels().list(
            part="snippet,statistics,brandingSettings,contentDetails",
            id=",".join(channel_ids),
            maxResults=50,
        ).execute()
    except HttpError as e:
        logger.error(f"YouTube channels error: {e}")
        raise RuntimeError(f"YouTube API error: {e.reason}") from e

    channel_map = {ch["id"]: ch for ch in channels_resp.get("items", [])}

    video_stats_map: dict[str, dict] = {}
    if video_ids:
        try:
            vid_resp = youtube.videos().list(
                part="snippet,statistics,contentDetails",
                id=",".join(video_ids[:50]),
            ).execute()
            video_stats_map = {v["id"]: v for v in vid_resp.get("items", [])}
        except HttpError as e:
            logger.warning(f"Could not fetch video stats: {e}")

    channel_videos: dict[str, list] = {}
    for vid_data in video_stats_map.values():
        ch_id = vid_data["snippet"]["channelId"]
        channel_videos.setdefault(ch_id, []).append(vid_data)

    creators = []
    for channel_id, channel_data in channel_map.items():
        try:
            creator = _build_creator(channel_id, channel_data, topic, channel_videos.get(channel_id, []))
            creators.append(creator)
        except Exception as e:
            logger.warning(f"Skipping channel {channel_id}: {e}")

    return creators


def fetch_channel_videos(channel_id: str, upload_playlist_id: Optional[str] = None) -> list[dict]:
    """Fetch recent videos for a channel via its uploads playlist. Costs ~2 quota units."""
    youtube = _get_client()

    if not upload_playlist_id:
        try:
            ch_resp = youtube.channels().list(part="contentDetails", id=channel_id).execute()
            ch_items = ch_resp.get("items", [])
            if ch_items:
                upload_playlist_id = (
                    ch_items[0].get("contentDetails", {}).get("relatedPlaylists", {}).get("uploads")
                )
        except HttpError:
            return []

    if not upload_playlist_id:
        return []

    try:
        pl_resp = youtube.playlistItems().list(
            part="snippet",
            playlistId=upload_playlist_id,
            maxResults=10,
        ).execute()
        pl_items = pl_resp.get("items", [])
    except HttpError:
        return []

    video_ids = [
        item["snippet"]["resourceId"]["videoId"]
        for item in pl_items
        if item["snippet"].get("resourceId", {}).get("kind") == "youtube#video"
    ]
    if not video_ids:
        return []

    try:
        vid_resp = youtube.videos().list(
            part="snippet,statistics,contentDetails",
            id=",".join(video_ids),
        ).execute()
    except HttpError:
        return []

    videos = []
    for v in vid_resp.get("items", []):
        vs = v.get("statistics", {})
        vs_snippet = v.get("snippet", {})
        v_views = _safe_int(vs.get("viewCount"))
        v_likes = _safe_int(vs.get("likeCount"))
        v_comments = _safe_int(vs.get("commentCount"))
        videos.append({
            "video_id": v["id"],
            "title": vs_snippet.get("title"),
            "thumbnail_url": (
                vs_snippet.get("thumbnails", {}).get("high", {}).get("url")
                or vs_snippet.get("thumbnails", {}).get("default", {}).get("url")
            ),
            "view_count": v_views,
            "like_count": v_likes,
            "comment_count": v_comments,
            "published_at": vs_snippet.get("publishedAt"),
            "duration": v.get("contentDetails", {}).get("duration"),
            "engagement_rate": _engagement_rate(v_likes, v_comments, v_views),
        })

    return videos
