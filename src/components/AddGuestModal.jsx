import { useState } from 'react'

export default function AddGuestModal({
  guestFirstName, guestLastName,
  options, onConfirm, onClose,
  isEditing = false,
  initialGender = null,
  initialRating = null,
  initialLabelId1 = null,
  initialLabelId2 = null
}) {
  const { notation, labelSystem1, labelSystem2 } = options
  const [firstName, setFirstName] = useState(guestFirstName)
  const [lastName, setLastName] = useState(guestLastName)
  const [gender, setGender] = useState(initialGender)
  const [rating, setRating] = useState(initialRating)
  const [labelId1, setLabelId1] = useState(initialLabelId1)
  const [labelId2, setLabelId2] = useState(initialLabelId2)

  const canSubmit = (firstName.trim() || lastName.trim())

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onConfirm(firstName.trim(), lastName.trim(), gender, rating, labelId1, labelId2)
  }

  const displayName = [guestFirstName, guestLastName].filter(Boolean).join(' ')

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wide">{isEditing ? 'Modifier' : 'Ajouter'}</p>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nom — éditable en mode édition, affiché en mode ajout */}
            {isEditing ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Prénom</p>
                  <input
                    type="text"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder="Prénom"
                    className="w-full bg-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Nom</p>
                  <input
                    type="text"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder="Nom"
                    className="w-full bg-slate-700 rounded-xl px-3 py-2.5 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <h3 className="text-lg font-bold text-white">{displayName}</h3>
            )}

            {/* Genre */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Genre <span className="text-slate-500 font-normal">(optionnel)</span></p>
              <div className="flex gap-2">
                {[{ value: 'M', label: 'Homme' }, { value: 'F', label: 'Femme' }].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGender(prev => prev === value ? null : value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      gender === value
                        ? 'bg-indigo-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Label System 1 */}
            {labelSystem1.enabled && labelSystem1.items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">{labelSystem1.name}</p>
                <div className="flex flex-wrap gap-2">
                  {labelSystem1.items.map(label => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => setLabelId1(prev => prev === label.id ? null : label.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                        labelId1 === label.id ? 'border-white scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Label System 2 */}
            {labelSystem2.enabled && labelSystem2.items.length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">{labelSystem2.name}</p>
                <div className="flex flex-wrap gap-2">
                  {labelSystem2.items.map(label => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => setLabelId2(prev => prev === label.id ? null : label.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                        labelId2 === label.id ? 'border-white scale-105' : 'border-transparent'
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
              disabled={isEditing && !canSubmit}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 transition-colors"
            >
              {isEditing ? 'Enregistrer' : 'Ajouter'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
