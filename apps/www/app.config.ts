import { sentrySolidStartVite } from '@sentry/solidstart';
import { defineConfig } from '@solidjs/start/config';
import { Resource } from 'sst';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming',
    compatibilityDate: '2024-09-18',
  },
  vite: () => ({
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      VitePWA({
        includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'The AI Study Bible',
          short_name: 'ASB',
          description:
            'The AI Study Bible is a digital study Bible that uses artificial intelligence to help you study the Bible.',
          theme_color: '#030527',
          icons: [
            {
              src: 'pwa/64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa/192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa/512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
          start_url: '/',
        },
      }),
      sentrySolidStartVite({
        org: Resource.SentryOrg.value,
        project: Resource.SentryProject.value,
        authToken: Resource.SentryAuthToken.value,
      }),
    ],
    ssr: {
      external: ['@node-rs/argon2'],
    },
  }),
});
