import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    include: ['**/*.spec.tsx', '**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/**/*.tsx',
        'src/lib/**/*.ts',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/test/**',
      ],
    },
    clearMocks: true,
    mockReset: true,
  },
});