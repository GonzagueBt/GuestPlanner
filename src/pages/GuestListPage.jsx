import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { groupGuests, formatDate, formatGuestName } from '../lib/utils'
import { THEMES, THEME_GROUPS, getTheme } from '../lib/themes'
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
    lists, getList, addGuest, removeGuest, updateGuest, updateListOptions, updateListTheme,
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
    participation: [],   // [] = tous ; sinon ['yes','no','pending']
    labelIds: {},        // { [sysId]: [] | [labelId, 'none', ...] }
    ageCategoryId: [],   // [] = tous ; sinon [catId, 'none', ...]
    invitation: [],      // [] = tous ; sinon ['sent','unsent']
    rating: [],          // [] = tous ; sinon ['1','2','none', ...]
  })
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [showDataModal, setShowDataModal] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)
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
  const labelSystems = options.labelSystems || []

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
    labelSystems.some(ls => ls.enabled && ls.items.length > 0)

  function applyFilters(guests) {
    return guests.filter(g => {
      if (options.participationEnabled && filters.participation.length > 0) {
        const gVal = g.participation === null ? 'pending' : g.participation
        if (!filters.participation.includes(gVal)) return false
      }
      for (const [sysId, filterVals] of Object.entries(filters.labelIds)) {
        if (filterVals && filterVals.length > 0) {
          const gVal = (g.labelIds?.[sysId] ?? null) === null ? 'none' : g.labelIds[sysId]
          if (!filterVals.includes(gVal)) return false
        }
      }
      if (options.ageSystem.enabled && options.ageSystem.items.length > 0 && filters.ageCategoryId.length > 0) {
        const gVal = g.ageCategoryId === null ? 'none' : g.ageCategoryId
        if (!filters.ageCategoryId.includes(gVal)) return false
      }
      if (options.invitationSentEnabled && filters.invitation.length > 0) {
        const gVal = g.invitationSent ? 'sent' : 'unsent'
        if (!filters.invitation.includes(gVal)) return false
      }
      if (options.notation.enabled && filters.rating.length > 0) {
        const gVal = g.rating == null ? 'none' : String(g.rating)
        if (!filters.rating.includes(gVal)) return false
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
      addGuest(id, fn, ln, null, null, null, {}, null, false)
      setFirstName('')
      setLastName('')
    }
  }

  function handleModalConfirm(firstName, lastName, gender, ageCategory, rating, labelIds, participation, invitationSent) {
    addGuest(id, firstName, lastName, gender, ageCategory, rating, labelIds, participation, invitationSent)
    setPendingGuest(null)
    setFirstName('')
    setLastName('')
  }

  function handleEditConfirm(firstName, lastName, gender, ageCategory, rating, labelIds, participation, invitationSent) {
    updateGuest(id, editTarget.id, firstName, lastName, gender, ageCategory, rating, labelIds, participation, invitationSent)
    setEditTarget(null)
  }

  function handleSaveOptions(name, newNotation, newGenderEnabled, newParticipationEnabled, newInvitationSentEnabled, newAgeSystem, newLabelSystems) {
    updateListOptions(id, name, newNotation, newGenderEnabled, newParticipationEnabled, newInvitationSentEnabled, newAgeSystem, newLabelSystems)
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

  function resetFilters() {
    setFilters({ participation: [], labelIds: {}, ageCategoryId: [], invitation: [], rating: [] })
  }

  function toggleFilter(key, val) {
    setFilters(f => {
      const cur = f[key] || []
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]
      return { ...f, [key]: next }
    })
  }

  function toggleLabelFilter(sysId, val) {
    setFilters(f => {
      const cur = f.labelIds[sysId] || []
      const next = cur.includes(val) ? cur.filter(v => v !== val) : [...cur, val]
      return { ...f, labelIds: { ...f.labelIds, [sysId]: next } }
    })
  }

  const notationEnabled = options.notation.enabled
  const canSortByAge = options.ageSystem.enabled && options.ageSystem.items.length > 0
  const canSortByRating = notationEnabled

  const availableSorts = [
    { key: 'alpha', label: 'A→Z' },
    canSortByAge && { key: 'age', label: 'Âge' },
    ...labelSystems
      .filter(ls => ls.enabled && ls.items.length > 0)
      .map(ls => ({ key: `label_${ls.id}`, label: ls.name })),
    canSortByRating && { key: 'rating', label: 'Notes' }
  ].filter(Boolean)

  const effectiveSortMode = availableSorts.find(m => m.key === sortMode) ? sortMode : 'alpha'
  const notationMax = notationEnabled ? options.notation.max : null

  const filteredGuests = applyFilters(list.guests)
  const grouped = groupGuests(filteredGuests, effectiveSortMode, labelSystems, options.ageSystem, notationMax, sortAsc)

  const hasAnyFilter =
    filters.participation.length > 0 ||
    Object.values(filters.labelIds).some(v => v && v.length > 0) ||
    filters.ageCategoryId.length > 0 ||
    filters.invitation.length > 0 ||
    filters.rating.length > 0

  const activeFilterCount = [
    filters.participation.length > 0,
    Object.values(filters.labelIds).some(v => v && v.length > 0),
    filters.ageCategoryId.length > 0,
    filters.invitation.length > 0,
    filters.rating.length > 0,
  ].filter(Boolean).length

  const showFilterRow =
    options.participationEnabled ||
    labelSystems.some(ls => ls.enabled && ls.items.length > 0) ||
    (options.ageSystem.enabled && options.ageSystem.items.length > 0) ||
    options.invitationSentEnabled ||
    options.notation.enabled

  const showStickyBar = selectMode && selectedIds.size > 0

  const theme = getTheme(options.theme)

  return (
    <div className="min-h-full bg-slate-900 flex flex-col" style={{ backgroundColor: theme.pageBg }}>
      {/* Header */}
      <div
        className="border-b border-slate-700/40 px-4 pt-5 pb-4 flex-shrink-0"
        style={{
          backgroundColor: theme.headerBg,
          borderTop: theme.topBorder ? `3px solid ${theme.topBorder}` : undefined,
        }}
      >
        <div className="max-w-lg mx-auto space-y-3">
          {/* Titre + dates + options */}
          <div className="flex items-center gap-3 pb-3 border-b border-slate-700/40">
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

        </div>
      </div>

      {/* Tri + Filtre — barre appartenant à la liste */}
      {(availableSorts.length > 1 || showFilterRow || hasAnyFilter) && (
        <div className="border-b border-slate-700/30 flex-shrink-0" style={{ backgroundColor: theme.subBarBg || theme.pageBg }}>
          <div className="max-w-lg mx-auto px-4 py-2.5 space-y-1.5">
            {(availableSorts.length > 1 || showFilterRow) && (
              <div className="flex gap-2 items-center">
                {availableSorts.length > 1 && (
                  <>
                    <label className="flex items-center gap-2 flex-1 text-xs text-slate-500 min-w-0">
                      Trier
                      <select
                        value={effectiveSortMode}
                        onChange={e => changeSortMode(e.target.value)}
                        className="flex-1 min-w-0 bg-slate-700 text-white rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
                  </>
                )}

                {showFilterRow && (
                  <button
                    onClick={() => setShowFilterModal(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                      availableSorts.length <= 1 ? 'ml-auto' : ''
                    } ${
                      hasAnyFilter
                        ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40'
                        : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
                    </svg>
                    Filtrer
                    {activeFilterCount > 0 && (
                      <span className="bg-indigo-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none flex-shrink-0">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {hasAnyFilter && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">
                  {filteredGuests.length} invité{filteredGuests.length !== 1 ? 's' : ''} correspondent aux filtres
                </span>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1 ml-auto"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Effacer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
                  labelSystems={labelSystems}
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
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 p-4 flex items-center gap-3 z-40">
          <span className="text-sm text-white font-medium flex-1">{selectedIds.size} invité{selectedIds.size !== 1 ? 's' : ''} sélectionné{selectedIds.size !== 1 ? 's' : ''}</span>
          <button onClick={() => { setBulkTargetGuests(null); setShowBulkModal(true) }}
            className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors">
            Actions
          </button>
        </div>
      )}

      {/* FAB - Multi-select */}
      <button
        onClick={() => { setSelectMode(v => !v); setSelectedIds(new Set()) }}
        style={{ right: 'max(1rem, calc((100vw - 32rem) / 2 + 1rem))' }}
        className={`fixed z-30 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          showStickyBar ? 'bottom-24' : 'bottom-6'
        } ${
          selectMode
            ? 'bg-indigo-500 text-white shadow-indigo-500/30'
            : 'bg-slate-700 text-slate-300 hover:bg-slate-600 shadow-slate-900/50'
        }`}
        title="Sélection multiple"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 8l2 2 4-4" />
        </svg>
      </button>

      {/* Filter bottom sheet */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowFilterModal(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-600" />
            </div>

            {/* Modal header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
              <div>
                <h3 className="text-white font-semibold">Filtres</h3>
                {hasAnyFilter && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeFilterCount} filtre{activeFilterCount !== 1 ? 's' : ''} actif{activeFilterCount !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasAnyFilter && (
                  <button
                    onClick={resetFilters}
                    className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
                  >
                    Effacer tout
                  </button>
                )}
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable filter sections */}
            <div className="overflow-y-auto px-4 py-4 space-y-5 flex-1">

              {/* Participation */}
              {options.participationEnabled && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2.5">Participation</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(f => ({ ...f, participation: [] }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.participation.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Tous
                    </button>
                    {[
                      { value: 'yes', label: 'Participe' },
                      { value: 'no', label: 'Absent' },
                      { value: 'pending', label: 'Sans réponse' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => toggleFilter('participation', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.participation.includes(opt.value)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Label systems */}
              {labelSystems.filter(ls => ls.enabled && ls.items.length > 0).map(ls => {
                const activeVals = filters.labelIds[ls.id] || []
                return (
                  <div key={ls.id}>
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-2.5">{ls.name}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setFilters(f => ({ ...f, labelIds: { ...f.labelIds, [ls.id]: [] } }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          activeVals.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Tous
                      </button>
                      {ls.items.map(label => {
                        const isActive = activeVals.includes(label.id)
                        return (
                          <button
                            key={label.id}
                            onClick={() => toggleLabelFilter(ls.id, label.id)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isActive ? 'ring-2 ring-white/20' : ''}`}
                            style={{
                              backgroundColor: isActive
                                ? (label.color || '#4f46e5')
                                : (label.color ? label.color + '28' : '#334155'),
                              color: isActive ? '#ffffff' : (label.color || '#94a3b8'),
                            }}
                          >
                            {label.name}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => toggleLabelFilter(ls.id, 'none')}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          activeVals.includes('none') ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        Sans {ls.name.toLowerCase()}
                      </button>
                    </div>
                  </div>
                )
              })}

              {/* Age */}
              {options.ageSystem.enabled && options.ageSystem.items.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2.5">Catégorie d'âge</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(f => ({ ...f, ageCategoryId: [] }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.ageCategoryId.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Tous
                    </button>
                    {options.ageSystem.items.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => toggleFilter('ageCategoryId', cat.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.ageCategoryId.includes(cat.id)
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                    <button
                      onClick={() => toggleFilter('ageCategoryId', 'none')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.ageCategoryId.includes('none')
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Sans catégorie
                    </button>
                  </div>
                </div>
              )}

              {/* Invitation */}
              {options.invitationSentEnabled && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2.5">Invitation</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(f => ({ ...f, invitation: [] }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.invitation.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Tous
                    </button>
                    {[
                      { value: 'sent', label: 'Envoyée' },
                      { value: 'unsent', label: 'Non envoyée' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => toggleFilter('invitation', opt.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.invitation.includes(opt.value)
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notation */}
              {options.notation.enabled && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-2.5">Note</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilters(f => ({ ...f, rating: [] }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.rating.length === 0 ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Tous
                    </button>
                    {Array.from({ length: options.notation.max }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => toggleFilter('rating', String(n))}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          filters.rating.includes(String(n))
                            ? 'bg-indigo-500 text-white'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                      >
                        {n}/{options.notation.max}
                      </button>
                    ))}
                    <button
                      onClick={() => toggleFilter('rating', 'none')}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        filters.rating.includes('none')
                          ? 'bg-indigo-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      Sans note
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 pb-6 pt-3 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => setShowFilterModal(false)}
                className={`w-full font-semibold py-3 rounded-xl text-sm transition-colors ${
                  hasAnyFilter
                    ? 'bg-indigo-500 hover:bg-indigo-400 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                {hasAnyFilter
                  ? `Voir ${filteredGuests.length} invité${filteredGuests.length !== 1 ? 's' : ''}`
                  : 'Fermer'}
              </button>
            </div>
          </div>
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
          initialLabelIds={editTarget.labelIds || {}}
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
          existingNames={lists.filter(l => l.id !== id).map(l => l.name)}
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
          onOpenTheme={() => { setShowDataModal(false); setShowThemeModal(true) }}
        />
      )}

      {/* Theme picker */}
      {showThemeModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowThemeModal(false)} />
          <div className="relative w-full max-w-lg mx-auto bg-slate-800 rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-slate-600" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
              <h3 className="text-white font-semibold">Thème de la liste</h3>
              <button onClick={() => setShowThemeModal(false)} className="p-1 text-slate-400 hover:text-white">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto px-4 py-4 space-y-5 flex-1">
              {THEME_GROUPS.map(group => (
                <div key={group.label}>
                  <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">{group.label}</p>
                  <div className="grid grid-cols-3 gap-3">
                    {group.ids.map(tid => {
                      const t = THEMES[tid]
                      if (!t) return null
                      const isActive = (options.theme || 'default') === t.id
                      return (
                        <button
                          key={t.id}
                          onClick={() => { updateListTheme(id, t.id); setShowThemeModal(false) }}
                          className={`relative rounded-xl overflow-hidden h-20 transition-all ${
                            isActive ? 'ring-2 ring-white/70 scale-[0.97]' : 'hover:ring-1 hover:ring-white/20'
                          }`}
                          style={{ background: `linear-gradient(170deg, ${t.headerBg} 40%, ${t.pageBg} 100%)` }}
                        >
                          {t.topBorder && (
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: t.topBorder }} />
                          )}
                          <div
                            className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
                            style={{ background: `linear-gradient(0deg, ${t.headerBg}cc 0%, transparent 100%)` }}
                          >
                            <span className="text-white text-xs font-medium drop-shadow">{t.name}</span>
                          </div>
                          {isActive && (
                            <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow">
                              <svg className="w-2.5 h-2.5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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
