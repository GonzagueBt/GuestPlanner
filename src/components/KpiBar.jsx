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

  const [openDropdowns, setOpenDropdowns] = useState({})
  function toggleDd(key) {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
      {/* Overlay to close dropdowns when clicking outside */}
      {Object.values(openDropdowns).some(Boolean) && (
        <div className="fixed inset-0 z-20" onClick={() => setOpenDropdowns({})} aria-hidden="true" />
      )}
      {/* Ligne 1 : total + dropdowns */}
      <div className="flex items-center gap-3">
        <p className="text-white font-bold flex-shrink-0">
          <span className="text-xl text-indigo-400">{guests.length}</span>
          <span className="text-xs text-slate-500 ml-1.5 uppercase tracking-wide">invité{guests.length !== 1 ? 's' : ''}</span>
        </p>

        <div className="flex gap-1.5 ml-auto flex-wrap justify-end">
          {hasAges && (
            <div className="relative">
              <button
                onClick={() => toggleDd('ages')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  openDropdowns.ages ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Âges <ChevronIcon open={!!openDropdowns.ages} />
              </button>
              {openDropdowns.ages && (
                <div className="absolute top-full right-0 mt-1.5 bg-slate-800 border border-slate-700/80 rounded-xl shadow-xl z-30 py-1.5 min-w-[150px]">
                  {ageCounts.map(({ cat, count }) => (
                    <div key={cat.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="text-amber-400 font-medium">{cat.name}</span>
                      <span className="text-slate-300 font-semibold tabular-nums ml-6">{count}</span>
                    </div>
                  ))}
                  {unassignedAge > 0 && (
                    <div className="flex items-center justify-between px-3 py-1.5 text-xs border-t border-slate-700/50 mt-0.5">
                      <span className="text-slate-500">Sans catégorie</span>
                      <span className="text-slate-500 tabular-nums ml-6">{unassignedAge}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeLabelSystems.map(ls => {
            const labelCounts = ls.items.map(label => ({
              label,
              count: guests.filter(g => g.labelIds?.[ls.id] === label.id).length
            }))
            const unassigned = guests.filter(g => !g.labelIds?.[ls.id]).length
            return (
              <div key={ls.id} className="relative">
                <button
                  onClick={() => toggleDd(ls.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    openDropdowns[ls.id] ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {ls.name} <ChevronIcon open={!!openDropdowns[ls.id]} />
                </button>
                {openDropdowns[ls.id] && (
                  <div className="absolute top-full right-0 mt-1.5 bg-slate-800 border border-slate-700/80 rounded-xl shadow-xl z-30 py-1.5 min-w-[150px]">
                    {labelCounts.map(({ label, count }) => (
                      <div key={label.id} className="flex items-center justify-between px-3 py-1.5 text-xs gap-3">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: label.color || '#475569' }} />
                          <span className="font-medium truncate" style={{ color: label.color || '#94a3b8' }}>{label.name}</span>
                        </div>
                        <span className="text-slate-300 font-semibold tabular-nums flex-shrink-0">{count}</span>
                      </div>
                    ))}
                    {unassigned > 0 && (
                      <div className="flex items-center justify-between px-3 py-1.5 text-xs border-t border-slate-700/50 mt-0.5">
                        <span className="text-slate-500">Sans {ls.name.toLowerCase()}</span>
                        <span className="text-slate-500 tabular-nums ml-6">{unassigned}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {hasRatings && (
            <div className="relative">
              <button
                onClick={() => toggleDd('ratings')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  openDropdowns.ratings ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                Notes <ChevronIcon open={!!openDropdowns.ratings} />
              </button>
              {openDropdowns.ratings && (
                <div className="absolute top-full right-0 mt-1.5 bg-slate-800 border border-slate-700/80 rounded-xl shadow-xl z-30 py-1.5 min-w-[130px]">
                  {ratingCounts.map(({ rating, count }) => (
                    <div key={rating} className="flex items-center justify-between px-3 py-1.5 text-xs">
                      <span className="text-indigo-400 font-semibold">{rating}/{notation.max}</span>
                      <span className="text-slate-300 font-semibold tabular-nums ml-6">{count}</span>
                    </div>
                  ))}
                  {unassignedRating > 0 && (
                    <div className="flex items-center justify-between px-3 py-1.5 text-xs border-t border-slate-700/50 mt-0.5">
                      <span className="text-slate-500">Sans note</span>
                      <span className="text-slate-500 tabular-nums ml-6">{unassignedRating}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
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
    </div>
  )
}
