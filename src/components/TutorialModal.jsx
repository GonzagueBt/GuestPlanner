import { useState } from 'react'

// ── Shared SVG palette (mirrors app dark palette) ─────────────────────────────
const P = {
  bg:     '#0f172a',
  panel:  '#1e293b',
  bdr:    '#334155',
  bdr2:   '#475569',
  txt:    '#f1f5f9',
  muted:  '#94a3b8',
  dim:    '#64748b',
  indigo: '#6366f1',
  ind20:  'rgba(99,102,241,0.25)',
  em:     '#10b981',
  em20:   'rgba(16,185,129,0.2)',
  amb:    '#f59e0b',
  red:    '#ef4444',
  red20:  'rgba(239,68,68,0.18)',
}

// ── Tiny SVG helpers ──────────────────────────────────────────────────────────
const R = (x, y, w, h, rx, fill, stroke, sw = 0.8) =>
  <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} strokeWidth={sw} />

const Pill = ({ x, y, w = 40, h = 7, fill = P.muted, op = 0.55 }) =>
  <rect x={x} y={y} width={w} height={h} rx={3.5} fill={fill} opacity={op} />

const Toggle = ({ x, y, on, color = P.indigo }) => (
  <g>
    <rect x={x} y={y} width={26} height={13} rx={6.5} fill={on ? color : P.bdr2} opacity={on ? 1 : 0.6} />
    <circle cx={on ? x + 19 : x + 7} cy={y + 6.5} r={4.8} fill="white" />
  </g>
)

const Chip = ({ x, y, w, label, active, color = P.indigo }) => (
  <g>
    <rect x={x} y={y} width={w} height={18} rx={9}
      fill={active ? color + '30' : P.bg}
      stroke={active ? color : P.bdr} strokeWidth={active ? 1 : 0.6} />
    <Pill x={x + 8} y={y + 5.5} w={w - 16} h={6} fill={active ? color : P.muted} op={active ? 0.9 : 0.5} />
  </g>
)

function RoundTableMini({ cx, cy, r, seats = 8, placed = 5 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={P.panel} stroke={P.bdr} strokeWidth="0.8" />
      <circle cx={cx} cy={cy} r={r * 0.52} fill="#1c3456" stroke={P.bdr2} strokeWidth="0.8" />
      {Array.from({ length: seats }, (_, i) => {
        const a = (2 * Math.PI * i / seats) - Math.PI / 2
        const sx = cx + (r - 5) * Math.cos(a), sy = cy + (r - 5) * Math.sin(a)
        const occ = i < placed
        return <circle key={i} cx={sx} cy={sy} r={r * 0.13}
          fill={occ ? '#1c3456' : P.bg}
          stroke={occ ? P.indigo : P.bdr} strokeWidth="0.8" />
      })}
      <Pill x={cx - 14} y={cy - 4} w={28} fill={P.muted} op={0.6} />
      <Pill x={cx - 8} y={cy + 5} w={16} h={5} fill={P.dim} op={0.5} />
    </g>
  )
}

function GuestRowMini({ x, y, w = 120, name = true, sub = true, placed = false, ring = null }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={24} rx={7} fill="transparent" />
      <circle cx={x + 12} cy={y + 12} r={9} fill={P.panel}
        stroke={ring || P.bdr} strokeWidth={ring ? 1.5 : 0.8} />
      {name && <Pill x={x + 26} y={y + 7} w={w * 0.45} fill={P.txt} op={0.85} />}
      {sub && <Pill x={x + 26} y={y + 16} w={w * 0.3} fill={placed ? P.indigo : P.dim} op={placed ? 0.8 : 0.5} />}
    </g>
  )
}

// ── Illustrations ─────────────────────────────────────────────────────────────

