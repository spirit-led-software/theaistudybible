import { defineConfig } from '@solidjs/start/config';
import devtools from 'solid-devtools/vite';
import { searchForWorkspaceRoot } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const workspaceRoot = searchForWorkspaceRoot(process.cwd());

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming',
    compatibilityDate: '2024-09-06',
  },
  vite: {
    envDir: workspaceRoot,
    envPrefix: 'PUBLIC_',
    plugins: [
      tsconfigPaths(),
      VitePWA({
        manifest: {
          icons: [
            {
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
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
        },
      }),
      devtools({
        autoname: true,
      }),
    ],
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
  },
});
