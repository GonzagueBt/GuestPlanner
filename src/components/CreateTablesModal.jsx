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

function Counter({ value, onChange, min = 1, max = 50, disabled = false }) {
  return (
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(Math.max(min, value - 1))} disabled={disabled || value <= min}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors">−</button>
      <span className="w-8 text-center text-white font-semibold tabular-nums select-none">{value}</span>
      <button type="button" onClick={() => onChange(Math.min(max, value + 1))} disabled={disabled || value >= max}
        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center transition-colors">+</button>
    </div>
  )
}

// Group existing tables by (shape × seats), preserving IDs for deletion
function groupTables(tables) {
  const groups = []
  for (const t of tables) {
    const g = groups.find(g => g.shape === t.shape && g.seats === t.seats)
    if (g) {
      g.existingCount++
      g.count++
      g.names.push(t.name)
      g.existingIds.push(t.id)
    } else {
      groups.push({
        id: uid(),
        shape: t.shape,
        seats: t.seats,
        existingCount: 1,
        count: 1,
        names: [t.name],
        existingIds: [t.id],
      })
    }
  }
  return groups
}

export default function CreateTablesModal({
  tables = [],
  guestCount = 0,
  participationEnabled = false,
  onClose,
  onCreate,
  onDeleteTables,
}) {
  const [types, setTypes] = useState(() => groupTables(tables))
  const [toDeleteIds, setToDeleteIds] = useState([])
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [cfgShape, setCfgShape] = useState('round')
  const [cfgSeats, setCfgSeats] = useState(8)
  const [cfgCount, setCfgCount] = useState(1)
  const [editingId, setEditingId] = useState(null)

  const totalExisting = types.reduce((s, t) => s + t.existingCount, 0)
  const totalNew  = types.reduce((s, t) => s + Math.max(0, t.count - t.existingCount), 0)
  const totalSeats = types.reduce((s, t) => s + t.seats * t.count, 0)
  const selectedType = types.find(t => t.id === selectedTypeId) ?? null
  const editingType  = types.find(t => t.id === editingId) ?? null
  const isEditingExisting = (editingType?.existingCount ?? 0) > 0

  const hasChanges = totalNew > 0 || toDeleteIds.length > 0

  const duplicateType = types.find(t =>
    t.id !== editingId && t.shape === cfgShape && t.seats === cfgSeats
  )
  const duplicateTypeIdx = duplicateType ? types.indexOf(duplicateType) : -1

  function newOffsetBefore(typesList, beforeId) {
    let offset = 0
    for (const t of typesList) {
      if (t.id === beforeId) return offset
      offset += Math.max(0, t.count - t.existingCount)
    }
    return offset
  }

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
    setTypes(groupTables(tables))
    setToDeleteIds([])
    setSelectedTypeId(null)
    resetConfig()
  }

  function handleAddOrUpdate() {
    if (duplicateType) return

    if (editingId) {
      setTypes(prev => prev.map(t => {
        if (t.id !== editingId) return t
        const minCount = t.existingCount > 0 ? t.existingCount : 1
        const newCount = Math.max(minCount, cfgCount)
        let names = [...t.names]
        if (newCount > t.count) {
          const offset = newOffsetBefore(prev, editingId)
          names = [
            ...names,
            ...Array.from({ length: newCount - t.count }, (_, i) =>
              `Table ${totalExisting + offset + (t.count - t.existingCount) + i + 1}`
            ),
          ]
        } else {
          names = names.slice(0, newCount)
        }
        const shape = t.existingCount > 0 ? t.shape : cfgShape
        const seats = t.existingCount > 0 ? t.seats : cfgSeats
        return { ...t, shape, seats, count: newCount, names }
      }))
    } else {
      const offset = types.reduce((s, t) => s + Math.max(0, t.count - t.existingCount), 0)
      const names = Array.from({ length: cfgCount }, (_, i) =>
        `Table ${totalExisting + offset + i + 1}`
      )
      const newType = { id: uid(), shape: cfgShape, seats: cfgSeats, existingCount: 0, count: cfgCount, names, existingIds: [] }
      setTypes(prev => [...prev, newType])
      setSelectedTypeId(newType.id)
    }
    resetConfig()
  }

  function handleEditClick(e, type) {
    e.stopPropagation()
    setCfgShape(type.shape)
    setCfgSeats(type.seats)
    setCfgCount(type.count)
    setEditingId(type.id)
  }

  function handleDeleteType() {
    const type = types.find(t => t.id === editingId)
    if (!type) return
    if (type.existingIds?.length) {
      setToDeleteIds(prev => [...prev, ...type.existingIds])
    }
    if (selectedTypeId === editingId) setSelectedTypeId(null)
    setTypes(prev => prev.filter(t => t.id !== editingId))
    resetConfig()
  }

  function handleDeleteExistingTable(typeId, nameIdx) {
    const type = types.find(t => t.id === typeId)
    if (!type || nameIdx >= type.existingCount) return
    const deletedId = type.existingIds[nameIdx]
    setToDeleteIds(prev => [...prev, deletedId])
    setTypes(prev => prev.map(t => {
      if (t.id !== typeId) return t
      const newExistingIds = t.existingIds.filter((_, i) => i !== nameIdx)
      const newNames = t.names.filter((_, i) => i !== nameIdx)
      const newExistingCount = t.existingCount - 1
      const newCount = t.count - 1
      if (newCount === 0) return null
      return { ...t, existingIds: newExistingIds, names: newNames, existingCount: newExistingCount, count: newCount }
    }).filter(Boolean))
    if (type.count - 1 === 0 && selectedTypeId === typeId) {
      setSelectedTypeId(null)
    }
  }

  function updateName(typeId, nameIdx, value) {
    setTypes(prev => prev.map(t =>
      t.id === typeId ? { ...t, names: t.names.map((n, i) => i === nameIdx ? value : n) } : t
    ))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (totalNew === 0 && toDeleteIds.length === 0) return

    if (totalNew > 0) {
      let runningNew = 0
      const configs = types.flatMap(type => {
        const delta = Math.max(0, type.count - type.existingCount)
        if (delta === 0) return []
        const result = type.names.slice(type.existingCount).map((name, i) => ({
          name: name.trim() || `Table ${totalExisting + runningNew + i + 1}`,
          shape: type.shape,
          seats: type.seats,
        }))
        runningNew += delta
        return result
      })
      onCreate(configs)
    }

    if (toDeleteIds.length > 0 && onDeleteTables) {
      onDeleteTables(toDeleteIds)
    }
  }

  const seatsOk = totalSeats >= guestCount
  const canSubmit = totalNew > 0 || toDeleteIds.length > 0

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pt-4 pb-safe-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar animate-slide-up sm:animate-scale-in">
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-5">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">
                  {totalExisting > 0 ? 'Gérer les tables' : 'Créer des tables'}
                </p>
                {totalExisting > 0 && (
                  <p className="text-xs text-slate-600 mt-0.5">
                    {totalExisting} table{totalExisting > 1 ? 's' : ''} existante{totalExisting > 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {hasChanges && (
                  <button type="button" onClick={handleReset}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                    Annuler
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
                  <div>
                    <p className="text-xs text-indigo-400 font-medium uppercase tracking-wide">
                      {isEditingExisting ? 'Ajouter des tables · Type' : 'Modification · Type'}{' '}
                      {types.findIndex(t => t.id === editingId) + 1}
                    </p>
                    {isEditingExisting && (
                      <p className="text-xs text-slate-500 mt-0.5">Forme et places verrouillées</p>
                    )}
                  </div>
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
                    const locked = isEditingExisting
                    return (
                      <button key={key} type="button"
                        onClick={() => !locked && setCfgShape(key)}
                        disabled={locked}
                        className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl transition-all ${
                          locked
                            ? 'opacity-40 cursor-not-allowed ' + (active ? 'bg-indigo-500/20 ring-2 ring-indigo-500/60 text-indigo-300' : 'bg-slate-700 text-slate-400')
                            : active
                              ? 'bg-indigo-500/20 ring-2 ring-indigo-500/60 text-indigo-300'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600/80 hover:text-slate-200'
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
                  <Counter value={cfgSeats} onChange={setCfgSeats} disabled={isEditingExisting} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                    {isEditingExisting ? 'Total' : 'Nombre'}
                  </p>
                  <Counter
                    value={cfgCount}
                    onChange={setCfgCount}
                    min={isEditingExisting ? (editingType?.existingCount ?? 1) : 1}
                  />
                  {isEditingExisting && editingType && cfgCount > editingType.existingCount && (
                    <p className="text-xs text-emerald-400 mt-1.5 text-center tabular-nums">
                      +{cfgCount - editingType.existingCount} à créer
                    </p>
                  )}
                </div>
              </div>

              {/* Duplicate warning */}
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
                    {isEditingExisting ? 'Supprimer le type' : 'Supprimer'}
                  </button>
                )}
                <button type="button" onClick={handleAddOrUpdate} disabled={!!duplicateType}
                  className="flex-1 bg-slate-600 hover:bg-slate-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-2.5 text-sm transition-colors">
                  {editingId
                    ? isEditingExisting
                      ? cfgCount > (editingType?.existingCount ?? 0)
                        ? `Ajouter ${cfgCount - (editingType?.existingCount ?? 0)} table${cfgCount - (editingType?.existingCount ?? 0) > 1 ? 's' : ''}`
                        : 'Aucun ajout'
                      : 'Modifier ce type'
                    : 'Ajouter ce type'}
                </button>
              </div>
            </div>

            {/* ── Types list ── */}
            {types.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Types de tables</p>
                <div className="space-y-1.5">
                  {types.map((type, typeIdx) => {
                    const isSelected = selectedTypeId === type.id
                    const isEditing  = editingId === type.id
                    const delta = type.count - type.existingCount
                    return (
                      <button key={type.id} type="button"
                        onClick={() => setSelectedTypeId(isSelected ? null : type.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                          isSelected ? 'bg-indigo-500/15 ring-1 ring-indigo-500/40 text-white' : 'bg-slate-700/60 hover:bg-slate-700 text-slate-300'
                        } ${isEditing ? 'ring-1 ring-indigo-400/50' : ''}`}>
                        <ShapeIcon shape={type.shape} className="flex-shrink-0 text-slate-400" />
                        <span className="flex-1 font-medium">Type {typeIdx + 1}</span>
                        <span className="text-slate-500 text-xs">
                          {type.shape === 'round' ? 'Ronde' : 'Rect.'} · {type.seats}pl.
                          {' · '}
                          <span className="text-slate-400">{type.existingCount}</span>
                          {delta > 0 && <span className="text-emerald-400"> +{delta}</span>}
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
                    const isExisting = nameIdx < selectedType.existingCount
                    return (
                      <div key={nameIdx} className="flex items-center gap-2">
                        <span className="text-slate-600 text-xs w-5 text-right flex-shrink-0 tabular-nums">{flatIdx + 1}</span>
                        <ShapeIcon shape={selectedType.shape} className="flex-shrink-0 text-slate-600 w-4 h-4" />
                        {isExisting ? (
                          <div className="flex-1 flex items-center gap-1.5">
                            <span className="flex-1 min-w-0 bg-slate-700/50 rounded-lg px-2.5 py-1.5 text-sm text-slate-400 truncate">
                              {name}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingTable(selectedTypeId, nameIdx)}
                              title="Supprimer cette table"
                              className="p-1 rounded text-slate-600 hover:text-red-400 transition-colors flex-shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={name}
                            onChange={e => updateName(selectedTypeId, nameIdx, e.target.value)}
                            className="flex-1 min-w-0 bg-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Stats ── */}
            {types.length > 0 && (
              <div className={`rounded-xl text-sm overflow-hidden ${seatsOk ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
                <div className="flex items-center justify-between px-4 py-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold tabular-nums ${seatsOk ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {totalSeats} place{totalSeats > 1 ? 's' : ''}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400 tabular-nums">{guestCount} invité{guestCount > 1 ? 's' : ''}</span>
                    {participationEnabled && (
                      <span title="Invités absents exclus" className="text-slate-500 cursor-help">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    )}
                  </div>
                  {seatsOk
                    ? <span className="text-emerald-400 text-xs font-medium">+{totalSeats - guestCount} libre{totalSeats - guestCount > 1 ? 's' : ''}</span>
                    : <span className="text-amber-400 text-xs font-medium">{guestCount - totalSeats} sans place</span>
                  }
                </div>
                {totalNew > 0 && (
                  <div className="border-t border-slate-700/40 px-4 py-2 flex items-center gap-2">
                    <span className="text-emerald-400 text-xs">+{totalNew} nouvelle{totalNew > 1 ? 's' : ''} table{totalNew > 1 ? 's' : ''} à créer</span>
                  </div>
                )}
                {toDeleteIds.length > 0 && (
                  <div className="border-t border-slate-700/40 px-4 py-2 flex items-center gap-2">
                    <span className="text-red-400 text-xs">−{toDeleteIds.length} table{toDeleteIds.length > 1 ? 's' : ''} à supprimer</span>
                  </div>
                )}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={!canSubmit}
              className="w-full bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors">
              {!canSubmit
                ? types.length === 0
                  ? 'Ajoutez au moins un type'
                  : 'Aucune modification'
                : totalNew > 0 && toDeleteIds.length > 0
                  ? `Créer ${totalNew} · Supprimer ${toDeleteIds.length}`
                  : totalNew > 0
                    ? `Créer ${totalNew} table${totalNew > 1 ? 's' : ''}`
                    : `Supprimer ${toDeleteIds.length} table${toDeleteIds.length > 1 ? 's' : ''}`}
            </button>

          </div>
        </form>
      </div>
    </div>
  )
}
