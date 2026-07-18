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
  },
})
