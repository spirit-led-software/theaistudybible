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
  },
  vite: {
    envDir: workspaceRoot,
    envPrefix: 'PUBLIC_',
    plugins: [tsconfigPaths(), VitePWA(), devtools()],
    server: {
      fs: {
        allow: [workspaceRoot],
      },
    },
  },
});
