import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@terrarium/engine': fileURLToPath(new URL('./packages/engine/src/index.ts', import.meta.url)),
      '@terrarium/observation': fileURLToPath(new URL('./packages/observation/src/index.ts', import.meta.url)),
      '@terrarium/fixtures': fileURLToPath(new URL('./packages/fixtures/index.ts', import.meta.url)),
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 60_000,
    coverage: {
      provider: 'v8',
      // measure the pure, deterministic core — the engine and its projection.
      // the UI is verified in the browser (see the run/verify skills), not here.
      include: ['packages/engine/src/**', 'packages/observation/src/**'],
      // barrels and pure type modules have nothing executable to cover
      exclude: ['**/index.ts', '**/state/schema.ts', '**/actions/types.ts'],
      reporter: ['text', 'html'],
      // a floor, not a target — keeps the core from silently losing coverage.
      // raise these as coverage improves; never lower to make a red build green.
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
