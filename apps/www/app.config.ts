// @ts-expect-error - vinxi plugin doesn't have types
import pkg from '@vinxi/plugin-mdx';

import { defineConfig } from '@solidjs/start/config';
import devtools from 'solid-devtools/vite';
import { VitePWA } from 'vite-plugin-pwa';
import tsconfigPaths from 'vite-tsconfig-paths';

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const { default: mdx } = pkg;

export default defineConfig({
  extensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  middleware: './src/middleware.ts',
  server: {
    preset: 'aws-lambda-streaming',
    compatibilityDate: '2024-09-06',
  },
  vite: {
    envPrefix: 'PUBLIC_',
    plugins: [
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      mdx.withImports({})({
        jsx: true,
        jsxImportSource: 'solid-js',
        providerImportSource: 'solid-mdx',
      }),
      tsconfigPaths(),
      VitePWA(),
      devtools({
        autoname: true,
      }),
    ],
  },
});
