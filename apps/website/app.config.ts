import { defineConfig } from '@solidjs/start/config';
import { searchForWorkspaceRoot } from 'vite';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda'
  },
  vite: {
    plugins: [
      tsconfigPaths(),
      cjsInterop({
        dependencies: ['@clerk/clerk-js']
      })
    ],
    server: {
      fs: {
        allow: [searchForWorkspaceRoot(process.cwd())]
      }
    }
  }
});
