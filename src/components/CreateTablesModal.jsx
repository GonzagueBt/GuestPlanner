import { useState } from 'react'

function uid() { return Math.random().toString(36).slice(2) }

function RoundIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={`w-6 h-6 ${className}`} aria-hidden>
      <circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      {[0, 60, 120, 180, 240, 300].map(deg => {
        const r = (deg * Math.PI) / 180
        return <circle key={deg} cx={16 + 15 * Math.sin(r)} cy={16 - 15 * Math.cos(r)} r="2" fill="currentColor" />
      })}
    </svg>
  )
}

function RectIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 40 28" className={`w-8 h-6 ${className}`} aria-hidden>
      <rect x="5" y="5" width="30" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      {[12, 20, 28].map(x => <circle key={`t${x}`} cx={x} cy="2" r="2" fill="currentColor" />)}
      {[12, 20, 28].map(x => <circle key={`b${x}`} cx={x} cy="26" r="2" fill="currentColor" />)}
      <circle cx="2" cy="12" r="2" fill="currentColor" />
      <circle cx="2" cy="18" r="2" fill="currentColor" />
      <circle cx="38" cy="12" r="2" fill="currentColor" />
      <circle cx="38" cy="18" r="2" fill="currentColor" />
    </svg>
  )
}

function Counter({ value, onChange, min = 1, max = 50 }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors">
        −
      </button>
      <span className="w-8 text-center text-white font-semibold tabular-nums select-none">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors">
        +
      </button>
    </div>
  )
}

function ShapeLabel({ shape }) {
  return shape === 'round' ? 'Ronde' : 'Rectangulaire'
}

