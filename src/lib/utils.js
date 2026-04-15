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

export function groupGuests(guests, mode, labels) {
  const sorted = sortGuests(guests, mode, labels)
  if (sorted.length === 0) return []

  const items = []
  let currentKey = undefined

  for (const guest of sorted) {
    let key, headerLabel, headerColor = null

    if (mode === 'alpha') {
      key = guest.name[0].toUpperCase()
      headerLabel = key
    } else if (mode === 'label') {
      const label = labels.find(l => l.id === guest.labelId)
      key = guest.labelId ?? '__none__'
      headerLabel = label?.name ?? 'Sans label'
      headerColor = label?.color ?? null
    } else if (mode === 'rating') {
      key = guest.rating != null ? String(guest.rating) : '__none__'
      headerLabel = guest.rating != null ? String(guest.rating) : 'Sans note'
    }

    if (key !== currentKey) {
      items.push({ type: 'header', label: headerLabel, color: headerColor })
      currentKey = key
    }
    items.push({ type: 'guest', guest })
  }

  return items
}

export const LABEL_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#B45309', '#047857', '#0369A1'
]
