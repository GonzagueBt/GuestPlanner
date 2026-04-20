import { useState } from 'react'
import { newId, LABEL_COLORS, DEFAULT_AGE_CATEGORIES } from '../lib/utils'
import { LABEL_PRESETS } from '../lib/labelPresets'
import SortableDragList from './SortableDragList'

const MAX_LABEL_SYSTEMS = 5

function AgeCategorySection({ enabled, setEnabled, items, setItems }) {
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
              placeholder="Nouvelle catégorie (ex : Bébé)"
              className="flex-1 bg-slate-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="button" onClick={addItem} disabled={!newName.trim()}
              className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium px-1">
              + Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LabelSystemSection({ system, onUpdate, onRemove }) {
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
        <input
          type="text"
          value={system.name}
          onChange={e => onUpdate({ name: e.target.value })}
          className="flex-1 font-medium text-white bg-transparent outline-none border-b border-transparent focus:border-slate-500 transition-colors"
          placeholder="Nom du système de label"
        />
        <button type="button" onClick={onRemove}
          className="text-slate-500 hover:text-red-400 transition-colors text-lg leading-none flex-shrink-0 p-1">
          ×
        </button>
      </div>

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

      <div className="space-y-3 ml-1">
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
            placeholder="Nom du label (ex : Famille)"
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
    </div>
  )
}

export default function CreateListModal({ onClose, onCreate, existingNames = [] }) {
  const [name, setName] = useState('')
  const [notationEnabled, setNotationEnabled] = useState(false)
  const [notationMax, setNotationMax] = useState(5)

  const [genderEnabled, setGenderEnabled] = useState(false)
  const [participationEnabled, setParticipationEnabled] = useState(false)
  const [invitationSentEnabled, setInvitationSentEnabled] = useState(false)
  const [ageEnabled, setAgeEnabled] = useState(false)
  const [ageItems, setAgeItems] = useState(DEFAULT_AGE_CATEGORIES.map(c => ({ ...c })))

  const [labelSystems, setLabelSystems] = useState([])

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

  const nameConflict = existingNames.some(n => n.toLowerCase() === name.trim().toLowerCase())

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || nameConflict) return
    onCreate(
      trimmed,
      { enabled: notationEnabled, max: notationMax },
      genderEnabled,
      participationEnabled,
      invitationSentEnabled,
      { enabled: ageEnabled, items: ageItems },
      labelSystems
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Nouvelle liste</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom de la liste *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex : Mariage de Pierre et Agathe"
                className={`w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 ${nameConflict ? 'ring-2 ring-red-500/60 focus:ring-red-500' : 'focus:ring-indigo-500'}`}
                autoFocus
              />
              {nameConflict && (
                <p className="text-xs text-red-400 mt-1.5 ml-1">Une liste avec ce nom existe déjà</p>
              )}
            </div>

            {/* Notation */}
            <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={notationEnabled} onChange={e => setNotationEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
                <span className="font-medium text-white">Attribuer une note</span>
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
            </div>

            {/* Genre */}
            <div className="bg-slate-700/50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={genderEnabled} onChange={e => setGenderEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
                <span className="font-medium text-white">Genre (H/F)</span>
              </label>
            </div>

            {/* Participation */}
            <div className="bg-slate-700/50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={participationEnabled} onChange={e => setParticipationEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
                <div>
                  <span className="font-medium text-white">Participation</span>
                  <p className="text-xs text-slate-400 mt-0.5">Suivi des réponses : participe / absent / sans réponse</p>
                </div>
              </label>
            </div>

            {/* Invitation */}
            <div className="bg-slate-700/50 rounded-xl p-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={invitationSentEnabled} onChange={e => setInvitationSentEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
                <div>
                  <span className="font-medium text-white">Invitation</span>
                  <p className="text-xs text-slate-400 mt-0.5">Suivi de l'envoi des invitations</p>
                </div>
              </label>
            </div>

            {/* Catégories d'âge */}
            <AgeCategorySection
              enabled={ageEnabled} setEnabled={setAgeEnabled}
              items={ageItems} setItems={setAgeItems}
            />

            {/* Systèmes de labels */}
            {labelSystems.map(ls => (
              <LabelSystemSection
                key={ls.id}
                system={ls}
                onUpdate={updates => updateLabelSystem(ls.id, updates)}
                onRemove={() => removeLabelSystem(ls.id)}
              />
            ))}

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

            <button
              type="submit"
              disabled={!name.trim() || nameConflict}
              className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-colors"
            >
              Créer la liste
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
