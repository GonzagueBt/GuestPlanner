import { useState } from 'react'
import { newId, LABEL_COLORS } from '../lib/utils'
import SortableDragList from './SortableDragList'

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

function LabelSystemSection({ systemName, setSystemName, enabled, setEnabled, labels, setLabels, guestsWithLabel, wasEnabled }) {
  const [newLabelName, setNewLabelName] = useState('')
  const [newLabelColor, setNewLabelColor] = useState(null)

  function addLabel() {
    const trimmed = newLabelName.trim()
    if (!trimmed) return
    setLabels(prev => [...prev, { id: newId(), name: trimmed, color: newLabelColor }])
    setNewLabelName('')
    setNewLabelColor(null)
  }

  return (
    <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-5 h-5 rounded accent-indigo-500" />
        <div className="flex items-center gap-1 flex-1 group">
          <input
            type="text"
            value={systemName}
            onChange={e => setSystemName(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="font-medium text-white bg-transparent outline-none border-b border-transparent focus:border-slate-500 transition-colors flex-1"
            placeholder="Nom du système de label"
          />
          <svg className="w-3 h-3 text-slate-500 group-focus-within:text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
      </label>

      {enabled && (
        <div className="space-y-3 ml-2">
          <SortableDragList
            items={labels}
            onReorder={setLabels}
            renderItem={label => (
              <div
                className="flex-1 flex items-center justify-between px-3 py-1.5 rounded-lg text-sm font-medium min-w-0"
                style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
              >
                <span className="truncate">{label.name}</span>
                <button
                  type="button"
                  onClick={() => setLabels(prev => prev.filter(l => l.id !== label.id))}
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

      {wasEnabled && !enabled && guestsWithLabel > 0 && (
        <p className="text-xs text-amber-400 ml-8 flex items-center gap-1.5">
          <WarningIcon />
          Désactiver effacera les labels de {guestsWithLabel} invité{guestsWithLabel > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

export default function EditOptionsModal({ list, onClose, onSave }) {
  const { options, guests } = list

  const [name, setName] = useState(list.name)
  const [notationEnabled, setNotationEnabled] = useState(options.notation.enabled)
  const [notationMax, setNotationMax] = useState(options.notation.max)

  const [genderEnabled, setGenderEnabled] = useState(options.genderEnabled)
  const [participationEnabled, setParticipationEnabled] = useState(options.participationEnabled ?? false)
  const [invitationSentEnabled, setInvitationSentEnabled] = useState(options.invitationSentEnabled ?? false)
  const [ageEnabled, setAgeEnabled] = useState(options.ageSystem.enabled)
  const [ageItems, setAgeItems] = useState(options.ageSystem.items)

  const [ls1Enabled, setLs1Enabled] = useState(options.labelSystem1.enabled)
  const [ls1Name, setLs1Name] = useState(options.labelSystem1.name)
  const [ls1Items, setLs1Items] = useState(options.labelSystem1.items)

  const [ls2Enabled, setLs2Enabled] = useState(options.labelSystem2.enabled)
  const [ls2Name, setLs2Name] = useState(options.labelSystem2.name)
  const [ls2Items, setLs2Items] = useState(options.labelSystem2.items)

  const guestsWithParticipation = guests.filter(g => g.participation != null).length
  const guestsWithInvitation = guests.filter(g => g.invitationSent === true).length
  const guestsWithGender = guests.filter(g => g.gender != null).length
  const guestsWithRating = guests.filter(g => g.rating != null).length
  const guestsWithAge = guests.filter(g => g.ageCategoryId != null).length
  const guestsWithLabel1 = guests.filter(g => g.labelId1 != null).length
  const guestsWithLabel2 = guests.filter(g => g.labelId2 != null).length

  function handleSave() {
    if (!name.trim()) return
    onSave(
      name.trim(),
      { enabled: notationEnabled, max: notationMax },
      genderEnabled,
      participationEnabled,
      invitationSentEnabled,
      { enabled: ageEnabled, items: ageItems },
      { enabled: ls1Enabled, name: ls1Name || 'Label 1', items: ls1Items },
      { enabled: ls2Enabled, name: ls2Name || 'Label 2', items: ls2Items }
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
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500" />
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

          {/* Label System 1 */}
          <LabelSystemSection
            systemName={ls1Name} setSystemName={setLs1Name}
            enabled={ls1Enabled} setEnabled={setLs1Enabled}
            labels={ls1Items} setLabels={setLs1Items}
            guestsWithLabel={guestsWithLabel1}
            wasEnabled={options.labelSystem1.enabled}
          />

          {/* Label System 2 */}
          <LabelSystemSection
            systemName={ls2Name} setSystemName={setLs2Name}
            enabled={ls2Enabled} setEnabled={setLs2Enabled}
            labels={ls2Items} setLabels={setLs2Items}
            guestsWithLabel={guestsWithLabel2}
            wasEnabled={options.labelSystem2.enabled}
          />

          <button onClick={handleSave} disabled={!name.trim()}
            className="w-full bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3.5 transition-colors">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}
