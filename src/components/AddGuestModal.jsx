import { useState } from 'react'

export default function AddGuestModal({
  guestFirstName, guestLastName,
  options, onConfirm, onClose,
  isEditing = false,
  initialGender = null,
  initialAgeCategory = null,
  initialRating = null,
  initialLabelIds = {},
  initialParticipation = null,
  initialInvitationSent = false
}) {
  const { notation, genderEnabled, participationEnabled, invitationSentEnabled, ageSystem, labelSystems = [] } = options
  const [firstName, setFirstName] = useState(guestFirstName)
  const [lastName, setLastName] = useState(guestLastName)
  const [gender, setGender] = useState(initialGender)
  const [ageCategory, setAgeCategory] = useState(initialAgeCategory)
  const [rating, setRating] = useState(initialRating)
  const [labelIds, setLabelIds] = useState(initialLabelIds ?? {})
  const [participation, setParticipation] = useState(initialParticipation)
  const [invitationSent, setInvitationSent] = useState(initialInvitationSent ?? false)

  const canSubmit = (firstName.trim() || lastName.trim())

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onConfirm(firstName.trim(), lastName.trim(), gender, ageCategory, rating, labelIds, participation, invitationSent)
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Nom */}
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

            {/* Participation */}
            {participationEnabled && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Participation</p>
                <div className="flex gap-2">
                  {[
                    { key: null,   label: 'Sans réponse', cls: 'bg-slate-700 text-slate-400 hover:bg-slate-600/80 hover:text-slate-200', active: 'bg-slate-600 text-white ring-2 ring-slate-400/60' },
                    { key: 'yes',  label: 'Participe',    cls: 'bg-slate-700 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400', active: 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/60' },
                    { key: 'no',   label: 'Absent',       cls: 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400',     active: 'bg-red-500/20 text-red-400 ring-2 ring-red-500/60' },
                  ].map(({ key, label, cls, active }) => (
                    <button key={String(key)} type="button"
                      onClick={() => setParticipation(prev => prev === key ? null : key)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${participation === key ? active : cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invitation */}
            {invitationSentEnabled && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Invitation</p>
                <div className="flex gap-2">
                  {[
                    { key: false, label: 'Non envoyée', cls: 'bg-slate-700 text-slate-400 hover:bg-slate-600/80', active: 'bg-slate-600 text-white ring-2 ring-slate-400/60' },
                    { key: true,  label: 'Envoyée',    cls: 'bg-slate-700 text-slate-400 hover:bg-indigo-500/20 hover:text-indigo-400', active: 'bg-indigo-500/20 text-indigo-400 ring-2 ring-indigo-500/60' },
                  ].map(({ key, label, cls, active }) => (
                    <button key={String(key)} type="button"
                      onClick={() => setInvitationSent(key)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-all ${invitationSent === key ? active : cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Genre */}
            {genderEnabled && <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Genre</p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setGender(prev => prev === 'M' ? null : 'M')}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl font-medium transition-all ${
                    gender === 'M'
                      ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/60'
                      : 'bg-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-600/80'
                  }`}
                >
                  <span className="text-xl leading-none">♂</span>
                  <span className="text-xs font-medium">Homme</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGender(prev => prev === 'F' ? null : 'F')}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl font-medium transition-all ${
                    gender === 'F'
                      ? 'bg-pink-500/20 text-pink-400 ring-2 ring-pink-500/60'
                      : 'bg-slate-700 text-slate-500 hover:text-slate-300 hover:bg-slate-600/80'
                  }`}
                >
                  <span className="text-xl leading-none">♀</span>
                  <span className="text-xs font-medium">Femme</span>
                </button>
              </div>
            </div>}

            {/* Catégorie d'âge */}
            {ageSystem.enabled && ageSystem.items.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Catégorie d'âge</p>
                <div className="flex flex-wrap gap-2">
                  {ageSystem.items.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setAgeCategory(prev => prev === cat.id ? null : cat.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        ageCategory === cat.id
                          ? 'bg-amber-500/20 text-amber-400 ring-2 ring-amber-500/60'
                          : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Systèmes de labels */}
            {labelSystems.filter(ls => ls.enabled && ls.items.length > 0).map(ls => (
              <div key={ls.id}>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{ls.name}</p>
                <div className="flex flex-wrap gap-2">
                  {ls.items.map(label => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => setLabelIds(prev => ({ ...prev, [ls.id]: prev[ls.id] === label.id ? null : label.id }))}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border-2 ${
                        labelIds[ls.id] === label.id ? 'border-white/70 scale-105' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
                    >
                      {label.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Notation */}
            {notation.enabled && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                  Note <span className="normal-case">(sur {notation.max})</span>
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
