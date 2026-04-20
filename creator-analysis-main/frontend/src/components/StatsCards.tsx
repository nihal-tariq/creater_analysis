import type { Analytics, Creator } from '../types'
import { Users, TrendingUp, Eye, BarChart2 } from 'lucide-react'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

interface Props {
  analytics: Analytics | null
  creators: Creator[]
}

export default function StatsCards({ analytics, creators }: Props) {
  const totalCreators = creators.length
  const totalSubs = creators.reduce((s, c) => s + c.subscriber_count, 0)
  const avgViews =
    creators.length > 0
      ? creators.reduce((s, c) => s + c.avg_views_per_video, 0) / creators.length
      : 0
  const avgEngagement =
    creators.length > 0
      ? creators.reduce((s, c) => s + c.engagement_rate, 0) / creators.length
      : 0

  const cards = [
    {
      label: 'Total Creators',
      value: formatNumber(totalCreators),
      sub: 'in current results',
      icon: Users,
      color: 'text-cyan-300',
      bg: 'bg-cyan-500/10 border-cyan-400/25',
      ring: 'from-cyan-400/40',
    },
    {
      label: 'Avg Engagement',
      value: `${avgEngagement.toFixed(2)}%`,
      sub: 'across current results',
      icon: TrendingUp,
      color: 'text-emerald-300',
      bg: 'bg-emerald-500/10 border-emerald-400/25',
      ring: 'from-emerald-400/40',
    },
    {
      label: 'Total Reach',
      value: formatNumber(totalSubs),
      sub: 'combined subscribers',
      icon: Eye,
      color: 'text-violet-300',
      bg: 'bg-violet-500/10 border-violet-400/25',
      ring: 'from-violet-400/40',
    },
    {
      label: 'Avg Views / Video',
      value: formatNumber(Math.round(avgViews)),
      sub: 'across loaded creators',
      icon: BarChart2,
      color: 'text-amber-300',
      bg: 'bg-amber-500/10 border-amber-400/25',
      ring: 'from-amber-400/40',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="relative overflow-hidden bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 shadow-lg shadow-slate-950/30">
          <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${card.ring} via-transparent to-transparent`} />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
            </div>
            <div className={`p-2 rounded-lg border ${card.bg}`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
