import { useState, useMemo } from 'react'
import { formatGuestName } from '../lib/utils'

// ── Link creator (inline, step 1 = pick type, step 2 = pick members) ──────────

function LinkCreator({ guestId, allGuests, linkTypes, existingLinks, onConfirm, onCancel }) {
  const [selectedTypeId, setSelectedTypeId] = useState(null)
  const [memberSearch, setMemberSearch] = useState('')
  const [pendingMemberIds, setPendingMemberIds] = useState(new Set())

  const selectedType = linkTypes.find(lt => lt.id === selectedTypeId)

  // Types not already used by this guest
  const availableTypes = useMemo(() => {
    const usedTypeIds = new Set(existingLinks.map(l => l.typeId))
    return linkTypes.filter(lt => !usedTypeIds.has(lt.id))
  }, [linkTypes, existingLinks])

  // Candidates: not current guest, not already in a link of this type
  const candidates = useMemo(() => {
    if (!selectedTypeId) return []
    const inLink = new Set()
    for (const g of allGuests) {
      for (const lk of (g.links || [])) {
        if (lk.typeId === selectedTypeId) lk.memberIds.forEach(mid => inLink.add(mid))
      }
    }
    return allGuests.filter(g => {
      if (g.id === guestId) return false
      if (inLink.has(g.id)) return false
      if (!memberSearch) return true
      return `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase().includes(memberSearch.toLowerCase())
    })
  }, [allGuests, guestId, selectedTypeId, memberSearch])

  function toggleMember(id) {
    setPendingMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (selectedType && next.size < selectedType.size - 1) next.add(id)
      return next
    })
  }

  function handleConfirm() {
    if (!selectedTypeId || !selectedType) return
    const memberIds = guestId
      ? [guestId, ...[...pendingMemberIds]]
      : [...pendingMemberIds]
    onConfirm(selectedTypeId, [...pendingMemberIds], memberIds)
  }

  const canConfirm = selectedType && pendingMemberIds.size === selectedType.size - 1

  if (!selectedTypeId) {
    return (
      <div className="bg-slate-700/40 rounded-xl p-3 space-y-3">
        <p className="text-xs text-slate-400">Choisir un type de lien</p>
        {availableTypes.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-2">Tous les types de liens sont déjà utilisés</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {availableTypes.map(lt => (
              <button key={lt.id} type="button" onClick={() => setSelectedTypeId(lt.id)}
                className="px-3 py-1.5 rounded-full text-sm bg-slate-600 hover:bg-indigo-500/30 hover:text-indigo-300 text-slate-300 transition-colors">
                {lt.name} <span className="text-slate-500">({lt.size})</span>
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={onCancel}
          className="text-xs text-slate-500 hover:text-slate-300">Annuler</button>
      </div>
    )
  }

  return (
    <div className="bg-slate-700/40 rounded-xl p-3 space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => { setSelectedTypeId(null); setPendingMemberIds(new Set()) }}
          className="text-slate-500 hover:text-white text-xs">← Retour</button>
        <p className="text-xs text-slate-400 flex-1">
          {selectedType.name} — sélectionner {selectedType.size - 1} autre{selectedType.size - 1 > 1 ? 's' : ''} invité{selectedType.size - 1 > 1 ? 's' : ''}
        </p>
      </div>
      <input
        type="text"
        value={memberSearch}
        onChange={e => setMemberSearch(e.target.value)}
        placeholder="Rechercher…"
        className="w-full bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="max-h-36 overflow-y-auto space-y-0.5">
        {candidates.length === 0 && (
          <p className="text-center text-slate-500 py-3 text-xs">Aucun invité disponible</p>
        )}
        {candidates.map(g => {
          const isSel = pendingMemberIds.has(g.id)
          const isDisabled = !isSel && pendingMemberIds.size >= selectedType.size - 1
          return (
            <button key={g.id} type="button" onClick={() => toggleMember(g.id)}
              disabled={isDisabled}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                isSel ? 'bg-indigo-500/20 text-indigo-300' :
                isDisabled ? 'text-slate-600 cursor-not-allowed' :
                'text-slate-300 hover:bg-slate-700/60'
              }`}>
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {((g.firstName || g.lastName || '?')[0]).toUpperCase()}
              </span>
              <span className="flex-1 truncate">{formatGuestName(g)}</span>
              {isSel && <span className="text-indigo-400 text-xs flex-shrink-0">✓</span>}
            </button>
          )
        })}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{pendingMemberIds.size}/{selectedType.size - 1} sélectionné{pendingMemberIds.size > 1 ? 's' : ''}</span>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-300">Annuler</button>
          <button type="button" onClick={handleConfirm} disabled={!canConfirm}
            className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium">
            Créer →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────────

