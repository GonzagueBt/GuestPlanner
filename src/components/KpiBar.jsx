export default function KpiBar({ list }) {
  const { guests, options } = list
  const { labels, notation } = options

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

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
      {/* Stats principales */}
      <div className="flex gap-4 flex-wrap">
        <Stat label="Invités" value={guests.length} accent />
      </div>

      {/* Répartition par label */}
      {labels.enabled && labels.items.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Par label</p>
          <div className="flex flex-wrap gap-2">
            {labelCounts.map(({ label, count }) => (
              <span
                key={label.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: label.color ? label.color + '25' : '#47556920', color: label.color || '#94a3b8' }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: label.color || '#475569' }}
                />
                {label.name} · {count}
              </span>
            ))}
            {unassignedLabel > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
                Sans label · {unassignedLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Répartition par notation */}
      {notation.enabled && guests.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Par note</p>
          <div className="flex flex-wrap gap-2">
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
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold ${accent ? 'text-indigo-400' : 'text-white'}`}>{value}</p>
    </div>
  )
}
