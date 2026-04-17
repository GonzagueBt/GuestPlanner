import * as XLSX from 'xlsx'

// ── Styles ──────────────────────────────────────────────────────────────────

const S_HEADER = {
  font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
  fill: { patternType: 'solid', fgColor: { rgb: '4F46E5' } },
  alignment: { horizontal: 'center', vertical: 'center' },
  border: {
    bottom: { style: 'medium', color: { rgb: '3730A3' } },
  },
}

const S_ROW_ODD = {
  fill: { patternType: 'solid', fgColor: { rgb: 'F5F5FF' } },
  alignment: { vertical: 'center' },
}

const S_ROW_EVEN = {
  alignment: { vertical: 'center' },
}

const S_NOTE = (isOdd) => ({
  ...(isOdd ? S_ROW_ODD : S_ROW_EVEN),
  alignment: { horizontal: 'center', vertical: 'center' },
  numFmt: '0',
})

// ── Helpers ──────────────────────────────────────────────────────────────────

function setCellStyle(ws, r, c, style) {
  const ref = XLSX.utils.encode_cell({ r, c })
  if (ws[ref]) ws[ref].s = style
}

// ── Export ───────────────────────────────────────────────────────────────────

export function exportListToExcel(list) {
  const { guests, options, name, tables = [] } = list
  const { genderEnabled, participationEnabled, invitationSentEnabled, ageSystem, notation, labelSystems = [] } = options

  // Column definitions
  const columns = [
    { key: 'Prénom', width: 16 },
    { key: 'Nom', width: 16 },
  ]
  if (genderEnabled)
    columns.push({ key: 'Genre', width: 10 })
  if (participationEnabled)
    columns.push({ key: 'Participation', width: 14 })
  if (invitationSentEnabled)
    columns.push({ key: 'Invitation', width: 12 })
  if (ageSystem.enabled && ageSystem.items.length > 0)
    columns.push({ key: "Catégorie d'âge", width: 18 })
  if (notation.enabled)
    columns.push({ key: 'Note', width: 8 })
  for (const ls of labelSystems) {
    if (ls.enabled && ls.items.length > 0)
      columns.push({ key: ls.name, width: Math.max(14, ls.name.length + 4) })
  }

  const headers = columns.map(c => c.key)
  const noteColIdx = headers.indexOf('Note')

  // Build data rows
  const rows = guests.map(g => {
    const row = { 'Prénom': g.firstName || '', 'Nom': g.lastName || '' }
    if (genderEnabled)
      row['Genre'] = g.gender === 'M' ? 'Homme' : g.gender === 'F' ? 'Femme' : ''
    if (participationEnabled)
      row['Participation'] = g.participation === 'yes' ? 'Participe' : g.participation === 'no' ? 'Absent' : ''
    if (invitationSentEnabled)
      row['Invitation'] = g.invitationSent ? 'Envoyée' : 'Non envoyée'
    if (ageSystem.enabled && ageSystem.items.length > 0) {
      const cat = ageSystem.items.find(c => c.id === g.ageCategoryId)
      row["Catégorie d'âge"] = cat?.name || ''
    }
    if (notation.enabled)
      row['Note'] = g.rating != null ? g.rating : ''
    for (const ls of labelSystems) {
      if (ls.enabled && ls.items.length > 0) {
        const label = ls.items.find(l => l.id === (g.labelIds?.[ls.id] ?? null))
        row[ls.name] = label?.name || ''
      }
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })

  // Style header row
  headers.forEach((_, c) => setCellStyle(ws, 0, c, S_HEADER))

  // Style data rows (alternating)
  rows.forEach((_, rowIdx) => {
    const r = rowIdx + 1
    const odd = rowIdx % 2 === 0
    headers.forEach((_, c) => {
      if (c === noteColIdx) {
        setCellStyle(ws, r, c, S_NOTE(odd))
      } else {
        setCellStyle(ws, r, c, odd ? S_ROW_ODD : S_ROW_EVEN)
      }
    })
  })

  // Column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width }))

  // Row heights: header taller
  ws['!rows'] = [{ hpt: 22 }]

  // Autofilter on entire range
  ws['!autofilter'] = { ref: ws['!ref'] }

  // Freeze header row
  ws['!freeze'] = { xSplit: 0, ySplit: 1 }

  // ── Workbook ────────────────────────────────────────────────────────────────

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Invités')

  // Tables sheet (si des tables existent)
  const sheetCount = [1] // compte les sheets visibles
  if (tables.length > 0) {
    const tableRows = []
    for (const t of tables) {
      for (const guestId of (t.guestIds || [])) {
        const guest = guests.find(g => g.id === guestId)
        tableRows.push({
          'Table': t.name,
          'Forme': t.shape || '',
          'Places': t.seats || '',
          'Invité': guest ? [guest.firstName, guest.lastName].filter(Boolean).join(' ') : ''
        })
      }
      if (!t.guestIds || t.guestIds.length === 0) {
        tableRows.push({ 'Table': t.name, 'Forme': t.shape || '', 'Places': t.seats || '', 'Invité': '' })
      }
    }
    const tablesWs = XLSX.utils.json_to_sheet(tableRows, { header: ['Table', 'Forme', 'Places', 'Invité'] })
    XLSX.utils.book_append_sheet(wb, tablesWs, 'Tables')
    sheetCount.push(1)
  }

  // Metadata sheet → préserve les options pour un import fidèle
  const metaWs = XLSX.utils.aoa_to_sheet([[JSON.stringify({ options, tables })]])
  XLSX.utils.book_append_sheet(wb, metaWs, '_meta')

  // Marquer _meta comme très caché
  const sheetVisibility = sheetCount.map(() => ({ Hidden: 0 }))
  sheetVisibility.push({ Hidden: 2 }) // _meta
  wb.Workbook = { Sheets: sheetVisibility }

  const filename = `${name.replace(/[^a-zA-Z0-9_\- ]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename, { cellStyles: true })
}

// ── Import ───────────────────────────────────────────────────────────────────

export async function importListFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array' })

        // Restaurer les options et tables depuis la feuille _meta
        let savedOptions = null
        let savedTables = null
        const metaSheet = wb.Sheets['_meta']
        if (metaSheet) {
          try {
            const [[raw]] = XLSX.utils.sheet_to_json(metaSheet, { header: 1 })
            if (raw) {
              const parsed = JSON.parse(raw)
              // Ancienne version : juste options, nouvelle version : { options, tables }
              if (parsed.options) {
                savedOptions = parsed.options
                savedTables = parsed.tables || null
              } else {
                savedOptions = parsed
              }
            }
          } catch { /* ignore */ }
        }

        // Lire la première feuille visible (pas _meta, pas Tables)
        const dataSheetName = wb.SheetNames.find(n => n !== '_meta' && n !== 'Tables') || wb.SheetNames[0]
        const ws = wb.Sheets[dataSheetName]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (!rows.length) throw new Error('Fichier vide')

        const headers = Object.keys(rows[0])
        const knownHeaders = new Set(['Prénom', 'Nom', 'Genre', 'Participation', 'Invitation', "Catégorie d'âge", 'Note'])
        const labelHeaders = headers.filter(h => !knownHeaders.has(h))

        const hasGender = headers.includes('Genre')
        const hasParticipation = headers.includes('Participation')
        const hasInvitation = headers.includes('Invitation')
        const hasAge = headers.includes("Catégorie d'âge")
        const hasNotation = headers.includes('Note')

        let options, ageItems, labelSystemsItems

        if (savedOptions) {
          // Restauration complète depuis metadata
          options = savedOptions
          ageItems = savedOptions.ageSystem?.items || []
          labelSystemsItems = (savedOptions.labelSystems || []).map(ls => ({
            ls,
            items: ls.items || []
          }))
        } else {
          // Reconstruction depuis les données (fichier externe sans metadata)
          const ageCategoryNames = hasAge
            ? [...new Set(rows.map(r => r["Catégorie d'âge"]).filter(Boolean))]
            : []
          ageItems = ageCategoryNames.map((n, i) => ({ id: `age_${i}`, name: n }))

          const labelSystems = labelHeaders.map((header, idx) => {
            const names = [...new Set(rows.map(r => r[header]).filter(Boolean))]
            const items = names.map((n, i) => ({ id: `l${idx}_${i}`, name: n, color: null }))
            return { id: `ls_${idx}`, name: header, enabled: true, items }
          })
          labelSystemsItems = labelSystems.map(ls => ({ ls, items: ls.items }))

          const notationMax = hasNotation
            ? Math.max(...rows.map(r => Number(r['Note']) || 0).filter(n => n > 0), 5)
            : 5

          options = {
            notation: { enabled: hasNotation, max: notationMax },
            genderEnabled: hasGender,
            participationEnabled: hasParticipation,
            invitationSentEnabled: hasInvitation,
            ageSystem: { enabled: hasAge, items: ageItems },
            labelSystems
          }
        }

        const guests = rows.map(row => {
          const genderVal = String(row['Genre'] || '')
          const gender = genderVal === 'Homme' ? 'M' : genderVal === 'Femme' ? 'F' : null

          const ageName = String(row["Catégorie d'âge"] || '')
          const ageItem = ageItems.find(a => a.name === ageName)

          const ratingRaw = row['Note']
          const ratingNum = ratingRaw !== '' && ratingRaw != null ? Number(ratingRaw) : NaN
          const rating = !isNaN(ratingNum) && ratingNum > 0 ? ratingNum : null

          const participationVal = String(row['Participation'] || '')
          const participation = participationVal === 'Participe' ? 'yes' : participationVal === 'Absent' ? 'no' : null

          const invitationVal = String(row['Invitation'] || '')
          const invitationSent = invitationVal === 'Envoyée'

          // Reconstruire labelIds
          const labelIds = {}
          for (const { ls, items } of labelSystemsItems) {
            const colName = ls.name
            const labelName = String(row[colName] || '')
            const found = items.find(l => l.name === labelName)
            if (found) labelIds[ls.id] = found.id
          }

          return {
            id: crypto.randomUUID(),
            firstName: String(row['Prénom'] || ''),
            lastName: String(row['Nom'] || ''),
            gender,
            ageCategoryId: ageItem?.id || null,
            rating,
            labelIds,
            participation,
            invitationSent
          }
        })

        const listName = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/_\d{4}-\d{2}-\d{2}$/, '')
          .replace(/_/g, ' ')

        resolve({ listName, options, guests, tables: savedTables || [] })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsArrayBuffer(file)
  })
}
