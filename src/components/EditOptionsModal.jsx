import { useState } from 'react'
import { newId, LABEL_COLORS } from '../lib/utils'
import { LABEL_PRESETS } from '../lib/labelPresets'
import SortableDragList from './SortableDragList'

const MAX_LABEL_SYSTEMS = 5

const LINK_PRESETS = [
  { name: 'Couple', size: 2 },
  { name: 'Famille', size: 4 },
  { name: 'Amis proches', size: 3 },
  { name: 'Coloc', size: 3 },
]

function LinkTypesSection({ linkTypes, setLinkTypes, guestsWithLink }) {
  const [newName, setNewName] = useState('')
  const [newSize, setNewSize] = useState(2)

  function addLinkType() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setLinkTypes(prev => [...prev, { id: newId(), name: trimmed, size: newSize }])
    setNewName('')
    setNewSize(2)
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
      <div>
        <p className="font-medium text-white">Liens entre invités</p>
        <p className="text-xs text-slate-400 mt-0.5">Définissez des types de liens pour relier des invités (ex : Couple, Famille…)</p>
      </div>

      {linkTypes.map(lt => {
        const count = guestsWithLink(lt.id)
        return (
          <div key={lt.id} className="flex items-center justify-between bg-slate-600/50 rounded-lg px-3 py-2">
            <div className="min-w-0">
              <span className="text-sm text-white font-medium">{lt.name}</span>
              <span className="text-xs text-slate-400 ml-2">{lt.size} personnes</span>
              {count > 0 && <span className="text-xs text-indigo-400 ml-2">{count} lien{count > 1 ? 's' : ''}</span>}
            </div>
            <button
              type="button"
              onClick={() => setLinkTypes(prev => prev.filter(l => l.id !== lt.id))}
              className="ml-2 text-slate-500 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 p-1"
            >×</button>
          </div>
        )
      })}

      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-slate-500">Modèles :</span>
          {LINK_PRESETS.map(p => (
            <button key={p.name} type="button"
              onClick={() => { setNewName(p.name); setNewSize(p.size) }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-0.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20">
              {p.name} ({p.size})
            </button>
          ))}
        </div>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLinkType())}
          placeholder="Nom du lien (ex : Couple)"
          className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div>
          <p className="text-xs text-slate-400 mb-1.5">Nombre de personnes dans le lien</p>
          <div className="flex gap-2">
            {[2, 3, 4, 5, 6].map(n => (
              <button key={n} type="button" onClick={() => setNewSize(n)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  newSize === n ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={addLinkType} disabled={!newName.trim()}
          className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium">
          + Ajouter ce type de lien
        </button>
      </div>
    </div>
  )
}

function WarningIcon() {
  return (
    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

function AgeCategorySection({ enabled, setEnabled, items, setItems, guestsWithAge, wasEnabled }) {
  const [newName, setNewName] = useState('')

  function addItem() {
    const trimmed = newName.trim()
    if (!trimmed) return
    setItems(prev => [...prev, { id: newId(), name: trimmed }])
    setNewName('')
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
        <span className="font-medium text-white">Catégories d'âge</span>
      </label>

      {enabled && (
        <div className="space-y-3 ml-2">
          <SortableDragList
            items={items}
            onReorder={setItems}
            renderItem={item => (
              <div className="flex-1 flex items-center justify-between bg-amber-500/10 text-amber-400 px-3 py-1.5 rounded-lg text-sm font-medium min-w-0">
                <span className="truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))}
                  className="ml-2 hover:opacity-70 leading-none flex-shrink-0 text-base"
                >×</button>
              </div>
            )}
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addItem())}
              placeholder="Nouvelle catégorie"
              className="flex-1 bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="button" onClick={addItem} disabled={!newName.trim()}
              className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium px-1">
              + Ajouter
            </button>
          </div>
        </div>
      )}

      {wasEnabled && !enabled && guestsWithAge > 0 && (
        <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
          <WarningIcon />
          Désactiver effacera la catégorie de {guestsWithAge} invité{guestsWithAge > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

function LabelSystemSection({ system, guestsWithLabel, wasEnabled, onUpdate, onRemove }) {
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(null)
  const [showPresets, setShowPresets] = useState(false)

  function addLabel() {
    const trimmed = newLabelName.trim()
    if (!trimmed) return
    onUpdate({ items: [...system.items, { id: newId(), name: trimmed, color: newLabelColor }] })
    setNewLabelName('')
    setNewLabelColor(null)
  }

  function loadPreset(preset) {
    onUpdate({
      name: preset.name,
      items: preset.items.map(item => ({ ...item, id: newId() }))
    })
    setShowPresets(false)
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-3 cursor-pointer flex-1">
          <input
            type="checkbox"
            checked={system.enabled}
            onChange={e => onUpdate({ enabled: e.target.checked })}
            className="w-5 h-5 rounded accent-indigo-500 flex-shrink-0"
          />
          <div className="flex items-center gap-1 flex-1 group">
            <input
              type="text"
              value={system.name}
              onChange={e => onUpdate({ name: e.target.value })}
              onClick={e => e.stopPropagation()}
              className="font-medium text-white bg-transparent outline-none border-b border-transparent focus:border-slate-500 transition-colors flex-1"
              placeholder="Nom du système de label"
            />
            <svg className="w-3 h-3 text-slate-500 group-focus-within:text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </label>
        <button type="button" onClick={onRemove}
          className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 p-1">
          ×
        </button>
      </div>

      {system.enabled && (
        <div className="space-y-3 ml-2">
          {/* Preset loader */}
          <div>
            <button
              type="button"
              onClick={() => setShowPresets(p => !p)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10" />
              </svg>
              Charger un modèle
            </button>
            {showPresets && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {LABEL_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => loadPreset(preset)}
                    className="px-2.5 py-1 rounded-full bg-slate-600 hover:bg-indigo-500/30 hover:text-indigo-300 text-slate-300 text-xs font-medium transition-colors"
                    title={preset.description}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <SortableDragList
            items={system.items}
            onReorder={items => onUpdate({ items })}
            renderItem={label => (
              <div
                className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium min-w-0"
                style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
              >
                <span className="truncate">{label.name}</span>
                <button
                  type="button"
                  onClick={() => onUpdate({ items: system.items.filter(l => l.id !== label.id) })}
                  className="ml-2 hover:opacity-70 leading-none flex-shrink-0 text-base"
                >×</button>
              </div>
            )}
          />
          <div className="space-y-2">
            <input
              type="text"
              value={newLabelName}
              onChange={e => setNewLabelName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLabel())}
              placeholder="Nom du label"
              className="w-full bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Couleur (optionnel)</p>
              <div className="flex flex-wrap gap-2">
                {LABEL_COLORS.map(color => (
                  <button key={color} type="button"
                    onClick={() => setNewLabelColor(prev => prev === color ? null : color)}
                    className={`w-7 h-7 rounded-full transition-transform ${newLabelColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button type="button" onClick={addLabel} disabled={!newLabelName.trim()}
              className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium">
              + Ajouter le label
            </button>
          </div>
        </div>
      )}

      {wasEnabled && !system.enabled && guestsWithLabel > 0 && (
        <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
          <WarningIcon />
          Désactiver effacera les labels de {guestsWithLabel} invité{guestsWithLabel > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export default function EditOptionsModal({ list, onClose, onSave, existingNames = [] }) {
  const { options, guests } = list

  const [name, setName] = useState(list.name)
  const [notationEnabled, setNotationEnabled] = useState(options.notation.enabled)
  const [notationMax, setNotationMax] = useState(options.notation.max)

  const [genderEnabled, setGenderEnabled] = useState(options.genderEnabled)
  const [participationEnabled, setParticipationEnabled] = useState(options.participationEnabled ?? false)
  const [invitationSentEnabled, setInvitationSentEnabled] = useState(options.invitationSentEnabled ?? false)
  const [ageEnabled, setAgeEnabled] = useState(options.ageSystem.enabled)
  const [ageItems, setAgeItems] = useState(options.ageSystem.items)

  const [labelSystems, setLabelSystems] = useState(options.labelSystems || [])
  const [linkTypes, setLinkTypes] = useState(options.linkTypes || [])

  function addLabelSystem() {
    if (labelSystems.length >= MAX_LABEL_SYSTEMS) return
    setLabelSystems(prev => [...prev, {
      id: newId(),
      name: `Label ${prev.length + 1}`,
      enabled: true,
      items: []
    }])
  }

  function updateLabelSystem(id, updates) {
    setLabelSystems(prev => prev.map(ls => ls.id === id ? { ...ls, ...updates } : ls))
  }

  function removeLabelSystem(id) {
    setLabelSystems(prev => prev.filter(ls => ls.id !== id))
  }

  const guestsWithParticipation = guests.filter(g => g.participation != null).length
  const guestsWithInvitation = guests.filter(g => g.invitationSent === true).length
  const guestsWithGender = guests.filter(g => g.gender != null).length
  const guestsWithRating = guests.filter(g => g.rating != null).length
  const guestsWithAge = guests.filter(g => g.ageCategoryId != null).length

  const nameConflict = name.trim().toLowerCase() !== list.name.toLowerCase() &&
    existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase())

  function guestsWithLink(typeId) {
    return guests.filter(g => (g.links || []).some(lk => lk.typeId === typeId)).length
  }

  function handleSave() {
    if (!name.trim() || nameConflict) return
    onSave(
      name.trim(),
      { enabled: notationEnabled, max: notationMax },
      genderEnabled,
      participationEnabled,
      invitationSentEnabled,
      { enabled: ageEnabled, items: ageItems },
      labelSystems,
      linkTypes
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

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom de la liste</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className={`w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 ${nameConflict ? 'ring-2 ring-red-500/60 focus:ring-red-500' : 'focus:ring-indigo-500'}`} />
            {nameConflict && (
              <p className="text-xs text-red-400 mt-1.5 ml-1">Une liste avec ce nom existe déjà</p>
            )}
          </div>

          {/* Notation */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={notationEnabled} onChange={e => setNotationEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
              <span className="font-medium text-white">Système de notation</span>
            </label>
            {notationEnabled && (
              <div className="ml-8 space-y-2">
                <span className="text-sm text-slate-400">Note max :</span>
                <div className="flex flex-wrap gap-2">
                  {[5, 6, 7, 8, 9, 10].map(n => (
                    <button key={n} type="button" onClick={() => setNotationMax(n)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${notationMax === n ? 'bg-indigo-500 text-white' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {options.notation.enabled && !notationEnabled && guestsWithRating > 0 && (
              <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
                <WarningIcon />
                Désactiver effacera les notes de {guestsWithRating} invité{guestsWithRating > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Genre */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={genderEnabled} onChange={e => setGenderEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
              <span className="font-medium text-white">Sélection du genre</span>
            </label>
            {options.genderEnabled && !genderEnabled && guestsWithGender > 0 && (
              <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
                <WarningIcon />
                Désactiver effacera le genre de {guestsWithGender} invité{guestsWithGender > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Participation */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={participationEnabled} onChange={e => setParticipationEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
              <div>
                <span className="font-medium text-white">Participation</span>
                <p className="text-xs text-slate-400 mt-0.5">Suivi des réponses : participe / absent / sans réponse</p>
              </div>
            </label>
            {options.participationEnabled && !participationEnabled && guestsWithParticipation > 0 && (
              <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
                <WarningIcon />
                Désactiver effacera les réponses de {guestsWithParticipation} invité{guestsWithParticipation > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Invitation */}
          <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={invitationSentEnabled} onChange={e => setInvitationSentEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
              <div>
                <span className="font-medium text-white">Invitation</span>
                <p className="text-xs text-slate-400 mt-0.5">Suivi de l'envoi des invitations</p>
              </div>
            </label>
            {options.invitationSentEnabled && !invitationSentEnabled && guestsWithInvitation > 0 && (
              <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
                <WarningIcon />
                Désactiver réinitialisera les invitations de {guestsWithInvitation} invité{guestsWithInvitation > 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Catégories d'âge */}
          <AgeCategorySection
            enabled={ageEnabled} setEnabled={setAgeEnabled}
            items={ageItems} setItems={setAgeItems}
            guestsWithAge={guestsWithAge}
            wasEnabled={options.ageSystem.enabled}
          />

          {/* Systèmes de labels */}
          {labelSystems.map(ls => {
            const guestsWithLabel = guests.filter(g => g.labelIds?.[ls.id] != null).length
            const wasEnabled = (options.labelSystems || []).find(ols => ols.id === ls.id)?.enabled ?? false
            return (
              <LabelSystemSection
                key={ls.id}
                system={ls}
                guestsWithLabel={guestsWithLabel}
                wasEnabled={wasEnabled}
                onUpdate={updates => updateLabelSystem(ls.id, updates)}
                onRemove={() => removeLabelSystem(ls.id)}
              />
            )
          })}

          {labelSystems.length < MAX_LABEL_SYSTEMS && (
            <button
              type="button"
              onClick={addLabelSystem}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-slate-600 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 rounded-xl py-3 text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un système de labels
            </button>
          )}

          {/* Types de liens */}
          <LinkTypesSection
            linkTypes={linkTypes}
            setLinkTypes={setLinkTypes}
            guestsWithLink={guestsWithLink}
          />

          <button onClick={handleSave} disabled={!name.trim() || nameConflict}
            className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
