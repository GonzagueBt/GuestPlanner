export const THEMES = {
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
}

export function getTheme(themeId) {
  return THEMES[themeId] || THEMES.default
}
