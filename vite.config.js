import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const BUILD_STAMP = `${(process.env.VERCEL_GIT_COMMIT_SHA || 'local').slice(0, 7)} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.xlsx'],
  base: '/',  // Custom domain: inform.co.tz
  define: { __BUILD__: JSON.stringify(BUILD_STAMP) },

  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        dir: 'dist',
        // Everything hashed under /assets/ so each deploy is uniquely named and is covered by
        // vercel.json's `assets` rewrite-exclusion + immutable cache. An unhashed root main.js
        // was the recurring "deploy not visible" cause: browsers/edges served the cached entry.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
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
