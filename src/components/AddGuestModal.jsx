import { useState } from 'react'

export default function AddGuestModal({ guestName, options, onConfirm, onClose, isEditing = false, initialRating = null, initialLabelId = null }) {
  const { notation, labels } = options
  const [rating, setRating] = useState(initialRating)
  const [labelId, setLabelId] = useState(initialLabelId)

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(rating, labelId)
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">{isEditing ? 'Modifier' : 'Ajouter'}</p>
              <h3 className="text-lg font-bold text-white">{guestName}</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Labels */}
            {labels.enabled && labels.items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Label</p>
                <div className="flex flex-wrap gap-2">
                  {labels.items.map(label => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => setLabelId(prev => prev === label.id ? null : label.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                        labelId === label.id ? 'border-white scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Notation */}
            {notation.enabled && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">
                  Note <span className="text-slate-500 font-normal">(sur {notation.max})</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: notation.max }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(prev => prev === n ? null : n)}
                      className={`w-10 h-10 rounded-lg text-sm font-semibold transition-colors ${
                        rating === n
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl py-3 transition-colors"
            >
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
