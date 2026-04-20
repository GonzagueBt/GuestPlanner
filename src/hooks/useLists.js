import { useState, useCallback } from 'react'
import { newId, DEFAULT_AGE_CATEGORIES } from '../lib/utils'
import { exportListToExcel, importListFromExcel } from '../lib/excel'

const STORAGE_KEY = 'guestplanner_lists'

function migrateGuest(g) {
  let guest = g
  // { name } → { firstName, lastName }
  if (guest.name !== undefined && guest.firstName === undefined) {
    const parts = guest.name.trim().split(' ')
    const { name: _n, ...rest } = guest
    guest = { ...rest, firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' }
  }
  // { labelId } → { labelId1 } (très vieux format)
  if (guest.labelId !== undefined && guest.labelId1 === undefined) {
    const { labelId, ...rest } = guest
    guest = { ...rest, labelId1: labelId ?? null }
  }
  // gender
  if (guest.gender === undefined) guest = { ...guest, gender: null }
  // ageCategory → ageCategoryId
  if (guest.ageCategory !== undefined && guest.ageCategoryId === undefined) {
    const { ageCategory, ...rest } = guest
    guest = { ...rest, ageCategoryId: ageCategory ?? null }
  }
  if (guest.ageCategoryId === undefined) guest = { ...guest, ageCategoryId: null }
  if (guest.participation === undefined) guest = { ...guest, participation: null }
  if (guest.invitationSent === undefined) guest = { ...guest, invitationSent: false }
  // Migrer labelId1/labelId2 → labelIds object
  if (guest.labelIds === undefined) {
    const labelIds = {}
    if (guest.labelId1 !== undefined) labelIds['ls1'] = guest.labelId1 ?? null
    if (guest.labelId2 !== undefined) labelIds['ls2'] = guest.labelId2 ?? null
    const { labelId1, labelId2, ...rest } = guest
    guest = { ...rest, labelIds }
  }
  return guest
}

function migrateOptions(options) {
  let opts = options
  // Très vieux format : { labels } → { labelSystem1, labelSystem2 }
  if (opts.labelSystem1 === undefined && opts.labelSystems === undefined) {
    const oldLabels = opts.labels || { enabled: false, items: [] }
    const { labels, ...rest } = opts
    opts = {
      ...rest,
      labelSystem1: { enabled: oldLabels.enabled, name: 'Label 1', items: oldLabels.items || [] },
      labelSystem2: { enabled: false, name: 'Label 2', items: [] }
    }
  }
  // Migrer labelSystem1/2 → labelSystems array avec IDs stables 'ls1'/'ls2'
  if (opts.labelSystems === undefined) {
    const systems = []
    if (opts.labelSystem1) systems.push({ id: 'ls1', ...opts.labelSystem1 })
    if (opts.labelSystem2) systems.push({ id: 'ls2', ...opts.labelSystem2 })
    const { labelSystem1, labelSystem2, labels, ...rest } = opts
    opts = { ...rest, labelSystems: systems }
  }
  // ageSystem absent → ajouter avec catégories par défaut
  if (opts.ageSystem === undefined) {
    opts = { ...opts, ageSystem: { enabled: false, items: [...DEFAULT_AGE_CATEGORIES] } }
  }
  if (opts.genderEnabled === undefined) opts = { ...opts, genderEnabled: false }
  if (opts.participationEnabled === undefined) opts = { ...opts, participationEnabled: false }
  if (opts.invitationSentEnabled === undefined) opts = { ...opts, invitationSentEnabled: false }
  return opts
}

function uniqueName(baseName, existingNames) {
  if (!existingNames.includes(baseName)) return baseName
  let i = 2
  while (existingNames.includes(`${baseName} (${i})`)) i++
  return `${baseName} (${i})`
}

function loadLists() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const lists = JSON.parse(raw)
    return lists.map(l => ({
      ...l,
      options: migrateOptions(l.options),
      guests: l.guests.map(migrateGuest),
      tables: (l.tables ?? []).map(t => ({
        ...t,
        // Ensure guestIds is always a fixed-length array (null = empty seat)
        guestIds: Array.from({ length: t.seats }, (_, i) => t.guestIds?.[i] ?? null)
      }))
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

  const createList = useCallback((name, notationOpts, genderEnabled, participationEnabled, invitationSentEnabled, ageSystemOpts, labelSystems) => {
    const id = newId()
    const now = new Date().toISOString()
    const newList = {
      id,
      name,
      createdAt: now,
      updatedAt: now,
      options: {
        notation: notationOpts,
        genderEnabled: genderEnabled ?? false,
        participationEnabled: participationEnabled ?? false,
        invitationSentEnabled: invitationSentEnabled ?? false,
        ageSystem: ageSystemOpts,
        labelSystems: labelSystems ?? []
      },
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

  const addGuest = useCallback((listId, firstName, lastName, gender, ageCategoryId, rating, labelIds, participation, invitationSent = false) => {
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
          labelIds: labelIds ?? {},
          participation: participation ?? null,
          invitationSent: invitationSent ?? false
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

  const updateGuest = useCallback((listId, guestId, firstName, lastName, gender, ageCategoryId, rating, labelIds, participation, invitationSent = false) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l,
        updatedAt: now,
        guests: l.guests.map(g =>
          g.id === guestId
            ? { ...g, firstName, lastName, gender: gender ?? null, ageCategoryId: ageCategoryId ?? null, rating: rating ?? null, labelIds: labelIds ?? {}, participation: participation ?? null, invitationSent: invitationSent ?? false }
            : g
        )
      }
    }))
  }, [lists, persist])

  const updateListOptions = useCallback((listId, name, newNotation, newGenderEnabled, newParticipationEnabled, newInvitationSentEnabled, newAgeSystem, newLabelSystems) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      const removedAge = new Set(
        l.options.ageSystem.items
          .filter(old => !newAgeSystem.items.find(n => n.id === old.id))
          .map(old => old.id)
      )
      // Pour chaque système existant, calculer quels label IDs ont été supprimés
      const removedLabels = {}
      for (const sys of (l.options.labelSystems || [])) {
        const newSys = newLabelSystems.find(ns => ns.id === sys.id)
        if (!newSys || !newSys.enabled) {
          removedLabels[sys.id] = 'all'
        } else {
          removedLabels[sys.id] = new Set(
            sys.items
              .filter(old => !newSys.items.find(ni => ni.id === old.id))
              .map(old => old.id)
          )
        }
      }
      const guests = l.guests.map(g => {
        const newLabelIds = { ...(g.labelIds || {}) }
        for (const [sysId, removedSet] of Object.entries(removedLabels)) {
          if (removedSet === 'all') {
            newLabelIds[sysId] = null
          } else {
            const current = g.labelIds?.[sysId] ?? null
            if (removedSet.has(current)) newLabelIds[sysId] = null
          }
        }
        return {
          ...g,
          gender: newGenderEnabled ? g.gender : null,
          participation: newParticipationEnabled ? g.participation : null,
          invitationSent: newInvitationSentEnabled ? g.invitationSent : false,
          rating: newNotation.enabled ? g.rating : null,
          ageCategoryId: (!newAgeSystem.enabled || removedAge.has(g.ageCategoryId)) ? null : g.ageCategoryId,
          labelIds: newLabelIds
        }
      })
      return {
        ...l, name, updatedAt: now,
        options: {
          notation: newNotation,
          genderEnabled: newGenderEnabled,
          participationEnabled: newParticipationEnabled,
          invitationSentEnabled: newInvitationSentEnabled,
          ageSystem: newAgeSystem,
          labelSystems: newLabelSystems
        },
        guests
      }
    }))
  }, [lists, persist])

  const bulkUpdateGuests = useCallback((listId, guestIdSet, updates) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l, updatedAt: now,
        guests: l.guests.map(g => {
          if (!guestIdSet.has(g.id)) return g
          const updated = { ...g, ...updates }
          // Merger les labelIds plutôt que les remplacer
          if (updates.labelIds) {
            updated.labelIds = { ...(g.labelIds || {}), ...updates.labelIds }
          }
          return updated
        })
      }
    }))
  }, [lists, persist])

  const removeGuests = useCallback((listId, guestIdSet) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return { ...l, updatedAt: now, guests: l.guests.filter(g => !guestIdSet.has(g.id)) }
    }))
  }, [lists, persist])

  const copyGuestsToList = useCallback((fromListId, guestIdSet, toListId) => {
    const fromList = lists.find(l => l.id === fromListId)
    if (!fromList) return
    const toCopy = fromList.guests.filter(g => guestIdSet.has(g.id))
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== toListId) return l
      const existingKeys = new Set(
        l.guests.map(g => `${(g.firstName || '').trim().toLowerCase()}|${(g.lastName || '').trim().toLowerCase()}`)
      )
      const newGuests = toCopy
        .filter(g => !existingKeys.has(`${(g.firstName || '').trim().toLowerCase()}|${(g.lastName || '').trim().toLowerCase()}`))
        .map(g => ({ ...g, id: newId() }))
      return { ...l, updatedAt: now, guests: [...l.guests, ...newGuests] }
    }))
  }, [lists, persist])

  const exportListJson = useCallback((listId) => {
    const list = lists.find(l => l.id === listId)
    if (!list) return
    const payload = { name: list.name, options: list.options, guests: list.guests, tables: list.tables ?? [] }
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
      return importListFromExcel(file).then(({ listName, options, guests, tables }) => {
        const id = newId()
        const now = new Date().toISOString()
        const name = uniqueName(listName, lists.map(l => l.name))
        const newList = { id, name, createdAt: now, updatedAt: now, options, guests, tables: (tables || []).map(t => ({ ...t, id: newId() })) }
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
          const raw = Array.isArray(parsed) ? parsed[0] : parsed
          if (!raw || !raw.name || !Array.isArray(raw.guests)) throw new Error('Format invalide')
          const id = newId()
          const now = new Date().toISOString()
          const newList = {
            id,
            name: uniqueName(raw.name, lists.map(l => l.name)),
            createdAt: now,
            updatedAt: now,
            options: migrateOptions(raw.options || {}),
            guests: raw.guests.map(g => ({ ...migrateGuest(g), id: newId() })),
            tables: (raw.tables || []).map(t => ({ ...t, id: newId() }))
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
    const existingNames = lists.map(l => l.name)
    const copy = {
      ...list,
      id,
      name: uniqueName(`${list.name} (copie)`, existingNames),
      createdAt: now,
      updatedAt: now,
      guests: list.guests.map(g => ({ ...g, id: newId() }))
    }
    persist([copy, ...lists])
    return id
  }, [lists, persist])

  const updateListTheme = useCallback((listId, theme) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return { ...l, updatedAt: now, options: { ...l.options, theme } }
    }))
  }, [lists, persist])

  const createTables = useCallback((listId, tableConfigs) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      const newTables = tableConfigs.map(cfg => ({
        id: newId(),
        name: cfg.name,
        shape: cfg.shape,
        seats: cfg.seats,
        guestIds: Array(cfg.seats).fill(null)
      }))
      return { ...l, updatedAt: now, tables: [...(l.tables || []), ...newTables] }
    }))
  }, [lists, persist])

  // ── Seating assignment ────────────────────────────────────────────────────

  // Moves a guest to a seat, removing them from any previous seat first
  const assignGuestToSeat = useCallback((listId, guestId, toTableId, toSeatIndex) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      // Remove guest from any current seat
      const tables = l.tables.map(t => ({
        ...t,
        guestIds: t.guestIds.map(gId => gId === guestId ? null : gId)
      }))
      // Place at new seat
      return {
        ...l, updatedAt: now,
        tables: tables.map(t => {
          if (t.id !== toTableId) return t
          const newGuestIds = [...t.guestIds]
          newGuestIds[toSeatIndex] = guestId
          return { ...t, guestIds: newGuestIds }
        })
      }
    }))
  }, [lists, persist])

  // Removes a guest from a specific seat
  const unassignGuestFromSeat = useCallback((listId, tableId, seatIndex) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l, updatedAt: now,
        tables: l.tables.map(t => {
          if (t.id !== tableId) return t
          const newGuestIds = [...t.guestIds]
          newGuestIds[seatIndex] = null
          return { ...t, guestIds: newGuestIds }
        })
      }
    }))
  }, [lists, persist])

  // Swaps the occupants of two seats (cross-table supported; empty seats work correctly)
  const swapSeats = useCallback((listId, tableIdA, seatA, tableIdB, seatB) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      const guestA = l.tables.find(t => t.id === tableIdA)?.guestIds?.[seatA] ?? null
      const guestB = l.tables.find(t => t.id === tableIdB)?.guestIds?.[seatB] ?? null
      const tables = l.tables.map(t => {
        const newGuestIds = [...t.guestIds]
        if (t.id === tableIdA) newGuestIds[seatA] = guestB
        if (t.id === tableIdB) newGuestIds[seatB] = guestA
        return { ...t, guestIds: newGuestIds }
      })
      return { ...l, updatedAt: now, tables }
    }))
  }, [lists, persist])

  const updateTable = useCallback((listId, tableId, updates) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return {
        ...l, updatedAt: now,
        tables: l.tables.map(t => {
          if (t.id !== tableId) return t
          const merged = { ...t, ...updates }
          // If seat count changed, resize guestIds (truncate or pad with null)
          if (updates.seats !== undefined && updates.seats !== t.seats) {
            merged.guestIds = Array.from({ length: updates.seats }, (_, i) => t.guestIds[i] ?? null)
          }
          return merged
        })
      }
    }))
  }, [lists, persist])

  const deleteTable = useCallback((listId, tableId) => {
    const now = new Date().toISOString()
    persist(lists.map(l => {
      if (l.id !== listId) return l
      return { ...l, updatedAt: now, tables: l.tables.filter(t => t.id !== tableId) }
    }))
  }, [lists, persist])

  return { lists, createList, deleteList, getList, addGuest, removeGuest, updateGuest, updateListOptions, updateListTheme, bulkUpdateGuests, removeGuests, copyGuestsToList, exportListJson, exportListExcel, importListFromFile, duplicateList, createTables, updateTable, deleteTable, assignGuestToSeat, unassignGuestFromSeat, swapSeats }
}
