import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['**/dist', '**/node_modules', '**/coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // type-only imports stay marked as such (reinforces verbatimModuleSyntax)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
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
    // engine is pure: no DOM, no React, no other packages, no I/O (§1.1)
    files: ['packages/engine/**/*.ts'],
    rules: {
      // a pure deterministic core has nothing to say to the console
      'no-console': 'error',
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
          paths: [
            {
              // components may import constants and action/save TYPES from the
              // engine, but never the functions that build or advance TrueState
              // — only the sim worker runs the engine (§1.1)
              name: '@terrarium/engine',
              importNames: ['init', 'step', 'replay', 'applyActions', 'runTick', 'runInterregnum'],
              message:
                'Only packages/ui/src/worker may run the engine; components see PublishedState via @terrarium/observation.',
            },
          ],
        },
      ],
    },
  },
  {
    // the sim worker is the one place in the UI that may run the engine — it
    // holds TrueState privately and posts only PublishedState across the wire
    files: ['packages/ui/src/worker/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@terrarium/engine/src/state/*', '**/engine/src/state/*'],
              message: 'even the worker uses the public engine API, not its state internals.',
            },
          ],
        },
      ],
    },
  },
])