export default function AddGuestModal({
  guestFirstName, guestLastName,
  options, onConfirm, onClose,
  isEditing = false,
  initialGender = null,
  initialAgeCategory = null,
  initialRating = null,
  initialLabelIds = {},
  initialParticipation = null,
  initialInvitationSent = false,
  // Link props
  guestId = null,
  allGuests = [],
  initialLinks = [],
  onCreateLink = null,
  onRemoveLink = null,
}) {
  const { notation, genderEnabled, participationEnabled, invitationSentEnabled, ageSystem, labelSystems = [], linkTypes = [] } = options
  const [firstName, setFirstName] = useState(guestFirstName)
  const [lastName, setLastName] = useState(guestLastName)
  const [gender, setGender] = useState(initialGender)
  const [ageCategory, setAgeCategory] = useState(initialAgeCategory)
  const [rating, setRating] = useState(initialRating)
  const [labelIds, setLabelIds] = useState(initialLabelIds ?? {})
  const [participation, setParticipation] = useState(initialParticipation)
  const [invitationSent, setInvitationSent] = useState(initialInvitationSent ?? false)

  // Links state
  const [links, setLinks] = useState(initialLinks || [])
  const [pendingLinks, setPendingLinks] = useState([]) // for add mode: [{typeId, memberIds (others)}]
  const [showLinkCreator, setShowLinkCreator] = useState(false)

  const canSubmit = (firstName.trim() || lastName.trim())

  function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    onConfirm(firstName.trim(), lastName.trim(), gender, ageCategory, rating, labelIds, participation, invitationSent, pendingLinks)
  }

  function handleLinkConfirm(typeId, otherMemberIds, allMemberIds) {
    if (isEditing && guestId && onCreateLink) {
      // Live create in edit mode
      onCreateLink(typeId, allMemberIds)
      setLinks(prev => [
        ...prev,
        { id: `temp-${Date.now()}`, typeId, memberIds: allMemberIds }
      ])
    } else {
      // Pending in add mode
      setPendingLinks(prev => [...prev, { typeId, memberIds: otherMemberIds }])
    }
    setShowLinkCreator(false)
  }

  function handleRemoveLink(linkId) {
    if (isEditing && onRemoveLink) onRemoveLink(linkId)
    setLinks(prev => prev.filter(l => l.id !== linkId))
  }

  function removePendingLink(idx) {
    setPendingLinks(prev => prev.filter((_, i) => i !== idx))
  }

  const displayName = [guestFirstName, guestLastName].filter(Boolean).join(' ')
  const showLinks = linkTypes.length > 0

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

            {/* Liens */}
            {showLinks && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Liens</p>

                {/* Existing links (edit mode) */}
                {isEditing && links.map(link => {
                  const type = linkTypes.find(lt => lt.id === link.typeId)
                  const otherMembers = (link.memberIds || [])
                    .filter(mid => mid !== guestId)
                    .map(mid => allGuests.find(g => g.id === mid))
                    .filter(Boolean)
                  if (!type) return null
                  return (
                    <div key={link.id} className="flex items-center justify-between bg-slate-700/60 rounded-xl px-3 py-2 mb-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{type.name}</span>
                        <p className="text-sm text-white truncate">
                          {otherMembers.length > 0 ? otherMembers.map(m => formatGuestName(m)).join(', ') : '—'}
                        </p>
                      </div>
                      <button type="button" onClick={() => handleRemoveLink(link.id)}
                        className="ml-2 text-slate-500 hover:text-red-400 text-lg leading-none flex-shrink-0 p-1 transition-colors">
                        ×
                      </button>
                    </div>
                  )
                })}

                {/* Pending links (add mode) */}
                {!isEditing && pendingLinks.map((pl, idx) => {
                  const type = linkTypes.find(lt => lt.id === pl.typeId)
                  const members = (pl.memberIds || []).map(mid => allGuests.find(g => g.id === mid)).filter(Boolean)
                  if (!type) return null
                  return (
                    <div key={idx} className="flex items-center justify-between bg-slate-700/60 rounded-xl px-3 py-2 mb-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wide">{type.name}</span>
                        <p className="text-sm text-white truncate">
                          {members.map(m => formatGuestName(m)).join(', ')}
                        </p>
                      </div>
                      <button type="button" onClick={() => removePendingLink(idx)}
                        className="ml-2 text-slate-500 hover:text-red-400 text-lg leading-none flex-shrink-0 p-1 transition-colors">
                        ×
                      </button>
                    </div>
                  )
                })}

                {showLinkCreator ? (
                  <LinkCreator
                    guestId={isEditing ? guestId : null}
                    allGuests={allGuests}
                    linkTypes={linkTypes}
                    existingLinks={isEditing ? links : pendingLinks.map((pl, i) => ({ id: String(i), typeId: pl.typeId, memberIds: pl.memberIds }))}
                    onConfirm={handleLinkConfirm}
                    onCancel={() => setShowLinkCreator(false)}
                  />
                ) : (
                  <button type="button" onClick={() => setShowLinkCreator(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm text-slate-400 hover:text-indigo-400 border border-dashed border-slate-600 hover:border-indigo-500 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Créer un lien
                  </button>
                )}
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
