import { useState } from 'react'

function ChevronIcon({ open }) {
  return (
    <svg className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function KpiBar({ list }) {
  const { guests, options } = list
  const { genderEnabled, participationEnabled, invitationSentEnabled, ageSystem, labelSystems = [], notation } = options

  const [showAges, setShowAges] = useState(false)
  const [showRatings, setShowRatings] = useState(false)
  const [expandedLabels, setExpandedLabels] = useState({})

  const toggleLabel = (id) => setExpandedLabels(prev => ({ ...prev, [id]: !prev[id] }))

  const participatesCount = participationEnabled ? guests.filter(g => g.participation === 'yes').length : 0
  const absentCount       = participationEnabled ? guests.filter(g => g.participation === 'no').length  : 0
  const pendingCount      = participationEnabled ? guests.filter(g => g.participation === null).length  : 0

  const invitationSentCount   = invitationSentEnabled ? guests.filter(g => g.invitationSent === true).length : 0
  const invitationUnsentCount = invitationSentEnabled ? guests.filter(g => !g.invitationSent).length : 0

  const maleCount   = guests.filter(g => g.gender === 'M').length
  const femaleCount = guests.filter(g => g.gender === 'F').length

  const ageCounts = (ageSystem?.enabled ? ageSystem.items : []).map(cat => ({
    cat,
    count: guests.filter(g => g.ageCategoryId === cat.id).length
  })).filter(({ count }) => count > 0)
  const unassignedAge = ageSystem?.enabled ? guests.filter(g => !g.ageCategoryId).length : 0
  const hasAges = ageSystem?.enabled && ageSystem.items.length > 0 && guests.length > 0

  const ratingCounts = notation.enabled
    ? Array.from({ length: notation.max }, (_, i) => i + 1)
        .map(n => ({ rating: n, count: guests.filter(g => g.rating === n).length }))
        .filter(({ count }) => count > 0)
    : []
  const unassignedRating = notation.enabled ? guests.filter(g => g.rating == null).length : 0
  const hasRatings = notation.enabled && guests.length > 0

  const activeLabelSystems = labelSystems.filter(ls => ls.enabled && ls.items.length > 0)

  const hasSecondRow =
    (participationEnabled && guests.length > 0) ||
    (genderEnabled && (maleCount > 0 || femaleCount > 0)) ||
    (invitationSentEnabled && guests.length > 0)

  return (
    <div className="bg-slate-800/60 rounded-xl px-4 py-3 space-y-2">
      {/* Ligne 1 : total + toggles */}
      <div className="flex items-center gap-3">
        <p className="text-white font-bold flex-shrink-0">
          <span className="text-xl text-indigo-400">{guests.length}</span>
          <span className="text-xs text-slate-500 ml-1.5 uppercase tracking-wide">invité{guests.length !== 1 ? 's' : ''}</span>
        </p>

        <div className="flex gap-1.5 ml-auto flex-wrap justify-end">
          {hasAges && (
            <button
              onClick={() => setShowAges(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showAges ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Âges <ChevronIcon open={showAges} />
            </button>
          )}
          {activeLabelSystems.map(ls => (
            <button
              key={ls.id}
              onClick={() => toggleLabel(ls.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                expandedLabels[ls.id] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ls.name} <ChevronIcon open={!!expandedLabels[ls.id]} />
            </button>
          ))}
          {hasRatings && (
            <button
              onClick={() => setShowRatings(v => !v)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                showRatings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              Notes <ChevronIcon open={showRatings} />
            </button>
          )}
        </div>
      </div>

      {/* Ligne 2 : participation + genre + invitation */}
      {hasSecondRow && (
        <div className="flex items-center gap-3 flex-wrap">
          {participationEnabled && guests.length > 0 && (
            <div className="flex items-center gap-2.5 text-xs">
              {participatesCount > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  {participatesCount} participe
                </span>
              )}
              {absentCount > 0 && (
                <span className="flex items-center gap-1 text-red-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                  {absentCount} absent
                </span>
              )}
              {pendingCount > 0 && (
                <span className="flex items-center gap-1 text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-500 inline-block" />
                  {pendingCount} sans réponse
                </span>
              )}
            </div>
          )}

          {participationEnabled && genderEnabled && (maleCount > 0 || femaleCount > 0) && guests.length > 0 && (
            <span className="w-px h-3 bg-slate-700 flex-shrink-0" />
          )}

          {genderEnabled && (maleCount > 0 || femaleCount > 0) && (
            <div className="flex items-center gap-2 text-xs">
              {maleCount > 0 && <span className="text-blue-400 font-medium">♂ {maleCount}</span>}
              {femaleCount > 0 && <span className="text-pink-400 font-medium">♀ {femaleCount}</span>}
            </div>
          )}

          {invitationSentEnabled && guests.length > 0 && (
            <>
              {(participationEnabled || (genderEnabled && (maleCount > 0 || femaleCount > 0))) && (
                <span className="w-px h-3 bg-slate-700 flex-shrink-0" />
              )}
              <div className="flex items-center gap-1.5 text-xs">
                <svg className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-slate-400">
                  <span className="text-indigo-400 font-medium">{invitationSentCount}</span> envoyée{invitationSentCount !== 1 ? 's' : ''}
                  {' · '}
                  <span className="text-slate-500 font-medium">{invitationUnsentCount}</span> non envoyée{invitationUnsentCount !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Répartition par catégorie d'âge */}
      {showAges && hasAges && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {ageCounts.map(({ cat, count }) => (
            <span key={cat.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-amber-400 bg-amber-500/10">
              {cat.name} · {count}
            </span>
          ))}
          {unassignedAge > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
              Sans catégorie · {unassignedAge}
            </span>
          )}
        </div>
      )}

      {/* Répartition par système de labels */}
      {activeLabelSystems.map(ls => {
        if (!expandedLabels[ls.id]) return null
        const labelCounts = ls.items.map(label => ({
          label,
          count: guests.filter(g => g.labelIds?.[ls.id] === label.id).length
        }))
        const unassigned = guests.filter(g => !g.labelIds?.[ls.id]).length
        return (
          <div key={ls.id} className="flex flex-wrap gap-2 pt-0.5">
            {labelCounts.map(({ label, count }) => (
              <span key={label.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: label.color ? label.color + '25' : '#47556920', color: label.color || '#94a3b8' }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: label.color || '#475569' }} />
                {label.name} · {count}
              </span>
            ))}
            {unassigned > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
                Sans {ls.name} · {unassigned}
              </span>
            )}
          </div>
        )
      })}

      {/* Répartition par notation */}
      {showRatings && hasRatings && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          {ratingCounts.map(({ rating, count }) => (
            <span key={rating} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-indigo-400 bg-indigo-400/10">
              {rating}/{notation.max} · {count}
            </span>
          ))}
          {unassignedRating > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-slate-400 bg-slate-700/50">
              Sans note · {unassignedRating}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
