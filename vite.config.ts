/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { VitePWA } from 'vite-plugin-pwa';

// Build stamp (commit + UTC time) — shown in the footer so anyone can confirm what is live.
const sha = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local').slice(0, 7);
const BUILD_STAMP = `${sha} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installable, offline-capable app: the shell, data and map boundaries are precached; basemap tiles
    // and fonts are cached as they are used. Supabase calls always go to the network.
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
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2,json}'],
        globIgnores: ['**/model.xlsx'],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/assets\//, /\.[a-z0-9]+$/i],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith('basemaps.cartocdn.com'),
            handler: 'CacheFirst',
            options: { cacheName: 'basemap-tiles', expiration: { maxEntries: 800, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: ({ url }) => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
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
    include: ['recharts', 'leaflet', 'react-leaflet', 'motion/react', 'radix-ui', 'cmdk', 'sonner', '@supabase/supabase-js', '@tanstack/react-query', 'i18next', 'react-i18next', 'lucide-react', 'zustand', 'zustand/middleware'],
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
    // Tests always run in local demo mode — never against a real Supabase project from .env.local.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '', VITE_SUPABASE_ANON_KEY: '' },
    // Component tests opt into the DOM with a `// @vitest-environment jsdom` file header.
    setupFiles: ['src/test/setup.ts'],
  },
});