export default function CreateTablesModal({ existingCount = 0, onClose, onCreate }) {
  // Created types
  const [types, setTypes] = useState([])

  // Config panel state
  const [cfgShape, setCfgShape] = useState('round')
  const [cfgSeats, setCfgSeats] = useState(8)
  const [cfgCount, setCfgCount] = useState(1)
  const [editingId, setEditingId] = useState(null) // null = adding new

  const totalCount = types.reduce((s, t) => s + t.count, 0)

  // Duplicate: same shape + same seats, excluding the one currently being edited
  const isDuplicate = types.some(t => t.id !== editingId && t.shape === cfgShape && t.seats === cfgSeats)

  // Flat list for the names section
  const flatNames = types.flatMap((type, typeIdx) => {
    const startFlat = types.slice(0, typeIdx).reduce((s, t) => s + t.count, 0)
    return type.names.map((name, nameIdx) => ({
      typeId: type.id,
      typeIdx,
      shape: type.shape,
      seats: type.seats,
      name,
      nameIdx,
      flatIdx: startFlat + nameIdx,
    }))
  })

  function resetConfig() {
    setCfgShape('round')
    setCfgSeats(8)
    setCfgCount(1)
    setEditingId(null)
  }

  function handleAddOrUpdate() {
    if (isDuplicate) return

    if (editingId) {
      setTypes(prev => prev.map(t => {
        if (t.id !== editingId) return t
        let names = [...t.names]
        if (cfgCount > t.count) {
          // How many tables precede this type (flat offset)
          const typeIdx = prev.findIndex(x => x.id === editingId)
          const offset = prev.slice(0, typeIdx).reduce((s, x) => s + x.count, 0)
          const extra = Array.from({ length: cfgCount - t.count }, (_, i) =>
            `Table ${existingCount + offset + t.count + i + 1}`
          )
          names = [...names, ...extra]
        } else {
          names = names.slice(0, cfgCount)
        }
        return { ...t, shape: cfgShape, seats: cfgSeats, count: cfgCount, names }
      }))
    } else {
      const offset = types.reduce((s, t) => s + t.count, 0)
      const names = Array.from({ length: cfgCount }, (_, i) =>
        `Table ${existingCount + offset + i + 1}`
      )
      setTypes(prev => [...prev, { id: uid(), shape: cfgShape, seats: cfgSeats, count: cfgCount, names }])
    }

    resetConfig()
  }

  function handleTypeClick(type) {
    setCfgShape(type.shape)
    setCfgSeats(type.seats)
    setCfgCount(type.count)
    setEditingId(type.id)
  }

  function handleDeleteType() {
    setTypes(prev => prev.filter(t => t.id !== editingId))
    resetConfig()
  }

  function updateName(typeId, nameIdx, value) {
    setTypes(prev => prev.map(t =>
      t.id === typeId
        ? { ...t, names: t.names.map((n, i) => i === nameIdx ? value : n) }
        : t
    ))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (totalCount === 0) return
    const configs = flatNames.map(({ name, shape, seats, flatIdx }) => ({
      name: name.trim() || `Table ${existingCount + flatIdx + 1}`,
      shape,
      seats,
    }))
    onCreate(configs)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Créer des tables</p>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* ── Config panel ── */}
            <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
              {editingId && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase">Modification</p>
                  <button type="button" onClick={resetConfig} className="text-xs text-slate-400 hover:text-white transition-colors">
                    Annuler
                  </button>
                </div>
              )}

              {/* Shape */}
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Forme</p>
                <div className="flex gap-2">
                  {[{ key: 'round', label: 'Ronde' }, { key: 'rect', label: 'Rectangulaire' }].map(({ key, label }) => {
                    const active = cfgShape === key
                    return (
                      <button key={key} type="button" onClick={() => setCfgShape(key)}
                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${
                          active ? 'bg-indigo-500/20 ring-2 ring-indigo-500/60 text-indigo-300' : 'bg-slate-700 text-slate-400 hover:bg-slate-600/80 hover:text-slate-200'
                        }`}>
                        {key === 'round' ? <RoundIcon /> : <RectIcon />}
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
                  <Counter value={cfgSeats} onChange={setCfgSeats} min={1} max={50} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Nombre</p>
                  <Counter value={cfgCount} onChange={setCfgCount} min={1} max={50} />
                </div>
              </div>

              {/* Duplicate warning */}
              {isDuplicate && (
                <p className="text-xs text-amber-400">
                  Un type <ShapeLabel shape={cfgShape} /> · {cfgSeats} places existe déjà.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {editingId && (
                  <button type="button" onClick={handleDeleteType}
                    className="px-3 py-2.5 rounded-xl text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors font-medium">
                    Supprimer
                  </button>
                )}
                <button type="button" onClick={handleAddOrUpdate} disabled={isDuplicate}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 active:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">
                  {editingId ? 'Modifier ce type' : 'Ajouter ce type'}
                </button>
              </div>
            </div>

            {/* ── Types summary ── */}
            {types.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Types créés</p>
                <div className="space-y-1.5">
                  {types.map(type => (
                    <button key={type.id} type="button" onClick={() => handleTypeClick(type)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                        editingId === type.id
                          ? 'bg-indigo-500/20 ring-1 ring-indigo-500/50 text-indigo-200'
                          : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                      }`}>
                      {type.shape === 'round'
                        ? <RoundIcon className="flex-shrink-0 text-slate-400" />
                        : <RectIcon className="flex-shrink-0 text-slate-400" />
                      }
                      <span className="flex-1">
                        <ShapeLabel shape={type.shape} /> · {type.seats} places
                      </span>
                      <span className="text-slate-500 tabular-nums">×{type.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Names list ── */}
            {totalCount > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Noms des tables</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {flatNames.map(({ typeId, shape, seats, name, nameIdx, flatIdx }) => (
                    <div key={`${typeId}-${nameIdx}`} className="flex items-center gap-2">
                      <span className="text-slate-600 text-xs w-5 text-right flex-shrink-0 tabular-nums">
                        {flatIdx + 1}
                      </span>
                      {shape === 'round'
                        ? <span className="w-3.5 h-3.5 rounded-full border border-slate-500 flex-shrink-0" />
                        : <span className="w-4 h-3 rounded-sm border border-slate-500 flex-shrink-0" />
                      }
                      <input
                        type="text"
                        value={name}
                        onChange={e => updateName(typeId, nameIdx, e.target.value)}
                        className="flex-1 min-w-0 bg-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-500"
                      />
                      <span className="text-xs text-slate-600 flex-shrink-0 tabular-nums">{seats}pl.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={totalCount === 0}
              className="w-full bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors">
              {totalCount === 0
                ? 'Configurez au moins un type'
                : `Créer ${totalCount} table${totalCount > 1 ? 's' : ''}`}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}
