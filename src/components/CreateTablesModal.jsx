import { useState } from 'react'

function uid() { return Math.random().toString(36).slice(2) }

function RoundIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 32 32" className={`w-5 h-5 ${className}`} aria-hidden>
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
    <svg viewBox="0 0 40 28" className={`w-7 h-5 ${className}`} aria-hidden>
      <rect x="5" y="5" width="30" height="18" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2" />
      {[12, 20, 28].map(x => <circle key={`t${x}`} cx={x} cy="2" r="2" fill="currentColor" />)}
      {[12, 20, 28].map(x => <circle key={`b${x}`} cx={x} cy="26" r="2" fill="currentColor" />)}
      <circle cx="2" cy="12" r="2" fill="currentColor" /><circle cx="2" cy="18" r="2" fill="currentColor" />
      <circle cx="38" cy="12" r="2" fill="currentColor" /><circle cx="38" cy="18" r="2" fill="currentColor" />
    </svg>
  )
}

function ShapeIcon({ shape, className }) {
  return shape === 'round' ? <RoundIcon className={className} /> : <RectIcon className={className} />
}

function Counter({ value, onChange, min = 1, max = 50 }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors">−</button>
      <span className="w-8 text-center text-white font-semibold tabular-nums select-none">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors">+</button>
    </div>
  )
}

