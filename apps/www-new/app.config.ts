// @ts-ignore
import solid from 'vite-plugin-solid';

import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import { defineConfig } from '@tanstack/start/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  vite: {
    plugins: [
      tsConfigPaths(),
      TanStackRouterVite({ target: 'solid', autoCodeSplitting: true }),
      solid({ ssr: true }),
    ],
    build: { target: 'esnext' },
  },
});