function IlluHomeLists() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      <rect width="300" height="42" fill={P.panel} />
      <Pill x={16} y={13} w={110} h={10} fill={P.txt} op={0.9} />
      <Pill x={16} y={28} w={60} fill={P.muted} op={0.4} />
      <rect x={258} y={10} width={28} height={26} rx={8} fill={P.bdr} />
      {[
        { y: 52, w: 90, badge: P.indigo },
        { y: 96, w: 130, badge: null },
        { y: 140, w: 70, badge: P.em },
      ].map((item, i) => (
        <g key={i}>
          <rect x={12} y={item.y} width={276} height={36} rx={10}
            fill={P.panel} stroke={P.bdr} strokeWidth="0.8" />
          <Pill x={24} y={item.y + 10} w={item.w} h={8} fill={P.txt} op={0.85} />
          <Pill x={24} y={item.y + 23} w={55} fill={P.muted} op={0.45} />
          {item.badge && <>
            <rect x={210} y={item.y + 11} width={30} height={14} rx={7}
              fill={item.badge + '30'} stroke={item.badge} strokeWidth="0.6" />
            <Pill x={218} y={item.y + 16} w={14} h={5} fill={item.badge} op={0.9} />
          </>}
          <path d={`M280 ${item.y + 12} l5 6 -5 6`} stroke={P.dim}
            strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
    </svg>
  )
}

function IlluCreateList() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      <rect x={18} y={8} width={264} height={154} rx={14} fill={P.panel} stroke={P.bdr} strokeWidth="1" />
      <Pill x={34} y={24} w={120} h={10} fill={P.txt} op={0.9} />
      {/* Name input */}
      <rect x={34} y={42} width={232} height={26} rx={8}
        fill={P.bg} stroke={P.indigo} strokeWidth="1.5" />
      <Pill x={44} y={51} w={90} fill={P.txt} op={0.65} />
      {/* Options */}
      {[
        { label: 'Participation', on: true, color: P.em },
        { label: 'Genre', on: false },
        { label: 'Labels personnalisés', on: true, color: P.indigo },
        { label: "Catégorie d'âge", on: false },
        { label: 'Note (/5)', on: true, color: P.amb },
      ].map((opt, i) => (
        <g key={i}>
          <Pill x={34} y={80 + i * 18} w={130} fill={P.muted} op={0.5} />
          <Toggle x={238} y={76 + i * 18} on={opt.on} color={opt.color} />
        </g>
      ))}
    </svg>
  )
}

function IlluAddGuest() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Header */}
      <rect width="300" height="80" fill={P.panel} />
      <Pill x={16} y={16} w={100} h={10} fill={P.txt} op={0.85} />
      <Pill x={16} y={30} w={65} fill={P.muted} op={0.45} />
      {/* KPI bar */}
      <rect x={16} y={44} width={268} height={22} rx={8} fill={P.bdr + '60'} />
      <Pill x={24} y={52} w={50} fill={P.em} op={0.7} />
      <Pill x={82} y={52} w={50} fill={P.red} op={0.5} />
      <Pill x={140} y={52} w={50} fill={P.muted} op={0.4} />
      {/* Input row */}
      <rect x={12} y={88} width={104} height={26} rx={9} fill={P.bdr} stroke={P.bdr2} strokeWidth="1" />
      <Pill x={22} y={98} w={55} fill={P.muted} op={0.45} />
      <rect x={122} y={88} width={104} height={26} rx={9} fill={P.bdr} stroke={P.bdr2} strokeWidth="1" />
      <Pill x={132} y={98} w={40} fill={P.muted} op={0.45} />
      <rect x={232} y={88} width={56} height={26} rx={9} fill={P.indigo} />
      <Pill x={242} y={98} w={36} fill="white" op={0.9} />
      {/* Suggestion dropdown hint */}
      <rect x={12} y={118} width={200} height={22} rx={8} fill={P.bdr} stroke={P.indigo + '60'} strokeWidth="0.8" />
      <Pill x={22} y={127} w={80} fill={P.indigo} op={0.6} />
      <Pill x={110} y={128} w={40} h={5} fill={P.dim} op={0.5} />
      {/* guests below */}
      {[
        { ring: P.em, placed: false },
        { ring: P.red, placed: false },
        { ring: null, placed: true },
      ].map((g, i) => (
        <GuestRowMini key={i} x={12} y={144 + i * 8} w={180} placed={g.placed} ring={g.ring} sub={false} />
      ))}
    </svg>
  )
}

