import { newId } from './utils'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function computeSides(n) {
  const rem = Math.max(n - 2, 0)
  return { leftCount: Math.ceil(rem / 2), rightCount: Math.floor(rem / 2) }
}

function getAdjacentSlots(n, pos, shape) {
  if (shape === 'round') {
    return [(pos - 1 + n) % n, (pos + 1) % n]
  }
  return [pos - 1, pos + 1].filter(i => i >= 0 && i < n)
}

function isAdjacent(i, j, n, shape) {
  if (i === -1 || j === -1) return false
  if (shape === 'round') {
    return Math.abs(i - j) === 1 || Math.abs(i - j) === n - 1
  }
  return Math.abs(i - j) === 1
}

function isFacing(i, j, n, shape) {
  if (shape !== 'rect') return false
  const { leftCount } = computeSides(n)
  if (leftCount === 0) return false
  if (i >= 1 && i <= leftCount && j === i + leftCount) return true
  if (j >= 1 && j <= leftCount && i === j + leftCount) return true
  return false
}

// Rearranges seats within one table to satisfy adjacency/facing constraints
function optimizeSeats(table, adjWants, facingWants) {
  const n = table.guestIds.length
  const guestIds = [...table.guestIds]

  // Build filled slots only (skip null)
  const filledSlots = guestIds
    .map((id, i) => ({ id, slot: i }))
    .filter(x => x.id)

  if (filledSlots.length < 2) return guestIds

  // Try to satisfy adjacency pairs
  for (const [gIdA, gIdB] of adjWants) {
    const slotA = guestIds.indexOf(gIdA)
    const slotB = guestIds.indexOf(gIdB)
    if (slotA === -1 || slotB === -1) continue
    if (isAdjacent(slotA, slotB, n, table.shape)) continue

    // Try moving B to a slot adjacent to A
    const candidates = getAdjacentSlots(n, slotA, table.shape)
    for (const target of candidates) {
      if (target === slotA) continue
      const current = guestIds[target]
      // Swap B with current occupant at target
      guestIds[target] = gIdB
      guestIds[slotB] = current
      break
    }
  }

  // Try to satisfy facing pairs (rect tables only)
  if (table.shape === 'rect') {
    const { leftCount } = computeSides(n)
    for (const [gIdA, gIdB] of facingWants) {
      const slotA = guestIds.indexOf(gIdA)
      const slotB = guestIds.indexOf(gIdB)
      if (slotA === -1 || slotB === -1) continue
      if (isFacing(slotA, slotB, n, table.shape)) continue

      // Find facing slot for A
      let facingSlot = -1
      if (slotA >= 1 && slotA <= leftCount) facingSlot = slotA + leftCount
      else if (slotA > leftCount && slotA < n - 1) facingSlot = slotA - leftCount

      if (facingSlot > 0 && facingSlot < n) {
        const current = guestIds[facingSlot]
        guestIds[facingSlot] = gIdB
        guestIds[slotB] = current
      }
    }
  }

  return guestIds
}

/**
 * Main auto-placement algorithm.
 * Returns: { tables: [{id, guestIds}], newCategories: [{id, name}], categoryUpdates: {tableId: catId} }
 */
