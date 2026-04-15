import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sortGuests } from '../lib/utils'
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

export default function GuestListPage({ store }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getList, addGuest, removeGuest, updateGuest, updateListOptions } = store

  const list = getList(id)

  const [search, setSearch] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortMode, setSortMode] = useState('alpha')
  const [pendingName, setPendingName] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const searchRef = useRef()

  useEffect(() => {
    if (!list) navigate('/')
  }, [list, navigate])

  if (!list) return null

  const { options } = list
  const needsModal = options.notation.enabled || (options.labels.enabled && options.labels.items.length > 0)

  const normalizedSearch = search.trim()

  // Suggestions : noms déjà dans la liste qui contiennent la saisie
  const suggestions = normalizedSearch.length > 0
    ? list.guests
        .filter(g => g.name.toLowerCase().includes(normalizedSearch.toLowerCase()))
        .map(g => g.name)
        .slice(0, 5)
    : []

  // Vérifier si nom exact déjà dans liste
  const alreadyExists = list.guests.some(
    g => g.name.toLowerCase() === normalizedSearch.toLowerCase()
  )

  function handleAdd() {
    if (!normalizedSearch || alreadyExists) return
    if (needsModal) {
      setPendingName(normalizedSearch)
    } else {
      addGuest(id, normalizedSearch, null, null)
      setSearch('')
    }
    setShowSuggestions(false)
  }

  function handleModalConfirm(rating, labelId) {
    addGuest(id, pendingName, rating, labelId)
    setPendingName(null)
    setSearch('')
  }

  function handleEditConfirm(rating, labelId) {
    updateGuest(id, editTarget.id, rating, labelId)
    setEditTarget(null)
  }

  function handleSaveOptions(newNotation, newLabels) {
    updateListOptions(id, newNotation, newLabels)
    setShowOptions(false)
  }

  function handleDeleteConfirm() {
    removeGuest(id, deleteTarget.id)
    setDeleteTarget(null)
  }

  const sorted = sortGuests(list.guests, sortMode, options.labels.items)

  const labelsEnabled = options.labels.enabled
  const notationEnabled = options.notation.enabled
  const canSortByLabel = labelsEnabled && options.labels.items.length > 0
  const canSortByRating = notationEnabled

  const availableSorts = SORT_MODES.filter(m => {
    if (m.key === 'label') return canSortByLabel
    if (m.key === 'rating') return canSortByRating
    return true
  })

  return (
    <div className="min-h-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 pt-5 pb-4 flex-shrink-0">
        <div className="max-w-lg mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-white flex-1 truncate">{list.name}</h1>
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

          {/* Barre de recherche + bouton ajouter */}
          <div className="relative">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setShowSuggestions(true)
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  placeholder="Nom d'un invité..."
                  className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 text-base"
                />
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 rounded-xl overflow-hidden z-10 shadow-xl">
                    {suggestions.map(name => (
                      <button
                        key={name}
                        className="w-full text-left px-4 py-3 text-white hover:bg-slate-600 transition-colors text-sm border-b border-slate-600/50 last:border-0"
                        onMouseDown={() => { setSearch(name); setShowSuggestions(false) }}
                      >
                        <span className="text-slate-400 text-xs mr-2">↩</span>
                        {name}
                        <span className="text-xs text-slate-500 ml-2">(déjà dans la liste)</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAdd}
                disabled={!normalizedSearch || alreadyExists}
                className={`px-5 rounded-xl font-semibold text-sm transition-colors flex-shrink-0 ${
                  !normalizedSearch || alreadyExists
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white'
                }`}
              >
                Ajouter
              </button>
            </div>
            {alreadyExists && normalizedSearch && (
              <p className="text-xs text-amber-400 mt-1.5 ml-1">Ce nom est déjà dans la liste</p>
            )}
          </div>

          {/* Tri */}
          {availableSorts.length > 1 && (
            <div className="flex gap-2">
              {availableSorts.map(mode => (
                <button
                  key={mode.key}
                  onClick={() => setSortMode(mode.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    sortMode === mode.key
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
          {sorted.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p>Aucun invité pour l'instant</p>
              <p className="text-sm mt-1">Tapez un nom ci-dessus pour commencer</p>
            </div>
          ) : (
            sorted.map(guest => (
              <GuestItem
                key={guest.id}
                guest={guest}
                labels={options.labels.items}
                notationEnabled={notationEnabled}
                onDelete={() => setDeleteTarget(guest)}
                onEdit={needsModal ? () => setEditTarget(guest) : undefined}
              />
            ))
          )}
        </div>
      </div>

      {pendingName && (
        <AddGuestModal
          guestName={pendingName}
          options={options}
          onConfirm={handleModalConfirm}
          onClose={() => setPendingName(null)}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          message={`Supprimer "${deleteTarget.name}" de la liste ?`}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {editTarget && (
        <AddGuestModal
          guestName={editTarget.name}
          options={options}
          isEditing
          initialRating={editTarget.rating}
          initialLabelId={editTarget.labelId}
          onConfirm={handleEditConfirm}
          onClose={() => setEditTarget(null)}
        />
      )}

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