function IlluGuestMeta() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Guest card */}
      <rect x={12} y={10} width={276} height={44} rx={11} fill={P.panel} stroke={P.bdr} strokeWidth="0.8" />
      <circle cx={32} cy={32} r={13} fill={P.bdr} stroke={P.em} strokeWidth="1.5" />
      <Pill x={50} y={24} w={90} h={9} fill={P.txt} op={0.9} />
      {/* Badges */}
      {[
        { x: 50, label: 'Participe', color: P.em, fill: P.em20 },
        { x: 118, label: 'Table 3', color: P.indigo, fill: P.ind20 },
        { x: 178, label: '★★★', color: P.amb, fill: P.amb + '25' },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={36} width={b.label.length * 5.5 + 16} height={14} rx={7}
            fill={b.fill} stroke={b.color} strokeWidth="0.5" />
          <Pill x={b.x + 8} y={40} w={b.label.length * 5.5} h={5} fill={b.color} op={0.8} />
        </g>
      ))}
      {/* Info grid */}
      <rect x={12} y={62} width={276} height={100} rx={11} fill={P.panel} stroke={P.bdr} strokeWidth="0.8" />
      <Pill x={24} y={74} w={80} h={8} fill={P.txt} op={0.6} />
      {[
        { x: 24, y: 92, label: 'Participation', color: P.em },
        { x: 120, y: 92, label: 'Genre', color: P.indigo },
        { x: 196, y: 92, label: 'Âge', color: P.amb },
        { x: 24, y: 122, label: "Label 'Table'", color: P.red },
        { x: 140, y: 122, label: 'Note /5', color: P.amb },
      ].map((item, i) => (
        <g key={i}>
          <rect x={item.x} y={item.y} width={80} height={22} rx={7}
            fill={item.color + '15'} stroke={item.color + '50'} strokeWidth="0.8" />
          <Pill x={item.x + 8} y={item.y + 7.5} w={64} h={6} fill={item.color} op={0.6} />
        </g>
      ))}
      {/* Stars */}
      {Array.from({ length: 5 }, (_, i) => (
        <path key={i} d={`M${24 + i * 16} 148 l2,-4 2,4 4,0 -3,3 1,4 -4,-2 -4,2 1,-4 -3,-3 z`}
          fill={i < 3 ? P.amb : P.bdr2} />
      ))}
    </svg>
  )
}

function IlluFilters() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Sort bar */}
      <rect x={12} y={10} width={276} height={30} rx={9} fill={P.panel} stroke={P.bdr} strokeWidth="0.8" />
      <Pill x={22} y={21} w={30} h={6} fill={P.muted} op={0.4} />
      <rect x={58} y={14} width={54} height={22} rx={7} fill={P.bg} stroke={P.bdr} strokeWidth="0.8" />
      <Pill x={66} y={22} w={38} h={6} fill={P.muted} op={0.5} />
      {/* Filter chips row */}
      <rect x={12} y={48} width={276} height={32} rx={9} fill={P.panel} stroke={P.bdr} strokeWidth="0.8" />
      {[
        { w: 52, active: true, color: P.em, x: 22 },
        { w: 42, active: false, color: P.red, x: 80 },
        { w: 72, active: true, color: P.indigo, x: 128 },
        { w: 38, active: false, color: P.amb, x: 206 },
      ].map((c, i) => (
        <Chip key={i} x={c.x} y={56} w={c.w} active={c.active} color={c.color} />
      ))}
      {/* Guest list filtered */}
      <rect x={12} y={88} width={276} height={12} rx={5} fill={P.panel} stroke={P.bdr} strokeWidth="0.5" />
      <Pill x={20} y={92} w={60} h={5} fill={P.muted} op={0.4} />
      <Pill x={240} y={92} w={40} h={5} fill={P.muted} op={0.4} />
      {[
        { ring: P.em, placed: true },
        { ring: P.em, placed: false },
        { ring: null, placed: true },
        { ring: P.em, placed: false },
      ].map((g, i) => (
        <GuestRowMini key={i} x={12} y={106 + i * 16} w={240} placed={g.placed} ring={g.ring} />
      ))}
    </svg>
  )
}

function IlluBulkSelect() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Selection mode bar */}
      <rect x={12} y={8} width={276} height={24} rx={8} fill={P.ind20} stroke={P.indigo} strokeWidth="0.8" />
      <Pill x={22} y={16} w={80} fill={P.indigo} op={0.7} />
      <Pill x={240} y={16} w={40} fill={P.indigo} op={0.4} />
      {/* Guest rows with checkboxes */}
      {[
        { checked: true, ring: P.em },
        { checked: true, ring: null },
        { checked: false, ring: P.red },
        { checked: true, ring: P.em },
        { checked: false, ring: null },
      ].map((g, i) => (
        <g key={i}>
          <rect x={12} y={38 + i * 22} width={276} height={18} rx={7}
            fill={P.panel} stroke={g.checked ? P.indigo : P.bdr} strokeWidth={g.checked ? 0.8 : 0.4} />
          {/* checkbox */}
          <rect x={20} y={42 + i * 22} width={12} height={12} rx={3.5}
            fill={g.checked ? P.indigo : P.bg} stroke={g.checked ? P.indigo : P.bdr2} strokeWidth="1" />
          {g.checked && <path d={`M23 ${47 + i * 22} l3 3 5-5`}
            stroke="white" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <circle cx={43} cy={47 + i * 22} r={6} fill={P.bdr}
            stroke={g.ring || 'transparent'} strokeWidth="1.2" />
          <Pill x={54} y={44 + i * 22} w={80} fill={P.txt} op={0.8} />
          <Pill x={54} y={52 + i * 22} w={50} h={5} fill={g.ring === P.em ? P.em : P.dim} op={0.5} />
        </g>
      ))}
      {/* Floating action bar */}
      <rect x={12} y={150} width={276} height={14} rx={7} fill={P.indigo} />
      <Pill x={70} y={155} w={60} h={5} fill="white" op={0.85} />
      <Pill x={180} y={155} w={50} h={5} fill="white" op={0.55} />
    </svg>
  )
}