export function autoPlace(list, rules) {
  const { tables, guests, options } = list

  // ── 1. Setup ─────────────────────────────────────────────────────────────────

  const eligible = guests.filter(g => g.participation !== 'no')
  const guestMap = new Map(eligible.map(g => [g.id, g]))

  const tableSlots = tables.map(t => ({
    id: t.id,
    seats: t.seats,
    shape: t.shape || 'round',
    guestIds: rules.keepExisting ? [...t.guestIds] : Array(t.seats).fill(null)
  }))

  // Guests locked in place (existing + kept)
  const locked = new Set()
  if (rules.keepExisting) {
    tableSlots.forEach(t => t.guestIds.forEach(gId => { if (gId && guestMap.has(gId)) locked.add(gId) }))
  }

  const unplaced = new Set(eligible.filter(g => !locked.has(g.id)).map(g => g.id))

  // ── 2. Exclusion map ──────────────────────────────────────────────────────────

  const excl = new Map()
  function addExcl(a, b) {
    if (!excl.has(a)) excl.set(a, new Set())
    if (!excl.has(b)) excl.set(b, new Set())
    excl.get(a).add(b)
    excl.get(b).add(a)
  }
  for (const { guestIdA, guestIdB } of (rules.exclusionsSameTable || [])) addExcl(guestIdA, guestIdB)

  // ── 3. Same-table grouping (union-find) ───────────────────────────────────────

  const uf = {}
  function ufFind(x) {
    if (uf[x] === undefined) uf[x] = x
    if (uf[x] !== x) uf[x] = ufFind(uf[x])
    return uf[x]
  }
  function ufUnion(a, b) { uf[ufFind(a)] = ufFind(b) }

  // Inclusions same-table
  for (const { guestIds } of (rules.inclusionsSameTable || [])) {
    const valid = guestIds.filter(id => unplaced.has(id))
    for (let i = 1; i < valid.length; i++) ufUnion(valid[0], valid[i])
  }

  // Link same-table rules
  const linkRules = rules.linksSameTable || {}
  for (const g of eligible) {
    if (locked.has(g.id)) continue
    for (const link of (g.links || [])) {
      if (!linkRules[link.typeId]?.sameTable) continue
      const members = link.memberIds.filter(mid => unplaced.has(mid))
      for (let i = 1; i < members.length; i++) ufUnion(members[0], members[i])
    }
  }

  // Build groups: root → [guestId]
  const groupMap = new Map()
  for (const gId of unplaced) {
    const root = ufFind(gId)
    if (!groupMap.has(root)) groupMap.set(root, [])
    groupMap.get(root).push(gId)
  }

  // ── 4. Age-based table categorization ────────────────────────────────────────

  const ageTablePref = new Map()   // guestId → tableSlots index (preferred)
  const newCategories = []
  const categoryUpdates = {}

  if (rules.ageGroupTables && options.ageSystem?.enabled && options.ageSystem.items.length > 0) {
    const ageCounts = new Map()
    for (const gId of unplaced) {
      const g = guestMap.get(gId)
      if (g.ageCategoryId) ageCounts.set(g.ageCategoryId, (ageCounts.get(g.ageCategoryId) || 0) + 1)
    }

    const sortedAges = [...ageCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)

    // Assign table groups to age categories (proportional)
    const totalEligible = unplaced.size || 1
    let tIdx = 0
    const agePref = new Map()

    for (const ageId of sortedAges) {
      const count = ageCounts.get(ageId)
      const fraction = count / totalEligible
      const ageCat = options.ageSystem.items.find(c => c.id === ageId)
      if (!ageCat) continue

      // Create a category for this age group
      const catId = newId()
      newCategories.push({ id: catId, name: ageCat.name })

      agePref.set(ageId, [])
      let remaining = Math.ceil(fraction * tableSlots.length)

      while (remaining > 0 && tIdx < tableSlots.length) {
        agePref.get(ageId).push(tIdx)
        categoryUpdates[tableSlots[tIdx].id] = catId
        remaining--
        tIdx++
      }
    }

    for (const gId of unplaced) {
      const g = guestMap.get(gId)
      if (g.ageCategoryId && agePref.has(g.ageCategoryId)) {
        const pref = agePref.get(g.ageCategoryId)
        if (pref.length > 0) ageTablePref.set(gId, pref[0])
      }
    }
  }

  // ── 5. Scoring function ───────────────────────────────────────────────────────

  function scoreGuestAtTable(gId, tIdx) {
    const g = guestMap.get(gId)
    if (!g) return -Infinity
    const t = tableSlots[tIdx]
    const occs = t.guestIds.filter(Boolean).map(id => guestMap.get(id)).filter(Boolean)

    let score = 0

    // Hard exclusion check
    const myExcl = excl.get(gId)
    if (myExcl) {
      for (const o of occs) if (myExcl.has(o.id)) return -Infinity
    }

    // Prefer age-designated table
    if (ageTablePref.has(gId) && ageTablePref.get(gId) === tIdx) score += 200

    // Gender alternation
    if (rules.alternateGender && g.gender && occs.length > 0) {
      const mCount = occs.filter(o => o.gender === 'M').length
      const fCount = occs.filter(o => o.gender === 'F').length
      if (g.gender === 'M') score += fCount >= mCount ? 20 : -15
      if (g.gender === 'F') score += mCount >= fCount ? 20 : -15
    }

    // Label grouping
    for (const [sysId, rule] of Object.entries(rules.labelGrouping || {})) {
      if (!rule.enabled) continue
      const gLabel = g.labelIds?.[sysId]
      if (!gLabel || occs.length === 0) continue
      const matchRate = occs.filter(o => o.labelIds?.[sysId] === gLabel).length / occs.length
      score += matchRate >= rule.rate / 100 ? 30 : matchRate > 0 ? 10 : 0
    }

    // Last name grouping
    if (rules.lastNameGrouping?.enabled && g.lastName && occs.length > 0) {
      const matchRate = occs.filter(o =>
        o.lastName && o.lastName.toLowerCase() === g.lastName.toLowerCase()
      ).length / occs.length
      score += matchRate >= (rules.lastNameGrouping.rate || 50) / 100 ? 25 : matchRate > 0 ? 8 : 0
    }

    // Score mode
    if (rules.scoreMode === 'group' && g.rating != null) {
      score += occs.filter(o => o.rating === g.rating).length * 20
    } else if (rules.scoreMode === 'balance' && g.rating != null && occs.length > 0) {
      const avgOcc = occs.reduce((s, o) => s + (o.rating || 0), 0) / occs.length
      score -= Math.abs(avgOcc - g.rating) * 5
    }

    return score
  }

  // ── 6. Place groups first (largest first) ────────────────────────────────────

  const sortedGroups = [...groupMap.values()].sort((a, b) => b.length - a.length)

  for (const group of sortedGroups) {
    let bestTIdx = -1
    let bestScore = -Infinity

    for (let tIdx = 0; tIdx < tableSlots.length; tIdx++) {
      const free = tableSlots[tIdx].guestIds.filter(x => !x).length
      if (free < group.length) continue

      let groupScore = 0
      let valid = true
      for (const gId of group) {
        const s = scoreGuestAtTable(gId, tIdx)
        if (s === -Infinity) { valid = false; break }
        groupScore += s
      }

      if (valid && groupScore > bestScore) { bestScore = groupScore; bestTIdx = tIdx }
    }

    if (bestTIdx === -1) continue

    for (const gId of group) {
      const slot = tableSlots[bestTIdx].guestIds.indexOf(null)
      if (slot !== -1) {
        tableSlots[bestTIdx].guestIds[slot] = gId
        unplaced.delete(gId)
      }
    }
  }

  // ── 7. Place remaining guests (greedy + shuffled) ────────────────────────────

  const remaining = shuffle([...unplaced])

  for (const gId of remaining) {
    let bestTIdx = -1
    let bestScore = -Infinity

    for (let tIdx = 0; tIdx < tableSlots.length; tIdx++) {
      if (!tableSlots[tIdx].guestIds.includes(null)) continue
      const s = scoreGuestAtTable(gId, tIdx)
      if (s > bestScore) { bestScore = s; bestTIdx = tIdx }
    }

    if (bestTIdx !== -1) {
      const slot = tableSlots[bestTIdx].guestIds.indexOf(null)
      if (slot !== -1) {
        tableSlots[bestTIdx].guestIds[slot] = gId
        unplaced.delete(gId)
      }
    }
  }

  // ── 8. Seat-level optimization (adjacency + facing) ───────────────────────────

  // Collect adjacency pairs per table
  const tableAdjPairs = Object.fromEntries(tableSlots.map(t => [t.id, []]))
  const tableFacingPairs = Object.fromEntries(tableSlots.map(t => [t.id, []]))

  // Inclusions adjacent
  for (const { guestIdA, guestIdB } of (rules.inclusionsAdjacent || [])) {
    for (const t of tableSlots) {
      if (t.guestIds.includes(guestIdA) && t.guestIds.includes(guestIdB)) {
        tableAdjPairs[t.id].push([guestIdA, guestIdB])
        break
      }
    }
  }

  // Exclusions adjacent (treated as: don't be adjacent → try to separate)
  // We skip this for now (complex; not critical for v1)

  // Link adjacent rules
  for (const t of tableSlots) {
    for (const gId of t.guestIds.filter(Boolean)) {
      const g = guestMap.get(gId)
      if (!g) continue
      for (const link of (g.links || [])) {
        if (!linkRules[link.typeId]?.adjacent) continue
        if (link.memberIds.length !== 2) continue
        const other = link.memberIds.find(mid => mid !== gId)
        if (!other) continue
        if (t.guestIds.includes(other)) {
          // Avoid duplicate pairs
          const existing = tableAdjPairs[t.id]
          if (!existing.some(([a, b]) => (a === gId && b === other) || (a === other && b === gId))) {
            tableAdjPairs[t.id].push([gId, other])
          }
        }
      }
    }
  }

  // Inclusions facing
  for (const { guestIdA, guestIdB } of (rules.inclusionsFacing || [])) {
    for (const t of tableSlots) {
      if (t.shape === 'rect' && t.guestIds.includes(guestIdA) && t.guestIds.includes(guestIdB)) {
        tableFacingPairs[t.id].push([guestIdA, guestIdB])
        break
      }
    }
  }

  // Apply optimization per table
  for (const t of tableSlots) {
    const adjPairs = tableAdjPairs[t.id] || []
    const facingPairs = tableFacingPairs[t.id] || []
    if (adjPairs.length > 0 || facingPairs.length > 0) {
      t.guestIds = optimizeSeats(t, adjPairs, facingPairs)
    }
  }

  // ── Result ────────────────────────────────────────────────────────────────────

  return {
    tables: tableSlots.map(t => ({ id: t.id, guestIds: t.guestIds })),
    newCategories,
    categoryUpdates
  }
}
