import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Legend,
} from 'recharts'
import type { TopPerformer } from '../types'

interface Props {
  topPerformers: TopPerformer[]
}

function formatSubs(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toString()
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-slate-900/95 border border-indigo-400/25 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{d.name}</p>
      <p className="text-cyan-300">Engagement: {d.engagement_rate.toFixed(2)}%</p>
      <p className="text-emerald-300">Subscribers: {formatSubs(d.subscriber_count)}</p>
      <p className="text-violet-300">Avg Views: {formatSubs(d.avg_views_per_video)}</p>
    </div>
  )
}

export default function TopCreatorsChart({ topPerformers }: Props) {
  const barData = topPerformers.slice(0, 8).map((p) => ({
    name: p.name.length > 14 ? p.name.slice(0, 14) + '…' : p.name,
    fullName: p.name,
    engagement_rate: parseFloat(p.engagement_rate.toFixed(2)),
    subscriber_count: p.subscriber_count,
    avg_views_per_video: p.avg_views_per_video,
  }))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Engagement Rate Bar Chart */}
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 shadow-lg shadow-slate-950/30">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Top Creators by Engagement Rate</h3>
        {barData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(v) => `${v}%`}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                width={90}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="engagement_rate" fill="#22d3ee" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Subscribers vs Avg Views Scatter */}
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 shadow-lg shadow-slate-950/30">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Subscribers vs Avg Views (bubble = engagement)</h3>
        {barData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ left: 0, right: 20, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                type="number"
                dataKey="subscriber_count"
                name="Subscribers"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={formatSubs}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="avg_views_per_video"
                name="Avg Views"
                tick={{ fill: '#64748b', fontSize: 10 }}
                tickFormatter={formatSubs}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="number" dataKey="engagement_rate" range={[40, 400]} name="Engagement %" />
              <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={barData} fill="#a78bfa" fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
