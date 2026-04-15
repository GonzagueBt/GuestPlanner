import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/GuestPlanner/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GuestPlanner',
        short_name: 'GuestPlanner',
        description: "Gérez vos listes d'invités facilement",
        theme_color: '#6366f1',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/GuestPlanner/',
        icons: [
          {
            src: '/GuestPlanner/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/GuestPlanner/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  server: {
    port: 3000
  }
})
