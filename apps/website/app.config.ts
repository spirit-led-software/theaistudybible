import { defineConfig } from '@solidjs/start/config';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming'
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
        allow: ['./tailwind.config.ts']
      }
    }
  }
});
