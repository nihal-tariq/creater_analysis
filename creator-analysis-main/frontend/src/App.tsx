import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, Search, Filter, ChevronLeft, ChevronRight, Loader2, Download } from 'lucide-react'
import type { Creator, Analytics, Topic, SortField, SortOrder } from './types'
import { fetchTopics, fetchCreators, fetchAnalytics } from './api/client'
import TopicSelector from './components/TopicSelector'
import StatsCards from './components/StatsCards'
import TopCreatorsChart from './components/TopCreatorsChart'
import CreatorTable from './components/CreatorTable'
import CreatorModal from './components/CreatorModal'

const LIMIT = 20

export default function App() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [creators, setCreators] = useState<Creator[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null)

  const [sortField, setSortField] = useState<SortField>('engagement_rate')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [minEngagement, setMinEngagement] = useState('')
  const [maxEngagement, setMaxEngagement] = useState('')
  const [minSubscribers, setMinSubscribers] = useState('')
  const [maxSubscribers, setMaxSubscribers] = useState('')
  const [channelSearch, setChannelSearch] = useState('')
  const [hasEmail, setHasEmail] = useState(false)
  const [page, setPage] = useState(1)

  const [loadingCreators, setLoadingCreators] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTopics().then(setTopics).catch(console.error)
  }, [])

  const loadCreators = useCallback(
    async (forceRefresh = false) => {
      if (!selectedTopic) {
        setCreators([])
        setAnalytics(null)
        return
      }
      setLoadingCreators(true)
      setError(null)
      try {
        const [data, analyticsData] = await Promise.all([
          fetchCreators({
            topic: selectedTopic,
            sort_by: sortField,
            order: sortOrder,
            min_engagement: minEngagement ? parseFloat(minEngagement) : undefined,
            max_engagement: maxEngagement ? parseFloat(maxEngagement) : undefined,
            min_subscribers: minSubscribers ? parseInt(minSubscribers) : undefined,
            has_email: hasEmail || undefined,
            page,
            limit: LIMIT,
            force_refresh: forceRefresh || undefined,
          }),
          fetchAnalytics(selectedTopic),
        ])
        const channelSearchLower = channelSearch.trim().toLowerCase()
        const minEngagementValue = minEngagement ? parseFloat(minEngagement) : undefined
        const maxEngagementValue = maxEngagement ? parseFloat(maxEngagement) : undefined
        const minSubscribersValue = minSubscribers ? parseInt(minSubscribers) : undefined
        const maxSubscribersValue = maxSubscribers ? parseInt(maxSubscribers) : undefined

        const filteredCreators = data.filter((creator) => {
          if (minEngagementValue !== undefined && creator.engagement_rate < minEngagementValue) return false
          if (maxEngagementValue !== undefined && creator.engagement_rate > maxEngagementValue) return false
          if (minSubscribersValue !== undefined && creator.subscriber_count < minSubscribersValue) return false
          if (maxSubscribersValue !== undefined && creator.subscriber_count > maxSubscribersValue) return false
          if (hasEmail && creator.emails.length === 0) return false
          if (!channelSearchLower) return true

          const customUrl = creator.custom_url?.toLowerCase() ?? ''
          return creator.name.toLowerCase().includes(channelSearchLower) || customUrl.includes(channelSearchLower)
        })

        setCreators(filteredCreators)
        setAnalytics(analyticsData)
      } catch (e: any) {
        setError(e.response?.data?.detail ?? e.message)
      } finally {
        setLoadingCreators(false)
      }
    },
    [
      selectedTopic,
      sortField,
      sortOrder,
      minEngagement,
      maxEngagement,
      minSubscribers,
      maxSubscribers,
      hasEmail,
      channelSearch,
      page,
    ]
  )

  // Auto-fetch when topic or filters change
  useEffect(() => {
    setPage(1)
  }, [
    selectedTopic,
    sortField,
    sortOrder,
    minEngagement,
    maxEngagement,
    minSubscribers,
    maxSubscribers,
    hasEmail,
    channelSearch,
  ])

  useEffect(() => {
    loadCreators()
  }, [loadCreators])

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic((prev) => (prev === topic ? null : topic))
  }

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const activeFilterCount = [
    minEngagement,
    maxEngagement,
    minSubscribers,
    maxSubscribers,
    channelSearch,
  ].filter(Boolean).length + (hasEmail ? 1 : 0)

  const clearFilters = () => {
    setMinEngagement('')
    setMaxEngagement('')
    setMinSubscribers('')
    setMaxSubscribers('')
    setChannelSearch('')
    setHasEmail(false)
  }

  const escapeCsv = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  const downloadCreatorsCsv = () => {
    if (creators.length === 0) return

    const headers = [
      'Name',
      'Channel ID',
      'Topic',
      'Subscribers',
      'Total Views',
      'Videos',
      'Avg Views/Video',
      'Avg Likes/Video',
      'Avg Comments/Video',
      'Engagement %',
      'Country',
      'Language',
      'Custom URL',
      'Channel URL',
      'Emails',
    ]

    const rows = creators.map((creator) => [
      creator.name,
      creator.channel_id,
      creator.topic ?? '',
      creator.subscriber_count,
      creator.total_view_count,
      creator.video_count,
      creator.avg_views_per_video.toFixed(2),
      creator.avg_likes_per_video.toFixed(2),
      creator.avg_comments_per_video.toFixed(2),
      creator.engagement_rate.toFixed(2),
      creator.country ?? '',
      creator.language ?? '',
      creator.custom_url ?? '',
      creator.channel_url ?? '',
      creator.emails.join('; '),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const topicPart = selectedTopic ?? 'all-topics'
    const datePart = new Date().toISOString().slice(0, 10)

    link.href = url
    link.setAttribute('download', `creators-${topicPart}-${datePart}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const chartTopPerformers = useMemo(
    () => creators
      .slice()
      .sort((a, b) => b.engagement_rate - a.engagement_rate)
      .slice(0, 8)
      .map((creator) => ({
        name: creator.name,
        channel_id: creator.channel_id,
        engagement_rate: creator.engagement_rate,
        subscriber_count: creator.subscriber_count,
        avg_views_per_video: creator.avg_views_per_video,
        thumbnail_url: creator.thumbnail_url,
        topic: creator.topic,
      })),
    [creators]
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/40">
      {/* Header */}
      <header className="border-b border-slate-700/60 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Creator Analytics</h1>
            <p className="text-xs text-slate-400">Brand Partnership Intelligence · YouTube Data API v3</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Live Data
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Topic Selector */}
        <div className="bg-slate-900/50 border border-indigo-500/20 rounded-xl p-5 shadow-lg shadow-indigo-950/30">
          <TopicSelector
            topics={topics}
            selected={selectedTopic}
            onSelect={handleTopicSelect}
          />
          {selectedTopic && (
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={() => loadCreators(true)}
                disabled={loadingCreators}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/15 hover:bg-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-indigo-200 text-xs font-medium rounded-lg transition-colors border border-indigo-400/30"
              >
                {loadingCreators ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Refresh from YouTube
              </button>
              <span className="text-xs text-slate-400">Results cached for 30 min</span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {/* Stats */}
        <StatsCards analytics={analytics} creators={creators} />

        {/* Charts */}
        {chartTopPerformers.length > 0 && (
          <TopCreatorsChart topPerformers={chartTopPerformers} />
        )}

        {/* Filters */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/75 to-indigo-950/40 p-5 shadow-xl shadow-indigo-950/30">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-center">
                <Filter className="w-4 h-4 text-indigo-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-indigo-100">Filters</h3>
                <p className="text-xs text-slate-400">Refine creators by channel, engagement, and audience size</p>
              </div>
              {loadingCreators && <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-indigo-200 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/25">
                {activeFilterCount} active
              </span>
              <button
                onClick={downloadCreatorsCsv}
                disabled={creators.length === 0}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-200 px-2.5 py-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 hover:bg-cyan-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV
              </button>
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-slate-200 px-2.5 py-1 rounded-full border border-slate-500/50 bg-slate-800/70 hover:bg-slate-700/70 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="lg:col-span-4">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Search Channel
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 focus-within:border-indigo-400/70 focus-within:ring-2 focus-within:ring-indigo-400/20 transition-all">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Creator name or @handle"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Engagement %
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minEngagement}
                  onChange={(e) => setMinEngagement(e.target.value)}
                  className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-400/20"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxEngagement}
                  onChange={(e) => setMaxEngagement(e.target.value)}
                  className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Subscribers
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minSubscribers}
                  onChange={(e) => setMinSubscribers(e.target.value)}
                  className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-400/20"
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={maxSubscribers}
                  onChange={(e) => setMaxSubscribers(e.target.value)}
                  className="rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400/70 focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>
            </div>

            <div className="lg:col-span-2 flex items-end">
              <label className="w-full flex items-center justify-between rounded-xl border border-slate-600/70 bg-slate-900/70 px-3 py-2.5 cursor-pointer hover:border-indigo-400/60 transition-colors">
                <span className="text-sm text-slate-100">Has email</span>
                <input
                  type="checkbox"
                  checked={hasEmail}
                  onChange={(e) => setHasEmail(e.target.checked)}
                  className="accent-indigo-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Table */}
        <CreatorTable
          creators={creators}
          onSelect={setSelectedCreator}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />

        {/* Pagination */}
        {creators.length > 0 && (
          <div className="flex items-center justify-between text-sm text-slate-300">
            <span>{creators.length} results (page {page})</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/80 border border-slate-600/60 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={creators.length < LIMIT}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-900/80 border border-slate-600/60 rounded-lg hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {selectedCreator && (
        <CreatorModal creator={selectedCreator} onClose={() => setSelectedCreator(null)} />
      )}
    </div>
  )
}
