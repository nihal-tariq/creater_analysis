import axios from 'axios'
import type { Creator, CreatorDetail, Analytics, Topic } from '../types'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export interface CreatorFilters {
  topic: string
  min_subscribers?: number
  min_engagement?: number
  max_engagement?: number
  has_email?: boolean
  sort_by?: string
  order?: 'asc' | 'desc'
  page?: number
  limit?: number
  force_refresh?: boolean
}

export const fetchTopics = async (): Promise<Topic[]> => {
  const res = await api.get<{ topics: Topic[] }>('/topics')
  return res.data.topics
}

export const fetchCreators = async (filters: CreatorFilters): Promise<Creator[]> => {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
  const res = await api.get<Creator[]>('/creators', { params })
  return res.data
}

export const fetchCreatorDetail = async (channelId: string): Promise<CreatorDetail> => {
  const res = await api.get<CreatorDetail>(`/creators/${channelId}`)
  return res.data
}

export const fetchAnalytics = async (topic?: string): Promise<Analytics> => {
  const params = topic ? { topic } : {}
  const res = await api.get<Analytics>('/analytics', { params })
  return res.data
}
