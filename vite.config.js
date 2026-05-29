import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.xlsx'],
  base: '/',  // Custom domain: inform.co.tz

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        warning: path.resolve(__dirname, 'warning-app.html')
      },
      output: {
        dir: 'dist',
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js'
      }
    }
  },

  // Proxy API requests to Go backend and external data sources during development
  server: {
    port: 5174,
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false
      },
      // External data source proxies (bypass CORS)
      '/proxy/tcvmp': {
        target: 'https://tcvmp.pmo.go.tz',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/tcvmp/, '')
      },
      '/proxy/rcmrd': {
        target: 'https://geoportal.rcmrd.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/rcmrd/, '')
      },
      '/proxy/osm': {
        target: 'https://overpass-api.de',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/osm/, '')
      },
      '/proxy/worldbank': {
        target: 'https://api.worldbank.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/proxy\/worldbank/, '')
      }
    }
  }
})
