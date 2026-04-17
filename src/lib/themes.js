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
  mariage_bouquet: {
    id: 'mariage_bouquet',
    name: 'Bouquet',
    pageBg: '#fde8f0',
    headerBg: '#3d0a22',
    subBarBg: '#f8d0e2',
    topBorder: '#fb7185',
  },
  mariage_emeraude: {
    id: 'mariage_emeraude',
    name: 'Émeraude',
    pageBg: '#eaf7f0',
    headerBg: '#012b15',
    subBarBg: '#d4ede0',
    topBorder: '#10b981',
  },
  mariage_saphir: {
    id: 'mariage_saphir',
    name: 'Saphir',
    pageBg: '#eef2ff',
    headerBg: '#03082e',
    subBarBg: '#dde4f8',
    topBorder: '#818cf8',
  },

  // ── Anniversaire ──────────────────────────────────────────
  anniv_neon: {
    id: 'anniv_neon',
    name: 'Néon',
    pageBg: '#06000f',
    headerBg: '#130030',
    topBorder: '#facc15',
  },
  anniv_tropical: {
    id: 'anniv_tropical',
    name: 'Tropical',
    pageBg: '#f0fdf6',
    headerBg: '#032010',
    subBarBg: '#d8f5e8',
    topBorder: '#f97316',
  },
  anniv_bonbons: {
    id: 'anniv_bonbons',
    name: 'Bonbons',
    pageBg: '#fff4fb',
    headerBg: '#28003a',
    subBarBg: '#f5ddf0',
    topBorder: '#e879f9',
  },

  // ── Chic ──────────────────────────────────────────────────
  chic_opera: {
    id: 'chic_opera',
    name: 'Opéra',
    pageBg: '#0a0008',
    headerBg: '#200010',
    topBorder: '#f43f5e',
  },
  chic_artdeco: {
    id: 'chic_artdeco',
    name: 'Art Déco',
    pageBg: '#f7f2e0',
    headerBg: '#1a1500',
    subBarBg: '#ede6c8',
    topBorder: '#f59e0b',
  },
  chic_sepia: {
    id: 'chic_sepia',
    name: 'Sépia',
    pageBg: '#f5ede0',
    headerBg: '#1c0e04',
    subBarBg: '#ead8c4',
    topBorder: '#b45309',
  },
}

export const THEME_GROUPS = [
  { label: 'Sombres', ids: ['default', 'ocean', 'foret', 'aurore', 'braise', 'champagne'] },
  { label: 'Mariage', ids: ['mariage_bouquet', 'mariage_emeraude', 'mariage_saphir'] },
  { label: 'Anniversaire', ids: ['anniv_neon', 'anniv_tropical', 'anniv_bonbons'] },
  { label: 'Chic', ids: ['chic_opera', 'chic_artdeco', 'chic_sepia'] },
]

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.default
}
