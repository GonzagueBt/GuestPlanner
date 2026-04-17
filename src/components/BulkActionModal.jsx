import { useState } from 'react'

export default function BulkActionModal({
  guests,
  guestIds,
  options,
  lists,
  currentListId,
  onClose,
  onBulkUpdate,
  onBulkDelete,
  onCopyToList,
}) {
  const UNSET = '__unset__'
  const [screen, setScreen] = useState('main')
  const [selectedValue, setSelectedValue] = useState(UNSET)
  const [lastNameValue, setLastNameValue] = useState('')
  const [activeLabelSystem, setActiveLabelSystem] = useState(null)

  const count = guestIds.size
  const { labelSystems = [], ageSystem, participationEnabled, invitationSentEnabled } = options

  const otherLists = lists.filter(l => l.id !== currentListId)
  const enabledLabelSystems = labelSystems.filter(ls => ls.enabled && ls.items.length > 0)

  function goBack() {
    setScreen('main')
    setSelectedValue(UNSET)
    setLastNameValue('')
    setActiveLabelSystem(null)
  }

  function renderHeader() {
    return (
      <div className="flex items-center justify-between mb-5">
        {screen !== 'main' ? (
          <button onClick={goBack} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </button>
        ) : (
          <p className="text-sm font-semibold text-white">{count} invité{count !== 1 ? 's' : ''} sélectionné{count !== 1 ? 's' : ''}</p>
        )}
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 ml-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  function ActionButton({ onClick, danger, children }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full text-left px-4 py-3.5 rounded-xl font-medium text-sm transition-colors flex items-center gap-3 ${
          danger
            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
            : 'bg-slate-700 text-white hover:bg-slate-600'
        }`}
      >
        {children}
      </button>
    )
  }

  // Main screen
  if (screen === 'main') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="p-5">
            {renderHeader()}
            <div className="space-y-2">
              <ActionButton danger onClick={() => setScreen('delete')}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Supprimer les {count} invité{count !== 1 ? 's' : ''}
              </ActionButton>

              {enabledLabelSystems.map(ls => (
                <ActionButton key={ls.id} onClick={() => { setSelectedValue(UNSET); setActiveLabelSystem(ls); setScreen('label') }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
                  </svg>
                  {ls.name}
                </ActionButton>
              ))}

              {ageSystem.enabled && ageSystem.items.length > 0 && (
                <ActionButton onClick={() => { setSelectedValue(UNSET); setScreen('age') }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Catégorie d'âge
                </ActionButton>
              )}

              <ActionButton onClick={() => { setLastNameValue(''); setScreen('lastName') }}>
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Modifier le nom de famille
              </ActionButton>

              {participationEnabled && (
                <ActionButton onClick={() => { setSelectedValue(UNSET); setScreen('participation') }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Participation
                </ActionButton>
              )}

              {invitationSentEnabled && (
                <ActionButton onClick={() => { setSelectedValue(UNSET); setScreen('invitation') }}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Invitation
                </ActionButton>
              )}

              {otherLists.length > 0 && (
                <ActionButton onClick={() => setScreen('copyToList')}>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier vers une autre liste
                </ActionButton>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Delete screen
  if (screen === 'delete') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm">
          <div className="p-5">
            {renderHeader()}
            <p className="text-white font-semibold text-base mb-1">Supprimer {count} invité{count !== 1 ? 's' : ''} ?</p>
            <p className="text-slate-400 text-sm mb-5">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={goBack}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
                Annuler
              </button>
              <button onClick={() => { onBulkDelete(); onClose() }}
                className="flex-1 bg-red-500 hover:bg-red-400 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
                Confirmer
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Label screen (générique pour tous les systèmes de labels)
  if (screen === 'label' && activeLabelSystem) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="p-5">
            {renderHeader()}
            <p className="text-sm font-semibold text-white mb-3">{activeLabelSystem.name}</p>
            <div className="space-y-2 mb-5">
              {activeLabelSystem.items.map(label => (
                <button key={label.id} type="button" onClick={() => setSelectedValue(label.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                    selectedValue === label.id ? 'ring-2 ring-white/50' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: label.color || '#475569', color: '#fff' }}>
                  {label.name}
                  {selectedValue === label.id && (
                    <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <button type="button" onClick={() => setSelectedValue(null)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 bg-slate-700 text-slate-400 hover:bg-slate-600 ${
                  selectedValue === null ? 'ring-2 ring-slate-400/50' : ''
                }`}>
                Retirer le label
                {selectedValue === null && (
                  <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            <button onClick={() => { onBulkUpdate({ labelIds: { [activeLabelSystem.id]: selectedValue } }); onClose() }}
              disabled={selectedValue === UNSET}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
              Appliquer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Age screen
  if (screen === 'age') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="p-5">
            {renderHeader()}
            <p className="text-sm font-semibold text-white mb-3">Catégorie d'âge</p>
            <div className="space-y-2 mb-5">
              {ageSystem.items.map(cat => (
                <button key={cat.id} type="button" onClick={() => setSelectedValue(cat.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 ${
                    selectedValue === cat.id ? 'ring-2 ring-amber-400/50' : ''
                  }`}>
                  {cat.name}
                  {selectedValue === cat.id && (
                    <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <button type="button" onClick={() => setSelectedValue(null)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 bg-slate-700 text-slate-400 hover:bg-slate-600 ${
                  selectedValue === null ? 'ring-2 ring-slate-400/50' : ''
                }`}>
                Retirer la catégorie
                {selectedValue === null && (
                  <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>
            <button onClick={() => { onBulkUpdate({ ageCategoryId: selectedValue }); onClose() }}
              disabled={selectedValue === UNSET}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
              Appliquer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Last name screen
  if (screen === 'lastName') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm">
          <div className="p-5">
            {renderHeader()}
            <p className="text-sm font-semibold text-white mb-3">Modifier le nom de famille</p>
            <input
              type="text"
              value={lastNameValue}
              onChange={e => setLastNameValue(e.target.value)}
              placeholder="Nom de famille"
              autoFocus
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 mb-4"
            />
            <button
              onClick={() => { onBulkUpdate({ lastName: lastNameValue.trim() }); onClose() }}
              disabled={!lastNameValue.trim()}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
              Appliquer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Participation screen
  if (screen === 'participation') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm">
          <div className="p-5">
            {renderHeader()}
            <p className="text-sm font-semibold text-white mb-3">Participation</p>
            <div className="space-y-2 mb-5">
              {[
                { key: 'yes', label: 'Participe', cls: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20', ring: 'ring-emerald-400/50' },
                { key: 'no', label: 'Absent', cls: 'bg-red-500/10 text-red-400 hover:bg-red-500/20', ring: 'ring-red-400/50' },
                { key: null, label: 'Sans réponse', cls: 'bg-slate-700 text-slate-400 hover:bg-slate-600', ring: 'ring-slate-400/50' },
              ].map(({ key, label, cls, ring }) => (
                <button key={String(key)} type="button" onClick={() => setSelectedValue(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${cls} ${selectedValue === key ? `ring-2 ${ring}` : ''}`}>
                  {label}
                  {selectedValue === key && (
                    <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { onBulkUpdate({ participation: selectedValue }); onClose() }}
              disabled={selectedValue === UNSET}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
              Appliquer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Invitation screen
  if (screen === 'invitation') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm">
          <div className="p-5">
            {renderHeader()}
            <p className="text-sm font-semibold text-white mb-3">Invitation</p>
            <div className="space-y-2 mb-5">
              {[
                { key: true, label: 'Envoyée', cls: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20', ring: 'ring-indigo-400/50' },
                { key: false, label: 'Non envoyée', cls: 'bg-slate-700 text-slate-400 hover:bg-slate-600', ring: 'ring-slate-400/50' },
              ].map(({ key, label, cls, ring }) => (
                <button key={String(key)} type="button" onClick={() => setSelectedValue(key)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${cls} ${selectedValue === key ? `ring-2 ${ring}` : ''}`}>
                  {label}
                  {selectedValue === key && (
                    <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={() => { onBulkUpdate({ invitationSent: selectedValue }); onClose() }}
              disabled={selectedValue === UNSET}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors">
              Appliquer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Copy to list screen
  if (screen === 'copyToList') {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto no-scrollbar">
          <div className="p-5">
            {renderHeader()}
            <p className="text-sm font-semibold text-white mb-3">Copier vers une autre liste</p>
            <div className="space-y-2">
              {otherLists.map(l => (
                <button key={l.id} type="button"
                  onClick={() => { onCopyToList(l.id); onClose() }}
                  className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors bg-slate-700 text-white hover:bg-slate-600 flex items-center justify-between gap-3">
                  <span className="truncate">{l.name}</span>
                  <span className="text-slate-500 text-xs flex-shrink-0">{l.guests.length} invité{l.guests.length !== 1 ? 's' : ''}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
