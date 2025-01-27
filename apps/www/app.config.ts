import { createId } from '@paralleldrive/cuid2';
import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import tailwindcss from '@tailwindcss/vite';
import solidDevTools from 'solid-devtools/vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const defaultCacheControlHeaders = {
  'cache-control': 'public,max-age=0,s-maxage=86400,stale-while-revalidate=86400,immutable',
  vary: 'Accept-Encoding',
};

const staticCacheControlHeaders = {
  ...defaultCacheControlHeaders,
  'cache-control': 'public,max-age=31536000,immutable',
};

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'bun',
    plugins: ['./src/server/plugins/compression.ts'],
    compatibilityDate: '2024-12-02',
    routeRules: {
      '/_build/assets/**': { headers: defaultCacheControlHeaders },
      '/_build/manifest.webmanifest': { headers: defaultCacheControlHeaders },
      '/_build/service-worker.js*': { headers: defaultCacheControlHeaders },
      '/_server/assets/**': { headers: defaultCacheControlHeaders },
      '/assets/**': { headers: defaultCacheControlHeaders },
      '/logos/**': { headers: staticCacheControlHeaders },
      '/pwa/**': { headers: staticCacheControlHeaders },
      '/apple-touch-icon-180x180.png': { headers: staticCacheControlHeaders },
      '/favicon.ico': { headers: staticCacheControlHeaders },
      '/icon.png': { headers: staticCacheControlHeaders },
      '/maskable-icon-512x512.png': { headers: staticCacheControlHeaders },
      '/robots.txt': { headers: staticCacheControlHeaders },
    },
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      solidDevTools({ autoname: true }),
      VitePWA({
        strategies: 'injectManifest',
        registerType: 'autoUpdate',
        srcDir: 'src',
        filename: 'service-worker.ts',
        manifest: {
          name: 'The AI Study Bible',
          short_name: 'TASB',
          description:
            'Study the Bible with AI-powered insights, verse explanations, and personalized devotionals. Access multiple translations, create highlights, notes, and bookmarks.',
          scope: '/',
          start_url: '/',
          theme_color: '#030527',
          icons: [
            { src: '/pwa/64x64.png', sizes: '64x64', type: 'image/png' },
            { src: '/pwa/192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa/512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            { name: 'Read the Bible', url: '/bible', short_name: 'Read' },
            { name: 'Chat with AI', url: '/chat', short_name: 'Chat' },
            { name: 'View Devotions', url: '/devotion', short_name: 'Devotions' },
          ],
        },
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
        injectManifest: {
          globPatterns: [
            '**/*.{js,css,html,png,svg,ico,wasm,webp,woff,woff2,ttf,eot,json,jpg,jpeg,gif,mp3,mp4,wav,avif}',
          ],
          manifestTransforms: [
            (manifest) => {
              manifest.push({ url: '/', revision: createId(), size: 0 });
              return { manifest, warnings: [] };
            },
          ],
        },
        devOptions: {
          enabled: true,
          suppressWarnings: true,
          navigateFallback: '/',
          navigateFallbackAllowlist: [/^\/$/],
          type: 'module',
        },
      }),
      sentrySolidStartVite({
        org: process.env.PUBLIC_SENTRY_ORG,
        project: process.env.PUBLIC_SENTRY_PROJECT_NAME,
        authToken: process.env.SENTRY_AUTH_TOKEN,
        bundleSizeOptimizations: {
          excludeDebugStatements: true,
          // TODO: Remove these if we want replay
          excludeReplayIframe: true,
          excludeReplayShadowDom: true,
          excludeReplayWorker: true,
        },
        sourceMapsUploadOptions: { filesToDeleteAfterUpload: ['**/*.map'] },
      }),
    ],
    optimizeDeps: { include: ['solid-markdown > debug', 'solid-marked > extend'] },
  },
});
