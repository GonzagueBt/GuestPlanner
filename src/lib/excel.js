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
  const { guests, options, name } = list
  const { genderEnabled, ageSystem, notation, labelSystem1, labelSystem2 } = options

  // Column definitions (key → display header, width in chars)
  const columns = [
    { key: 'Prénom', width: 16 },
    { key: 'Nom', width: 16 },
  ]
  if (genderEnabled)
    columns.push({ key: 'Genre', width: 10 })
  if (ageSystem.enabled && ageSystem.items.length > 0)
    columns.push({ key: "Catégorie d'âge", width: 18 })
  if (notation.enabled)
    columns.push({ key: 'Note', width: 8 })
  if (labelSystem1.enabled && labelSystem1.items.length > 0)
    columns.push({ key: labelSystem1.name, width: Math.max(14, labelSystem1.name.length + 4) })
  if (labelSystem2.enabled && labelSystem2.items.length > 0)
    columns.push({ key: labelSystem2.name, width: Math.max(14, labelSystem2.name.length + 4) })

  const headers = columns.map(c => c.key)
  const noteColIdx = headers.indexOf('Note')

  // Build data rows
  const rows = guests.map(g => {
    const row = { 'Prénom': g.firstName || '', 'Nom': g.lastName || '' }
    if (genderEnabled)
      row['Genre'] = g.gender === 'M' ? 'Homme' : g.gender === 'F' ? 'Femme' : ''
    if (ageSystem.enabled && ageSystem.items.length > 0) {
      const cat = ageSystem.items.find(c => c.id === g.ageCategoryId)
      row["Catégorie d'âge"] = cat?.name || ''
    }
    if (notation.enabled)
      row['Note'] = g.rating != null ? g.rating : ''
    if (labelSystem1.enabled && labelSystem1.items.length > 0) {
      const label = labelSystem1.items.find(l => l.id === g.labelId1)
      row[labelSystem1.name] = label?.name || ''
    }
    if (labelSystem2.enabled && labelSystem2.items.length > 0) {
      const label = labelSystem2.items.find(l => l.id === g.labelId2)
      row[labelSystem2.name] = label?.name || ''
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers })

  // Style header row
  headers.forEach((_, c) => setCellStyle(ws, 0, c, S_HEADER))

  // Style data rows (alternating) + center Note column
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

  // Hidden metadata sheet → preserves label colors and IDs for round-trip import
  const metaWs = XLSX.utils.aoa_to_sheet([[JSON.stringify(options)]])
  XLSX.utils.book_append_sheet(wb, metaWs, '_meta')

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

        // Try to restore options from metadata sheet (preserves label colors etc.)
        let savedOptions = null
        const metaSheet = wb.Sheets['_meta']
        if (metaSheet) {
          try {
            const [[raw]] = XLSX.utils.sheet_to_json(metaSheet, { header: 1 })
            if (raw) savedOptions = JSON.parse(raw)
          } catch { /* ignore */ }
        }

        // Read first visible sheet (skip _meta)
        const dataSheetName = wb.SheetNames.find(n => n !== '_meta') || wb.SheetNames[0]
        const ws = wb.Sheets[dataSheetName]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

        if (!rows.length) throw new Error('Fichier vide')

        const headers = Object.keys(rows[0])
        const knownHeaders = new Set(['Prénom', 'Nom', 'Genre', "Catégorie d'âge", 'Note'])
        const labelHeaders = headers.filter(h => !knownHeaders.has(h))

        const hasGender = headers.includes('Genre')
        const hasAge = headers.includes("Catégorie d'âge")
        const hasNotation = headers.includes('Note')
        const labelHeader1 = labelHeaders[0] || null
        const labelHeader2 = labelHeaders[1] || null

        let options, ageItems, label1Items, label2Items

        if (savedOptions) {
          // Full restore from metadata — colors and IDs intact
          options = savedOptions
          ageItems = savedOptions.ageSystem.items
          label1Items = savedOptions.labelSystem1.items
          label2Items = savedOptions.labelSystem2.items
        } else {
          // Reconstruct from data values (external file / no metadata)
          const ageCategoryNames = hasAge
            ? [...new Set(rows.map(r => r["Catégorie d'âge"]).filter(Boolean))]
            : []
          const label1Names = labelHeader1
            ? [...new Set(rows.map(r => r[labelHeader1]).filter(Boolean))]
            : []
          const label2Names = labelHeader2
            ? [...new Set(rows.map(r => r[labelHeader2]).filter(Boolean))]
            : []

          ageItems = ageCategoryNames.map((n, i) => ({ id: `age_${i}`, name: n }))
          label1Items = label1Names.map((n, i) => ({ id: `l1_${i}`, name: n, color: null }))
          label2Items = label2Names.map((n, i) => ({ id: `l2_${i}`, name: n, color: null }))

          const notationMax = hasNotation
            ? Math.max(...rows.map(r => Number(r['Note']) || 0).filter(n => n > 0), 5)
            : 5

          options = {
            notation: { enabled: hasNotation, max: notationMax },
            genderEnabled: hasGender,
            ageSystem: { enabled: hasAge, items: ageItems },
            labelSystem1: { enabled: !!labelHeader1, name: labelHeader1 || 'Label 1', items: label1Items },
            labelSystem2: { enabled: !!labelHeader2, name: labelHeader2 || 'Label 2', items: label2Items },
          }
        }

        // Resolve column names for labels (may differ between saved options and header)
        const l1ColName = savedOptions?.labelSystem1?.name || labelHeader1
        const l2ColName = savedOptions?.labelSystem2?.name || labelHeader2

        const guests = rows.map(row => {
          const genderVal = String(row['Genre'] || '')
          const gender = genderVal === 'Homme' ? 'M' : genderVal === 'Femme' ? 'F' : null

          const ageName = String(row["Catégorie d'âge"] || '')
          const ageItem = ageItems.find(a => a.name === ageName)

          const ratingRaw = row['Note']
          const ratingNum = ratingRaw !== '' && ratingRaw != null ? Number(ratingRaw) : NaN
          const rating = !isNaN(ratingNum) && ratingNum > 0 ? ratingNum : null

          const label1Name = l1ColName ? String(row[l1ColName] || '') : ''
          const label2Name = l2ColName ? String(row[l2ColName] || '') : ''

          return {
            id: crypto.randomUUID(),
            firstName: String(row['Prénom'] || ''),
            lastName: String(row['Nom'] || ''),
            gender,
            ageCategoryId: ageItem?.id || null,
            rating,
            labelId1: label1Items.find(l => l.name === label1Name)?.id || null,
            labelId2: label2Items.find(l => l.name === label2Name)?.id || null,
          }
        })

        const listName = file.name
          .replace(/\.[^.]+$/, '')
          .replace(/_\d{4}-\d{2}-\d{2}$/, '')
          .replace(/_/g, ' ')

        resolve({ listName, options, guests })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsArrayBuffer(file)
  })
}
