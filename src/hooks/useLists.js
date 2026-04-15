import { useState, useCallback } from 'react'
import { newId } from '../lib/utils'

const STORAGE_KEY = 'guestplanner_lists'

function migrateGuest(g) {
  // Migration : ancien format { name } → { firstName, lastName }
  if (g.name !== undefined && g.firstName === undefined) {
    const parts = g.name.trim().split(' ')
    const { name, ...rest } = g
    return { ...rest, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }
  }
  return g
}

function loadLists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const lists = JSON.parse(raw)
    return lists.map(l => ({ ...l, guests: l.guests.map(migrateGuest) }))
  } catch {
    return []
  }
}

function saveLists(lists) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
}

export function useLists() {
  const [lists, setLists] = useState(loadLists)

  const persist = useCallback((next) => {
    saveLists(next)
    setLists(next)
  }, [])

  const createList = useCallback((name, notationOpts, labelsOpts) => {
    const id = newId()
    const now = new Date().toISOString()
    const newList = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      options: { notation: notationOpts, labels: labelsOpts },
      guests: []
    }
    persist([newList, ...lists])
    return id
  }, [lists, persist])

  const deleteList = useCallback((id) => {
    persist(lists.filter(l => l.id !== id))
  }, [lists, persist])

  const getList = useCallback((id) => {
    return lists.find(l => l.id === id) ?? null
  }, [lists])

  const addGuest = useCallback((listId, firstName, lastName, rating, labelId) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l,
        updatedAt: now,
        guests: [...l.guests, { id: newId(), firstName, lastName, rating: rating ?? null, labelId: labelId ?? null }]
      }
    }))
  }, [lists, persist])

  const removeGuest = useCallback((listId, guestId) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return { ...l, updatedAt: now, guests: l.guests.filter(g => g.id !== guestId) }
    }))
  }, [lists, persist])

  const updateGuest = useCallback((listId, guestId, firstName, lastName, rating, labelId) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l,
        updatedAt: now,
        guests: l.guests.map(g =>
          g.id === guestId
            ? { ...g, firstName, lastName, rating: rating ?? null, labelId: labelId ?? null }
            : g
        )
      }
    }))
  }, [lists, persist])

  const updateListOptions = useCallback((listId, name, newNotation, newLabels) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      const removedLabelIds = new Set(
        l.options.labels.items
          .filter(old => !newLabels.items.find(nl => nl.id === old.id))
          .map(old => old.id)
      )
      const guests = l.guests.map(g => ({
        ...g,
        rating: newNotation.enabled ? g.rating : null,
        labelId: (!newLabels.enabled || removedLabelIds.has(g.labelId)) ? null : g.labelId
      }))
      return { ...l, name, updatedAt: now, options: { notation: newNotation, labels: newLabels }, guests }
    }))
  }, [lists, persist])

  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(lists, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `guestplanner-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [lists])

  const importData = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result)
          if (!Array.isArray(imported)) throw new Error('Format invalide')
          // Applique la migration à l'import aussi
          const migrated = imported.map(l => ({ ...l, guests: l.guests.map(migrateGuest) }))
          persist(migrated)
          resolve()
        } catch (err) {
          reject(err)
        }
      }
      reader.readAsText(file)
    })
  }, [persist])

  return { lists, createList, deleteList, getList, addGuest, removeGuest, updateGuest, updateListOptions, exportData, importData }
}
