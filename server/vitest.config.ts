import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: {
      NODE_ENV: 'test',
      GEMINI_API_KEY: 'test-key',
      LOG_LEVEL: 'error',
      TELEMETRY_SIM_ENABLED: 'false',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // index.ts is the process bootstrap; *.types.ts files hold only type
      // declarations (no executable code to cover).
      exclude: ['src/index.ts', 'src/**/types.ts', 'src/lib/firestore-fake.ts', 'src/lib/firestore.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
    },
  },
});
