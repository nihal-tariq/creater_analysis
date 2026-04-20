import { useEffect, useState } from 'react'
import { X, Mail, ExternalLink, TrendingUp, Eye, Users, Video, Loader2 } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { Creator, CreatorDetail } from '../types'
import { fetchCreatorDetail } from '../api/client'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function formatDate(s: string | null): string {
  if (!s) return 'N/A'
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface Props {
  creator: Creator
  onClose: () => void
}

export default function CreatorModal({ creator, onClose }: Props) {
  const [detail, setDetail] = useState<CreatorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    fetchCreatorDetail(creator.channel_id)
      .then(setDetail)
      .catch((e) => setError(e.response?.data?.detail ?? e.message))
      .finally(() => setLoading(false))
  }, [creator.channel_id])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const videoBarData = (detail?.videos ?? []).slice(0, 8).map((v) => ({
    title: (v.title ?? 'Untitled').slice(0, 18) + '…',
    views: v.view_count,
    engagement: parseFloat(v.engagement_rate.toFixed(2)),
  }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-b from-slate-900 to-slate-900/95 border border-indigo-400/25 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl shadow-indigo-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-700/70">
          <div className="flex items-center gap-4">
            {creator.thumbnail_url ? (
              <img
                src={creator.thumbnail_url}
                alt={creator.name}
                className="w-16 h-16 rounded-full object-cover bg-slate-700"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-2xl text-slate-400">
                {creator.name[0]}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-white">{creator.name}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {creator.topic && (
                  <span className="px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-400/30 text-indigo-200 text-xs capitalize">
                    {creator.topic}
                  </span>
                )}
                {creator.country && (
                  <span className="text-xs text-slate-400">{creator.country}</span>
                )}
                {creator.custom_url && (
                  <span className="text-xs text-slate-500">@{creator.custom_url.replace('@', '')}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {creator.channel_url && (
              <a
                href={creator.channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/10 border border-cyan-400/25 rounded-lg text-cyan-200 text-xs hover:bg-cyan-500/20 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                View YouTube Channel
              </a>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-700/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          
        </div>


        {/* Stats row */}
        <div className="grid grid-cols-4 gap-px bg-slate-700/70 border-b border-slate-700/70">
          {[
            { label: 'Subscribers', value: formatNumber(creator.subscriber_count), icon: Users, color: 'text-sky-400' },
            { label: 'Total Views', value: formatNumber(creator.total_view_count), icon: Eye, color: 'text-violet-400' },
            { label: 'Engagement', value: `${creator.engagement_rate.toFixed(2)}%`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Videos', value: formatNumber(creator.video_count), icon: Video, color: 'text-amber-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-900/70 px-4 py-3 text-center">
              <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="p-6 space-y-6">
          {/* Contact */}
          {creator.emails.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Contact Info
              </h3>
              <div className="flex flex-wrap gap-2">
                {creator.emails.map((email) => (
                  <a
                    key={email}
                    href={`mailto:${email}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs hover:bg-emerald-500/20 transition-colors"
                  >
                    <Mail className="w-3 h-3" />
                    {email}
                  </a>
                ))}
              </div>
            </div>
          )}

 {/* Description */}
          {creator.description && (
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                About
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                {creator.description}
              </p>
            </div>
          )}

          {/* Avg metrics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Average Per Video
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Views', value: formatNumber(Math.round(creator.avg_views_per_video)) },
                { label: 'Likes', value: formatNumber(Math.round(creator.avg_likes_per_video)) },
                { label: 'Comments', value: formatNumber(Math.round(creator.avg_comments_per_video)) },
              ].map((m) => (
                <div key={m.label} className="bg-slate-800/60 border border-slate-700/60 rounded-lg px-3 py-2 text-center">
                  <p className="text-base font-semibold text-white">{m.value}</p>
                  <p className="text-xs text-slate-400">{m.label}</p>
                </div>
              ))}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading recent videos…</span>
            </div>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {!loading && detail && detail.videos.length > 0 && (
            <>
              {/* Video views bar chart */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Recent Videos — Views
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={videoBarData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatNumber}
                    />
                    <YAxis
                      type="category"
                      dataKey="title"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      width={110}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                      formatter={(v: number) => [formatNumber(v), 'Views']}
                    />
                    <Bar dataKey="views" fill="#818cf8" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Video list */}
              <div>
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Recent Videos
                </h3>
                <div className="space-y-2">
                  {detail.videos.slice(0, 6).map((v) => (
                    <div key={v.video_id} className="flex items-center gap-3 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2">
                      {v.thumbnail_url && (
                        <img
                          src={v.thumbnail_url}
                          alt={v.title ?? ''}
                          className="w-16 h-9 rounded object-cover bg-slate-700 shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{v.title ?? 'Untitled'}</p>
                        <div className="flex gap-3 mt-0.5 text-xs text-slate-500">
                          <span>{formatNumber(v.view_count)} views</span>
                          <span>{formatNumber(v.like_count)} likes</span>
                          <span className="text-emerald-500/70">{v.engagement_rate.toFixed(2)}% eng</span>
                          <span>{formatDate(v.published_at)}</span>
                        </div>
                      </div>
                      <a
                        href={`https://youtube.com/watch?v=${v.video_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

         
        </div>
      </div>
    </div>
  )
}
