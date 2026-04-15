export function newId() {
  return crypto.randomUUID()
}

export function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function sortGuests(guests, mode, labels) {
  const sorted = [...guests]
  if (mode === 'alpha') {
    return sorted.sort((a, b) => a.name.localeCompare(b.name, 'fr'))
  }
  if (mode === 'label') {
    return sorted.sort((a, b) => {
      const la = labels.find(l => l.id === a.labelId)?.name ?? 'zzz'
      const lb = labels.find(l => l.id === b.labelId)?.name ?? 'zzz'
      return la.localeCompare(lb, 'fr') || a.name.localeCompare(b.name, 'fr')
    })
  }
  if (mode === 'rating') {
    return sorted.sort((a, b) => {
      const ra = a.rating ?? 0
      const rb = b.rating ?? 0
      return rb - ra || a.name.localeCompare(b.name, 'fr')
    })
  }
  return sorted
}

export const LABEL_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#B45309', '#047857', '#0369A1'
]
