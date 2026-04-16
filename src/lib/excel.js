import * as XLSX from 'xlsx'

export function exportListToExcel(list) {
  const { guests, options, name } = list
  const { genderEnabled, ageSystem, notation, labelSystem1, labelSystem2 } = options

  const rows = guests.map(g => {
    const row = {
      'Prénom': g.firstName || '',
      'Nom': g.lastName || '',
    }
    if (genderEnabled) {
      row['Genre'] = g.gender === 'M' ? 'Homme' : g.gender === 'F' ? 'Femme' : ''
    }
    if (ageSystem.enabled && ageSystem.items.length > 0) {
      const cat = ageSystem.items.find(c => c.id === g.ageCategoryId)
      row["Catégorie d'âge"] = cat?.name || ''
    }
    if (notation.enabled) {
      row['Note'] = g.rating != null ? g.rating : ''
    }
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

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Invités')

  const filename = `${name.replace(/[^a-zA-Z0-9_\- ]/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`
  XLSX.writeFile(wb, filename)
}

export async function importListFromExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
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

        // Collect unique values to rebuild option items
        const ageCategoryNames = hasAge
          ? [...new Set(rows.map(r => r["Catégorie d'âge"]).filter(Boolean))]
          : []
        const label1Names = labelHeader1
          ? [...new Set(rows.map(r => r[labelHeader1]).filter(Boolean))]
          : []
        const label2Names = labelHeader2
          ? [...new Set(rows.map(r => r[labelHeader2]).filter(Boolean))]
          : []

        const ageItems = ageCategoryNames.map((n, i) => ({ id: `age_${i}`, name: n }))
        const label1Items = label1Names.map((n, i) => ({ id: `l1_${i}`, name: n, color: null }))
        const label2Items = label2Names.map((n, i) => ({ id: `l2_${i}`, name: n, color: null }))

        const notationMax = hasNotation
          ? Math.max(...rows.map(r => Number(r['Note']) || 0).filter(n => n > 0), 5)
          : 5

        const options = {
          notation: { enabled: hasNotation, max: notationMax },
          genderEnabled: hasGender,
          ageSystem: { enabled: hasAge, items: ageItems },
          labelSystem1: { enabled: !!labelHeader1, name: labelHeader1 || 'Label 1', items: label1Items },
          labelSystem2: { enabled: !!labelHeader2, name: labelHeader2 || 'Label 2', items: label2Items },
        }

        const guests = rows.map(row => {
          const genderVal = String(row['Genre'] || '')
          const gender = genderVal === 'Homme' ? 'M' : genderVal === 'Femme' ? 'F' : null

          const ageName = String(row["Catégorie d'âge"] || '')
          const ageItem = ageItems.find(a => a.name === ageName)

          const ratingRaw = row['Note']
          const ratingNum = ratingRaw !== '' && ratingRaw != null ? Number(ratingRaw) : NaN
          const rating = !isNaN(ratingNum) && ratingNum > 0 ? ratingNum : null

          const label1Name = labelHeader1 ? String(row[labelHeader1] || '') : ''
          const label2Name = labelHeader2 ? String(row[labelHeader2] || '') : ''

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

        // Use filename (minus extension) as list name suggestion
        const listName = file.name.replace(/\.[^.]+$/, '').replace(/_\d{4}-\d{2}-\d{2}$/, '').replace(/_/g, ' ')

        resolve({ listName, options, guests })
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'))
    reader.readAsArrayBuffer(file)
  })
}
