import { useState, useCallback } from 'react'
import { newId, DEFAULT_AGE_CATEGORIES } from '../lib/utils'
import { exportListToExcel, importListFromExcel } from '../lib/excel'

const STORAGE_KEY = 'guestplanner_lists'

function migrateGuest(g) {
  let guest = g
  // { name } → { firstName, lastName }
  if (guest.name !== undefined && guest.firstName === undefined) {
    const parts = guest.name.trim().split(' ')
    const { name, ...rest } = guest
    guest = { ...rest, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }
  }
  // { labelId } → { labelId1, labelId2 }
  if (guest.labelId !== undefined && guest.labelId1 === undefined) {
    const { labelId, ...rest } = guest
    guest = { ...rest, labelId1: labelId ?? null, labelId2: null }
  }
  // gender
  if (guest.gender === undefined) guest = { ...guest, gender: null }
  // ageCategory (clé string) → ageCategoryId (id)
  if (guest.ageCategory !== undefined && guest.ageCategoryId === undefined) {
    const { ageCategory, ...rest } = guest
    guest = { ...rest, ageCategoryId: ageCategory ?? null }
  }
  if (guest.ageCategoryId === undefined) guest = { ...guest, ageCategoryId: null }
  // labelId1/labelId2
  if (guest.labelId1 === undefined) guest = { ...guest, labelId1: null }
  if (guest.labelId2 === undefined) guest = { ...guest, labelId2: null }
  return guest
}

function migrateOptions(options) {
  let opts = options
  // { labels } → { labelSystem1, labelSystem2 }
  if (opts.labelSystem1 === undefined) {
    const oldLabels = opts.labels || { enabled: false, items: [] }
    const { labels, ...rest } = opts
    opts = {
      ...rest,
      labelSystem1: { enabled: oldLabels.enabled, name: 'Label 1', items: oldLabels.items || [] },
      labelSystem2: { enabled: false, name: 'Label 2', items: [] }
    }
  }
  // ageSystem absent → ajouter avec catégories par défaut
  if (opts.ageSystem === undefined) {
    opts = { ...opts, ageSystem: { enabled: false, items: [...DEFAULT_AGE_CATEGORIES] } }
  }
  // genderEnabled absent → false par défaut
  if (opts.genderEnabled === undefined) {
    opts = { ...opts, genderEnabled: false }
  }
  return opts
}

