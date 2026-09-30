/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

// Build stamp (commit + UTC time) - shown in the footer so anyone can confirm what is live.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local').slice(0, 7);
const BUILD_STAMP = `${sha} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable, offline-capable app: the shell code is precached, pages are network-first, and page
    // code, data and fonts are cached as they are used. Supabase calls always go to the network.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'INFORM Tanzania',
        short_name: 'INFORM TZ',
        description: 'Sub-national disaster risk and crisis severity for every council in Tanzania.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#070c17',
        theme_color: '#1d6deb',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache only the app shell code (≈ 0.3 MB): a first visit on mobile data must not silently
        // download the whole site. Page code, map geometry and translations are cached as they are used,
        // so every page a visitor has opened keeps working offline.
        globPatterns: ['assets/index-*.{js,css}', 'assets/vendor-react-*.js', 'assets/*latin-wght-normal*.woff2', '*.{svg,ico}'],
        // Pages (HTML) are network-first and never served from a precached copy: online visitors always get
        // the current deploy (and a rollback takes effect at once); the cached copy is only for offline use.
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.mode === 'navigate' && !/\.[a-z0-9]+$/i.test(url.pathname),
            handler: 'NetworkFirst',
            options: { cacheName: 'pages', networkTimeoutSeconds: 4, expiration: { maxEntries: 30 } },
          },
          {
            // Hashed build assets never change: cache-first, bounded.
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: { cacheName: 'assets', expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
          {
            urlPattern: ({ url }) => url.hostname.endsWith('basemaps.cartocdn.com'),
            handler: 'CacheFirst',
            options: { cacheName: 'basemap-tiles', expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
        ],
      },
    }),
  ],
  base: '/',
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  define: { __BUILD__: JSON.stringify(BUILD_STAMP) },
  server: { port: 5174 },
  // Pre-bundle the heavy, lazily-imported dependencies up front so the dev server never re-optimises
  // (and stalls) mid-session when a route first imports them.
  optimizeDeps: {
    include: ['recharts', 'leaflet', 'react-leaflet', 'radix-ui', 'cmdk', 'sonner', '@supabase/supabase-js', '@tanstack/react-query', 'i18next', 'react-i18next', 'lucide-react', 'zustand', 'zustand/middleware'],
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Hashed file names under /assets/ so every deploy is uniquely addressable and cacheable.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          // Tiny helpers shared by the shell and the heavy lazy libraries. Left unassigned, Rollup puts them
          // in the first manual chunk that uses them, and the entry would then preload all of recharts and
          // supabase-js just to get clsx or tslib.
          if (/node_modules[\\/](clsx|tslib|use-sync-external-store|react-is|scheduler)[\\/]/.test(id)) return 'vendor-react';
          if (/node_modules[\\/]\.pnpm[\\/](clsx|tslib|use-sync-external-store|react-is|scheduler)@/.test(id)) return 'vendor-react';
          if (id.includes('leaflet')) return 'vendor-map';
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'vendor-charts';
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('react-dom') || id.includes('react-router') || /node_modules[\\/]react[\\/]/.test(id)) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
    // Full-page render tests (jsdom + the whole model) need more than the 5 s default on CI runners.
    testTimeout: 30_000,
    // Tests always run in local demo mode - never against a real Supabase project from .env.local.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
    // Component tests opt into the DOM with a `// @vitest-environment jsdom` file header.
    setupFiles: ['src/test/setup.ts'],
  },
});
