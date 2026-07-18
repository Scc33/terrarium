import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['**/dist', '**/node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      // Determinism: all randomness must come from the seeded RNG (§6).
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Use the seeded RNG (packages/engine/src/rng) — Math.random breaks replay determinism.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'The sim must be pure — no wall-clock reads.',
        },
      ],
    },
  },
  {
    // engine is pure: no DOM, no React, no other packages (§1.1)
    files: ['packages/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react-dom', 'react/*'], message: 'engine must stay free of React.' },
            { group: ['@terrarium/*'], message: 'engine depends on nothing.' },
          ],
        },
      ],
    },
  },
  {
    // ui may only see PublishedState — never true state internals (§1.1)
    files: ['packages/ui/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@terrarium/engine/src/state/*', '**/engine/src/state/*'],
              message: 'ui must not import true-state types; use @terrarium/observation.',
            },
          ],
        },
      ],
    },
  },
])
