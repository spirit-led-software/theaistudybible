import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'bun',
    plugins: ['./sentry.plugin.ts'],
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      VitePWA({
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
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
      }),
      sentrySolidStartVite({
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        authToken: process.env.SENTRY_AUTH_TOKEN,
      }),
    ],
  },
});
