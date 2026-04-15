import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { groupGuests, formatDate, formatGuestName } from '../lib/utils'
import KpiBar from '../components/KpiBar'
import GuestItem from '../components/GuestItem'
import AddGuestModal from '../components/AddGuestModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import EditOptionsModal from '../components/EditOptionsModal'

const SORT_MODES = [
  { key: 'alpha', label: 'A→Z' },
  { key: 'label', label: 'Labels' },
  { key: 'rating', label: 'Notes' }
]

function computeSuggestions(guests, firstName, lastName) {
  const fn = firstName.trim().toLowerCase()
  const ln = lastName.trim().toLowerCase()
  if (!fn && !ln) return []

  return guests.filter(g => {
    const gFn = (g.firstName || '').toLowerCase()
    const gLn = (g.lastName || '').toLowerCase()

    if (fn && !ln) {
      // Seulement prénom : contient
      return gFn.includes(fn)
    }
    if (!fn && ln) {
      // Seulement nom : contient
      return gLn.includes(ln)
    }
    // Les deux remplis : nom exact + prénom contient, OU prénom exact + nom contient
    return (gLn === ln && gFn.includes(fn)) || (gFn === fn && gLn.includes(ln))
  }).slice(0, 5)
}

export default function GuestListPage({ store }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getList, addGuest, removeGuest, updateGuest, updateListOptions } = store

  const list = getList(id)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortMode, setSortMode] = useState(() =>
    localStorage.getItem(`guestplanner_sort_${id}`) || 'alpha'
  )
  const [pendingGuest, setPendingGuest] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [editTarget, setEditTarget] = useState(null)

  useEffect(() => {
    if (!list) navigate('/')
  }, [list, navigate])

  if (!list) return null

  const { options } = list
  const needsModal = options.notation.enabled || (options.labels.enabled && options.labels.items.length > 0)

  const fn = firstName.trim()
  const ln = lastName.trim()
  const hasInput = fn || ln

  const suggestions = computeSuggestions(list.guests, firstName, lastName)

  const alreadyExists = hasInput && list.guests.some(
    g => (g.firstName || '').toLowerCase() === fn.toLowerCase() &&
         (g.lastName || '').toLowerCase() === ln.toLowerCase()
  )

  function handleAdd() {
    if (!hasInput || alreadyExists) return
    setShowSuggestions(false)
    if (needsModal) {
      setPendingGuest({ firstName: fn, lastName: ln })
    } else {
      addGuest(id, fn, ln, null, null)
      setFirstName('')
      setLastName('')
    }
  }

  function handleSuggestionClick(guest) {
    setFirstName(guest.firstName || '')
    setLastName(guest.lastName || '')
    setShowSuggestions(false)
  }

  function handleModalConfirm(firstName, lastName, rating, labelId) {
    addGuest(id, firstName, lastName, rating, labelId)
    setPendingGuest(null)
    setFirstName('')
    setLastName('')
  }

  function handleEditConfirm(firstName, lastName, rating, labelId) {
    updateGuest(id, editTarget.id, firstName, lastName, rating, labelId)
    setEditTarget(null)
  }

  function handleSaveOptions(name, newNotation, newLabels) {
    updateListOptions(id, name, newNotation, newLabels)
    setShowOptions(false)
  }

  function handleDeleteConfirm() {
    removeGuest(id, deleteTarget.id)
    setDeleteTarget(null)
  }

  function changeSortMode(mode) {
    setSortMode(mode)
    localStorage.setItem(`guestplanner_sort_${id}`, mode)
  }

  function handleBlur() {
    setTimeout(() => setShowSuggestions(false), 150)
  }

  const labelsEnabled = options.labels.enabled
  const notationEnabled = options.notation.enabled
  const canSortByLabel = labelsEnabled && options.labels.items.length > 0
  const canSortByRating = notationEnabled

  const availableSorts = SORT_MODES.filter(m => {
    if (m.key === 'label') return canSortByLabel
    if (m.key === 'rating') return canSortByRating
    return true
  })

  const effectiveSortMode = availableSorts.find(m => m.key === sortMode) ? sortMode : 'alpha'
  const notationMax = notationEnabled ? options.notation.max : null
  const grouped = groupGuests(list.guests, effectiveSortMode, options.labels.items, notationMax)

  return (
    <div className="min-h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 pt-5 pb-4 flex-shrink-0">
        <div className="max-w-lg mx-auto space-y-4">
          {/* Titre + dates + options */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-white truncate">{list.name}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Créée le {formatDate(list.createdAt)}
                {list.createdAt.slice(0, 10) !== list.updatedAt.slice(0, 10) && (
                  <> · Modifiée le {formatDate(list.updatedAt)}</>
                )}
              </p>
            </div>
            <button
              onClick={() => setShowOptions(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Options de la liste"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          {/* KPI */}
          <KpiBar list={list} />

          {/* Champs prénom + nom + bouton ajouter */}
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleBlur}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Prénom"
                className="flex-1 min-w-0 bg-slate-700 rounded-xl px-3 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
              <input
                type="text"
                value={lastName}
                onChange={e => { setLastName(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleBlur}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
                placeholder="Nom"
                className="flex-1 min-w-0 bg-slate-700 rounded-xl px-3 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 text-base"
              />
              <button
                onClick={handleAdd}
                disabled={!hasInput || alreadyExists}
                className={`px-4 rounded-xl font-semibold text-sm transition-colors flex-shrink-0 ${
                  !hasInput || alreadyExists
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                }`}
              >
                Ajouter
              </button>
            </div>

            {/* Message doublon */}
            {alreadyExists && (
              <p className="text-xs text-amber-400 mt-1.5 ml-1">Cet invité est déjà dans la liste</p>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-xl overflow-hidden z-10 shadow-xl">
                {suggestions.map(guest => (
                  <button
                    key={guest.id}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-600 transition-colors text-sm border-b border-slate-600/50 last:border-0 flex items-center gap-2"
                    onMouseDown={() => handleSuggestionClick(guest)}
                  >
                    <span className="flex-1">{formatGuestName(guest)}</span>
                    <span className="text-xs text-slate-500">déjà dans la liste</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tri */}
          {availableSorts.length > 1 && (
            <div className="flex gap-2">
              {availableSorts.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => changeSortMode(mode.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    effectiveSortMode === mode.key
                      ? 'bg-indigo-500 text-white'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Liste des invités */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
          {grouped.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>Aucun invité pour l'instant</p>
              <p className="text-sm mt-1">Tapez un prénom ou un nom ci-dessus pour commencer</p>
            </div>
          ) : (
            grouped.map((item, i) =>
              item.type === 'header' ? (
                <div key={`h-${i}`} className="flex items-center gap-2 pt-2 first:pt-0">
                  {item.color && (
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  )}
                  <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </span>
                  <span className="flex-1 h-px bg-slate-700/60" />
                </div>
              ) : (
                <GuestItem
                  key={item.guest.id}
                  guest={item.guest}
                  labels={options.labels.items}
                  notationEnabled={notationEnabled}
                  onDelete={() => setDeleteTarget(item.guest)}
                  onEdit={needsModal ? () => setEditTarget(item.guest) : undefined}
                />
              )
            )
          )}
        </div>
      </div>

      {/* Modal ajout (rating/label) */}
      {pendingGuest && (
        <AddGuestModal
          guestFirstName={pendingGuest.firstName}
          guestLastName={pendingGuest.lastName}
          options={options}
          onConfirm={handleModalConfirm}
          onClose={() => setPendingGuest(null)}
        />
      )}

      {/* Confirmation suppression */}
      {deleteTarget && (
        <DeleteConfirmModal
          message={`Supprimer "${formatGuestName(deleteTarget)}" de la liste ?`}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* Modal édition */}
      {editTarget && (
        <AddGuestModal
          guestFirstName={editTarget.firstName}
          guestLastName={editTarget.lastName}
          options={options}
          isEditing
          initialRating={editTarget.rating}
          initialLabelId={editTarget.labelId}
          onConfirm={handleEditConfirm}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Options de la liste */}
      {showOptions && (
        <EditOptionsModal
          list={list}
          onClose={() => setShowOptions(false)}
          onSave={handleSaveOptions}
        />
      )}
    </div>
  )
}
