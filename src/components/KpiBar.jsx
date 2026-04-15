import { useState } from 'react'

export default function KpiBar({ list }) {
  const { guests, options } = list
  const { labels, notation } = options

  const [showLabels, setShowLabels] = useState(false)
  const [showRatings, setShowRatings] = useState(false)

  const labelCounts = labels.enabled
    ? labels.items.map(label => ({
        label,
        count: guests.filter(g => g.labelId === label.id).length
      }))
    : []

  const unassignedLabel = labels.enabled
    ? guests.filter(g => !g.labelId).length
    : 0

  const ratingCounts = notation.enabled
    ? Array.from({ length: notation.max }, (_, i) => i + 1).map(n => ({
        rating: n,
        count: guests.filter(g => g.rating === n).length
      })).filter(({ count }) => count > 0)
    : []

  const unassignedRating = notation.enabled
    ? guests.filter(g => g.rating == null).length
    : 0

  const hasLabels = labels.enabled && labels.items.length > 0
  const hasRatings = notation.enabled && guests.length > 0

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 space-y-2">
      {/* Stats principales */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Invités</p>
          <p className="text-lg font-bold text-indigo-400">{guests.length}</p>
        </div>

        {/* Toggles */}
        <div className="flex gap-2 ml-auto flex-wrap justify-end">
          {hasLabels && (
            <button
              onClick={() => setShowLabels(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showLabels
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Labels
              <svg
                className={`w-3 h-3 transition-transform ${showLabels ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
          {hasRatings && (
            <button
              onClick={() => setShowRatings(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showRatings
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Notes
              <svg
                className={`w-3 h-3 transition-transform ${showRatings ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Répartition par label */}
      {showLabels && hasLabels && (
        <div className="flex flex-wrap gap-2 pt-1">
          {labelCounts.map(({ label, count }) => (
            <span
              key={label.id}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: label.color ? label.color + '25' : '#47556920', color: label.color || '#94a3b8' }}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color || '#475569' }} />
              {label.name} · {count}
            </span>
          ))}
          {unassignedLabel > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
              Sans label · {unassignedLabel}
            </span>
          )}
        </div>
      )}

      {/* Répartition par notation */}
      {showRatings && hasRatings && (
        <div className="flex flex-wrap gap-2 pt-1">
          {ratingCounts.map(({ rating, count }) => (
            <span
              key={rating}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-400 bg-indigo-400/10"
            >
              {rating}/{notation.max} · {count}
            </span>
          ))}
          {unassignedRating > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
              Sans note · {unassignedRating}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
