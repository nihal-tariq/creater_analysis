export interface Creator {
  channel_id: string
  name: string
  description: string | null
  platform: string
  topic: string | null
  subscriber_count: number
  total_view_count: number
  video_count: number
  avg_views_per_video: number
  avg_likes_per_video: number
  avg_comments_per_video: number
  engagement_rate: number
  country: string | null
  language: string | null
  thumbnail_url: string | null
  channel_url: string | null
  custom_url: string | null
  emails: string[]
}

export interface Video {
  video_id: string
  title: string | null
  thumbnail_url: string | null
  view_count: number
  like_count: number
  comment_count: number
  published_at: string | null
  duration: string | null
  engagement_rate: number
}

export interface CreatorDetail extends Creator {
  videos: Video[]
}

export interface TopPerformer {
  name: string
  channel_id: string
  engagement_rate: number
  subscriber_count: number
  avg_views_per_video: number
  thumbnail_url: string | null
  topic: string | null
}

export interface Analytics {
  total_creators: number
  avg_engagement_rate: number
  top_performers: TopPerformer[]
  topic_breakdown: { topic: string; count: number; avg_engagement: number }[]
}

export interface Topic {
  id: string
  label: string
}

export type SortField =
  | 'engagement_rate'
  | 'subscriber_count'
  | 'avg_views_per_video'
  | 'total_view_count'
  | 'name'

export type SortOrder = 'asc' | 'desc'