export default function CreateTablesModal({
  existingCount = 0,
  guestCount = 0,
  types, setTypes,
  selectedTypeId, setSelectedTypeId,
  onClose, onCreate,
}) {
  // Config panel — local, no need to persist
  const [cfgShape, setCfgShape] = useState('round')
  const [cfgSeats, setCfgSeats] = useState(8)
  const [cfgCount, setCfgCount] = useState(1)
  const [editingId, setEditingId] = useState(null)

  const totalCount  = types.reduce((s, t) => s + t.count, 0)
  const totalSeats  = types.reduce((s, t) => s + t.seats * t.count, 0)
  const selectedType = types.find(t => t.id === selectedTypeId) ?? null

  // Duplicate detection — includes type number for the message
  const duplicateType = types.find(t => t.id !== editingId && t.shape === cfgShape && t.seats === cfgSeats)
  const duplicateTypeIdx = duplicateType ? types.indexOf(duplicateType) : -1

  function typeOffset(typeId) {
    let offset = 0
    for (const t of types) {
      if (t.id === typeId) return offset
      offset += t.count
    }
    return offset
  }

  function resetConfig() {
    setCfgShape('round'); setCfgSeats(8); setCfgCount(1); setEditingId(null)
  }

  function handleReset() {
    setTypes([])
    setSelectedTypeId(null)
    resetConfig()
  }

  function handleAddOrUpdate() {
    if (duplicateType) return

    if (editingId) {
      setTypes(prev => prev.map(t => {
        if (t.id !== editingId) return t
        let names = [...t.names]
        if (cfgCount > t.count) {
          const typeIdx = prev.findIndex(x => x.id === editingId)
          const offset = prev.slice(0, typeIdx).reduce((s, x) => s + x.count, 0)
          names = [
            ...names,
            ...Array.from({ length: cfgCount - t.count }, (_, i) =>
              `Table ${existingCount + offset + t.count + i + 1}`
            )
          ]
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
      const newType = { id: uid(), shape: cfgShape, seats: cfgSeats, count: cfgCount, names }
      setTypes(prev => [...prev, newType])
      setSelectedTypeId(newType.id)
    }

    resetConfig()
  }

  function handleEditClick(e, type) {
    e.stopPropagation()
    setCfgShape(type.shape); setCfgSeats(type.seats); setCfgCount(type.count)
    setEditingId(type.id)
  }

  function handleDeleteType() {
    if (selectedTypeId === editingId) setSelectedTypeId(null)
    setTypes(prev => prev.filter(t => t.id !== editingId))
    resetConfig()
  }

  function updateName(typeId, nameIdx, value) {
    setTypes(prev => prev.map(t =>
      t.id === typeId ? { ...t, names: t.names.map((n, i) => i === nameIdx ? value : n) } : t
    ))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (totalCount === 0) return
    const configs = types.flatMap((type, typeIdx) => {
      const offset = types.slice(0, typeIdx).reduce((s, t) => s + t.count, 0)
      return type.names.map((name, i) => ({
        name: name.trim() || `Table ${existingCount + offset + i + 1}`,
        shape: type.shape,
        seats: type.seats,
      }))
    })
    onCreate(configs)
  }

  const seatsOk = totalSeats >= guestCount

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 uppercase tracking-wide">Créer des tables</p>
              <div className="flex items-center gap-2">
                {types.length > 0 && (
                  <button type="button" onClick={handleReset}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                    Réinitialiser
                  </button>
                )}
                <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── Config panel ── */}
            <div className="bg-slate-700/50 rounded-xl p-4 space-y-4">
              {editingId && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">
                    Modification · Type {types.findIndex(t => t.id === editingId) + 1}
                  </p>
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
                        <ShapeIcon shape={key} />
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
                  <Counter value={cfgSeats} onChange={setCfgSeats} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Nombre</p>
                  <Counter value={cfgCount} onChange={setCfgCount} />
                </div>
              </div>

              {/* Duplicate warning with type reference */}
              {duplicateType && (
                <p className="text-xs text-amber-400">
                  Identique au{' '}
                  <span className="font-semibold">Type {duplicateTypeIdx + 1}</span>
                  {' '}({duplicateType.shape === 'round' ? 'Ronde' : 'Rectangulaire'} · {duplicateType.seats} places).
                </p>
              )}

              <div className="flex gap-2">
                {editingId && (
                  <button type="button" onClick={handleDeleteType}
                    className="px-3 py-2.5 rounded-xl text-sm text-red-400 bg-red-500/10 hover:bg-red-500/20 transition-colors font-medium">
                    Supprimer
                  </button>
                )}
                <button type="button" onClick={handleAddOrUpdate} disabled={!!duplicateType}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">
                  {editingId ? 'Modifier ce type' : 'Ajouter ce type'}
                </button>
              </div>
            </div>

            {/* ── Types list ── */}
            {types.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Types créés</p>
                <div className="space-y-1.5">
                  {types.map((type, typeIdx) => {
                    const isSelected = selectedTypeId === type.id
                    const isEditing  = editingId === type.id
                    return (
                      <button key={type.id} type="button"
                        onClick={() => setSelectedTypeId(isSelected ? null : type.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                          isSelected ? 'bg-indigo-500/15 ring-1 ring-indigo-500/40 text-white' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                        } ${isEditing ? 'ring-1 ring-indigo-400/50' : ''}`}>
                        <ShapeIcon shape={type.shape} className="flex-shrink-0 text-slate-400" />
                        <span className="flex-1 font-medium">Type {typeIdx + 1}</span>
                        <span className="text-slate-500 text-xs">
                          {type.shape === 'round' ? 'Ronde' : 'Rect.'} · {type.seats}pl. · ×{type.count}
                        </span>
                        <button type="button" onClick={e => handleEditClick(e, type)}
                          title="Modifier ce type"
                          className="ml-1 p-1 rounded text-slate-500 hover:text-slate-200 transition-colors flex-shrink-0">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Tables of selected type ── */}
            {selectedType && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Tables · Type {types.findIndex(t => t.id === selectedTypeId) + 1}
                  <span className="normal-case font-normal text-slate-600 ml-1">
                    ({selectedType.shape === 'round' ? 'Ronde' : 'Rectangulaire'} · {selectedType.seats} places)
                  </span>
                </p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {selectedType.names.map((name, nameIdx) => {
                    const flatIdx = typeOffset(selectedTypeId) + nameIdx
                    return (
                      <div key={nameIdx} className="flex items-center gap-2">
                        <span className="text-slate-600 text-xs w-5 text-right flex-shrink-0 tabular-nums">{flatIdx + 1}</span>
                        <ShapeIcon shape={selectedType.shape} className="flex-shrink-0 text-slate-600 w-4 h-4" />
                        <input
                          type="text"
                          value={name}
                          onChange={e => updateName(selectedTypeId, nameIdx, e.target.value)}
                          className="flex-1 min-w-0 bg-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Stats ── */}
            {totalCount > 0 && (
              <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm ${
                seatsOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold tabular-nums ${seatsOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {totalSeats} place{totalSeats > 1 ? 's' : ''}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400 tabular-nums">{guestCount} invité{guestCount > 1 ? 's' : ''}</span>
                </div>
                {seatsOk
                  ? <span className="text-emerald-400 text-xs font-medium">+{totalSeats - guestCount} libre{totalSeats - guestCount > 1 ? 's' : ''}</span>
                  : <span className="text-amber-400 text-xs font-medium">{guestCount - totalSeats} sans place</span>
                }
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={totalCount === 0}
              className="w-full bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors">
              {totalCount === 0
                ? 'Ajoutez au moins un type'
                : `Créer ${totalCount} table${totalCount > 1 ? 's' : ''}`}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}
