import { useState, useMemo, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CreateTablesModal from '../components/CreateTablesModal'
import { getTheme } from '../lib/themes'

// ─── Layout constants ─────────────────────────────────────────────────────────

const SW = 80   // seat width
const SH = 36   // seat height
const SG = 8    // seat gap (rect layout)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function seatLabel(g) {
  if (!g) return ''
  const fn = (g.firstName || '').trim()
  const ln = (g.lastName || '').trim()
  if (fn && ln) return `${fn[0]}.\u00A0${ln}`
  return fn || ln
}

function computeSides(n) {
  const rem = Math.max(n - 2, 0)
  return { leftCount: Math.ceil(rem / 2), rightCount: Math.floor(rem / 2) }
}

function fullName(g) {
  return [g.firstName, g.lastName].filter(Boolean).join(' ')
}

// ─── Seat ─────────────────────────────────────────────────────────────────────

function Seat({ guest, isSource, inSwapMode, tableId, seatIndex, onClick, onDragStart, onDrop, onTouchStart }) {
  const empty = !guest
  const isAbsent = !empty && guest.participation === 'no'
  return (
    <div
      draggable={!empty}
      data-table-id={tableId}
      data-seat-index={String(seatIndex)}
      onDragStart={onDragStart}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      onTouchStart={onTouchStart}
      onClick={onClick}
      style={{ width: SW, height: SH, flexShrink: 0 }}
      className={[
        'rounded-lg border text-[11px] font-medium flex items-center justify-center',
        'cursor-pointer select-none transition-all overflow-hidden',
        empty
          ? 'border-dashed border-slate-600 text-slate-600 hover:border-indigo-500/70 hover:text-indigo-400'
          : isSource
            ? 'border-indigo-400 bg-indigo-500/30 text-indigo-100 ring-2 ring-indigo-400/60 shadow-lg shadow-indigo-500/20'
            : isAbsent
              ? 'border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20'
              : inSwapMode
                ? 'border-slate-500 bg-slate-700 text-slate-200 hover:border-indigo-400/60 hover:bg-indigo-500/15'
                : 'border-slate-500/60 bg-slate-700/80 text-white hover:bg-slate-600/80',
      ].join(' ')}
    >
      {empty ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ) : (
        <span className="truncate px-1.5 text-center leading-tight">{seatLabel(guest)}</span>
      )}
    </div>
  )
}

// ─── Round table schema ───────────────────────────────────────────────────────

