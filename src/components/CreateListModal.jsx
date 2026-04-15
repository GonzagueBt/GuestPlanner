import { useState } from 'react'
import { newId, LABEL_COLORS } from '../lib/utils'

function LabelSystemSection({ systemName, setSystemName, enabled, setEnabled, labels, setLabels }) {
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
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => setEnabled(e.target.checked)}
          className="w-5 h-5 rounded accent-indigo-500"
        />
        <input
          type="text"
          value={systemName}
          onChange={e => setSystemName(e.target.value)}
          onClick={e => e.stopPropagation()}
          className="font-medium text-white bg-transparent outline-none border-b border-transparent focus:border-slate-500 transition-colors flex-1"
          placeholder="Nom du système de label"
        />
      </label>

      {enabled && (
        <div className="space-y-3 ml-2">
          {labels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {labels.map(label => (
                <span
                  key={label.id}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: label.color || '#475569', color: '#fff' }}
                >
                  {label.name}
                  <button type="button" onClick={() => setLabels(prev => prev.filter(l => l.id !== label.id))} className="hover:opacity-70 ml-0.5 leading-none">×</button>
                </span>
              ))}
            </div>
          )}
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
                  <button
                    key={color}
                    type="button"
                    onClick={() => setNewLabelColor(prev => prev === color ? null : color)}
                    className={`w-7 h-7 rounded-full transition-transform ${newLabelColor === color ? 'scale-125 ring-2 ring-white' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={addLabel}
              disabled={!newLabelName.trim()}
              className="text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              + Ajouter le label
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateListModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [notationEnabled, setNotationEnabled] = useState(false)
  const [notationMax, setNotationMax] = useState(5)

  const [ls1Enabled, setLs1Enabled] = useState(false)
  const [ls1Name, setLs1Name] = useState('Label 1')
  const [ls1Items, setLs1Items] = useState([])

  const [ls2Enabled, setLs2Enabled] = useState(false)
  const [ls2Name, setLs2Name] = useState('Label 2')
  const [ls2Items, setLs2Items] = useState([])

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    onCreate(
      trimmed,
      { enabled: notationEnabled, max: notationMax },
      { enabled: ls1Enabled, name: ls1Name || 'Label 1', items: ls1Items },
      { enabled: ls2Enabled, name: ls2Name || 'Label 2', items: ls2Items }
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
                placeholder="Ex : Anniversaire de Léa"
                className="w-full bg-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
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
            </div>

            {/* Label System 1 */}
            <LabelSystemSection
              systemName={ls1Name} setSystemName={setLs1Name}
              enabled={ls1Enabled} setEnabled={setLs1Enabled}
              labels={ls1Items} setLabels={setLs1Items}
            />

            {/* Label System 2 */}
            <LabelSystemSection
              systemName={ls2Name} setSystemName={setLs2Name}
              enabled={ls2Enabled} setEnabled={setLs2Enabled}
              labels={ls2Items} setLabels={setLs2Items}
            />

            <button
              type="submit"
              disabled={!name.trim()}
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
