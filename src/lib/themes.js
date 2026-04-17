export const THEMES = {
  // ── Sombres ──────────────────────────────────────────────
  default: {
    id: 'default',
    name: 'Minuit',
    pageBg: '#0f172a',
    headerBg: '#1e293b',
    topBorder: null,
  },
  ocean: {
    id: 'ocean',
    name: 'Océan',
    pageBg: '#030d1a',
    headerBg: '#061a30',
    topBorder: '#22d3ee',
  },
  foret: {
    id: 'foret',
    name: 'Forêt',
    pageBg: '#041510',
    headerBg: '#081f15',
    topBorder: '#34d399',
  },
  aurore: {
    id: 'aurore',
    name: 'Aurore',
    pageBg: '#0d0820',
    headerBg: '#160d38',
    topBorder: '#c084fc',
  },
  braise: {
    id: 'braise',
    name: 'Braise',
    pageBg: '#180805',
    headerBg: '#2a1008',
    topBorder: '#fb923c',
  },
  champagne: {
    id: 'champagne',
    name: 'Champagne',
    pageBg: '#130e06',
    headerBg: '#201808',
    topBorder: '#fbbf24',
  },

  // ── Mariage ───────────────────────────────────────────────
  mariage_ivoire: {
    id: 'mariage_ivoire',
    name: 'Ivoire',
    pageBg: '#f2ece0',
    headerBg: '#2a2010',
    subBarBg: '#e2d8c8',
    topBorder: '#c9a84c',
  },
  mariage_rose: {
    id: 'mariage_rose',
    name: 'Rose poudré',
    pageBg: '#fdf0f0',
    headerBg: '#2a1520',
    subBarBg: '#f0dede',
    topBorder: '#f9a8c9',
  },
  mariage_ardoise: {
    id: 'mariage_ardoise',
    name: 'Ardoise & Or',
    pageBg: '#1c1e2a',
    headerBg: '#252838',
    topBorder: '#d4af70',
  },

  // ── Anniversaire ──────────────────────────────────────────
  anniv_confetti: {
    id: 'anniv_confetti',
    name: 'Confetti',
    pageBg: '#0e0818',
    headerBg: '#1a0e2e',
    topBorder: '#f43f5e',
  },
  anniv_pastel: {
    id: 'anniv_pastel',
    name: 'Pastel',
    pageBg: '#f3eeff',
    headerBg: '#1a1030',
    subBarBg: '#e8e0f5',
    topBorder: '#c084fc',
  },
  anniv_soleil: {
    id: 'anniv_soleil',
    name: 'Soleil',
    pageBg: '#fffbee',
    headerBg: '#1e1408',
    subBarBg: '#f0e8cc',
    topBorder: '#fbbf24',
  },

  // ── Chic ──────────────────────────────────────────────────
  chic_noir_or: {
    id: 'chic_noir_or',
    name: 'Noir & Or',
    pageBg: '#080808',
    headerBg: '#101010',
    topBorder: '#d4a853',
  },
  chic_marbre: {
    id: 'chic_marbre',
    name: 'Marbre',
    pageBg: '#f0eeec',
    headerBg: '#1c1c1c',
    subBarBg: '#e5e2de',
    topBorder: '#94a3b8',
  },
  chic_velours: {
    id: 'chic_velours',
    name: 'Velours',
    pageBg: '#150d1e',
    headerBg: '#1f1228',
    topBorder: '#e879f9',
  },
}

export const THEME_GROUPS = [
  { label: 'Sombres', ids: ['default', 'ocean', 'foret', 'aurore', 'braise', 'champagne'] },
  { label: 'Mariage', ids: ['mariage_ivoire', 'mariage_rose', 'mariage_ardoise'] },
  { label: 'Anniversaire', ids: ['anniv_confetti', 'anniv_pastel', 'anniv_soleil'] },
  { label: 'Chic', ids: ['chic_noir_or', 'chic_marbre', 'chic_velours'] },
]

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.default
}
