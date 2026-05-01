import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    transform: {
      '^.+\\.ts$': ['ts-jest', {
        tsconfig: 'tsconfig.json',
      }],
    },
    testMatch: ['**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/modules/**/*.ts',
        '!src/**/*.d.ts',
      ],
      exclude: [
        '**/*.module.ts',
        '**/*.trpc.ts',
        '**/dto/**',
        '**/__tests__/**',
      ],
    },
    setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
    clearMocks: true,
    mockReset: true,
  },
});