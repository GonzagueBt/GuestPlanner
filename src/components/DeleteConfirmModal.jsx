export default function DeleteConfirmModal({ message, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pt-4 pb-safe-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 animate-slide-up sm:animate-scale-in">
        <p className="text-white text-base">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
