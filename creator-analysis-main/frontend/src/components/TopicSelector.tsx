import type { Topic } from '../types'

const TOPIC_ICONS: Record<string, string> = {
  travel: '✈️',
  food: '🍳',
  makeup: '💄',
  grwm: '🪞',
  fitness: '💪',
  tech: '💻',
  fashion: '👗',
  gaming: '🎮',
  lifestyle: '🌟',
  finance: '💰',
  comedy: '😂',
  music: '🎵',
  education: '📚',
  art: '🎨',
  parenting: '👨‍👩‍👧',
  pets: '🐾',
  diy: '🔨',
  sports: '⚽',
  motivation: '🔥',
  vlogs: '📹',
  skincare: '✨',
  cooking: '👨‍🍳',
  dance: '💃',
  photography: '📷',
  cars: '🚗',
}

interface Props {
  topics: Topic[]
  selected: string | null
  onSelect: (topic: string) => void
}

export default function TopicSelector({ topics, selected, onSelect }: Props) {
  return (
    <div className="text-center">
      <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Select a Niche
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {topics.map((topic) => {
          const isSelected = selected === topic.id
          return (
            <button
              key={topic.id}
              onClick={() => onSelect(topic.id)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${isSelected
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800 hover:text-white border border-slate-600/60'
                }
              `}
            >
              <span>{TOPIC_ICONS[topic.id] ?? '📌'}</span>
              <span>{topic.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
