import { defineConfig } from '@solidjs/start/config';
import devtools from 'solid-devtools/vite';
import { searchForWorkspaceRoot } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming',
    compatibilityDate: '2024-06-13'
  },
  vite: {
    plugins: [
      tsconfigPaths(),
      cjsInterop({
        dependencies: ['@clerk/clerk-js']
      }),
      VitePWA(),
      devtools({
        autoname: true
      })
    ],
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())]
      }
    }
  }
});
