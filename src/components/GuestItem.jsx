import { useRef, useState } from 'react'

const SWIPE_THRESHOLD = 80

export default function GuestItem({ guest, labels, notationEnabled, onDelete, onEdit }) {
  const [offsetX, setOffsetX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const startX = useRef(null)
  const didSwipe = useRef(false)
  const label = labels.find(l => l.id === guest.labelId)

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
    if (offsetX < -SWIPE_THRESHOLD) {
      didSwipe.current = true
      onDelete()
    } else {
      didSwipe.current = false
    }
    setOffsetX(0)
    setSwiping(false)
    startX.current = null
  }

  function handleRowClick() {
    if (didSwipe.current) { didSwipe.current = false; return }
    onEdit?.()
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
        className={`relative bg-slate-800 rounded-xl px-4 py-3.5 flex items-center gap-3 transition-transform select-none ${onEdit ? 'cursor-pointer hover:bg-slate-750 active:bg-slate-700' : ''}`}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? 'none' : 'transform 0.25s ease'
        }}
        onClick={handleRowClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Label color dot */}
        {label && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: label.color || '#475569' }}
          />
        )}

        {/* Nom */}
        <span className="flex-1 text-white font-medium truncate">{guest.name}</span>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {label && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium hidden sm:block"
              style={{ backgroundColor: label.color ? label.color + '33' : '#47556933', color: label.color || '#94a3b8' }}
            >
              {label.name}
            </span>
          )}
          {notationEnabled && guest.rating != null && (
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded-full">
              {guest.rating}
            </span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
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