function IlluExportImport() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      <rect x={18} y={8} width={264} height={154} rx={14} fill={P.panel} stroke={P.bdr} strokeWidth="1" />
      <Pill x={34} y={24} w={80} h={9} fill={P.txt} op={0.7} />
      {[
        { label: 'Changer le thème', icon: P.indigo },
        { label: 'Dupliquer la liste', icon: P.bdr2 },
        { label: 'Exporter en JSON', icon: P.indigo, accent: true },
        { label: 'Exporter en Excel', icon: P.em, accent: true },
      ].map((btn, i) => (
        <g key={i}>
          <rect x={34} y={42 + i * 30} width={232} height={24} rx={8}
            fill={P.bg} stroke={btn.accent ? btn.icon + '40' : P.bdr} strokeWidth={btn.accent ? 1 : 0.6} />
          <circle cx={50} cy={54 + i * 30} r={7}
            fill={btn.icon + '25'} />
          <Pill x={62} y={50 + i * 30} w={110} h={8} fill={btn.accent ? btn.icon : P.muted} op={btn.accent ? 0.8 : 0.5} />
          {/* Download icon */}
          {btn.accent && <>
            <path d={`M236 ${49 + i * 30} v7 m-3 -3 l3 3 3-3`}
              stroke={btn.icon} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Pill x={228} y={58 + i * 30} w={16} h={3} fill={btn.icon} op={0.7} />
          </>}
        </g>
      ))}
      {/* Import arrow at bottom */}
      <rect x={34} y={162} width={232} height={0} fill="none" />
    </svg>
  )
}

// ── TABLE ILLUSTRATIONS ───────────────────────────────────────────────────────

function IlluTableIntro() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Header */}
      <rect width="300" height="38" fill={P.panel} />
      <Pill x={30} y={12} w={80} h={9} fill={P.txt} op={0.85} />
      <Pill x={30} y={26} w={55} fill={P.muted} op={0.4} />
      {/* Tables button */}
      <rect x={214} y={9} width={50} height={22} rx={8} fill={P.ind20} stroke={P.indigo} strokeWidth="1" />
      <Pill x={222} y={18} w={34} h={7} fill={P.indigo} op={0.85} />
      {/* Sidebar */}
      <rect x={0} y={38} width={68} height={130} fill={P.panel} stroke={P.bdr} strokeWidth="0.4" />
      {['Table 1', 'Table 2', 'Table 3'].map((t, i) => (
        <g key={i}>
          <rect x={6} y={46 + i * 28} width={56} height={20} rx={6}
            fill={i === 0 ? P.ind20 : 'transparent'} stroke={i === 0 ? P.indigo : 'transparent'} strokeWidth="0.8" />
          <circle cx={17} cy={56 + i * 28} r={4} fill={i === 0 ? P.indigo : P.bdr2} />
          <Pill x={25} y={53 + i * 28} w={30} h={6} fill={i === 0 ? P.txt : P.muted} op={i === 0 ? 0.8 : 0.5} />
        </g>
      ))}
      {/* Canvas: round table */}
      <RoundTableMini cx={170} cy={110} r={48} seats={8} placed={5} />
      {/* Guest list */}
      <rect x={238} y={38} width={62} height={130} fill={P.panel} />
      {Array.from({ length: 5 }, (_, i) => (
        <GuestRowMini key={i} x={240} y={46 + i * 22} w={58} sub={false} placed={i === 0} />
      ))}
    </svg>
  )
}

