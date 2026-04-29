/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1e293b',
          raised: '#334155',
          overlay: '#475569',
        },
        'slate-750': '#283548',
      },
      animation: {
        'slide-up':  'slide-up 0.22s ease-out',
        'scale-in':  'scale-in 0.18s ease-out',
        'fade-in':   'fade-in  0.15s ease-out',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        'scale-in': {
          from: { transform: 'scale(0.97)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    }
  },
  plugins: []
}