function loadLists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const lists = JSON.parse(raw)
    return lists.map(l => ({
      ...l,
      tables: l.tables ?? [],
      options: migrateOptions(l.options),
      guests: l.guests.map(migrateGuest)
    }))
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

  const createList = useCallback((name, notationOpts, genderEnabled, ageSystemOpts, labelSystem1Opts, labelSystem2Opts) => {
    const id = newId()
    const now = new Date().toISOString()
    const newList = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      options: { notation: notationOpts, genderEnabled: genderEnabled ?? false, ageSystem: ageSystemOpts, labelSystem1: labelSystem1Opts, labelSystem2: labelSystem2Opts },
      guests: [],
      tables: []
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

  const addGuest = useCallback((listId, firstName, lastName, gender, ageCategoryId, rating, labelId1, labelId2) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l,
        updatedAt: now,
        guests: [...l.guests, {
          id: newId(), firstName, lastName,
          gender: gender ?? null,
          ageCategoryId: ageCategoryId ?? null,
          rating: rating ?? null,
          labelId1: labelId1 ?? null,
          labelId2: labelId2 ?? null
        }]
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

  const updateGuest = useCallback((listId, guestId, firstName, lastName, gender, ageCategoryId, rating, labelId1, labelId2) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l,
        updatedAt: now,
        guests: l.guests.map(g =>
          g.id === guestId
            ? { ...g, firstName, lastName, gender: gender ?? null, ageCategoryId: ageCategoryId ?? null, rating: rating ?? null, labelId1: labelId1 ?? null, labelId2: labelId2 ?? null }
            : g
        )
      }
    }))
  }, [lists, persist])

  const updateListOptions = useCallback((listId, name, newNotation, newGenderEnabled, newAgeSystem, newLabelSystem1, newLabelSystem2) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      const removedAge = new Set(
        l.options.ageSystem.items
          .filter(old => !newAgeSystem.items.find(n => n.id === old.id))
          .map(old => old.id)
      )
      const removed1 = new Set(
        l.options.labelSystem1.items
          .filter(old => !newLabelSystem1.items.find(nl => nl.id === old.id))
          .map(old => old.id)
      )
      const removed2 = new Set(
        l.options.labelSystem2.items
          .filter(old => !newLabelSystem2.items.find(nl => nl.id === old.id))
          .map(old => old.id)
      )
      const guests = l.guests.map(g => ({
        ...g,
        gender: newGenderEnabled ? g.gender : null,
        rating: newNotation.enabled ? g.rating : null,
        ageCategoryId: (!newAgeSystem.enabled || removedAge.has(g.ageCategoryId)) ? null : g.ageCategoryId,
        labelId1: (!newLabelSystem1.enabled || removed1.has(g.labelId1)) ? null : g.labelId1,
        labelId2: (!newLabelSystem2.enabled || removed2.has(g.labelId2)) ? null : g.labelId2
      }))
      return { ...l, name, updatedAt: now, options: { notation: newNotation, genderEnabled: newGenderEnabled, ageSystem: newAgeSystem, labelSystem1: newLabelSystem1, labelSystem2: newLabelSystem2 }, guests }
    }))
  }, [lists, persist])

  const exportListJson = useCallback((listId) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return
    const payload = { name: list.name, options: list.options, guests: list.guests }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = list.name.replace(/[^a-zA-Z0-9_\- ]/g, '_')
    a.download = `${safeName}_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [lists])

  const exportListExcel = useCallback((listId) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return
    exportListToExcel(list)
  }, [lists])

  const importListFromFile = useCallback((file) => {
    const isExcel = /\.(xlsx|xls)$/i.test(file.name)
    if (isExcel) {
      return importListFromExcel(file).then(({ listName, options, guests }) => {
        const id = newId()
        const now = new Date().toISOString()
        const newList = { id, name: listName, createdAt: now, updatedAt: now, options, guests }
        persist([newList, ...lists])
        return id
      })
    }
    // JSON
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result)
          // Support both single-list format and legacy full-backup array
          const raw = Array.isArray(parsed) ? parsed[0] : parsed
          if (!raw || !raw.name || !Array.isArray(raw.guests)) throw new Error('Format invalide')
          const id = newId()
          const now = new Date().toISOString()
          const newList = {
            id,
            name: raw.name,
            createdAt: now,
            updatedAt: now,
            options: migrateOptions(raw.options || {}),
            guests: raw.guests.map(g => ({ ...migrateGuest(g), id: newId() }))
          }
          persist([newList, ...lists])
          resolve(id)
        } catch (err) { reject(err) }
      }
      reader.onerror = () => reject(new Error('Erreur de lecture'))
      reader.readAsText(file)
    })
  }, [lists, persist])

  const duplicateList = useCallback((listId) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return null
    const id = newId()
    const now = new Date().toISOString()
    const copy = {
      ...list,
      id,
      name: `${list.name} (copie)`,
      createdAt: now,
      updatedAt: now,
      guests: list.guests.map(g => ({ ...g, id: newId() }))
    }
    persist([copy, ...lists])
    return id
  }, [lists, persist])

  // tableConfigs: [{ name, shape, seats }]
  const createTables = useCallback((listId, tableConfigs) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      const newTables = tableConfigs.map(cfg => ({
        id: newId(),
        name: cfg.name,
        shape: cfg.shape,
        seats: cfg.seats,
        guestIds: []
      }))
      return { ...l, updatedAt: now, tables: [...(l.tables || []), ...newTables] }
    }))
  }, [lists, persist])

  const updateTable = useCallback((listId, tableId, updates) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return { ...l, updatedAt: now, tables: l.tables.map(t => t.id === tableId ? { ...t, ...updates } : t) }
    }))
  }, [lists, persist])

  const deleteTable = useCallback((listId, tableId) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return { ...l, updatedAt: now, tables: l.tables.filter(t => t.id !== tableId) }
    }))
  }, [lists, persist])

  return { lists, createList, deleteList, getList, addGuest, removeGuest, updateGuest, updateListOptions, exportListJson, exportListExcel, importListFromFile, duplicateList, createTables, updateTable, deleteTable }
}
