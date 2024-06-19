import { defineConfig } from '@solidjs/start/config';
import devtools from 'solid-devtools/vite';
import { searchForWorkspaceRoot } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

const workspaceRoot = searchForWorkspaceRoot(process.cwd());

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'bun'
  },
  vite: {
    envDir: workspaceRoot,
    plugins: [
      tsconfigPaths(),
      cjsInterop({
        dependencies: ['@clerk/clerk-js']
      }),
      VitePWA(),
      devtools()
    ],
    server: {
      fs: {
        allow: [workspaceRoot]
      }
    }
  }
});
