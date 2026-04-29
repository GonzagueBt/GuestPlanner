import { useState, useMemo, useEffect } from 'react'
import { formatGuestName } from '../lib/utils'
import { autoPlace } from '../lib/autoPlace'

// ── Guest picker (search + select, multi or single) ────────────────────────────

function GuestPicker({ guests, selected, onToggle, maxSelect = Infinity, exclude = [] }) {
  const [search, setSearch] = useState('')
  const filtered = guests.filter(g => {
    if (exclude.includes(g.id)) return false
    if (!search) return true
    return `${g.firstName || ''} ${g.lastName || ''}`.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher un invité…"
        className="w-full bg-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="max-h-40 overflow-y-auto space-y-0.5 rounded-xl bg-slate-700/30">
        {filtered.length === 0 && (
          <p className="text-center text-slate-500 py-4 text-sm">Aucun invité trouvé</p>
        )}
        {filtered.map(g => {
          const isSelected = selected.includes(g.id)
          const isDisabled = !isSelected && selected.length >= maxSelect
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => !isDisabled && onToggle(g.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors rounded-lg ${
                isSelected
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : isDisabled
                    ? 'text-slate-600 cursor-not-allowed'
                    : 'text-slate-300 hover:bg-slate-700/60'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {((g.firstName || g.lastName || '?')[0]).toUpperCase()}
              </span>
              <span className="flex-1 truncate">{formatGuestName(g)}</span>
              {isSelected && <span className="text-indigo-400 text-xs">✓</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Constraint pair (shows current constraints + add new) ──────────────────────

function ConstraintList({ label, items, onRemove, onAdd, guests, multi = false, pairOnly = false }) {
  const [adding, setAdding] = useState(false)
  const [selectedA, setSelectedA] = useState([])
  const [selectedB, setSelectedB] = useState([])

  function handleAdd() {
    if (pairOnly) {
      if (selectedA.length > 0 && selectedB.length > 0) {
        for (const a of selectedA) {
          for (const b of selectedB) {
            if (a !== b) onAdd({ guestIdA: a, guestIdB: b })
          }
        }
      }
    } else if (multi) {
      const combined = [...new Set([...selectedA, ...selectedB])]
      if (combined.length >= 2) onAdd({ guestIds: combined })
    } else {
      if (selectedA.length > 0 && selectedB.length > 0) {
        onAdd({ guestIdA: selectedA[0], guestIdB: selectedB[0] })
      }
    }
    setSelectedA([])
    setSelectedB([])
    setAdding(false)
  }

  function toggleA(id) {
    setSelectedA(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setSelectedB(prev => prev.filter(x => x !== id))
  }
  function toggleB(id) {
    setSelectedB(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    setSelectedA(prev => prev.filter(x => x !== id))
  }

  const guestName = id => {
    const g = guests.find(g => g.id === id)
    return g ? formatGuestName(g) : id
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2 text-sm">
          <span className="text-slate-300 truncate">
            {item.guestIds
              ? item.guestIds.map(guestName).join(' · ')
              : `${guestName(item.guestIdA)} ↔ ${guestName(item.guestIdB)}`}
          </span>
          <button type="button" onClick={() => onRemove(idx)}
            className="ml-2 text-slate-500 hover:text-red-400 text-lg leading-none flex-shrink-0 p-1">×</button>
        </div>
      ))}

      {adding ? (
        <div className="bg-slate-700/30 rounded-xl p-3 space-y-3">
          {multi ? (
            <>
              <p className="text-xs text-slate-500">Sélectionner les invités à regrouper (min. 2)</p>
              <GuestPicker guests={guests} selected={[...selectedA, ...selectedB]} onToggle={id => {
                const combined = [...new Set([...selectedA, ...selectedB])]
                if (combined.includes(id)) {
                  setSelectedA(prev => prev.filter(x => x !== id))
                  setSelectedB(prev => prev.filter(x => x !== id))
                } else {
                  setSelectedA(prev => [...prev, id])
                }
              }} />
            </>
          ) : (
            <>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Invité A</p>
                <GuestPicker guests={guests} selected={selectedA} onToggle={toggleA} maxSelect={pairOnly ? Infinity : 1} exclude={selectedB} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1.5">Invité B</p>
                <GuestPicker guests={guests} selected={selectedB} onToggle={toggleB} maxSelect={pairOnly ? Infinity : 1} exclude={selectedA} />
              </div>
            </>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setAdding(false); setSelectedA([]); setSelectedB([]) }}
              className="flex-1 py-2 rounded-lg bg-slate-700 text-slate-300 text-sm">Annuler</button>
            <button type="button" onClick={handleAdd}
              disabled={multi ? ([...selectedA, ...selectedB]).length < 2 : selectedA.length === 0 || selectedB.length === 0}
              className="flex-1 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white text-sm font-medium">
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)}
          className="w-full text-xs text-indigo-400 hover:text-indigo-300 py-2 rounded-lg border border-dashed border-slate-600 hover:border-indigo-500 transition-colors">
          + Ajouter
        </button>
      )}
    </div>
  )
}

// ── Step components ────────────────────────────────────────────────────────────

function StepTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <p className="text-white font-semibold text-base">{title}</p>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, sublabel }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div className="relative flex-shrink-0 mt-0.5">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only" />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-slate-600'}`} />
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </div>
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
    </label>
  )
}

function RateSlider({ value, onChange, label }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">{label}</p>
        <span className="text-xs font-semibold text-indigo-400">{value}%</span>
      </div>
      <input
        type="range" min={10} max={100} step={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>10%</span><span>50%</span><span>100%</span>
      </div>
    </div>
  )
}

// ── Main wizard ───────────────────────────────────────────────────────────────

export default function AutoPlaceWizard({ list, onApply, onClose }) {
  const { guests, tables, options } = list
  const linkTypes = options.linkTypes || []
  const enabledLabelSystems = (options.labelSystems || []).filter(ls => ls.enabled && ls.items.length > 0)

  const hasExistingPlacements = tables.some(t => t.guestIds.some(Boolean))
  const hasAgeSystem = options.ageSystem?.enabled && options.ageSystem.items.length > 0
  const hasGender = options.genderEnabled
  const hasLabels = enabledLabelSystems.length > 0
  const hasLinks = linkTypes.length > 0 && guests.some(g => g.links?.length > 0)
  const hasScores = options.notation?.enabled
  const hasRectTables = tables.some(t => t.shape === 'rect')

  const eligibleGuests = guests.filter(g => g.participation !== 'no')

  const STEPS = useMemo(() => {
    const s = []
    if (hasExistingPlacements) s.push('existing')
    if (hasAgeSystem) s.push('age')
    if (hasGender) s.push('gender')
    if (hasLabels) s.push('labels')
    s.push('lastname')
    s.push('constraints')
    if (hasLinks) s.push('links')
    if (hasScores) s.push('scores')
    s.push('confirm')
    return s
  }, [hasExistingPlacements, hasAgeSystem, hasGender, hasLabels, hasLinks, hasScores])

  const [stepIdx, setStepIdx] = useState(0)
  const currentStep = STEPS[stepIdx]

  const [rules, setRules] = useState({
    keepExisting: false,
    ageGroupTables: false,
    alternateGender: false,
    labelGrouping: Object.fromEntries(
      enabledLabelSystems.map(ls => [ls.id, { enabled: false, rate: 50 }])
    ),
    lastNameGrouping: { enabled: false, rate: 50 },
    exclusionsSameTable: [],
    exclusionsAdjacent: [],
    inclusionsSameTable: [],
    inclusionsAdjacent: [],
    inclusionsFacing: [],
    linksSameTable: Object.fromEntries(
      linkTypes.map(lt => [lt.id, { sameTable: true, adjacent: lt.size === 2 }])
    ),
    scoreMode: 'none',
  })

  function setRule(key, value) {
    setRules(prev => ({ ...prev, [key]: value }))
  }

  function next() { setStepIdx(i => Math.min(i + 1, STEPS.length - 1)) }
  function prev() { setStepIdx(i => Math.max(i - 1, 0)) }

  // Pre-compute placement when the confirm step is shown so warnings are visible before launch
  const [confirmPreview, setConfirmPreview] = useState(null)
  useEffect(() => {
    if (currentStep === 'confirm') {
      setConfirmPreview(autoPlace(list, rules))
    } else {
      setConfirmPreview(null)
    }
  }, [currentStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const confirmWarnings = confirmPreview?.warnings ?? {}

  function handleLaunch() {
    const result = confirmPreview ?? autoPlace(list, rules)
    onApply(result)
  }

  const progress = (stepIdx + 1) / STEPS.length

  // Step labels for the summary
  const stepLabels = {
    existing: 'Placements existants',
    age: 'Tranches d\'âge',
    gender: 'Genre',
    labels: 'Labels',
    lastname: 'Nom de famille',
    constraints: 'Exclusions / Inclusions',
    links: 'Liens',
    scores: 'Notes',
    confirm: 'Confirmation',
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-4 pt-4 pb-safe-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-slide-up sm:animate-scale-in">

        {/* Header */}
        <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white font-bold">Placement automatique</p>
              <p className="text-xs text-slate-500 mt-0.5">{stepLabels[currentStep]} · étape {stepIdx + 1}/{STEPS.length}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-2 -mr-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full transition-all duration-300" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-5 py-5">

          {/* ── STEP: existing placements ── */}
          {currentStep === 'existing' && (
            <div className="space-y-4">
              <StepTitle
                title="Des invités sont déjà placés"
                subtitle="Que souhaitez-vous faire avec les placements actuels ?"
              />
              <div className="space-y-3">
                {[
                  { value: false, label: 'Repartir à zéro', sub: 'Tous les sièges sont libérés et replacés automatiquement' },
                  { value: true, label: 'Conserver les placements actuels', sub: 'Les invités déjà placés restent à leur place ; les autres sont distribués selon vos règles' },
                ].map(opt => (
                  <button key={String(opt.value)} type="button"
                    onClick={() => setRule('keepExisting', opt.value)}
                    className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                      rules.keepExisting === opt.value
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{opt.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP: age ── */}
          {currentStep === 'age' && (
            <div className="space-y-5">
              <StepTitle
                title="Tables par tranche d'âge"
                subtitle="Faut-il regrouper les invités par tranche d'âge sur des tables dédiées ?"
              />
              <Toggle
                checked={rules.ageGroupTables}
                onChange={v => setRule('ageGroupTables', v)}
                label="Regrouper par tranche d'âge"
                sublabel="Des catégories de table seront créées automatiquement (Enfant, Adulte…)"
              />
              {rules.ageGroupTables && (
                <div className="bg-slate-700/30 rounded-xl p-3 text-xs text-slate-400 space-y-1">
                  <p className="font-medium text-slate-300">Catégories détectées :</p>
                  {options.ageSystem.items.map(cat => {
                    const count = eligibleGuests.filter(g => g.ageCategoryId === cat.id).length
                    return (
                      <p key={cat.id}>{cat.name} — {count} invité{count !== 1 ? 's' : ''}</p>
                    )
                  })}
                  <p>{eligibleGuests.filter(g => !g.ageCategoryId).length} sans catégorie</p>
                </div>
              )}
            </div>
          )}

          {/* ── STEP: gender ── */}
          {currentStep === 'gender' && (
            <div className="space-y-5">
              <StepTitle
                title="Alternance homme / femme"
                subtitle="Sur chaque table, faut-il maximiser l'alternance entre hommes et femmes ?"
              />
              <Toggle
                checked={rules.alternateGender}
                onChange={v => setRule('alternateGender', v)}
                label="Alterner homme / femme"
                sublabel="L'algorithme préférera placer un homme à côté d'une femme et vice-versa"
              />
            </div>
          )}

          {/* ── STEP: labels ── */}
          {currentStep === 'labels' && (
            <div className="space-y-5">
              <StepTitle
                title="Regroupement par label"
                subtitle="Faut-il favoriser le regroupement des invités partageant le même label ?"
              />
              {enabledLabelSystems.map(ls => {
                const rule = rules.labelGrouping[ls.id] || { enabled: false, rate: 50 }
                return (
                  <div key={ls.id} className="bg-slate-700/30 rounded-xl p-4 space-y-4">
                    <Toggle
                      checked={rule.enabled}
                      onChange={v => setRule('labelGrouping', { ...rules.labelGrouping, [ls.id]: { ...rule, enabled: v } })}
                      label={ls.name}
                      sublabel={`Regrouper les invités ayant le même label "${ls.name}"`}
                    />
                    {rule.enabled && (
                      <RateSlider
                        value={rule.rate}
                        onChange={v => setRule('labelGrouping', { ...rules.labelGrouping, [ls.id]: { ...rule, rate: v } })}
                        label="Taux de regroupement visé (par rapport au nombre de chaises)"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── STEP: lastname ── */}
          {currentStep === 'lastname' && (
            <div className="space-y-5">
              <StepTitle
                title="Regroupement par nom de famille"
                subtitle="Faut-il regrouper les personnes portant le même nom de famille ?"
              />
              <Toggle
                checked={rules.lastNameGrouping.enabled}
                onChange={v => setRule('lastNameGrouping', { ...rules.lastNameGrouping, enabled: v })}
                label="Regrouper par nom de famille"
                sublabel="Favorise le placement des personnes de même famille sur la même table"
              />
              {rules.lastNameGrouping.enabled && (
                <RateSlider
                  value={rules.lastNameGrouping.rate}
                  onChange={v => setRule('lastNameGrouping', { ...rules.lastNameGrouping, rate: v })}
                  label="Taux de regroupement visé"
                />
              )}
            </div>
          )}

          {/* ── STEP: constraints ── */}
          {currentStep === 'constraints' && (
            <div className="space-y-6">
              <StepTitle
                title="Exclusions et inclusions"
                subtitle="Définissez des règles de co-placement entre invités"
              />

              <ConstraintList
                label="Exclusions — même table (ne pas mettre à la même table)"
                items={rules.exclusionsSameTable}
                onRemove={idx => setRule('exclusionsSameTable', rules.exclusionsSameTable.filter((_, i) => i !== idx))}
                onAdd={pair => setRule('exclusionsSameTable', [...rules.exclusionsSameTable, pair])}
                guests={eligibleGuests}
              />

              <ConstraintList
                label="Exclusions — à côté (ne pas placer côte à côte)"
                items={rules.exclusionsAdjacent}
                onRemove={idx => setRule('exclusionsAdjacent', rules.exclusionsAdjacent.filter((_, i) => i !== idx))}
                onAdd={pair => setRule('exclusionsAdjacent', [...rules.exclusionsAdjacent, pair])}
                guests={eligibleGuests}
              />

              <ConstraintList
                label="Inclusions — même table (obligation de mettre à la même table)"
                items={rules.inclusionsSameTable}
                onRemove={idx => setRule('inclusionsSameTable', rules.inclusionsSameTable.filter((_, i) => i !== idx))}
                onAdd={group => setRule('inclusionsSameTable', [...rules.inclusionsSameTable, group])}
                guests={eligibleGuests}
                multi
              />

              <ConstraintList
                label="Inclusions — à côté (placer côte à côte)"
                items={rules.inclusionsAdjacent}
                onRemove={idx => setRule('inclusionsAdjacent', rules.inclusionsAdjacent.filter((_, i) => i !== idx))}
                onAdd={pair => setRule('inclusionsAdjacent', [...rules.inclusionsAdjacent, pair])}
                guests={eligibleGuests}
              />

              {hasRectTables && (
                <ConstraintList
                  label="Inclusions — en face (tables rectangulaires uniquement)"
                  items={rules.inclusionsFacing}
                  onRemove={idx => setRule('inclusionsFacing', rules.inclusionsFacing.filter((_, i) => i !== idx))}
                  onAdd={pair => setRule('inclusionsFacing', [...rules.inclusionsFacing, pair])}
                  guests={eligibleGuests}
                />
              )}
            </div>
          )}

          {/* ── STEP: links ── */}
          {currentStep === 'links' && (
            <div className="space-y-5">
              <StepTitle
                title="Placement des liens"
                subtitle="Pour chaque type de lien, définissez les règles de co-placement"
              />
              {linkTypes.map(lt => {
                const rule = rules.linksSameTable[lt.id] || { sameTable: true, adjacent: false }
                return (
                  <div key={lt.id} className="bg-slate-700/30 rounded-xl p-4 space-y-4">
                    <p className="text-sm font-semibold text-white">{lt.name} <span className="text-slate-500 font-normal">({lt.size} personnes)</span></p>
                    <Toggle
                      checked={rule.sameTable}
                      onChange={v => setRule('linksSameTable', { ...rules.linksSameTable, [lt.id]: { ...rule, sameTable: v, adjacent: v ? rule.adjacent : false } })}
                      label="Regrouper à la même table"
                      sublabel="Tous les membres du lien seront placés à la même table"
                    />
                    {rule.sameTable && lt.size === 2 && (
                      <Toggle
                        checked={rule.adjacent}
                        onChange={v => setRule('linksSameTable', { ...rules.linksSameTable, [lt.id]: { ...rule, adjacent: v } })}
                        label="Placer côte à côte"
                        sublabel="Les deux membres du lien seront placés sur des sièges adjacents"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* ── STEP: scores ── */}
          {currentStep === 'scores' && (
            <div className="space-y-4">
              <StepTitle
                title="Gestion des notes"
                subtitle="Comment prendre en compte les notes des invités dans le placement ?"
              />
              {[
                { value: 'none', label: 'Ignorer les notes', sub: 'Les notes ne jouent aucun rôle dans le placement' },
                { value: 'group', label: 'Regrouper par note similaire', sub: 'Les invités avec la même note tendent à être à la même table' },
                { value: 'balance', label: 'Équilibrer les notes entre tables', sub: 'Chaque table aura une moyenne de notes similaire' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setRule('scoreMode', opt.value)}
                  className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${
                    rules.scoreMode === opt.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <p className="text-sm font-semibold text-white">{opt.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.sub}</p>
                </button>
              ))}
            </div>
          )}

          {/* ── STEP: confirm ── */}
          {currentStep === 'confirm' && (
            <div className="space-y-4">
              <StepTitle
                title="Prêt à placer"
                subtitle="Vérifiez le résumé des règles et lancez le placement."
              />
              <div className="bg-slate-700/30 rounded-xl p-4 space-y-2 text-sm">
                {hasExistingPlacements && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Existants :</span>{' '}
                    {rules.keepExisting ? 'conservés (inviolables)' : 'remis à zéro'}
                  </p>
                )}
                {hasAgeSystem && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Tranches d'âge :</span>{' '}
                    {rules.ageGroupTables ? 'tables par âge' : 'désactivé'}
                  </p>
                )}
                {hasGender && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Genre :</span>{' '}
                    {rules.alternateGender ? 'alternance H/F activée' : 'désactivé'}
                  </p>
                )}
                {enabledLabelSystems.filter(ls => rules.labelGrouping[ls.id]?.enabled).map(ls => (
                  <p key={ls.id} className="text-slate-300">
                    <span className="text-slate-500">{ls.name} :</span>{' '}
                    regroupement à {rules.labelGrouping[ls.id]?.rate}%
                  </p>
                ))}
                {rules.lastNameGrouping.enabled && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Nom de famille :</span>{' '}
                    regroupement à {rules.lastNameGrouping.rate}%
                  </p>
                )}
                {rules.exclusionsSameTable.length > 0 && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Exclusions (table) :</span>{' '}
                    {rules.exclusionsSameTable.length} paire{rules.exclusionsSameTable.length > 1 ? 's' : ''}
                  </p>
                )}
                {rules.inclusionsSameTable.length > 0 && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Inclusions (table) :</span>{' '}
                    {rules.inclusionsSameTable.length} groupe{rules.inclusionsSameTable.length > 1 ? 's' : ''}
                  </p>
                )}
                {(rules.inclusionsAdjacent.length > 0 || rules.exclusionsAdjacent.length > 0 || rules.inclusionsFacing.length > 0) && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Contraintes de siège :</span>{' '}
                    {rules.inclusionsAdjacent.length + rules.exclusionsAdjacent.length + rules.inclusionsFacing.length} règle{rules.inclusionsAdjacent.length + rules.exclusionsAdjacent.length + rules.inclusionsFacing.length > 1 ? 's' : ''}
                  </p>
                )}
                {hasLinks && linkTypes.some(lt => rules.linksSameTable[lt.id]?.sameTable) && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Liens :</span>{' '}
                    {linkTypes.filter(lt => rules.linksSameTable[lt.id]?.sameTable).map(lt => lt.name).join(', ')} → même table
                  </p>
                )}
                {hasScores && rules.scoreMode !== 'none' && (
                  <p className="text-slate-300">
                    <span className="text-slate-500">Notes :</span>{' '}
                    {rules.scoreMode === 'group' ? 'regroupées' : 'équilibrées'}
                  </p>
                )}
              </div>
              {confirmWarnings.ageMixing?.length > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-xs text-orange-300">
                  Pas assez de tables pour isoler toutes les tranches d'âge. Mélangées avec les voisines :{' '}
                  <span className="font-semibold">{confirmWarnings.ageMixing.join(', ')}</span>.
                </div>
              )}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs text-amber-300">
                {eligibleGuests.length} invité{eligibleGuests.length !== 1 ? 's' : ''} à placer sur{' '}
                {tables.reduce((s, t) => s + t.seats, 0)} places au total.
                Les positions respectent vos règles ; le reste est distribué aléatoirement.
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-slate-700/50 flex gap-3">
          {stepIdx > 0 && (
            <button type="button" onClick={prev}
              className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm font-medium transition-colors">
              ← Retour
            </button>
          )}
          {currentStep !== 'confirm' ? (
            <button type="button" onClick={next}
              className="flex-1 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors">
              Suivant →
            </button>
          ) : (
            <button type="button" onClick={handleLaunch}
              className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold transition-colors">
              Lancer le placement ✓
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
