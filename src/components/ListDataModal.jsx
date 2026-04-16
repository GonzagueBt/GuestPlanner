
export default function ListDataModal({ listName, onClose, onExportJson, onExportExcel, onDuplicate }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm overflow-hidden">
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Liste · {listName}</p>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {/* Dupliquer */}
            <button
              onClick={onDuplicate}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors text-left"
            >
              <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-medium text-sm">Dupliquer la liste</p>
                <p className="text-xs text-slate-400 mt-0.5">Crée une copie avec tous les invités</p>
              </div>
            </button>

            <div className="h-px bg-slate-700" />

            {/* Export JSON */}
            <button
              onClick={onExportJson}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors text-left"
            >
              <svg className="w-5 h-5 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div>
                <p className="font-medium text-sm">Exporter en JSON</p>
                <p className="text-xs text-slate-400 mt-0.5">Format réimportable dans GuestPlanner</p>
              </div>
            </button>

            {/* Export Excel */}
            <button
              onClick={onExportExcel}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white transition-colors text-left"
            >
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <div>
                <p className="font-medium text-sm">Exporter en Excel</p>
                <p className="text-xs text-slate-400 mt-0.5">Fichier .xlsx lisible dans Excel / Sheets</p>
              </div>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}
