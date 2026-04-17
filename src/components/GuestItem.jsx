import { useRef, useState } from 'react'
import { formatGuestName } from '../lib/utils'

const SWIPE_THRESHOLD = 80

export default function GuestItem({
  guest, labelSystems = [], notationEnabled, invitationSentEnabled,
  onDelete, onEdit,
  selectMode = false, selected = false, onSelect
}) {
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(null)

  // Collecter les labels assignés (tous systèmes confondus)
  const assignedLabels = labelSystems
    .filter(ls => ls.enabled)
    .map(ls => {
      const labelId = guest.labelIds?.[ls.id] ?? null
      return labelId ? (ls.items || []).find(l => l.id === labelId) : null
    })
    .filter(Boolean)

  function onTouchStart(e) {
    if (selectMode) return
    startX.current = e.touches[0].clientX
    setSwiping(false)
  }

  function onTouchMove(e) {
    if (selectMode) return
    if (startX.current === null) return
    const delta = e.touches[0].clientX - startX.current
    if (delta < 0) {
      setSwiping(true)
      setOffsetX(Math.max(delta, -SWIPE_THRESHOLD * 1.5))
    }
  }

  function onTouchEnd() {
    if (selectMode) return
    if (offsetX < -SWIPE_THRESHOLD) onDelete()
    setOffsetX(0)
    setSwiping(false)
    startX.current = null
  }

  const swipeProgress = selectMode ? 0 : Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1)

  const participationRing =
    guest.participation === 'yes' ? 'ring-1 ring-emerald-500/50' :
    guest.participation === 'no'  ? 'ring-1 ring-red-500/50' : ''

  function handleItemClick() {
    if (selectMode && onSelect) onSelect()
  }

  return (
    <div className={`relative overflow-hidden rounded-xl ${participationRing}`}>
      {/* Background rouge visible au swipe */}
      {!selectMode && (
        <div
          className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
          style={{ backgroundColor: `rgba(239,68,68,${swipeProgress * 0.9})` }}
        >
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
      )}

      {/* Contenu */}
      <div
        className={`relative bg-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-transform select-none ${selectMode ? 'cursor-pointer' : ''}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={handleItemClick}
      >
        {/* Checkbox de sélection */}
        {selectMode && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); if (onSelect) onSelect() }}
            className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors flex items-center justify-center ${
              selected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 bg-transparent'
            }`}
          >
            {selected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}

        {/* Label color dots */}
        {assignedLabels.length > 0 && (
          <div className="flex gap-1 flex-shrink-0 items-center">
            {assignedLabels.map(label => (
              <span key={label.id} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label.color || '#475569' }} />
            ))}
          </div>
        )}

        {/* Nom */}
        <span className="flex-1 text-white font-medium truncate">{formatGuestName(guest)}</span>

        {/* Meta */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {assignedLabels.map(label => (
            <span
              key={label.id}
              className="text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block"
              style={{ backgroundColor: label.color ? label.color + '33' : '#47556933', color: label.color || '#94a3b8' }}
            >
              {label.name}
            </span>
          ))}
          {notationEnabled && guest.rating != null && (
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
              {guest.rating}
            </span>
          )}
          {/* Invitation non envoyée */}
          {invitationSentEnabled && !guest.invitationSent && !selectMode && (
            <span className="text-slate-500 flex items-center" title="Invitation non envoyée">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </span>
          )}
          {!selectMode && onEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit() }}
              className="text-slate-500 hover:text-indigo-400 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {!selectMode && (
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              className="text-slate-500 hover:text-red-400 transition-colors p-1 -mr-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