function IlluCreateTables() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      <rect x={14} y={6} width={272} height={156} rx={14} fill={P.panel} stroke={P.bdr} strokeWidth="1" />
      <Pill x={28} y={22} w={110} h={9} fill={P.txt} op={0.85} />
      {/* Shape toggle */}
      <rect x={28} y={40} width={118} height={26} rx={8} fill={P.ind20} stroke={P.indigo} strokeWidth="1.2" />
      <Pill x={36} y={49} w={60} h={8} fill={P.indigo} op={0.9} />
      <rect x={154} y={40} width={118} height={26} rx={8} fill={P.bg} stroke={P.bdr} strokeWidth="0.8" />
      <Pill x={162} y={49} w={80} h={8} fill={P.muted} op={0.5} />
      {/* Mini round table */}
      <RoundTableMini cx={76} cy={122} r={32} seats={8} placed={0} />
      {/* Seats count row */}
      <rect x={160} y={96} width={114} height={28} rx={8} fill={P.bg} stroke={P.bdr} strokeWidth="0.8" />
      <Pill x={168} y={106} w={50} h={8} fill={P.muted} op={0.5} />
      <rect x={228} y={100} width={20} height={20} rx={6} fill={P.indigo} opacity="0.8" />
      <Pill x={234} y={107} w={8} h={6} fill="white" op={0.9} />
      {/* Number of tables stepper */}
      <rect x={160} y={132} width={114} height={24} rx={8} fill={P.bg} stroke={P.bdr} strokeWidth="0.8" />
      <Pill x={168} y={141} w={40} h={6} fill={P.muted} op={0.5} />
      <Pill x={220} y={141} w={14} h={6} fill={P.txt} op={0.7} />
      <rect x={240} y={136} width={16} height={16} rx={5} fill={P.indigo} opacity="0.8" />
      <Pill x={244} y={141} w={8} h={6} fill="white" op={0.9} />
    </svg>
  )
}

function IlluSelectTables() {
  const positions = [
    { cx: 84,  cy: 60,  r: 38 },
    { cx: 216, cy: 60,  r: 38 },
    { cx: 84,  cy: 128, r: 38 },
    { cx: 216, cy: 128, r: 38 },
  ]
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {positions.map((t, i) => (
        <RoundTableMini key={i} cx={t.cx} cy={t.cy} r={t.r} seats={6} placed={i < 2 ? 4 : 3} />
      ))}
      {/* Selection highlight on table 1 */}
      <circle cx={84} cy={60} r={41} fill="none" stroke={P.indigo} strokeWidth="1.5" opacity="0.4" strokeDasharray="4,3" />
    </svg>
  )
}

function IlluPlaceGuests() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Table */}
      <RoundTableMini cx={130} cy={90} r={55} seats={8} placed={4} />
      {/* Empty seat highlighted */}
      {(() => {
        const a = (2 * Math.PI * 5 / 8) - Math.PI / 2
        const sx = 130 + 50 * Math.cos(a) - 12, sy = 90 + 50 * Math.sin(a) - 7
        return <rect x={sx} y={sy} width={24} height={14} rx={4}
          fill={P.bg} stroke={P.indigo} strokeWidth="2" strokeDasharray="3,2" />
      })()}
      {/* Guest list */}
      <rect x={218} y={10} width={78} height={150} fill={P.panel} stroke={P.bdr} strokeWidth="0.6" />
      {[P.em, null, P.red, null, P.em].map((ring, i) => (
        <GuestRowMini key={i} x={222} y={18 + i * 28} w={68} placed={i === 0} ring={ring} sub={false} />
      ))}
      {/* Drag arrow from guest 1 to seat */}
      <defs>
        <marker id="tArr" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto">
          <path d="M0,0.5 L6,3.5 L0,6.5 Z" fill={P.indigo} />
        </marker>
      </defs>
      <path d="M220 34 Q180 20 148 65"
        stroke={P.indigo} strokeWidth="2" fill="none"
        strokeDasharray="5,3" strokeLinecap="round"
        markerEnd="url(#tArr)" />
      {/* Ghost pill */}
      <rect x={170} y={10} width={44} height={18} rx={9} fill={P.indigo} opacity="0.85" />
      <Pill x={178} y={16} w={28} h={6} fill="white" op={0.9} />
    </svg>
  )
}

