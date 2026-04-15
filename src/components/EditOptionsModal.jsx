import { useState } from 'react'
import { newId, LABEL_COLORS } from '../lib/utils'

export default function EditOptionsModal({ list, onClose, onSave }) {
  const { options, guests } = list

  const [notationEnabled, setNotationEnabled] = useState(options.notation.enabled)
  const [notationMax, setNotationMax] = useState(options.notation.max)
  const [labelsEnabled, setLabelsEnabled] = useState(options.labels.enabled)
  // On garde les labels existants tels quels (avec leurs IDs) pour ne pas casser les assignations
  const [labels, setLabels] = useState(options.labels.items)
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(null)

  // Calcul de l'impact de la désactivation
  const guestsWithRating = guests.filter(g => g.rating != null).length
  const guestsWithLabel = guests.filter(g => g.labelId != null).length

  function addLabel() {
    const trimmed = newLabelName.trim()
    if (!trimmed) return
    setLabels(prev => [...prev, { id: newId(), name: trimmed, color: newLabelColor }])
    setNewLabelName('')
    setNewLabelColor(null)
  }

  function removeLabel(id) {
    setLabels(prev => prev.filter(l => l.id !== id))
  }

  function handleSave() {
    onSave(
      { enabled: notationEnabled, max: notationMax },
      { enabled: labelsEnabled, items: labels }
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Options de la liste</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Option notation */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notationEnabled}
                onChange={e => setNotationEnabled(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-500"
              />
              <span className="font-medium text-white">Système de notation</span>
            </label>

            {notationEnabled && (
              <div className="ml-8 space-y-2">
                <span className="text-sm text-slate-400">Note max :</span>
                <div className="flex flex-wrap gap-2">
                  {[5, 6, 7, 8, 9, 10].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNotationMax(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        notationMax === n
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Avertissement perte de données */}
            {options.notation.enabled && !notationEnabled && guestsWithRating > 0 && (
              <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Désactiver effacera les notes de {guestsWithRating} invité{guestsWithRating > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Option labels */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={labelsEnabled}
                onChange={e => setLabelsEnabled(e.target.checked)}
                className="w-5 h-5 rounded accent-indigo-500"
              />
              <span className="font-medium text-white">Système de labels</span>
            </label>

            {labelsEnabled && (
              <div className="space-y-3 ml-2">
                {/* Labels existants */}
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {labels.map(label => (
                      <span
                        key={label.id}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                        style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
                      >
                        {label.name}
                        <button
                          type="button"
                          onClick={() => removeLabel(label.id)}
                          className="hover:opacity-70 ml-0.5 leading-none"
                        >×</button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Ajouter un label */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={e => setNewLabelName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    placeholder="Nom du label (ex : Famille)"
                    className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-xs text-slate-400 mb-1.5">Couleur (optionnel)</p>
                    <div className="flex flex-wrap gap-2">
                      {LABEL_COLORS.map(color => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewLabelColor(prev => prev === color ? null : color)}
                          className={`w-7 h-7 rounded-full transition-transform ${newLabelColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addLabel}
                    disabled={!newLabelName.trim()}
                    className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                  >
                    + Ajouter le label
                  </button>
                </div>
              </div>
            )}

            {/* Avertissement perte de données */}
            {options.labels.enabled && !labelsEnabled && guestsWithLabel > 0 && (
              <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Désactiver effacera les labels de {guestsWithLabel} invité{guestsWithLabel > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl py-3.5 transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
