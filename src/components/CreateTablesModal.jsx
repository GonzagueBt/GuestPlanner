import { useState, useEffect, useId } from 'react'

function uid() {
  return Math.random().toString(36).slice(2)
}

function RoundIcon({ active }) {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
      <circle cx="20" cy="20" r="14" fill="none"
        stroke={active ? '#fff' : '#94a3b8'} strokeWidth="2.5" />
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const rad = (deg * Math.PI) / 180
        const x = 20 + 19 * Math.sin(rad)
        const y = 20 - 19 * Math.cos(rad)
        return <circle key={deg} cx={x} cy={y} r="2.5"
          fill={active ? '#c7d2fe' : '#475569'} />
      })}
    </svg>
  )
}

function RectIcon({ active }) {
  return (
    <svg viewBox="0 0 48 32" className="w-10 h-7">
      <rect x="6" y="6" width="36" height="20" rx="2" fill="none"
        stroke={active ? '#fff' : '#94a3b8'} strokeWidth="2.5" />
      {[12, 24, 36].map(x => (
        <circle key={`t${x}`} cx={x} cy="3" r="2.5" fill={active ? '#c7d2fe' : '#475569'} />
      ))}
      {[12, 24, 36].map(x => (
        <circle key={`b${x}`} cx={x} cy="29" r="2.5" fill={active ? '#c7d2fe' : '#475569'} />
      ))}
      {[11, 21].map(y => (
        <circle key={`l${y}`} cx="3" cy={y} r="2.5" fill={active ? '#c7d2fe' : '#475569'} />
      ))}
      {[11, 21].map(y => (
        <circle key={`r${y}`} cx="45" cy={y} r="2.5" fill={active ? '#c7d2fe' : '#475569'} />
      ))}
    </svg>
  )
}

function Counter({ value, onChange, min = 1, max = 50 }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
      >−</button>
      <span className="w-8 text-center text-white font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors"
      >+</button>
    </div>
  )
}

export default function CreateTablesModal({ existingCount = 0, onClose, onCreate }) {
  const [groups, setGroups] = useState([
    { id: uid(), shape: 'round', seats: 8, count: 1 }
  ])
  const [names, setNames] = useState([`Table ${existingCount + 1}`])

  const totalCount = groups.reduce((s, g) => s + g.count, 0)

  // Resize names array when total changes, preserving existing edits
  useEffect(() => {
    setNames(prev => {
      if (prev.length === totalCount) return prev
      if (prev.length < totalCount) {
        return [
          ...prev,
          ...Array.from({ length: totalCount - prev.length }, (_, i) =>
            `Table ${existingCount + prev.length + i + 1}`
          )
        ]
      }
      return prev.slice(0, totalCount)
    })
  }, [totalCount, existingCount])

  function updateGroup(id, key, val) {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, [key]: val } : g))
  }

  function removeGroup(id) {
    setGroups(prev => prev.filter(g => g.id !== id))
  }

  function addGroup() {
    setGroups(prev => [...prev, { id: uid(), shape: 'round', seats: 8, count: 1 }])
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (totalCount === 0) return
    const configs = []
    let idx = 0
    for (const g of groups) {
      for (let i = 0; i < g.count; i++) {
        configs.push({ name: names[idx]?.trim() || `Table ${existingCount + idx + 1}`, shape: g.shape, seats: g.seats })
        idx++
      }
    }
    onCreate(configs)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Créer des tables</p>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Groups */}
            {groups.map((group, gi) => (
              <div key={group.id} className="bg-slate-700/50 rounded-xl p-4 space-y-4">
                {groups.length > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Type {gi + 1}</p>
                    <button
                      type="button"
                      onClick={() => removeGroup(group.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                    >Supprimer</button>
                  </div>
                )}

                {/* Shape */}
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Forme</p>
                  <div className="flex gap-2">
                    {[
                      { key: 'round', label: 'Ronde' },
                      { key: 'rect', label: 'Rectangulaire' },
                    ].map(({ key, label }) => {
                      const active = group.shape === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => updateGroup(group.id, 'shape', key)}
                          className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${
                            active
                              ? 'bg-indigo-500/25 ring-2 ring-indigo-500/70 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600/80'
                          }`}
                        >
                          {key === 'round'
                            ? <RoundIcon active={active} />
                            : <RectIcon active={active} />
                          }
                          <span className="text-xs font-medium">{label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Seats + Count */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Places</p>
                    <Counter
                      value={group.seats}
                      onChange={v => updateGroup(group.id, 'seats', v)}
                      min={1}
                      max={50}
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Nombre</p>
                    <Counter
                      value={group.count}
                      onChange={v => updateGroup(group.id, 'count', v)}
                      min={1}
                      max={50}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add group */}
            <button
              type="button"
              onClick={addGroup}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:text-slate-200 hover:border-slate-500 text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un autre type de table
            </button>

            {/* Names */}
            {totalCount > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Noms des tables
                </p>
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {names.map((name, i) => {
                    // Find which group this table belongs to for the shape badge
                    let cumul = 0
                    let tableGroup = groups[0]
                    for (const g of groups) {
                      cumul += g.count
                      if (i < cumul) { tableGroup = g; break }
                    }
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-slate-500 text-xs w-4 text-right flex-shrink-0">{i + 1}</span>
                        {tableGroup.shape === 'round'
                          ? <span className="w-4 h-4 rounded-full border border-slate-500 flex-shrink-0" />
                          : <span className="w-5 h-3.5 rounded-sm border border-slate-500 flex-shrink-0" />
                        }
                        <input
                          type="text"
                          value={name}
                          onChange={e => setNames(prev => prev.map((n, j) => j === i ? e.target.value : n))}
                          className="flex-1 bg-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                        />
                        <span className="text-xs text-slate-600 flex-shrink-0">{tableGroup.seats}pl.</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={totalCount === 0}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              Créer {totalCount} table{totalCount > 1 ? 's' : ''}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}