function IlluNavigation() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      {/* Table */}
      <RoundTableMini cx={140} cy={88} r={48} seats={8} placed={6} />
      {/* Pan arrows */}
      {[
        { tx: 140, ty: 28, rot: 0 },
        { tx: 210, ty: 88, rot: 90 },
        { tx: 140, ty: 148, rot: 180 },
        { tx: 70, ty: 88, rot: 270 },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.tx},${p.ty}) rotate(${p.rot})`}>
          <circle r="12" fill={P.panel} stroke={P.bdr} strokeWidth="1" />
          <path d="M0,-5 L4,0 L0,5" stroke={P.muted} strokeWidth="1.5" fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
        </g>
      ))}
      {/* Zoom buttons */}
      <rect x={260} y={55} width={28} height={28} rx={7} fill={P.panel} stroke={P.bdr} strokeWidth="1" />
      <Pill x={267} y={65} w={14} h={5} fill={P.txt} op={0.8} />
      <rect x={268} y={60} width={4} height={14} rx={2} fill={P.txt} opacity="0.8" />
      <rect x={260} y={89} width={28} height={28} rx={7} fill={P.panel} stroke={P.bdr} strokeWidth="1" />
      <Pill x={267} y={99} w={14} h={5} fill={P.txt} op={0.8} />
      {/* Pinch gesture icons */}
      <circle cx={20} cy={148} r={7} fill={P.indigo} opacity="0.6" />
      <circle cx={42} cy={148} r={7} fill={P.indigo} opacity="0.6" />
      <path d="M14,142 L22,148 M48,142 L40,148"
        stroke={P.indigo} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" strokeLinecap="round" />
      <Pill x={11} y={158} w={38} h={5} fill={P.muted} op={0.4} />
      {/* Click center hint */}
      <circle cx={140} cy={88} r={20} fill="none" stroke={P.indigo} strokeWidth="1.5" opacity="0.5" strokeDasharray="4,3" />
    </svg>
  )
}

function IlluEditTable() {
  return (
    <svg viewBox="0 0 300 168" width="100%" height="100%">
      <rect width="300" height="168" fill={P.bg} />
      <RoundTableMini cx={150} cy={88} r={60} seats={8} placed={5} />
      {/* Table center with clearly visible buttons */}
      <circle cx={150} cy={88} r={32} fill="#1c3456" stroke={P.bdr2} strokeWidth="1.2" />
      <Pill x={133} y={78} w={34} h={7} fill={P.muted} op={0.7} />
      <Pill x={138} y={88} w={24} h={5} fill={P.dim} op={0.55} />
      {/* Edit button */}
      <rect x={122} y={98} width={22} height={20} rx={6} fill={P.panel} stroke={P.bdr2} strokeWidth="1" />
      <path d="M128,114 l2,-6 4,4 -2,6 z M130,108 l2,-3 3,3 -2,2 z"
        fill="none" stroke={P.muted} strokeWidth="1.1" strokeLinejoin="round" />
      {/* Delete button */}
      <rect x={150} y={98} width={22} height={20} rx={6} fill={P.panel} stroke={P.bdr2} strokeWidth="1" />
      <path d="M155,104 h12 M158,104 v11 m4,-11 v11 M157,101 v-1 h6 v1"
        stroke={P.red} strokeWidth="1.1" strokeLinecap="round" fill="none" />
      {/* Highlight glow */}
      <circle cx={150} cy={88} r={32} fill="none" stroke={P.indigo} strokeWidth="1" opacity="0.35" />
    </svg>
  )
}

// ── Step data ─────────────────────────────────────────────────────────────────

const LIST_STEPS = [
  {
    title: 'Vos listes d\'invités',
    badge: 'Introduction',
    badgeColor: 'indigo',
    desc: 'GuestPlanner vous permet de gérer des listes d\'invités pour n\'importe quel événement. Chaque liste est indépendante, personnalisable et stockée sur votre appareil.',
    bullets: [
      'Mariage, anniversaire, séminaire… créez autant de listes que nécessaire',
      'Chaque liste a ses propres options, son thème et ses invités',
      'Exportez en JSON ou Excel, importez depuis n\'importe quel appareil',
    ],
    Illu: IlluHomeLists,
  },
  {
    title: 'Créer et personnaliser une liste',
    badge: 'Étape 1',
    badgeColor: 'indigo',
    desc: 'À la création, choisissez les informations que vous souhaitez suivre pour vos invités. Ces options peuvent être modifiées à tout moment depuis les réglages de la liste.',
    bullets: [
      'Participation : oui / non / sans réponse',
      'Genre, catégorie d\'âge, note sur X étoiles',
      'Labels personnalisés (table, menu, hébergement…)',
      'Suivi de l\'envoi des invitations',
    ],
    Illu: IlluCreateList,
  },
  {
    title: 'Ajouter des invités',
    badge: 'Étape 2',
    badgeColor: 'indigo',
    desc: 'Saisissez le prénom et le nom dans la barre en haut, puis cliquez sur "Ajouter". Si des options sont activées, une fenêtre s\'ouvre pour tout renseigner d\'un coup.',
    bullets: [
      'Appuyez sur Entrée pour valider rapidement',
      'Si l\'invité existe déjà, ses informations apparaissent pour modification',
      'La liste est triée alphabétiquement par défaut',
    ],
    Illu: IlluAddGuest,
  },
  {
    title: 'Informations par invité',
    badge: 'Étape 3',
    badgeColor: 'emerald',
    desc: 'Cliquez sur un invité pour modifier ses informations. Des indicateurs visuels permettent de repérer rapidement le statut de chacun dans la liste.',
    bullets: [
      'Cercle vert = participe · cercle rouge = absent',
      'Étoiles colorées pour la note, labels avec leurs couleurs',
      'La liste des tables indique la table assignée à chaque invité',
    ],
    Illu: IlluGuestMeta,
  },
  {
    title: 'Filtrer et trier',
    badge: 'Étape 4',
    badgeColor: 'amber',
    desc: 'Utilisez les filtres pour n\'afficher que les invités correspondant à vos critères. Combinez plusieurs filtres simultanément et triez selon la colonne de votre choix.',
    bullets: [
      'Filtrer par participation, label, âge, note ou invitation',
      'Trier alphabétiquement, par label ou par note',
      'Le nombre d\'invités affichés est indiqué en bas de la liste',
    ],
    Illu: IlluFilters,
  },
  {
    title: 'Actions groupées',
    badge: 'Étape 5',
    badgeColor: 'amber',
    desc: 'Maintenez le doigt appuyé (mobile) ou cliquez sur la case d\'un invité (desktop) pour entrer en mode sélection. Appliquez ensuite une action à tous les invités sélectionnés.',
    bullets: [
      'Appliquer un statut de participation à plusieurs invités d\'un coup',
      'Attribuer un label, une note ou une catégorie d\'âge en masse',
      'Copier des invités vers une autre liste ou les supprimer',
    ],
    Illu: IlluBulkSelect,
  },
  {
    title: 'Exporter et importer',
    badge: 'Étape 6',
    badgeColor: 'emerald',
    desc: 'Sauvegardez votre liste pour la retrouver sur un autre appareil, ou partagez-la avec quelqu\'un. L\'import se fait depuis le bouton ↑ sur l\'écran d\'accueil.',
    bullets: [
      'JSON : réimport complet avec les tables et les placements',
      'Excel (.xlsx) : lisible et modifiable dans tout tableur',
      'Importez un fichier Excel externe sans metadata (tables vidées)',
    ],
    Illu: IlluExportImport,
  },
]

const TABLE_STEPS = [
  {
    title: 'Le plan de table',
    badge: 'Introduction',
    badgeColor: 'indigo',
    desc: 'Depuis la page d\'une liste, le bouton "Tables" en haut vous donne accès au plan de table. Placez visuellement vos invités sur des tables rondes ou rectangulaires.',
    bullets: [
      'La liste des invités à droite montre qui est placé et où',
      'Par défaut, seuls les invités qui participent s\'affichent',
      'Le plan est synchronisé avec la liste d\'invités en temps réel',
    ],
    Illu: IlluTableIntro,
  },
  {
    title: 'Créer des tables',
    badge: 'Étape 1',
    badgeColor: 'indigo',
    desc: 'Cliquez sur "Ajouter des tables" dans la barre latérale. Choisissez la forme, le nombre de places et combien de tables créer. Elles sont nommées automatiquement.',
    bullets: [
      'Tables rondes : idéales pour 6 à 12 personnes',
      'Tables rectangulaires : jusqu\'à 30 places, avec sièges des deux côtés',
      'Modifiable à tout moment (nom, forme, nombre de places)',
    ],
    Illu: IlluCreateTables,
  },
  {
    title: 'Afficher les tables',
    badge: 'Étape 2',
    badgeColor: 'indigo',
    desc: 'Cliquez sur une table dans la liste à gauche pour l\'afficher sur le plan. Sélectionnez-en plusieurs pour les voir simultanément — la disposition s\'adapte automatiquement.',
    bullets: [
      '1 table = centré · 2 = côte à côte · 3 = triangle · 4 = carré',
      'Plus de 4 tables : disposition en grille adaptée à l\'écran',
      'Le zoom se réajuste automatiquement à chaque changement de sélection',
    ],
    Illu: IlluSelectTables,
  },
  {
    title: 'Placer les invités',
    badge: 'Étape 3',
    badgeColor: 'emerald',
    desc: 'Glissez un invité depuis la liste vers une chaise. Cliquez sur une chaise vide pour choisir dans la liste. Sur mobile, faites glisser avec le doigt.',
    bullets: [
      'Glissez entre deux chaises pour échanger ou déplacer',
      'Cliquez sur une chaise occupée : voir les infos, échanger, libérer',
      'Un avertissement apparaît si vous placez un invité absent',
    ],
    Illu: IlluPlaceGuests,
  },
  {
    title: 'Naviguer sur le plan',
    badge: 'Étape 4',
    badgeColor: 'amber',
    desc: 'Déplacez-vous sur le plan en cliquant et faisant glisser le fond. Zoomez avec les boutons +/−, ou avec le pincement à deux doigts sur mobile.',
    bullets: [
      'Cliquez sur le centre d\'une table → zoom automatique sur cette table',
      'Bouton ↔ = revenir à la vue globale (toutes les tables sélectionnées)',
      'Zoom entre 15 % et 400 % du zoom naturel',
    ],
    Illu: IlluNavigation,
  },
  {
    title: 'Modifier et supprimer les tables',
    badge: 'Étape 5',
    badgeColor: 'amber',
    desc: 'Les boutons crayon (modifier) et corbeille (supprimer) sont toujours visibles au centre de chaque table. Passez la souris dessus pour les utiliser.',
    bullets: [
      'Réduire le nombre de places libère les invités en surnombre',
      'Supprimer une table libère automatiquement tous ses invités',
      'La liste latérale affiche le taux de remplissage de chaque table',
    ],
    Illu: IlluEditTable,
  },
]

// ── Badge colors ──────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  indigo: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30',
}

// ── TutorialModal ─────────────────────────────────────────────────────────────

export default function TutorialModal({ initialSection = 'lists', onClose }) {
  const [section, setSection] = useState(initialSection)
  const [step, setStep] = useState(0)

  const steps = section === 'lists' ? LIST_STEPS : TABLE_STEPS
  const current = steps[step]
  const isFirst = step === 0
  const isLast = step === steps.length - 1

  function switchSection(s) {
    setSection(s)
    setStep(0)
  }

  function goNext() {
    if (!isLast) setStep(s => s + 1)
  }
  function goPrev() {
    if (!isFirst) setStep(s => s - 1)
  }

  // keyboard nav
  function handleKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') goNext()
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') goPrev()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-6"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-slate-900 rounded-2xl w-full max-w-xl flex flex-col overflow-hidden shadow-2xl"
        style={{ maxHeight: '92vh' }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700/60 px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Guide d'utilisation</p>
          </div>
          {/* Section tabs */}
          <div className="flex gap-1 bg-slate-900/60 rounded-xl p-1">
            <button
              onClick={() => switchSection('lists')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                section === 'lists'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Liste d'invités
            </button>
            <button
              onClick={() => switchSection('tables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                section === 'tables'
                  ? 'bg-indigo-500 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Plan de table
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Illustration ── */}
        <div className="flex-shrink-0 bg-slate-950 border-b border-slate-700/40"
          style={{ height: 200 }}>
          <current.Illu />
        </div>

        {/* ── Step content ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-0">
          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${BADGE_STYLES[current.badgeColor]}`}>
              {current.badge}
            </span>
            <span className="text-slate-600 text-[11px]">
              {step + 1} / {steps.length}
            </span>
          </div>
          {/* Title */}
          <h2 className="text-white font-bold text-lg leading-tight">{current.title}</h2>
          {/* Description */}
          <p className="text-slate-400 text-sm leading-relaxed">{current.desc}</p>
          {/* Bullets */}
          {current.bullets && (
            <ul className="space-y-2">
              {current.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Footer: dots + nav ── */}
        <div className="flex-shrink-0 bg-slate-800/50 border-t border-slate-700/60 px-4 py-3 flex items-center gap-3">
          {/* Prev */}
          <button
            onClick={goPrev}
            disabled={isFirst}
            className="w-9 h-9 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Progress dots */}
          <div className="flex-1 flex items-center justify-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`rounded-full transition-all ${
                  i === step
                    ? 'w-4 h-2 bg-indigo-400'
                    : 'w-2 h-2 bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>

          {/* Next / Close */}
          {isLast ? (
            <button
              onClick={onClose}
              className="px-4 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-semibold transition-colors flex-shrink-0"
            >
              Terminé
            </button>
          ) : (
            <button
              onClick={goNext}
              className="w-9 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
