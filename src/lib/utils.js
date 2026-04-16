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

export function formatGuestName(guest) {
  return [guest.firstName, guest.lastName].filter(Boolean).join(' ')
}

function alphaKey(guest) {
  return (guest.lastName || guest.firstName || '').toLowerCase()
}

// labelSystem1 et labelSystem2 sont { name, items }
export function sortGuests(guests, mode, labelSystem1, labelSystem2) {
  const sorted = [...guests]
  if (mode === 'alpha') {
    return sorted.sort((a, b) =>
      alphaKey(a).localeCompare(alphaKey(b), 'fr') ||
      (a.firstName || '').localeCompare(b.firstName || '', 'fr')
    )
  }
  if (mode === 'label1') {
    const items = labelSystem1?.items ?? []
    return sorted.sort((a, b) => {
      const la = items.find(l => l.id === a.labelId1)?.name ?? 'zzz'
      const lb = items.find(l => l.id === b.labelId1)?.name ?? 'zzz'
      return la.localeCompare(lb, 'fr') || alphaKey(a).localeCompare(alphaKey(b), 'fr')
    })
  }
  if (mode === 'label2') {
    const items = labelSystem2?.items ?? []
    return sorted.sort((a, b) => {
      const la = items.find(l => l.id === a.labelId2)?.name ?? 'zzz'
      const lb = items.find(l => l.id === b.labelId2)?.name ?? 'zzz'
      return la.localeCompare(lb, 'fr') || alphaKey(a).localeCompare(alphaKey(b), 'fr')
    })
  }
  if (mode === 'rating') {
    return sorted.sort((a, b) => {
      const ra = a.rating ?? 0
      const rb = b.rating ?? 0
      return rb - ra || alphaKey(a).localeCompare(alphaKey(b), 'fr')
    })
  }
  return sorted
}

export function groupGuests(guests, mode, labelSystem1, labelSystem2, notationMax = null) {
  const sorted = sortGuests(guests, mode, labelSystem1, labelSystem2)
  if (sorted.length === 0) return []

  const items = []
  let currentKey = undefined
  let currentHeader = null

  for (const guest of sorted) {
    let key, headerLabel, headerColor = null

    if (mode === 'alpha') {
      key = (guest.lastName || guest.firstName || '?')[0].toUpperCase()
      headerLabel = key
    } else if (mode === 'label1') {
      const labelItems = labelSystem1?.items ?? []
      const label = labelItems.find(l => l.id === guest.labelId1)
      key = guest.labelId1 ?? '__none__'
      headerLabel = label?.name ?? `Sans ${labelSystem1?.name ?? 'label'}`
      headerColor = label?.color ?? null
    } else if (mode === 'label2') {
      const labelItems = labelSystem2?.items ?? []
      const label = labelItems.find(l => l.id === guest.labelId2)
      key = guest.labelId2 ?? '__none__'
      headerLabel = label?.name ?? `Sans ${labelSystem2?.name ?? 'label'}`
      headerColor = label?.color ?? null
    } else if (mode === 'rating') {
      key = guest.rating != null ? String(guest.rating) : '__none__'
      headerLabel = guest.rating != null
        ? (notationMax ? `${guest.rating}/${notationMax}` : String(guest.rating))
        : 'Sans note'
    }

    if (key !== currentKey) {
      currentHeader = { type: 'header', label: headerLabel, color: headerColor, count: 0, maleCount: 0, femaleCount: 0 }
      items.push(currentHeader)
      currentKey = key
    }
    currentHeader.count++
    if (guest.gender === 'M') currentHeader.maleCount++
    if (guest.gender === 'F') currentHeader.femaleCount++
    items.push({ type: 'guest', guest })
  }

  return items
}

export const LABEL_COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E',
  '#14B8A6', '#3B82F6', '#8B5CF6', '#EC4899',
  '#6B7280', '#B45309', '#047857', '#0369A1'
]
