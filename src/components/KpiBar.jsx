import { useState } from 'react'

function ChevronIcon({ open }) {
  return (
    <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function KpiBar({ list }) {
  const { guests, options } = list
  const { labelSystem1, labelSystem2, notation } = options

  const [showLabels1, setShowLabels1] = useState(false)
  const [showLabels2, setShowLabels2] = useState(false)
  const [showRatings, setShowRatings] = useState(false)

  const maleCount = guests.filter(g => g.gender === 'M').length
  const femaleCount = guests.filter(g => g.gender === 'F').length

  const label1Counts = labelSystem1.enabled
    ? labelSystem1.items.map(label => ({ label, count: guests.filter(g => g.labelId1 === label.id).length }))
    : []
  const unassigned1 = labelSystem1.enabled ? guests.filter(g => !g.labelId1).length : 0

  const label2Counts = labelSystem2.enabled
    ? labelSystem2.items.map(label => ({ label, count: guests.filter(g => g.labelId2 === label.id).length }))
    : []
  const unassigned2 = labelSystem2.enabled ? guests.filter(g => !g.labelId2).length : 0

  const ratingCounts = notation.enabled
    ? Array.from({ length: notation.max }, (_, i) => i + 1)
        .map(n => ({ rating: n, count: guests.filter(g => g.rating === n).length }))
        .filter(({ count }) => count > 0)
    : []
  const unassignedRating = notation.enabled ? guests.filter(g => g.rating == null).length : 0

  const hasLabels1 = labelSystem1.enabled && labelSystem1.items.length > 0
  const hasLabels2 = labelSystem2.enabled && labelSystem2.items.length > 0
  const hasRatings = notation.enabled && guests.length > 0

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 space-y-2">
      {/* Stats principales */}
      <div className="flex items-center gap-4 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Invités</p>
          <p className="text-lg font-bold text-indigo-400">{guests.length}</p>
        </div>

        {(maleCount > 0 || femaleCount > 0) && (
          <>
            {maleCount > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">♂</p>
                <p className="text-lg font-bold text-blue-400">{maleCount}</p>
              </div>
            )}
            {femaleCount > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">♀</p>
                <p className="text-lg font-bold text-pink-400">{femaleCount}</p>
              </div>
            )}
          </>
        )}

        {/* Toggles */}
        <div className="flex gap-2 ml-auto flex-wrap justify-end">
          {hasLabels1 && (
            <button
              onClick={() => setShowLabels1(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showLabels1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {labelSystem1.name}
              <ChevronIcon open={showLabels1} />
            </button>
          )}
          {hasLabels2 && (
            <button
              onClick={() => setShowLabels2(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showLabels2 ? 'bg-teal-500/20 text-teal-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {labelSystem2.name}
              <ChevronIcon open={showLabels2} />
            </button>
          )}
          {hasRatings && (
            <button
              onClick={() => setShowRatings(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showRatings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Notes
              <ChevronIcon open={showRatings} />
            </button>
          )}
        </div>
      </div>

      {/* Répartition par label 1 */}
      {showLabels1 && hasLabels1 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {label1Counts.map(({ label, count }) => (
            <span key={label.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: label.color ? label.color + '25' : '#47556920', color: label.color || '#94a3b8' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color || '#475569' }} />
              {label.name} · {count}
            </span>
          ))}
          {unassigned1 > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
              Sans {labelSystem1.name} · {unassigned1}
            </span>
          )}
        </div>
      )}

      {/* Répartition par label 2 */}
      {showLabels2 && hasLabels2 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {label2Counts.map(({ label, count }) => (
            <span key={label.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{ backgroundColor: label.color ? label.color + '25' : '#47556920', color: label.color || '#94a3b8' }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color || '#475569' }} />
              {label.name} · {count}
            </span>
          ))}
          {unassigned2 > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
              Sans {labelSystem2.name} · {unassigned2}
            </span>
          )}
        </div>
      )}

      {/* Répartition par notation */}
      {showRatings && hasRatings && (
        <div className="flex flex-wrap gap-2 pt-1">
          {ratingCounts.map(({ rating, count }) => (
            <span key={rating} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-400 bg-indigo-400/10">
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
