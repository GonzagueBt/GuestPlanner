import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '../lib/utils'
import CreateListModal from '../components/CreateListModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'

export default function HomePage({ store }) {
  const { lists, createList, deleteList, duplicateList, importListFromFile } = store
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const importRef = useRef()

  function handleCreate(name, notation, genderEnabled, ageSystem, labelSystem1, labelSystem2) {
    const id = createList(name, notation, genderEnabled, ageSystem, labelSystem1, labelSystem2)
    setShowCreate(false)
    navigate(`/list/${id}`)
  }

  function handleDelete(id) {
    deleteList(id)
    setDeleteTarget(null)
  }

  function handleDuplicate(e, listId) {
    e.stopPropagation()
    const newId = duplicateList(listId)
    if (newId) navigate(`/list/${newId}`)
  }

  async function handleImport(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const newId = await importListFromFile(file)
      navigate(`/list/${newId}`)
    } catch {
      alert('Fichier invalide. Vérifiez le format (JSON ou Excel GuestPlanner).')
    }
    e.target.value = ''
  }

  return (
    <div className="min-h-full bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-4 py-5">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">GuestPlanner</h1>
            <p className="text-sm text-slate-400">{lists.length} liste{lists.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Import */}
            <input
              ref={importRef}
              type="file"
              accept=".json,.xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={() => importRef.current?.click()}
              title="Importer une liste (JSON ou Excel)"
              className="p-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Bouton nouvelle liste */}
        <button
          onClick={() => setShowCreate(true)}
          className="w-full flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-400 active:bg-indigo-600 text-white font-semibold rounded-2xl py-4 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Créer une nouvelle liste
        </button>

        {/* Liste des listes */}
        {lists.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-base">Aucune liste pour l'instant</p>
            <p className="text-sm mt-1">Créez votre première liste d'invités</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map(list => (
              <div
                key={list.id}
                onClick={() => navigate(`/list/${list.id}`)}
                className="bg-slate-800 hover:bg-slate-750 active:bg-slate-700 rounded-2xl p-4 cursor-pointer transition-colors border border-slate-700/50 hover:border-slate-600"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate">{list.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-slate-400 text-sm">
                        {list.guests.length} invité{list.guests.length !== 1 ? 's' : ''}
                      </span>
                      <span className="text-slate-600 text-xs">·</span>
                      <span className="text-slate-500 text-xs">créée {formatDate(list.createdAt)}</span>
                    </div>
                    {(list.options.notation.enabled || list.options.labelSystem1.enabled || list.options.labelSystem2.enabled) && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {list.options.notation.enabled && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-medium">
                            /{list.options.notation.max}
                          </span>
                        )}
                        {list.options.labelSystem1.enabled && list.options.labelSystem1.items.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                            {list.options.labelSystem1.name}
                          </span>
                        )}
                        {list.options.labelSystem2.enabled && list.options.labelSystem2.items.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 font-medium">
                            {list.options.labelSystem2.name}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={e => handleDuplicate(e, list.id)}
                      title="Dupliquer"
                      className="p-2 text-slate-500 hover:text-indigo-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(list) }}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateListModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          message={`Supprimer la liste "${deleteTarget.name}" et ses ${deleteTarget.guests.length} invités ?`}
          onConfirm={() => handleDelete(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
