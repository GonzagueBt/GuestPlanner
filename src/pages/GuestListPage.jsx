import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { groupGuests, formatDate, formatGuestName } from '../lib/utils'
import KpiBar from '../components/KpiBar'
import GuestItem from '../components/GuestItem'
import AddGuestModal from '../components/AddGuestModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import EditOptionsModal from '../components/EditOptionsModal'
import ListDataModal from '../components/ListDataModal'
import CreateTablesModal from '../components/CreateTablesModal'
import BulkActionModal from '../components/BulkActionModal'

function computeSuggestions(guests, firstName, lastName) {
  const fn = firstName.trim().toLowerCase()
  const ln = lastName.trim().toLowerCase()
  if (!fn && !ln) return []

  return guests.filter(g => {
    const gFn = (g.firstName || '').toLowerCase()
    const gLn = (g.lastName || '').toLowerCase()

    if (fn && !ln) {
      return gFn.includes(fn)
    }
    if (!fn && ln) {
      return gLn.includes(ln)
    }
    return (gLn === ln && gFn.includes(fn)) || (gFn === fn && gLn.includes(ln))
  }).slice(0, 5)
}

export default function GuestListPage({ store }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const {
    lists, getList, addGuest, removeGuest, updateGuest, updateListOptions,
    exportListJson, exportListExcel, duplicateList, createTables,
    bulkUpdateGuests, removeGuests, copyGuestsToList
  } = store

  const list = getList(id)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [sortMode, setSortMode] = useState(() =>
    localStorage.getItem(`guestplanner_sort_${id}`) || 'alpha'
  )
  const [sortAsc, setSortAsc] = useState(() => {
    const stored = localStorage.getItem(`guestplanner_sort_asc_${id}`)
    return stored === null ? true : stored === 'true'
  })
  const [pendingGuest, setPendingGuest] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showOptions, setShowOptions] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [filters, setFilters] = useState({
    participation: 'all',
    labelId1: 'all',
    labelId2: 'all',
    ageCategoryId: 'all',
    invitation: 'all',
  })
  const [showDataModal, setShowDataModal] = useState(false)
  const [showCreateTables, setShowCreateTables] = useState(false)
  const [pendingTableTypes, setPendingTableTypes] = useState([])
  const [selectedPendingTypeId, setSelectedPendingTypeId] = useState(null)

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkTargetGuests, setBulkTargetGuests] = useState(null)

  useEffect(() => {
    if (!list) navigate('/')
  }, [list, navigate])

  if (!list) return null

  const { options } = list

  const fn = firstName.trim()
  const ln = lastName.trim()
  const hasInput = fn || ln

  const suggestions = computeSuggestions(list.guests, firstName, lastName)

  const alreadyExists = hasInput && list.guests.some(
    g => (g.firstName || '').toLowerCase() === fn.toLowerCase() &&
         (g.lastName || '').toLowerCase() === ln.toLowerCase()
  )

  const needsModal =
    options.genderEnabled ||
    options.participationEnabled ||
    options.invitationSentEnabled ||
    (options.ageSystem.enabled && options.ageSystem.items.length > 0) ||
    options.notation.enabled ||
    (options.labelSystem1.enabled && options.labelSystem1.items.length > 0) ||
    (options.labelSystem2.enabled && options.labelSystem2.items.length > 0)

  function applyFilters(guests) {
    return guests.filter(g => {
      if (options.participationEnabled && filters.participation !== 'all') {
        if (filters.participation === 'yes+pending') { if (g.participation === 'no') return false }
        else {
          const val = filters.participation === 'pending' ? null : filters.participation
          if (g.participation !== val) return false
        }
      }
      if (options.labelSystem1.enabled && filters.labelId1 !== 'all') {
        const val = filters.labelId1 === 'none' ? null : filters.labelId1
        if (g.labelId1 !== val) return false
      }
      if (options.labelSystem2.enabled && filters.labelId2 !== 'all') {
        const val = filters.labelId2 === 'none' ? null : filters.labelId2
        if (g.labelId2 !== val) return false
      }
      if (options.ageSystem.enabled && options.ageSystem.items.length > 0 && filters.ageCategoryId !== 'all') {
        const val = filters.ageCategoryId === 'none' ? null : filters.ageCategoryId
        if (g.ageCategoryId !== val) return false
      }
      if (options.invitationSentEnabled && filters.invitation !== 'all') {
        if (filters.invitation === 'sent' && !g.invitationSent) return false
        if (filters.invitation === 'unsent' && g.invitationSent) return false
      }
      return true
    })
  }

  function handleAdd() {
    if (!hasInput || alreadyExists) return
    setShowSuggestions(false)
    if (needsModal) {
      setPendingGuest({ firstName: fn, lastName: ln })
    } else {
      addGuest(id, fn, ln, null, null, null, null, null, null, false)
      setFirstName('')
      setLastName('')
    }
  }

  function handleModalConfirm(firstName, lastName, gender, ageCategory, rating, labelId1, labelId2, participation, invitationSent) {
    addGuest(id, firstName, lastName, gender, ageCategory, rating, labelId1, labelId2, participation, invitationSent)
    setPendingGuest(null)
    setFirstName('')
    setLastName('')
  }

  function handleEditConfirm(firstName, lastName, gender, ageCategory, rating, labelId1, labelId2, participation, invitationSent) {
    updateGuest(id, editTarget.id, firstName, lastName, gender, ageCategory, rating, labelId1, labelId2, participation, invitationSent)
    setEditTarget(null)
  }

  function handleSaveOptions(name, newNotation, newGenderEnabled, newParticipationEnabled, newInvitationSentEnabled, newAgeSystem, newLabelSystem1, newLabelSystem2) {
    updateListOptions(id, name, newNotation, newGenderEnabled, newParticipationEnabled, newInvitationSentEnabled, newAgeSystem, newLabelSystem1, newLabelSystem2)
    setShowOptions(false)
  }

  function handleCreateTables(configs) {
    createTables(id, configs)
    setPendingTableTypes([])
    setSelectedPendingTypeId(null)
    setShowCreateTables(false)
  }

  function handleDuplicate() {
    const newId = duplicateList(id)
    setShowDataModal(false)
    if (newId) navigate(`/list/${newId}`)
  }

  function handleDeleteConfirm() {
    removeGuest(id, deleteTarget.id)
    setDeleteTarget(null)
  }

  function changeSortMode(mode) {
    setSortMode(mode)
    localStorage.setItem(`guestplanner_sort_${id}`, mode)
  }

  function toggleSortAsc() {
    const next = !sortAsc
    setSortAsc(next)
    localStorage.setItem(`guestplanner_sort_asc_${id}`, String(next))
  }

  function handleBlur() {
    setTimeout(() => setShowSuggestions(false), 150)
  }

  const notationEnabled = options.notation.enabled
  const canSortByAge = options.ageSystem.enabled && options.ageSystem.items.length > 0
  const canSortByLabel1 = options.labelSystem1.enabled && options.labelSystem1.items.length > 0
  const canSortByLabel2 = options.labelSystem2.enabled && options.labelSystem2.items.length > 0
  const canSortByRating = notationEnabled

  const availableSorts = [
    { key: 'alpha', label: 'A→Z' },
    canSortByAge && { key: 'age', label: 'Âge' },
    canSortByLabel1 && { key: 'label1', label: options.labelSystem1.name },
    canSortByLabel2 && { key: 'label2', label: options.labelSystem2.name },
    canSortByRating && { key: 'rating', label: 'Notes' }
  ].filter(Boolean)

  const effectiveSortMode = availableSorts.find(m => m.key === sortMode) ? sortMode : 'alpha'
  const notationMax = notationEnabled ? options.notation.max : null

  const filteredGuests = applyFilters(list.guests)
  const grouped = groupGuests(filteredGuests, effectiveSortMode, options.labelSystem1, options.labelSystem2, options.ageSystem, notationMax, sortAsc)

  const hasAnyFilter =
    filters.participation !== 'all' ||
    filters.labelId1 !== 'all' ||
    filters.labelId2 !== 'all' ||
    filters.ageCategoryId !== 'all' ||
    filters.invitation !== 'all'

  const showFilterRow =
    options.participationEnabled ||
    (options.labelSystem1.enabled && options.labelSystem1.items.length > 0) ||
    (options.labelSystem2.enabled && options.labelSystem2.items.length > 0) ||
    (options.ageSystem.enabled && options.ageSystem.items.length > 0) ||
    options.invitationSentEnabled

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
              onClick={() => setShowCreateTables(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center relative"
              title="Tables"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M10 3v18M14 3v18" />
              </svg>
              {list.tables?.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-400" />
              )}
            </button>
            {/* Multi-select toggle */}
            <button
              onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
              className={`p-2 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${selectMode ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
              title="Sélection multiple"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
              </svg>
            </button>
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
            <button
              onClick={() => setShowDataModal(true)}
              className="p-2 text-slate-400 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Exporter / Importer / Dupliquer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
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
                {/* "Modifier tous" option when 2+ suggestions */}
                {suggestions.length >= 2 && (
                  <button
                    className="w-full text-left px-4 py-3 text-indigo-400 hover:bg-slate-600 transition-colors text-sm border-b border-slate-600/50 flex items-center gap-2"
                    onMouseDown={() => { setBulkTargetGuests(suggestions); setShowBulkModal(true); setShowSuggestions(false) }}
                  >
                    <span className="flex-1">Modifier les {suggestions.length} résultats</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                )}
                {suggestions.map(guest => (
                  <button
                    key={guest.id}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-600 transition-colors text-sm border-b border-slate-600/50 last:border-0 flex items-center gap-2"
                    onMouseDown={() => { setEditTarget(guest); setShowSuggestions(false) }}
                  >
                    <span className="flex-1">{formatGuestName(guest)}</span>
                    <span className="text-xs text-slate-500">modifier</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tri + direction */}
          {availableSorts.length > 1 && (
            <div className="flex gap-2 items-center">
              <label className="flex items-center gap-2 flex-1 text-xs text-slate-500">
                Trier
                <select
                  value={effectiveSortMode}
                  onChange={e => changeSortMode(e.target.value)}
                  className="flex-1 bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {availableSorts.map(m => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={toggleSortAsc}
                className="bg-slate-700 hover:bg-slate-600 text-white rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors flex-shrink-0"
                title={sortAsc ? 'Ordre croissant' : 'Ordre décroissant'}
              >
                {sortAsc ? '↑' : '↓'}
              </button>
            </div>
          )}

          {/* Filtres multi-dimensionnels */}
          {showFilterRow && (
            <div className="flex flex-wrap gap-2 items-center">
              {options.participationEnabled && (
                <select
                  value={filters.participation}
                  onChange={e => setFilters(f => ({ ...f, participation: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Participation</option>
                  <option value="yes">Participe</option>
                  <option value="no">Absent</option>
                  <option value="pending">Sans réponse</option>
                  <option value="yes+pending">Participe + sans réponse</option>
                </select>
              )}
              {options.labelSystem1.enabled && options.labelSystem1.items.length > 0 && (
                <select
                  value={filters.labelId1}
                  onChange={e => setFilters(f => ({ ...f, labelId1: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">{options.labelSystem1.name}</option>
                  {options.labelSystem1.items.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                  <option value="none">Sans label</option>
                </select>
              )}
              {options.labelSystem2.enabled && options.labelSystem2.items.length > 0 && (
                <select
                  value={filters.labelId2}
                  onChange={e => setFilters(f => ({ ...f, labelId2: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">{options.labelSystem2.name}</option>
                  {options.labelSystem2.items.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                  <option value="none">Sans label</option>
                </select>
              )}
              {options.ageSystem.enabled && options.ageSystem.items.length > 0 && (
                <select
                  value={filters.ageCategoryId}
                  onChange={e => setFilters(f => ({ ...f, ageCategoryId: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Âge</option>
                  {options.ageSystem.items.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  <option value="none">Sans catégorie</option>
                </select>
              )}
              {options.invitationSentEnabled && (
                <select
                  value={filters.invitation}
                  onChange={e => setFilters(f => ({ ...f, invitation: e.target.value }))}
                  className="bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="all">Invitation</option>
                  <option value="sent">Envoyée</option>
                  <option value="unsent">Non envoyée</option>
                </select>
              )}
              {hasAnyFilter && (
                <span className="text-xs text-indigo-400 font-medium">
                  {filteredGuests.length} invité{filteredGuests.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Liste des invités */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
          {/* Select all bar */}
          {selectMode && (
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-sm text-slate-400">{selectedIds.size} sélectionné(s)</span>
              <button type="button" onClick={() => {
                if (selectedIds.size === filteredGuests.length)
                  setSelectedIds(new Set())
                else
                  setSelectedIds(new Set(filteredGuests.map(g => g.id)))
              }} className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                {selectedIds.size === filteredGuests.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>
          )}

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
                  <span className="text-sm font-semibold text-slate-500">· {item.count}</span>
                  {(item.maleCount > 0 || item.femaleCount > 0) && (
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <span className="text-blue-500/70">{item.maleCount}♂</span>
                      <span className="text-pink-500/70">{item.femaleCount}♀</span>
                    </span>
                  )}
                  <span className="flex-1 h-px bg-slate-700/60" />
                </div>
              ) : (
                <GuestItem
                  key={item.guest.id}
                  guest={item.guest}
                  labelSystem1={options.labelSystem1}
                  labelSystem2={options.labelSystem2}
                  notationEnabled={notationEnabled}
                  invitationSentEnabled={options.invitationSentEnabled}
                  onDelete={() => setDeleteTarget(item.guest)}
                  onEdit={() => setEditTarget(item.guest)}
                  selectMode={selectMode}
                  selected={selectedIds.has(item.guest.id)}
                  onSelect={() => setSelectedIds(prev => {
                    const next = new Set(prev)
                    if (next.has(item.guest.id)) next.delete(item.guest.id)
                    else next.add(item.guest.id)
                    return next
                  })}
                />
              )
            )
          )}
        </div>
      </div>

      {/* Sticky bottom bar for bulk actions */}
      {selectMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 flex items-center gap-3 z-40">
          <span className="text-sm text-white font-medium flex-1">{selectedIds.size} invité{selectedIds.size !== 1 ? 's' : ''} sélectionné{selectedIds.size !== 1 ? 's' : ''}</span>
          <button onClick={() => { setBulkTargetGuests(null); setShowBulkModal(true) }}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Actions
          </button>
        </div>
      )}

      {/* Modal ajout */}
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
          initialGender={editTarget.gender}
          initialAgeCategory={editTarget.ageCategoryId}
          initialRating={editTarget.rating}
          initialLabelId1={editTarget.labelId1}
          initialLabelId2={editTarget.labelId2}
          initialParticipation={editTarget.participation}
          initialInvitationSent={editTarget.invitationSent}
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

      {/* Création de tables */}
      {showCreateTables && (
        <CreateTablesModal
          existingCount={list.tables?.length ?? 0}
          guestCount={
            options.participationEnabled
              ? list.guests.filter(g => g.participation !== 'no').length
              : list.guests.length
          }
          participationEnabled={options.participationEnabled}
          types={pendingTableTypes}
          setTypes={setPendingTableTypes}
          selectedTypeId={selectedPendingTypeId}
          setSelectedTypeId={setSelectedPendingTypeId}
          onClose={() => setShowCreateTables(false)}
          onCreate={handleCreateTables}
        />
      )}

      {/* Export / Import / Dupliquer */}
      {showDataModal && (
        <ListDataModal
          listName={list.name}
          onClose={() => setShowDataModal(false)}
          onExportJson={() => { exportListJson(id); setShowDataModal(false) }}
          onExportExcel={() => { exportListExcel(id); setShowDataModal(false) }}
          onDuplicate={handleDuplicate}
        />
      )}

      {/* Bulk action modal */}
      {showBulkModal && (
        <BulkActionModal
          guests={list.guests}
          guestIds={bulkTargetGuests ? new Set(bulkTargetGuests.map(g => g.id)) : selectedIds}
          options={options}
          lists={lists}
          currentListId={id}
          onClose={() => { setShowBulkModal(false); setBulkTargetGuests(null) }}
          onBulkUpdate={updates => {
            const ids = bulkTargetGuests ? new Set(bulkTargetGuests.map(g => g.id)) : selectedIds
            bulkUpdateGuests(id, ids, updates)
            setSelectedIds(new Set()); setSelectMode(false)
          }}
          onBulkDelete={() => {
            const ids = bulkTargetGuests ? new Set(bulkTargetGuests.map(g => g.id)) : selectedIds
            removeGuests(id, ids)
            setSelectedIds(new Set()); setSelectMode(false)
          }}
          onCopyToList={targetListId => {
            const ids = bulkTargetGuests ? new Set(bulkTargetGuests.map(g => g.id)) : selectedIds
            copyGuestsToList(id, ids, targetListId)
          }}
        />
      )}
    </div>
  )
}
