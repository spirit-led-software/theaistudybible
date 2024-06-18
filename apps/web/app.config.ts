import { defineConfig } from '@solidjs/start/config';
import devtools from 'solid-devtools/vite';
import { searchForWorkspaceRoot } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming',
    compatibilityDate: '2024-06-13'
  },
  vite: {
    plugins: [tsconfigPaths(), VitePWA(), devtools()],
    ssr: {
      noExternal: ['@clerk/clerk-js']
    },
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())]
      }
    }
  }
});
