import { ChevronUp, ChevronDown, ExternalLink, Mail } from 'lucide-react'
import type { Creator, SortField, SortOrder } from '../types'

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toString()
}

function EngagementBadge({ rate }: { rate: number }) {
  const color =
    rate >= 5 ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-400/30' :
    rate >= 2 ? 'text-cyan-300 bg-cyan-500/15 border border-cyan-400/30' :
    rate >= 1 ? 'text-amber-300 bg-amber-500/15 border border-amber-400/30' :
    'text-rose-300 bg-rose-500/15 border border-rose-400/30'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-semibold ${color}`}>
      {rate.toFixed(2)}%
    </span>
  )
}

interface Props {
  creators: Creator[]
  onSelect: (c: Creator) => void
  sortField: SortField
  sortOrder: SortOrder
  onSort: (field: SortField) => void
}

const COLUMNS: { label: string; field: SortField | null; align?: string }[] = [
  { label: 'Creator', field: 'name' },
  { label: 'Subscribers', field: 'subscriber_count', align: 'right' },
  { label: 'Avg Views', field: 'avg_views_per_video', align: 'right' },
  { label: 'Engagement', field: 'engagement_rate', align: 'right' },
  { label: 'Topic', field: null },
  { label: 'Contact', field: null },
]

export default function CreatorTable({ creators, onSelect, sortField, sortOrder, onSort }: Props) {
  function SortIcon({ field }: { field: SortField | null }) {
    if (!field || field !== sortField) return <ChevronDown className="w-3 h-3 opacity-20" />
    return sortOrder === 'desc'
      ? <ChevronDown className="w-3 h-3 text-sky-400" />
      : <ChevronUp className="w-3 h-3 text-sky-400" />
  }

  if (creators.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-12 text-center">
        <p className="text-slate-400 text-sm">Select a niche above to load creators.</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl overflow-hidden shadow-lg shadow-slate-950/30">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/70 bg-slate-900/70">
              {COLUMNS.map((col) => (
                <th
                  key={col.label}
                  onClick={() => col.field && onSort(col.field)}
                  className={`
                    px-4 py-3 text-xs font-semibold text-slate-300 uppercase tracking-wider
                    ${col.align === 'right' ? 'text-right' : 'text-left'}
                    ${col.field ? 'cursor-pointer hover:text-cyan-300 select-none' : ''}
                  `}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.field && <SortIcon field={col.field} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/40">
            {creators.map((creator) => (
              <tr
                key={creator.channel_id}
                onClick={() => onSelect(creator)}
                className="hover:bg-indigo-500/10 cursor-pointer transition-colors group"
              >
                {/* Creator */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {creator.thumbnail_url ? (
                      <img
                        src={creator.thumbnail_url}
                        alt={creator.name}
                        className="w-8 h-8 rounded-full object-cover bg-slate-700 shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-slate-400 text-xs">
                        {creator.name[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white group-hover:text-cyan-300 transition-colors">
                        {creator.name}
                      </p>
                      {creator.country && (
                        <p className="text-xs text-slate-400">{creator.country}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatNumber(creator.subscriber_count)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-200">
                  {formatNumber(Math.round(creator.avg_views_per_video))}
                </td>
                <td className="px-4 py-3 text-right">
                  <EngagementBadge rate={creator.engagement_rate} />
                </td>
                <td className="px-4 py-3">
                  {creator.topic && (
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-400/25 text-indigo-200 text-xs capitalize">
                      {creator.topic}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {creator.emails.length > 0 && (
                      <div className="flex items-center gap-1 text-emerald-400" title={creator.emails[0]}>
                        <Mail className="w-3.5 h-3.5" />
                        <span className="text-xs">{creator.emails.length}</span>
                      </div>
                    )}
                    {creator.channel_url && (
                      <a
                        href={creator.channel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-slate-400 hover:text-cyan-300 transition-colors"
                        title="Open channel"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
