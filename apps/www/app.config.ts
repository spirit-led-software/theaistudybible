import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createId } from '@paralleldrive/cuid2';
import { wrapVinxiConfigWithSentry } from '@sentry/tanstackstart-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from '@tanstack/react-start/config';
import { analyzer } from 'vite-bundle-analyzer';
import { VitePWA } from 'vite-plugin-pwa';
import wasm from 'vite-plugin-wasm';
import tsconfigPaths from 'vite-tsconfig-paths';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultCacheControlHeaders = {
  'cache-control': 'public,max-age=0,s-maxage=86400,stale-while-revalidate=86400,immutable',
  vary: 'Accept-Encoding',
};

const staticCacheControlHeaders = {
  ...defaultCacheControlHeaders,
  'cache-control': 'public,max-age=31536000,s-maxage=31536000,immutable',
};

const doNotCacheHeaders = {
  'cache-control': 'public,max-age=0,s-maxage=0,must-revalidate',
};

const config = defineConfig({
  react: { babel: { plugins: ['babel-plugin-react-compiler'] } },
  server: {
    preset: 'node-server',
    compatibilityDate: '2025-03-06',
    experimental: { wasm: true },
    routeRules: {
      '/_build/assets/**': { headers: staticCacheControlHeaders },
      '/_build/manifest.webmanifest': {
        headers: { ...doNotCacheHeaders, 'content-type': 'application/manifest+json' },
      },
      '/_build/service-worker.js*': { headers: doNotCacheHeaders },
      '/_server/assets/**': { headers: defaultCacheControlHeaders },
      '/assets/**': { headers: staticCacheControlHeaders },
      '/logos/**': { headers: defaultCacheControlHeaders },
      '/pwa/**': { headers: defaultCacheControlHeaders },
      '/apple-touch-icon-180x180.png': { headers: defaultCacheControlHeaders },
      '/favicon.ico': { headers: defaultCacheControlHeaders },
      '/icon.png': { headers: defaultCacheControlHeaders },
      '/maskable-icon-512x512.png': { headers: defaultCacheControlHeaders },
      '/robots.txt': { headers: doNotCacheHeaders },
    },
    alias: {
      '@/www': path.resolve(__dirname, './app'),
      '@/schemas': path.resolve(__dirname, '../../packages/schemas/src'),
      '@/core': path.resolve(__dirname, '../../packages/core/src'),
      '@/ai': path.resolve(__dirname, '../../packages/ai/src'),
      '@/email': path.resolve(__dirname, '../../packages/email/src'),
      '@/functions': path.resolve(__dirname, '../functions/src'),
      '@/workers': path.resolve(__dirname, '../workers/src'),
      '@/scripts': path.resolve(__dirname, '../../tools/scripts/src'),
    },
    esbuild: { options: { target: 'esnext' } },
    $production: {
      plugins: ['./app/server/plugins/compression.ts', './app/server/plugins/posthog.ts'],
    },
  },
  vite: {
    build: { target: 'esnext' },
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      tailwindcss(),
      wasm(),
      VitePWA({
        strategies: 'injectManifest',
        registerType: 'autoUpdate',
        srcDir: 'app',
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
      process.env.ANALYZE === 'true' && analyzer(),
    ],
    ssr: { external: ['posthog-js', '@stripe/stripe-js'] },
  },
});

export default wrapVinxiConfigWithSentry(config, {
  org: process.env.PUBLIC_SENTRY_ORG,
  project: process.env.PUBLIC_SENTRY_PROJECT_NAME,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
});