function RoundSchema({ table, guestsById, swapFrom, onSeatClick, onDragStart, onSeatDrop, onSeatTouchStart }) {
  const n = table.seats
  if (n === 0) return null
  const tableR = Math.max(50, n * 13)
  const dist = tableR + 14 + SH / 2
  const half = Math.ceil(dist + SW / 2 + 6)
  const size = half * 2
  const cx = half

  return (
    <div className="relative mx-auto flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute rounded-full bg-slate-700/60 border-2 border-slate-600 flex flex-col items-center justify-center"
        style={{ width: tableR * 2, height: tableR * 2, left: cx - tableR, top: cx - tableR }}
      >
        <span className="text-slate-400 text-xs font-medium text-center px-3 leading-tight">{table.name}</span>
        <span className="text-slate-600 text-[10px] mt-0.5">
          {(table.guestIds || []).filter(Boolean).length}/{n}
        </span>
      </div>
      {(table.guestIds || []).map((gId, i) => {
        const angle = (2 * Math.PI * i / n) - Math.PI / 2
        const x = cx + dist * Math.cos(angle) - SW / 2
        const y = cx + dist * Math.sin(angle) - SH / 2
        const guest = guestsById[gId]
        const isSource = swapFrom?.tableId === table.id && swapFrom?.seatIndex === i
        return (
          <div key={i} style={{ position: 'absolute', left: Math.round(x), top: Math.round(y) }}>
            <Seat
              guest={guest}
              isSource={isSource}
              inSwapMode={!!swapFrom && !isSource}
              tableId={table.id}
              seatIndex={i}
              onClick={() => onSeatClick(table.id, i, gId)}
              onDragStart={e => onDragStart(e, gId, table.id, i)}
              onDrop={e => onSeatDrop(e, table.id, i)}
              onTouchStart={e => onSeatTouchStart(e, gId, table.id, i)}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Rectangular table schema ─────────────────────────────────────────────────

function RectSchema({ table, guestsById, swapFrom, onSeatClick, onDragStart, onSeatDrop, onSeatTouchStart }) {
  const n = table.seats
  if (n === 0) return null
  const { leftCount, rightCount } = computeSides(n)

  const topIdx = 0
  const leftIdxs = Array.from({ length: leftCount }, (_, i) => 1 + i)
  const rightIdxs = Array.from({ length: rightCount }, (_, i) => 1 + leftCount + i)
  const bottomIdx = n >= 2 ? n - 1 : -1

  const tableInnerH = Math.max(56, Math.max(leftCount, rightCount) * (SH + SG) - SG + 28)

  function makeSeat(idx) {
    if (idx < 0 || idx >= n) return null
    const gId = (table.guestIds || [])[idx] ?? null
    const guest = guestsById[gId]
    const isSource = swapFrom?.tableId === table.id && swapFrom?.seatIndex === idx
    return (
      <Seat
        key={idx}
        guest={guest}
        isSource={isSource}
        inSwapMode={!!swapFrom && !isSource}
        tableId={table.id}
        seatIndex={idx}
        onClick={() => onSeatClick(table.id, idx, gId)}
        onDragStart={e => onDragStart(e, gId, table.id, idx)}
        onDrop={e => onSeatDrop(e, table.id, idx)}
        onTouchStart={e => onSeatTouchStart(e, gId, table.id, idx)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 mx-auto" style={{ width: 'max-content' }}>
      {makeSeat(topIdx)}
      <div className="flex items-center gap-2">
        {leftCount > 0 && <div className="flex flex-col gap-2">{leftIdxs.map(idx => makeSeat(idx))}</div>}
        <div
          className="rounded-2xl bg-slate-700/60 border-2 border-slate-600 flex flex-col items-center justify-center flex-shrink-0"
          style={{ width: 108, minHeight: tableInnerH }}
        >
          <span className="text-slate-400 text-xs font-medium text-center px-3 leading-tight">{table.name}</span>
          <span className="text-slate-600 text-[10px] mt-0.5">
            {(table.guestIds || []).filter(Boolean).length}/{n}
          </span>
        </div>
        {rightCount > 0 && <div className="flex flex-col gap-2">{rightIdxs.map(idx => makeSeat(idx))}</div>}
      </div>
      {bottomIdx >= 0 && makeSeat(bottomIdx)}
    </div>
  )
}

// ─── Table edit modal ─────────────────────────────────────────────────────────

function TableEditModal({ table, onSave, onClose }) {
  const [name, setName] = useState(table.name)
  const [shape, setShape] = useState(table.shape)
  const [seats, setSeats] = useState(table.seats)
  const occupied = (table.guestIds || []).filter(Boolean).length
  const willDisplace = Math.max(0, occupied - seats)

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm">Modifier la table</p>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Nom</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full bg-slate-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Forme</p>
            <div className="flex gap-2">
              {[{ key: 'round', label: 'Ronde' }, { key: 'rect', label: 'Rectangulaire' }].map(({ key, label }) => (
                <button key={key} type="button" onClick={() => setShape(key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    shape === key ? 'bg-indigo-500/20 ring-2 ring-indigo-500/60 text-indigo-300' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                  }`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-2">Places</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setSeats(s => Math.max(1, s - 1))} disabled={seats <= 1}
                className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center">−</button>
              <span className="w-8 text-center text-white font-semibold tabular-nums">{seats}</span>
              <button type="button" onClick={() => setSeats(s => Math.min(50, s + 1))} disabled={seats >= 50}
                className="w-9 h-9 rounded-lg bg-slate-600 hover:bg-slate-500 disabled:opacity-30 text-white font-bold flex items-center justify-center">+</button>
            </div>
            {willDisplace > 0 && (
              <p className="text-amber-400 text-xs mt-2 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                {willDisplace} invité{willDisplace > 1 ? 's' : ''} ser{willDisplace > 1 ? 'ont' : 'a'} retiré{willDisplace > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium">Annuler</button>
            <button disabled={!name.trim()} onClick={() => onSave(name.trim(), shape, seats)}
              className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-semibold">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Delete table confirm ─────────────────────────────────────────────────────

function DeleteTableConfirm({ table, onConfirm, onCancel }) {
  const occupied = (table.guestIds || []).filter(Boolean).length
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div>
            <p className="text-white font-semibold text-sm">Supprimer «&nbsp;{table.name}&nbsp;» ?</p>
            {occupied > 0 && (
              <p className="text-slate-400 text-sm mt-1.5">
                {occupied} invité{occupied > 1 ? 's' : ''} ser{occupied > 1 ? 'ont' : 'a'} libéré{occupied > 1 ? 's' : ''}.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium">Annuler</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-semibold">Supprimer</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filter chips (reusable inline) ──────────────────────────────────────────

function FilterChips({ options, filters, onToggle, onToggleLabel, onReset }) {
  const { notation, genderEnabled, participationEnabled, invitationSentEnabled, ageSystem, labelSystems = [] } = options
  const Chip = ({ active, onClick, children, color }) => (
    <button type="button" onClick={onClick}
      style={color && active ? { backgroundColor: color, color: '#fff', borderColor: 'rgba(255,255,255,0.5)' } : color ? { backgroundColor: color + '80', color: '#fff' } : {}}
      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
        color ? 'border-transparent' :
        active ? 'bg-indigo-500 text-white border-transparent' : 'bg-slate-700 text-slate-400 border-transparent hover:text-slate-200'
      } ${active && color ? 'scale-105 !border-white/50' : ''}`}
    >{children}</button>
  )

  const hasAny = filters.participation.length || filters.invitation.length || filters.gender.length ||
    filters.ageCategoryId.length || filters.rating.length || Object.values(filters.labelIds).some(v => v?.length)

  return (
    <div className="space-y-3">
      {hasAny && (
        <button onClick={onReset} className="text-xs text-red-400 hover:text-red-300 transition-colors">
          Effacer les filtres
        </button>
      )}
      {participationEnabled && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Participation</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filters.participation.includes('yes')}    onClick={() => onToggle('participation','yes')}>Participe</Chip>
            <Chip active={filters.participation.includes('no')}     onClick={() => onToggle('participation','no')}>Absent</Chip>
            <Chip active={filters.participation.includes('pending')} onClick={() => onToggle('participation','pending')}>Sans réponse</Chip>
          </div>
        </div>
      )}
      {invitationSentEnabled && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Invitation</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filters.invitation.includes('sent')}   onClick={() => onToggle('invitation','sent')}>Envoyée</Chip>
            <Chip active={filters.invitation.includes('unsent')} onClick={() => onToggle('invitation','unsent')}>Non envoyée</Chip>
          </div>
        </div>
      )}
      {genderEnabled && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Genre</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={filters.gender.includes('M')}    onClick={() => onToggle('gender','M')}>Homme</Chip>
            <Chip active={filters.gender.includes('F')}    onClick={() => onToggle('gender','F')}>Femme</Chip>
            <Chip active={filters.gender.includes('none')} onClick={() => onToggle('gender','none')}>N/R</Chip>
          </div>
        </div>
      )}
      {ageSystem.enabled && ageSystem.items.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Âge</p>
          <div className="flex flex-wrap gap-1.5">
            {ageSystem.items.map(cat => (
              <Chip key={cat.id} active={filters.ageCategoryId.includes(cat.id)} onClick={() => onToggle('ageCategoryId', cat.id)}>{cat.name}</Chip>
            ))}
            <Chip active={filters.ageCategoryId.includes('none')} onClick={() => onToggle('ageCategoryId','none')}>N/R</Chip>
          </div>
        </div>
      )}
      {labelSystems.filter(ls => ls.enabled && ls.items.length > 0).map(ls => (
        <div key={ls.id}>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">{ls.name}</p>
          <div className="flex flex-wrap gap-1.5">
            {ls.items.map(label => (
              <Chip key={label.id} active={(filters.labelIds[ls.id] || []).includes(label.id)}
                onClick={() => onToggleLabel(ls.id, label.id)} color={label.color}>{label.name}</Chip>
            ))}
            <Chip active={(filters.labelIds[ls.id] || []).includes('none')} onClick={() => onToggleLabel(ls.id,'none')}>Aucun</Chip>
          </div>
        </div>
      ))}
      {notation.enabled && (
        <div>
          <p className="text-[10px] text-slate-600 uppercase tracking-wide mb-1.5">Note</p>
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: notation.max }, (_, i) => i + 1).map(n => (
              <Chip key={n} active={filters.rating.includes(String(n))} onClick={() => onToggle('rating', String(n))}>{n}</Chip>
            ))}
            <Chip active={filters.rating.includes('none')} onClick={() => onToggle('rating','none')}>N/R</Chip>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Seat picker sheet (with search + filters) ────────────────────────────────

function SeatPickerSheet({ guests, placementMap, tables, options, onPick, onClose }) {
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    participation: [], labelIds: {}, ageCategoryId: [], invitation: [], rating: [], gender: []
  })

  function toggleFilter(key, val) {
    setFilters(prev => {
      const arr = prev[key] || []
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }
  function toggleLabelFilter(sysId, val) {
    setFilters(prev => {
      const arr = prev.labelIds[sysId] || []
      return { ...prev, labelIds: { ...prev.labelIds, [sysId]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] } }
    })
  }

  function applyFilters(g) {
    const f = filters
    const { participationEnabled, invitationSentEnabled, genderEnabled, ageSystem, notation, labelSystems = [] } = options
    if (f.participation.length && participationEnabled) {
      if (!f.participation.includes(g.participation === null ? 'pending' : g.participation)) return false
    }
    if (f.invitation.length && invitationSentEnabled) {
      if (!f.invitation.includes(g.invitationSent ? 'sent' : 'unsent')) return false
    }
    if (f.gender.length && genderEnabled) {
      if (!f.gender.includes(g.gender ?? 'none')) return false
    }
    if (f.ageCategoryId.length && ageSystem.enabled) {
      if (!f.ageCategoryId.includes(g.ageCategoryId ?? 'none')) return false
    }
    if (f.rating.length && notation.enabled) {
      if (!f.rating.includes(g.rating == null ? 'none' : String(g.rating))) return false
    }
    for (const [sysId, vals] of Object.entries(f.labelIds)) {
      if (!vals?.length) continue
      const gVal = (g.labelIds?.[sysId] ?? null) === null ? 'none' : g.labelIds[sysId]
      if (!vals.includes(gVal)) return false
    }
    return true
  }

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.participation.length) n++
    if (filters.invitation.length) n++
    if (filters.gender.length) n++
    if (filters.ageCategoryId.length) n++
    if (filters.rating.length) n++
    for (const v of Object.values(filters.labelIds)) if (v?.length) n++
    return n
  }, [filters])

  const filtered = guests.filter(g => {
    if (search) {
      if (!`${g.firstName || ''} ${g.lastName || ''}`.toLowerCase().includes(search.toLowerCase())) return false
    }
    return applyFilters(g)
  })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-700/60 flex-shrink-0 flex items-center gap-3">
          <p className="text-sm font-semibold text-white flex-1">Choisir un invité</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Search + filter toggle */}
        <div className="p-3 flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
              className="flex-1 min-w-0 bg-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-shrink-0 ${
                activeFilterCount > 0 ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              {activeFilterCount > 0 ? activeFilterCount : ''}
            </button>
          </div>
          {/* Inline filters */}
          {showFilters && (
            <div className="bg-slate-700/40 rounded-xl p-3">
              <FilterChips
                options={options} filters={filters}
                onToggle={toggleFilter} onToggleLabel={toggleLabelFilter}
                onReset={() => setFilters({ participation: [], labelIds: {}, ageCategoryId: [], invitation: [], rating: [], gender: [] })}
              />
            </div>
          )}
        </div>
        {/* Guest list */}
        <div className="overflow-y-auto flex-1 px-3 pb-3 space-y-1">
          {filtered.map(g => {
            const placement = placementMap[g.id]
            const tableName = placement ? tables.find(t => t.id === placement.tableId)?.name : null
            return (
              <button key={g.id} onClick={() => onPick(g.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/80 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-xs font-semibold text-slate-300 flex-shrink-0">
                  {((g.firstName || g.lastName || '?')[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">{fullName(g)}</p>
                  {tableName && <p className="text-xs text-indigo-400 truncate">{tableName}</p>}
                </div>
                {placement && <span className="text-[10px] text-slate-500 flex-shrink-0 bg-slate-700 px-2 py-0.5 rounded-full">Placé</span>}
              </button>
            )
          })}
          {filtered.length === 0 && <p className="text-center text-slate-500 py-10 text-sm">Aucun invité trouvé</p>}
        </div>
      </div>
    </div>
  )
}

// ─── Seat action sheet ────────────────────────────────────────────────────────

function SeatActionSheet({ guest, onRemove, onSwap, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <p className="font-semibold text-white text-sm truncate">{fullName(guest)}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          <button onClick={onSwap} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors text-left">
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <div>
              <p>Échanger avec…</p>
              <p className="text-xs text-slate-400 mt-0.5">Cliquez sur une autre chaise</p>
            </div>
          </button>
          <button onClick={onRemove} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors text-left">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Retirer de la chaise
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm move sheet ───────────────────────────────────────────────────────

function ConfirmMoveSheet({ guest, fromTableName, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-white font-semibold text-sm">{fullName(guest)} est déjà placé(e)</p>
            <p className="text-slate-400 text-sm">Actuellement à <span className="text-indigo-400 font-medium">{fromTableName}</span>. Déplacer vers cette chaise ?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium">Annuler</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold">Déplacer</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TablePlannerPage({ store }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getList, assignGuestToSeat, unassignGuestFromSeat, swapSeats, createTables, updateTable, deleteTable } = store

  const list = getList(id)
  if (!list) { navigate('/'); return null }

  const guests = list.guests ?? []
  const tables = list.tables ?? []
  const { options } = list
  const theme = getTheme(options.theme)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [selectedTableId, setSelectedTableId] = useState(() => tables[0]?.id ?? null)
  const [search, setSearch]               = useState('')
  const [filterPlaced, setFilterPlaced]   = useState('all')
  const [guestListVisible, setGuestListVisible] = useState(true)
  const [showFilterSheet, setShowFilterSheet]   = useState(false)
  const [filters, setFilters] = useState(() => ({
    participation: options.participationEnabled ? ['yes', 'pending'] : [],
    labelIds: {}, ageCategoryId: [], invitation: [], rating: [], gender: []
  }))
  const [seatPicker, setSeatPicker]   = useState(null)
  const [seatMenu, setSeatMenu]       = useState(null)
  const [swapFrom, setSwapFrom]       = useState(null)
  const [pendingAssign, setPendingAssign] = useState(null)
  const [pendingNoParticipation, setPendingNoParticipation] = useState(null) // { guestId, toTableId, toSeatIndex }
  const [editingTable, setEditingTable]   = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [showCreateTables, setShowCreateTables] = useState(false)
  const [pendingTypes, setPendingTypes] = useState([])
  const [selectedPendingTypeId, setSelectedPendingTypeId] = useState(null)

  // ── Touch DnD ────────────────────────────────────────────────────────────────
  const touchDrag = useRef(null)
  // Keep fresh references accessible from event handlers (registered once)
  const touchHandlers = useRef(null)
  touchHandlers.current = { swapSeats, assignGuestToSeat, id }

  // requestAssign needs to be accessible from touch handlers — store via ref
  const requestAssignRef = useRef(null)

  useEffect(() => {
    function onTouchMove(e) {
      const drag = touchDrag.current
      if (!drag) return
      const touch = e.touches[0]
      const dx = touch.clientX - drag.startX
      const dy = touch.clientY - drag.startY
      // Don't start drag until moved 8px
      if (!drag.moved && Math.sqrt(dx * dx + dy * dy) < 8) return

      e.preventDefault() // prevent page scroll while dragging

      if (!drag.moved) {
        drag.moved = true
        // Create ghost pill
        const ghost = document.createElement('div')
        ghost.style.cssText = [
          'position:fixed', 'z-index:9999', 'pointer-events:none',
          'background:rgba(99,102,241,0.85)', 'color:#fff',
          'font-size:12px', 'font-weight:600', 'padding:6px 14px',
          'border-radius:999px', 'box-shadow:0 4px 20px rgba(0,0,0,0.5)',
          'white-space:nowrap', 'transform:translateX(-50%) translateY(-150%)',
          'transition:none',
        ].join(';')
        ghost.textContent = drag.label
        document.body.appendChild(ghost)
        drag.ghost = ghost
      }

      if (drag.ghost) {
        drag.ghost.style.left = `${touch.clientX}px`
        drag.ghost.style.top = `${touch.clientY}px`
      }
    }

    function onTouchEnd(e) {
      const drag = touchDrag.current
      touchDrag.current = null
      if (!drag) return
      if (drag.ghost) drag.ghost.remove()
      if (!drag.moved) return // tap, not drag → let onClick handle it

      const touch = e.changedTouches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const seatEl = el?.closest('[data-seat-index]')
      if (!seatEl) return

      const toTableId   = seatEl.dataset.tableId
      const toSeatIndex = parseInt(seatEl.dataset.seatIndex)

      const { swapSeats: swap, id: listId } = touchHandlers.current

      if (drag.type === 'seat') {
        if (drag.fromTableId === toTableId && drag.fromSeatIndex === toSeatIndex) return
        swap(listId, drag.fromTableId, drag.fromSeatIndex, toTableId, toSeatIndex)
      } else {
        // From guest list → use requestAssign (handles confirmation for placed guests)
        requestAssignRef.current?.(drag.guestId, toTableId, toSeatIndex)
      }
    }

    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend',  onTouchEnd)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend',  onTouchEnd)
    }
  }, []) // registered once; uses refs for fresh values

  // ── Derived ──────────────────────────────────────────────────────────────────
  const guestsById = useMemo(() =>
    Object.fromEntries(guests.map(g => [g.id, g])), [guests])

  const placementMap = useMemo(() => {
    const map = {}
    for (const t of tables)
      (t.guestIds || []).forEach((gId, seatIdx) => {
        if (gId && guestsById[gId]) map[gId] = { tableId: t.id, seatIndex: seatIdx }
      })
    return map
  }, [tables, guestsById])

  const selectedTable = tables.find(t => t.id === selectedTableId) ?? tables[0] ?? null
  const placedCount   = Object.keys(placementMap).length
  const totalSeats    = tables.reduce((s, t) => s + (t.seats || 0), 0)

  function applyFilters(g) {
    const f = filters
    if (f.participation.length && options.participationEnabled) {
      if (!f.participation.includes(g.participation === null ? 'pending' : g.participation)) return false
    }
    if (f.invitation.length && options.invitationSentEnabled) {
      if (!f.invitation.includes(g.invitationSent ? 'sent' : 'unsent')) return false
    }
    if (f.gender.length && options.genderEnabled) {
      if (!f.gender.includes(g.gender ?? 'none')) return false
    }
    if (f.ageCategoryId.length && options.ageSystem.enabled) {
      if (!f.ageCategoryId.includes(g.ageCategoryId ?? 'none')) return false
    }
    if (f.rating.length && options.notation.enabled) {
      if (!f.rating.includes(g.rating == null ? 'none' : String(g.rating))) return false
    }
    for (const [sysId, vals] of Object.entries(f.labelIds)) {
      if (!vals?.length) continue
      const gVal = (g.labelIds?.[sysId] ?? null) === null ? 'none' : g.labelIds[sysId]
      if (!vals.includes(gVal)) return false
    }
    return true
  }

  const filteredGuests = useMemo(() =>
    guests.filter(g => {
      const placed = !!placementMap[g.id]
      if (filterPlaced === 'placed'   && !placed) return false
      if (filterPlaced === 'unplaced' &&  placed) return false
      if (search) {
        if (!`${g.firstName || ''} ${g.lastName || ''}`.toLowerCase().includes(search.toLowerCase())) return false
      }
      return applyFilters(g)
    }).sort((a, b) =>
      `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase()
        .localeCompare(`${b.lastName || ''} ${b.firstName || ''}`.toLowerCase(), 'fr')
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  , [guests, search, filterPlaced, placementMap, filters])

  const activeFilterCount = useMemo(() => {
    let n = 0
    if (filters.participation.length) n++
    if (filters.invitation.length) n++
    if (filters.gender.length) n++
    if (filters.ageCategoryId.length) n++
    if (filters.rating.length) n++
    for (const v of Object.values(filters.labelIds)) if (v?.length) n++
    return n
  }, [filters])

  function toggleFilter(key, val) {
    setFilters(prev => {
      const arr = prev[key] || []
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] }
    })
  }
  function toggleLabelFilter(sysId, val) {
    setFilters(prev => {
      const arr = prev.labelIds[sysId] || []
      return { ...prev, labelIds: { ...prev.labelIds, [sysId]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] } }
    })
  }
  function resetFilters() {
    setFilters({
      participation: options.participationEnabled ? ['yes', 'pending'] : [],
      labelIds: {}, ageCategoryId: [], invitation: [], rating: [], gender: []
    })
  }

  // ── Seat interactions ─────────────────────────────────────────────────────────
  function requestAssign(guestId, toTableId, toSeatIndex) {
    const existing = placementMap[guestId]
    if (existing) {
      setPendingAssign({ guestId, toTableId, toSeatIndex })
    } else {
      const guest = guestsById[guestId]
      if (options.participationEnabled && guest?.participation === 'no') {
        setPendingNoParticipation({ guestId, toTableId, toSeatIndex })
      } else {
        assignGuestToSeat(id, guestId, toTableId, toSeatIndex)
        setSeatPicker(null)
      }
    }
  }
  requestAssignRef.current = requestAssign

  function handleSeatClick(tableId, seatIndex, guestId) {
    if (swapFrom) {
      if (swapFrom.tableId === tableId && swapFrom.seatIndex === seatIndex) setSwapFrom(null)
      else { swapSeats(id, swapFrom.tableId, swapFrom.seatIndex, tableId, seatIndex); setSwapFrom(null) }
      return
    }
    if (guestId && guestsById[guestId]) setSeatMenu({ tableId, seatIndex, guestId })
    else setSeatPicker({ tableId, seatIndex })
  }

  function confirmAssign() {
    if (!pendingAssign) return
    assignGuestToSeat(id, pendingAssign.guestId, pendingAssign.toTableId, pendingAssign.toSeatIndex)
    setPendingAssign(null)
    setSeatPicker(null)
  }

  function confirmNoParticipationAssign() {
    if (!pendingNoParticipation) return
    assignGuestToSeat(id, pendingNoParticipation.guestId, pendingNoParticipation.toTableId, pendingNoParticipation.toSeatIndex)
    setPendingNoParticipation(null)
    setSeatPicker(null)
  }

  // ── Drag and drop (desktop HTML5) ─────────────────────────────────────────────
  function handleDragStart(e, guestId, fromTableId, fromSeatIndex) {
    if (!guestId) { e.preventDefault(); return }
    e.dataTransfer.setData('guestId', guestId)
    if (fromTableId != null) {
      e.dataTransfer.setData('fromTableId', fromTableId)
      e.dataTransfer.setData('fromSeatIndex', String(fromSeatIndex))
    }
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleSeatDrop(e, tableId, seatIndex) {
    e.preventDefault()
    const guestId = e.dataTransfer.getData('guestId')
    if (!guestId) return
    const fromTableId   = e.dataTransfer.getData('fromTableId')
    const fromSeatIndex = e.dataTransfer.getData('fromSeatIndex')
    if (fromTableId) {
      if (fromTableId === tableId && parseInt(fromSeatIndex) === seatIndex) return
      swapSeats(id, fromTableId, parseInt(fromSeatIndex), tableId, seatIndex)
    } else {
      requestAssign(guestId, tableId, seatIndex)
    }
  }

  // ── Touch start handlers ──────────────────────────────────────────────────────
  function handleGuestTouchStart(e, guestId) {
    const g = guestsById[guestId]
    const touch = e.touches[0]
    touchDrag.current = {
      type: 'guest',
      guestId,
      label: g ? seatLabel(g) : guestId,
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      ghost: null,
    }
  }

  function handleSeatTouchStart(e, guestId, fromTableId, fromSeatIndex) {
    if (!guestId) return
    const g = guestsById[guestId]
    const touch = e.touches[0]
    touchDrag.current = {
      type: 'seat',
      guestId,
      fromTableId,
      fromSeatIndex,
      label: g ? seatLabel(g) : guestId,
      startX: touch.clientX,
      startY: touch.clientY,
      moved: false,
      ghost: null,
    }
  }

  // ── Table actions ─────────────────────────────────────────────────────────────
  function handleSaveTable(name, shape, seats) {
    updateTable(id, editingTable.id, { name, shape, seats })
    setEditingTable(null)
  }

  function handleDeleteTable() {
    const nextTable = tables.find(t => t.id !== deleteTarget.id)
    deleteTable(id, deleteTarget.id)
    setDeleteTarget(null)
    if (nextTable) setSelectedTableId(nextTable.id)
  }

  function handleCreateTables(configs) {
    createTables(id, configs)
    setPendingTypes([]); setSelectedPendingTypeId(null); setShowCreateTables(false)
  }

  // ── Table list item ───────────────────────────────────────────────────────────
  function TableItem({ t, compact }) {
    const occupied = (t.guestIds || []).filter(gId => gId && guestsById[gId]).length
    const pct = t.seats > 0 ? occupied / t.seats : 0
    const isSelected = t.id === selectedTableId
    const dot = pct >= 1 ? '#10b981' : pct > 0 ? '#f59e0b' : '#475569'

    if (compact) return (
      <button onClick={() => setSelectedTableId(t.id)}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700/80 text-slate-400 hover:text-slate-200'
        }`}
      >
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isSelected ? '#fff' : dot }} />
        {t.name}
        <span className={isSelected ? 'text-indigo-200' : 'text-slate-600'}>{occupied}/{t.seats}</span>
      </button>
    )

    return (
      <div className={`group flex items-center gap-1 rounded-xl transition-all ${isSelected ? 'bg-indigo-500/15 ring-1 ring-indigo-500/40' : 'hover:bg-slate-700/60'}`}>
        <button onClick={() => setSelectedTableId(t.id)} className="flex-1 text-left px-3 py-2.5 flex items-center gap-2.5 min-w-0">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dot }} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>{t.name}</p>
            <p className="text-xs text-slate-500 mt-0.5">{occupied}/{t.seats} · {t.shape === 'round' ? 'Ronde' : 'Rect.'}</p>
          </div>
        </button>
        <div className="flex items-center gap-0.5 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setEditingTable(t)} title="Modifier"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => setDeleteTarget(t)} title="Supprimer"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  // ── Guest row ─────────────────────────────────────────────────────────────────
  function GuestRow({ g }) {
    const placement = placementMap[g.id]
    const tableName = placement ? tables.find(t => t.id === placement.tableId)?.name : null
    const participationRing = options.participationEnabled
      ? g.participation === 'yes' ? 'ring-1 ring-emerald-500/50'
      : g.participation === 'no' ? 'ring-1 ring-red-500/50' : ''
      : ''
    return (
      <div
        draggable
        onDragStart={e => handleDragStart(e, g.id, null, null)}
        onTouchStart={e => handleGuestTouchStart(e, g.id)}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-700/50 cursor-grab active:cursor-grabbing transition-colors group ${participationRing}`}
      >
        <div className="w-7 h-7 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-xs font-semibold text-slate-400 flex-shrink-0 transition-colors">
          {((g.firstName || g.lastName || '?')[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate leading-tight">{fullName(g)}</p>
          {tableName
            ? <p className="text-[11px] text-indigo-400 truncate leading-tight">{tableName}</p>
            : <p className="text-[11px] text-slate-600 leading-tight">Non placé</p>
          }
        </div>
        <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>
    )
  }

  // ── Non-participation warning sheet ──────────────────────────────────────────
  function NonParticipantWarningSheet() {
    const guest = pendingNoParticipation ? guestsById[pendingNoParticipation.guestId] : null
    if (!guest) return null
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Invité absent</p>
                <p className="text-slate-400 text-sm mt-1">
                  <span className="text-white font-medium">{fullName(guest)}</span> a indiqué ne pas participer. Voulez-vous quand même le placer à cette table ?
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPendingNoParticipation(null)}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium">
                Annuler
              </button>
              <button onClick={confirmNoParticipationAssign}
                className="flex-1 py-3 rounded-xl bg-amber-500/80 hover:bg-amber-500 text-white text-sm font-semibold">
                Placer quand même
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Filter sheet ──────────────────────────────────────────────────────────────
  function FilterSheetModal() {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-700/60 flex-shrink-0 flex items-center justify-between">
            <p className="font-semibold text-white text-sm">Filtres</p>
            <div className="flex items-center gap-3">
              <button onClick={resetFilters} className="text-xs text-slate-400 hover:text-white">Tout effacer</button>
              <button onClick={() => setShowFilterSheet(false)} className="text-slate-400 hover:text-white p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            <FilterChips options={options} filters={filters} onToggle={toggleFilter} onToggleLabel={toggleLabelFilter} onReset={resetFilters} />
          </div>
          <div className="p-4 border-t border-slate-700/60 flex-shrink-0">
            <button onClick={() => setShowFilterSheet(false)}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold">Appliquer</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: theme.pageBg || '#0f172a' }}>

      {/* Header */}
      <div
        className="flex-shrink-0 border-b border-slate-700/50 px-4 py-3 flex items-center gap-3"
        style={{
          backgroundColor: theme.headerBg || '#1e293b',
          borderTop: theme.topBorder ? `3px solid ${theme.topBorder}` : undefined,
        }}
      >
        <button onClick={() => navigate(`/list/${id}`)} className="text-slate-400 hover:text-white p-1 -ml-1 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{list.name}</p>
          <p className="text-slate-500 text-xs tabular-nums">{placedCount}/{guests.length} placés · {totalSeats} places</p>
        </div>
      </div>

      {tables.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold">Aucune table créée</p>
              <p className="text-slate-500 text-sm mt-1">Créez des tables pour commencer le placement des invités.</p>
            </div>
            <button onClick={() => setShowCreateTables(true)}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-colors">
              Créer des tables
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

          {/* Desktop left panel */}
          <div className="hidden lg:flex flex-col w-56 flex-shrink-0 border-r border-slate-700/50 bg-slate-800/20 overflow-y-auto">
            <div className="p-3 pb-2">
              <button onClick={() => setShowCreateTables(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter des tables
              </button>
            </div>
            <div className="px-3 pb-3 space-y-0.5">
              {tables.map(t => <TableItem key={t.id} t={t} compact={false} />)}
            </div>
          </div>

          {/* Mobile tabs */}
          <div className="lg:hidden flex-shrink-0 bg-slate-800/20 border-b border-slate-700/50">
            <div className="flex gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar items-center">
              {tables.map(t => <TableItem key={t.id} t={t} compact={true} />)}
              <button onClick={() => setShowCreateTables(true)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-700/80 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ajouter
              </button>
            </div>
          </div>

          {/* Schema area */}
          <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex flex-col items-center gap-4">
            {/* Table action bar */}
            {selectedTable && (
              <div className="flex items-center gap-2 w-full max-w-xl flex-shrink-0 flex-wrap">
                <p className="text-slate-400 text-sm flex-1 truncate font-medium">{selectedTable.name}</p>
                <button onClick={() => setEditingTable(selectedTable)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Modifier
                </button>
                <button onClick={() => setDeleteTarget(selectedTable)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-500/15 text-slate-400 hover:text-red-400 text-xs font-medium transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Supprimer
                </button>
              </div>
            )}

            {/* Swap mode banner */}
            {swapFrom && (
              <div className="flex items-center gap-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl px-4 py-2.5 w-full max-w-xl flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                <p className="text-indigo-300 text-sm flex-1">Cliquez sur une chaise pour échanger</p>
                <button onClick={() => setSwapFrom(null)} className="text-indigo-400 hover:text-indigo-200 text-xs font-medium flex-shrink-0">Annuler</button>
              </div>
            )}

            {/* Schema */}
            {selectedTable && (
              <div className="flex-shrink-0">
                {selectedTable.shape === 'round' ? (
                  <RoundSchema table={selectedTable} guestsById={guestsById} swapFrom={swapFrom}
                    onSeatClick={handleSeatClick} onDragStart={handleDragStart} onSeatDrop={handleSeatDrop}
                    onSeatTouchStart={handleSeatTouchStart}
                  />
                ) : (
                  <RectSchema table={selectedTable} guestsById={guestsById} swapFrom={swapFrom}
                    onSeatClick={handleSeatClick} onDragStart={handleDragStart} onSeatDrop={handleSeatDrop}
                    onSeatTouchStart={handleSeatTouchStart}
                  />
                )}
              </div>
            )}
          </div>

          {/* Guest list panel */}
          <div className="flex-shrink-0 flex flex-col lg:flex-row">
            {/* Mobile toggle strip */}
            <button
              onClick={() => setGuestListVisible(v => !v)}
              className="lg:hidden flex items-center justify-center py-1 border-t border-slate-700/50 bg-slate-800/30 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={guestListVisible ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
            </button>
            {/* Desktop toggle strip */}
            <button
              onClick={() => setGuestListVisible(v => !v)}
              className="hidden lg:flex flex-col items-center justify-center w-4 border-l border-slate-700/50 bg-slate-800/20 hover:bg-slate-700/30 text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={guestListVisible ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          {guestListVisible && (
            <div className="lg:w-72 flex flex-col bg-slate-800/20 overflow-hidden max-h-[42vh] lg:max-h-none">
              <div className="flex-shrink-0 p-3 space-y-2 border-b border-slate-700/40">
                <div className="flex gap-2">
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                    className="flex-1 min-w-0 bg-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => setShowFilterSheet(true)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex-shrink-0 ${
                      activeFilterCount > 0 ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40' : 'bg-slate-700/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    {activeFilterCount > 0 ? activeFilterCount : ''}
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {[['all','Tous'],['unplaced','Non placés'],['placed','Placés']].map(([key, label]) => (
                    <button key={key} onClick={() => setFilterPlaced(key)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        filterPlaced === key ? 'bg-indigo-500 text-white' : 'bg-slate-700/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >{label}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto py-1.5 px-1.5 space-y-0.5">
                {filteredGuests.map(g => <GuestRow key={g.id} g={g} />)}
                {filteredGuests.length === 0 && <p className="text-center text-slate-600 py-8 text-sm">Aucun invité</p>}
              </div>
              <div className="flex-shrink-0 px-4 py-2 border-t border-slate-700/40">
                <p className="text-xs text-slate-600 tabular-nums">
                  {filteredGuests.length} invité{filteredGuests.length !== 1 ? 's' : ''}
                  {(activeFilterCount > 0 || filterPlaced !== 'all') && ' · filtré'}
                </p>
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {seatPicker && (
        <SeatPickerSheet guests={guests} placementMap={placementMap} tables={tables} options={options}
          onPick={guestId => requestAssign(guestId, seatPicker.tableId, seatPicker.seatIndex)}
          onClose={() => setSeatPicker(null)}
        />
      )}
      {seatMenu && guestsById[seatMenu.guestId] && (
        <SeatActionSheet
          guest={guestsById[seatMenu.guestId]}
          onRemove={() => { unassignGuestFromSeat(id, seatMenu.tableId, seatMenu.seatIndex); setSeatMenu(null) }}
          onSwap={() => { setSwapFrom({ tableId: seatMenu.tableId, seatIndex: seatMenu.seatIndex }); setSeatMenu(null) }}
          onClose={() => setSeatMenu(null)}
        />
      )}
      {pendingAssign && guestsById[pendingAssign.guestId] && (
        <ConfirmMoveSheet
          guest={guestsById[pendingAssign.guestId]}
          fromTableName={tables.find(t => t.id === placementMap[pendingAssign.guestId]?.tableId)?.name ?? '?'}
          onConfirm={confirmAssign}
          onCancel={() => setPendingAssign(null)}
        />
      )}
      {pendingNoParticipation && <NonParticipantWarningSheet />}
      {editingTable && <TableEditModal table={editingTable} onSave={handleSaveTable} onClose={() => setEditingTable(null)} />}
      {deleteTarget && <DeleteTableConfirm table={deleteTarget} onConfirm={handleDeleteTable} onCancel={() => setDeleteTarget(null)} />}
      {showFilterSheet && <FilterSheetModal />}
      {showCreateTables && (
        <CreateTablesModal
          existingCount={tables.length} guestCount={guests.length}
          participationEnabled={options.participationEnabled}
          types={pendingTypes} setTypes={setPendingTypes}
          selectedTypeId={selectedPendingTypeId} setSelectedTypeId={setSelectedPendingTypeId}
          onClose={() => setShowCreateTables(false)} onCreate={handleCreateTables}
        />
      )}
    </div>
  )
}
