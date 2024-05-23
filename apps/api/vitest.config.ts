import tsconfigpaths from 'vite-tsconfig-paths';
import { defineProject } from 'vitest/config';

export default defineProject({
  plugins: [tsconfigpaths()],
  test: {
    environment: 'node',
    include: ['./src/**/*.test.ts']
  }
});
