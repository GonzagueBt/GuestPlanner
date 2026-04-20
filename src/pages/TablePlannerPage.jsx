import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import CreateTablesModal from '../components/CreateTablesModal'

// ─── Layout constants ─────────────────────────────────────────────────────────

const SW = 80   // seat width
const SH = 36   // seat height
const SG = 8    // seat gap (for rect layout)

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

// ─── Seat ─────────────────────────────────────────────────────────────────────

function Seat({ guest, isSource, inSwapMode, onClick, onDragStart, onDrop }) {
  const empty = !guest
  return (
    <div
      draggable={!empty}
      onDragStart={onDragStart}
      onDragOver={e => e.preventDefault()}
      onDrop={onDrop}
      onClick={onClick}
      style={{ width: SW, height: SH, flexShrink: 0 }}
      className={[
        'rounded-lg border text-[11px] font-medium flex items-center justify-center',
        'cursor-pointer select-none transition-all overflow-hidden',
        empty
          ? 'border-dashed border-slate-600 text-slate-600 hover:border-indigo-500/70 hover:text-indigo-400'
          : isSource
            ? 'border-indigo-400 bg-indigo-500/30 text-indigo-100 ring-2 ring-indigo-400/60 shadow-lg shadow-indigo-500/20'
            : inSwapMode
              ? 'border-slate-500 bg-slate-700 text-slate-200 hover:border-indigo-400/60 hover:bg-indigo-500/15'
              : 'border-slate-500/60 bg-slate-700/80 text-white hover:bg-slate-600/80'
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

function RoundSchema({ table, guestsById, swapFrom, onSeatClick, onDragStart, onSeatDrop }) {
  const n = table.seats
  if (n === 0) return null
  const tableR = Math.max(50, n * 13)
  const dist = tableR + 14 + SH / 2
  const half = Math.ceil(dist + SW / 2 + 6)
  const size = half * 2
  const cx = half

  return (
    <div className="relative mx-auto flex-shrink-0" style={{ width: size, height: size }}>
      {/* Table disc */}
      <div
        className="absolute rounded-full bg-slate-700/60 border-2 border-slate-600 flex flex-col items-center justify-center"
        style={{ width: tableR * 2, height: tableR * 2, left: cx - tableR, top: cx - tableR }}
      >
        <span className="text-slate-400 text-xs font-medium text-center px-3 leading-tight">{table.name}</span>
        <span className="text-slate-600 text-[10px] mt-0.5">
          {(table.guestIds || []).filter(Boolean).length}/{n}
        </span>
      </div>
      {/* Seats */}
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
              onClick={() => onSeatClick(table.id, i, gId)}
              onDragStart={e => onDragStart(e, gId, table.id, i)}
              onDrop={e => onSeatDrop(e, table.id, i)}
            />
          </div>
        )
      })}
    </div>
  )
}

// ─── Rectangular table schema ─────────────────────────────────────────────────

function RectSchema({ table, guestsById, swapFrom, onSeatClick, onDragStart, onSeatDrop }) {
  const n = table.seats
  if (n === 0) return null
  const { leftCount, rightCount } = computeSides(n)

  // Index → position mapping
  // 0 = top, 1..leftCount = left (top→bottom), leftCount+1..leftCount+rightCount = right (top→bottom), n-1 = bottom
  const topIdx = 0
  const leftIdxs = Array.from({ length: leftCount }, (_, i) => 1 + i)
  const rightIdxs = Array.from({ length: rightCount }, (_, i) => 1 + leftCount + i)
  const bottomIdx = n >= 2 ? n - 1 : -1

  const tableInnerH = Math.max(56, Math.max(leftCount, rightCount) * (SH + SG) - SG + 28)
  const tableInnerW = 108

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
        onClick={() => onSeatClick(table.id, idx, gId)}
        onDragStart={e => onDragStart(e, gId, table.id, idx)}
        onDrop={e => onSeatDrop(e, table.id, idx)}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-2 mx-auto" style={{ width: 'max-content' }}>
      {/* Top */}
      {makeSeat(topIdx)}
      {/* Middle row */}
      <div className="flex items-center gap-2">
        {/* Left column */}
        {leftCount > 0 && (
          <div className="flex flex-col gap-2">
            {leftIdxs.map(idx => makeSeat(idx))}
          </div>
        )}
        {/* Table body */}
        <div
          className="rounded-2xl bg-slate-700/60 border-2 border-slate-600 flex flex-col items-center justify-center flex-shrink-0"
          style={{ width: tableInnerW, minHeight: tableInnerH }}
        >
          <span className="text-slate-400 text-xs font-medium text-center px-3 leading-tight">{table.name}</span>
          <span className="text-slate-600 text-[10px] mt-0.5">
            {(table.guestIds || []).filter(Boolean).length}/{n}
          </span>
        </div>
        {/* Right column */}
        {rightCount > 0 && (
          <div className="flex flex-col gap-2">
            {rightIdxs.map(idx => makeSeat(idx))}
          </div>
        )}
      </div>
      {/* Bottom */}
      {bottomIdx >= 0 && makeSeat(bottomIdx)}
    </div>
  )
}

