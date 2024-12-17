import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import solidDevTools from 'solid-devtools/vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'bun',
    serveStatic: false,
    plugins: ['./src/server/plugins/compression.ts'],
    compatibilityDate: '2024-12-02',
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      solidDevTools({ autoname: true }),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        manifest: {
          name: 'The AI Study Bible',
          short_name: 'The AI Study Bible',
          description:
            'The AI Study Bible is a digital study Bible that uses artificial intelligence to help you study the Bible.',
          theme_color: '#030527',
          scope: '/',
          icons: [
            {
              src: '/pwa/64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: '/pwa/192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa/512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          start_url: '/',
        },
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
        injectManifest: {
          globPatterns: [
            '**/*.{js,css,html,png,svg,ico,wasm,webp,woff,woff2,ttf,eot,json,jpg,jpeg,gif,mp3,mp4,wav,avif}',
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
      }),
    ],
    optimizeDeps: {
      include: ['solid-markdown > debug', 'solid-marked > extend'],
    },
  },
});
