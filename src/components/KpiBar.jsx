import { formatDate } from '../lib/utils'

export default function KpiBar({ list }) {
  const { guests, options, createdAt, updatedAt } = list
  const { labels } = options

  const labelCounts = labels.enabled
    ? labels.items.map(label => ({
        label,
        count: guests.filter(g => g.labelId === label.id).length
      }))
    : []

  const unassigned = labels.enabled
    ? guests.filter(g => !g.labelId).length
    : 0

  return (
    <div className="bg-slate-800/60 rounded-xl p-4 space-y-3">
      {/* Stats principales */}
      <div className="flex gap-4 flex-wrap">
        <Stat label="Invités" value={guests.length} accent />
        <Stat label="Créée" value={formatDate(createdAt)} />
        <Stat label="Modifiée" value={formatDate(updatedAt)} />
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
            {unassigned > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
                Sans label · {unassigned}
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