// ─── Seat picker sheet ────────────────────────────────────────────────────────

function SeatPickerSheet({ guests, placementMap, tables, onPick, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = guests.filter(g => {
    if (!search) return true
    return `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[75vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700/60 flex-shrink-0 flex items-center gap-3">
          <p className="text-sm font-semibold text-white flex-1">Choisir un invité</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 flex-shrink-0">
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="overflow-y-auto flex-1 px-3 pb-3 space-y-1">
          {filtered.map(g => {
            const placement = placementMap[g.id]
            const tableName = placement ? tables.find(t => t.id === placement.tableId)?.name : null
            return (
              <button key={g.id} onClick={() => onPick(g.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-700/80 text-left transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-sm font-semibold text-slate-300 flex-shrink-0 transition-colors">
                  {((g.firstName || g.lastName || '?')[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {[g.firstName, g.lastName].filter(Boolean).join(' ')}
                  </p>
                  {tableName && <p className="text-xs text-indigo-400 truncate">{tableName}</p>}
                </div>
                {placement && (
                  <span className="text-[10px] text-slate-500 flex-shrink-0 bg-slate-700 px-2 py-0.5 rounded-full">Placé</span>
                )}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <p className="text-center text-slate-500 py-10 text-sm">Aucun invité trouvé</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Seat action sheet ────────────────────────────────────────────────────────

function SeatActionSheet({ guest, onRemove, onSwap, onClose }) {
  const name = [guest.firstName, guest.lastName].filter(Boolean).join(' ')
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-700/60 flex items-center justify-between">
          <p className="font-semibold text-white text-sm truncate">{name}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 flex-shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          <button onClick={onSwap}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors text-left"
          >
            <svg className="w-5 h-5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <div>
              <p>Échanger avec…</p>
              <p className="text-xs text-slate-400 mt-0.5">Cliquez sur une autre chaise</p>
            </div>
          </button>
          <button onClick={onRemove}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors text-left"
          >
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
  const name = [guest.firstName, guest.lastName].filter(Boolean).join(' ')
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="space-y-1">
            <p className="text-white font-semibold text-sm">{name} est déjà placé(e)</p>
            <p className="text-slate-400 text-sm">
              Actuellement à <span className="text-indigo-400 font-medium">{fromTableName}</span>.
              Déplacer vers cette chaise ?
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors">
              Annuler
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors">
              Déplacer
            </button>
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
  const { getList, assignGuestToSeat, unassignGuestFromSeat, swapSeats, createTables } = store

  const list = getList(id)
  if (!list) { navigate('/'); return null }

  const guests = list.guests ?? []
  const tables = list.tables ?? []

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedTableId, setSelectedTableId] = useState(() => tables[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [filterPlaced, setFilterPlaced] = useState('all') // 'all' | 'placed' | 'unplaced'
  const [seatPicker, setSeatPicker]   = useState(null) // { tableId, seatIndex }
  const [seatMenu, setSeatMenu]       = useState(null) // { tableId, seatIndex, guestId }
  const [swapFrom, setSwapFrom]       = useState(null) // { tableId, seatIndex }
  const [pendingAssign, setPendingAssign] = useState(null) // { guestId, toTableId, toSeatIndex }
  const [showCreateTables, setShowCreateTables] = useState(false)
  const [pendingTypes, setPendingTypes] = useState([])
  const [selectedPendingTypeId, setSelectedPendingTypeId] = useState(null)

  // ── Derived ─────────────────────────────────────────────────────────────────
  const guestsById = useMemo(() =>
    Object.fromEntries(guests.map(g => [g.id, g])), [guests])

  const placementMap = useMemo(() => {
    const map = {}
    for (const t of tables) {
      ;(t.guestIds || []).forEach((gId, seatIdx) => {
        if (gId && guestsById[gId]) map[gId] = { tableId: t.id, seatIndex: seatIdx }
      })
    }
    return map
  }, [tables, guestsById])

  const selectedTable = tables.find(t => t.id === selectedTableId) ?? tables[0] ?? null

  const placedCount = Object.keys(placementMap).length
  const totalSeats  = tables.reduce((s, t) => s + (t.seats || 0), 0)

  const filteredGuests = useMemo(() =>
    guests
      .filter(g => {
        const placed = !!placementMap[g.id]
        if (filterPlaced === 'placed'   && !placed) return false
        if (filterPlaced === 'unplaced' &&  placed) return false
        if (search) {
          const full = `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase()
          if (!full.includes(search.toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => {
        const an = `${a.lastName || ''} ${a.firstName || ''}`.toLowerCase()
        const bn = `${b.lastName || ''} ${b.firstName || ''}`.toLowerCase()
        return an.localeCompare(bn, 'fr')
      }),
    [guests, search, filterPlaced, placementMap])

  // ── Seat interactions ────────────────────────────────────────────────────────
  function handleSeatClick(tableId, seatIndex, guestId) {
    if (swapFrom) {
      // In swap mode: click same seat cancels, else swap
      if (swapFrom.tableId === tableId && swapFrom.seatIndex === seatIndex) {
        setSwapFrom(null)
      } else {
        swapSeats(id, swapFrom.tableId, swapFrom.seatIndex, tableId, seatIndex)
        setSwapFrom(null)
      }
      return
    }
    if (guestId && guestsById[guestId]) {
      setSeatMenu({ tableId, seatIndex, guestId })
    } else {
      setSeatPicker({ tableId, seatIndex })
    }
  }

  function requestAssign(guestId, toTableId, toSeatIndex) {
    const existing = placementMap[guestId]
    if (existing) {
      setPendingAssign({ guestId, toTableId, toSeatIndex })
    } else {
      assignGuestToSeat(id, guestId, toTableId, toSeatIndex)
      setSeatPicker(null)
    }
  }

  function confirmAssign() {
    if (!pendingAssign) return
    assignGuestToSeat(id, pendingAssign.guestId, pendingAssign.toTableId, pendingAssign.toSeatIndex)
    setPendingAssign(null)
    setSeatPicker(null)
  }

  // ── Drag and drop ────────────────────────────────────────────────────────────
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

    const fromTableId  = e.dataTransfer.getData('fromTableId')
    const fromSeatIndex = e.dataTransfer.getData('fromSeatIndex')
    const isFromSeat = !!fromTableId

    // Dropping on same seat → no-op
    if (isFromSeat && fromTableId === tableId && parseInt(fromSeatIndex) === seatIndex) return

    if (isFromSeat) {
      // Seat-to-seat drag → always swap (works for empty target too)
      swapSeats(id, fromTableId, parseInt(fromSeatIndex), tableId, seatIndex)
    } else {
      // Guest list → seat: use requestAssign (handles confirmation if already placed)
      requestAssign(guestId, tableId, seatIndex)
    }
  }

  // ── Create tables ────────────────────────────────────────────────────────────
  function handleCreateTables(configs) {
    createTables(id, configs)
    setPendingTypes([])
    setSelectedPendingTypeId(null)
    setShowCreateTables(false)
  }

  // ── Table list item ──────────────────────────────────────────────────────────
  function TableListItem({ t, compact = false }) {
    const occupied = (t.guestIds || []).filter(gId => gId && guestsById[gId]).length
    const pct = t.seats > 0 ? occupied / t.seats : 0
    const isSelected = t.id === selectedTableId
    const dotColor = pct >= 1 ? '#10b981' : pct > 0 ? '#f59e0b' : '#475569'

    if (compact) {
      return (
        <button
          onClick={() => setSelectedTableId(t.id)}
          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700/80 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: isSelected ? '#fff' : dotColor }} />
          {t.name}
          <span className={isSelected ? 'text-indigo-200' : 'text-slate-600'}>{occupied}/{t.seats}</span>
        </button>
      )
    }

    return (
      <button
        onClick={() => setSelectedTableId(t.id)}
        className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-2.5 ${
          isSelected ? 'bg-indigo-500/15 ring-1 ring-indigo-500/40 text-white' : 'text-slate-300 hover:bg-slate-700/60'
        }`}
      >
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: dotColor }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{t.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{occupied}/{t.seats} places · {t.shape === 'round' ? 'Ronde' : 'Rect.'}</p>
        </div>
      </button>
    )
  }

  // ── Guest list item (sidebar) ─────────────────────────────────────────────────
  function GuestRow({ g }) {
    const placement = placementMap[g.id]
    const tableName = placement ? tables.find(t => t.id === placement.tableId)?.name : null
    return (
      <div
        draggable
        onDragStart={e => handleDragStart(e, g.id, null, null)}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-700/50 cursor-grab active:cursor-grabbing transition-colors group"
      >
        <div className="w-7 h-7 rounded-full bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-xs font-semibold text-slate-400 flex-shrink-0 transition-colors">
          {((g.firstName || g.lastName || '?')[0]).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white font-medium truncate leading-tight">
            {[g.firstName, g.lastName].filter(Boolean).join(' ')}
          </p>
          {tableName
            ? <p className="text-[11px] text-indigo-400 truncate leading-tight">{tableName}</p>
            : <p className="text-[11px] text-slate-600 leading-tight">Non placé</p>
          }
        </div>
        {/* Drag handle hint */}
        <svg className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
        </svg>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(`/list/${id}`)} className="text-slate-400 hover:text-white p-1 -ml-1 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{list.name}</p>
          <p className="text-slate-500 text-xs tabular-nums">
            {placedCount}/{guests.length} placés · {totalSeats} places
          </p>
        </div>
        <button
          onClick={() => setShowCreateTables(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-medium transition-colors flex-shrink-0"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tables
        </button>
      </div>

      {tables.length === 0 ? (
        /* ── Empty state ── */
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
            <button
              onClick={() => setShowCreateTables(true)}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Créer des tables
            </button>
          </div>
        </div>
      ) : (
        /* ── Main layout ── */
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

          {/* ── Desktop: left table list ── */}
          <div className="hidden lg:flex flex-col w-52 flex-shrink-0 border-r border-slate-700/50 bg-slate-800/20 overflow-y-auto">
            <div className="p-3 space-y-1">
              {tables.map(t => <TableListItem key={t.id} t={t} />)}
            </div>
          </div>

          {/* ── Mobile: table tabs ── */}
          <div className="lg:hidden flex-shrink-0 bg-slate-800/20 border-b border-slate-700/50">
            <div className="flex gap-2 overflow-x-auto px-4 py-2.5 no-scrollbar">
              {tables.map(t => <TableListItem key={t.id} t={t} compact />)}
            </div>
          </div>

          {/* ── Center: schema area ── */}
          <div className="flex-1 min-h-0 overflow-auto p-6 flex flex-col items-center gap-4">
            {/* Swap mode banner */}
            {swapFrom && (
              <div className="flex items-center gap-2.5 bg-indigo-500/15 border border-indigo-500/30 rounded-xl px-4 py-2.5 w-full max-w-md flex-shrink-0">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse flex-shrink-0" />
                <p className="text-indigo-300 text-sm flex-1">Cliquez sur une chaise pour échanger</p>
                <button
                  onClick={() => setSwapFrom(null)}
                  className="text-indigo-400 hover:text-indigo-200 text-xs font-medium flex-shrink-0"
                >
                  Annuler
                </button>
              </div>
            )}
            {/* Schema */}
            {selectedTable && (
              <div className="flex-shrink-0">
                {selectedTable.shape === 'round' ? (
                  <RoundSchema
                    table={selectedTable}
                    guestsById={guestsById}
                    swapFrom={swapFrom}
                    onSeatClick={handleSeatClick}
                    onDragStart={handleDragStart}
                    onSeatDrop={handleSeatDrop}
                  />
                ) : (
                  <RectSchema
                    table={selectedTable}
                    guestsById={guestsById}
                    swapFrom={swapFrom}
                    onSeatClick={handleSeatClick}
                    onDragStart={handleDragStart}
                    onSeatDrop={handleSeatDrop}
                  />
                )}
              </div>
            )}
          </div>

          {/* ── Guest list panel ── */}
          <div className="flex-shrink-0 lg:flex-shrink-0 lg:w-72 flex flex-col
            border-t border-slate-700/50 lg:border-t-0 lg:border-l
            bg-slate-800/20 overflow-hidden
            max-h-[42vh] lg:max-h-none"
          >
            {/* Search + filter */}
            <div className="flex-shrink-0 p-3 space-y-2 border-b border-slate-700/40">
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un invité…"
                className="w-full bg-slate-700/80 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-1.5">
                {[
                  { key: 'all',      label: 'Tous' },
                  { key: 'unplaced', label: 'Non placés' },
                  { key: 'placed',   label: 'Placés' },
                ].map(({ key, label }) => (
                  <button key={key} onClick={() => setFilterPlaced(key)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      filterPlaced === key
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700/60 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto py-1.5 px-1.5 lg:max-h-none space-y-0.5">
              {filteredGuests.map(g => <GuestRow key={g.id} g={g} />)}
              {filteredGuests.length === 0 && (
                <p className="text-center text-slate-600 py-8 text-sm">Aucun invité</p>
              )}
            </div>
            {/* Count */}
            <div className="flex-shrink-0 px-4 py-2 border-t border-slate-700/40">
              <p className="text-xs text-slate-600 tabular-nums">
                {filteredGuests.length} invité{filteredGuests.length !== 1 ? 's' : ''}
                {filterPlaced !== 'all' && ` · ${filterPlaced === 'placed' ? 'placés' : 'non placés'}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}

      {seatPicker && (
        <SeatPickerSheet
          guests={guests}
          placementMap={placementMap}
          tables={tables}
          onPick={guestId => requestAssign(guestId, seatPicker.tableId, seatPicker.seatIndex)}
          onClose={() => setSeatPicker(null)}
        />
      )}

      {seatMenu && guestsById[seatMenu.guestId] && (
        <SeatActionSheet
          guest={guestsById[seatMenu.guestId]}
          onRemove={() => {
            unassignGuestFromSeat(id, seatMenu.tableId, seatMenu.seatIndex)
            setSeatMenu(null)
          }}
          onSwap={() => {
            setSwapFrom({ tableId: seatMenu.tableId, seatIndex: seatMenu.seatIndex })
            setSeatMenu(null)
          }}
          onClose={() => setSeatMenu(null)}
        />
      )}

      {pendingAssign && guestsById[pendingAssign.guestId] && (
        <ConfirmMoveSheet
          guest={guestsById[pendingAssign.guestId]}
          fromTableName={
            tables.find(t => t.id === placementMap[pendingAssign.guestId]?.tableId)?.name ?? '?'
          }
          onConfirm={confirmAssign}
          onCancel={() => setPendingAssign(null)}
        />
      )}

      {showCreateTables && (
        <CreateTablesModal
          existingCount={tables.length}
          guestCount={guests.length}
          participationEnabled={list.options.participationEnabled}
          types={pendingTypes}
          setTypes={setPendingTypes}
          selectedTypeId={selectedPendingTypeId}
          setSelectedTypeId={setSelectedPendingTypeId}
          onClose={() => setShowCreateTables(false)}
          onCreate={handleCreateTables}
        />
      )}
    </div>
  )
}
