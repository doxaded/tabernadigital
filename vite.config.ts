import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'assets/*.jpg'],
      manifest: {
        name: 'Taberna Digital - RPG Companion',
        short_name: 'TabernaRPG',
        description: 'Companheiro mecânico e narrativo imersivo para RPG de mesa em ambientação de taverna medieval.',
        theme_color: '#160e08',
        background_color: '#160e08',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
