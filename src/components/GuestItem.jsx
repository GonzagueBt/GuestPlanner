import { useRef, useState } from 'react'
import { formatGuestName } from '../lib/utils'

const SWIPE_THRESHOLD = 80

export default function GuestItem({ guest, labelSystem1, labelSystem2, notationEnabled, onDelete, onEdit }) {
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(null)

  const label1 = (labelSystem1?.items ?? []).find(l => l.id === guest.labelId1)
  const label2 = (labelSystem2?.items ?? []).find(l => l.id === guest.labelId2)

  function onTouchStart(e) {
    startX.current = e.touches[0].clientX
    setSwiping(false)
  }

  function onTouchMove(e) {
    if (startX.current === null) return
    const delta = e.touches[0].clientX - startX.current
    if (delta < 0) {
      setSwiping(true)
      setOffsetX(Math.max(delta, -SWIPE_THRESHOLD * 1.5))
    }
  }

  function onTouchEnd() {
    if (offsetX < -SWIPE_THRESHOLD) onDelete()
    setOffsetX(0)
    setSwiping(false)
    startX.current = null
  }

  const swipeProgress = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1)

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Background rouge visible au swipe */}
      <div
        className="absolute inset-0 flex items-center justify-end pr-5 rounded-xl"
        style={{ backgroundColor: `rgba(239,68,68,${swipeProgress * 0.9})` }}
      >
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </div>

      {/* Contenu */}
      <div
        className="relative bg-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-transform select-none"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Label color dots */}
        {(label1 || label2) && (
          <div className="flex gap-1 flex-shrink-0 items-center">
            {label1 && (
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label1.color || '#475569' }} />
            )}
            {label2 && (
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: label2.color || '#475569' }} />
            )}
          </div>
        )}

        {/* Nom */}
        <span className="flex-1 text-white font-medium truncate">{formatGuestName(guest)}</span>

        {/* Meta */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {label1 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block"
              style={{ backgroundColor: label1.color ? label1.color + '33' : '#47556933', color: label1.color || '#94a3b8' }}
            >
              {label1.name}
            </span>
          )}
          {label2 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block"
              style={{ backgroundColor: label2.color ? label2.color + '33' : '#47556933', color: label2.color || '#94a3b8' }}
            >
              {label2.name}
            </span>
          )}
          {notationEnabled && guest.rating != null && (
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
              {guest.rating}
            </span>
          )}
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-slate-500 hover:text-indigo-400 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            className="text-slate-500 hover:text-red-400 transition-colors p-1 -mr-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
