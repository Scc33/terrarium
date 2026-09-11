import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const NO_CLOCK = 'The sim must be pure — no wall-clock reads. `new Date(value)` is arithmetic and is fine.'

// Determinism (§1.1, §6). Hoisted because the engine block extends this list,
// and flat config REPLACES a rule's options rather than merging them — an
// engine-only `no-restricted-properties` that did not restate these would
// silently un-ban them in the package that most needs them banned.
const DETERMINISM_PROPERTIES = [
  {
    object: 'Math',
    property: 'random',
    message: 'Use the seeded RNG (packages/engine/src/rng) — Math.random breaks replay determinism.',
  },
  {
    object: 'Date',
    property: 'now',
    message: NO_CLOCK,
  },
]

export default defineConfig([
  globalIgnores(['**/dist', '**/node_modules', '**/coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // `x == null` stays legal: the null/undefined/0 distinction is
      // load-bearing (ui/src/finance.ts returns null, never 0, when unfunded).
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      // type-only imports stay marked as such (reinforces verbatimModuleSyntax)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Determinism: all randomness must come from the seeded RNG (§6).
      'no-restricted-properties': ['error', ...DETERMINISM_PROPERTIES],
    },
  },
  {
    // engine is pure: no DOM, no React, no other packages, no I/O (§1.1)
    files: ['packages/engine/**/*.ts'],
    rules: {
      // a pure deterministic core has nothing to say to the console
      'no-console': 'error',
      // Engine-scoped: reading a clock is legitimate elsewhere — runner,
      // worker/trial.ts and every tools/measure-*.ts time themselves.
      'no-restricted-properties': ['error', ...DETERMINISM_PROPERTIES],
      // The whole global, not `now` and `timeOrigin` and the next one: every
      // member of it is clock-derived and the engine has no use for any.
      'no-restricted-globals': ['error', { name: 'performance', message: NO_CLOCK }],
      // The constructor forms no-restricted-properties cannot see. `Date()`
      // called as a function ignores its arguments and returns the current
      // time, so every call is the clock; only `new Date(value)` is arithmetic.
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: NO_CLOCK },
        { selector: "CallExpression[callee.name='Date']", message: NO_CLOCK },
      ],
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
    // Every behavioral constant lives in constants.ts, tune there, nowhere
    // else (ADR-0007, #179). This does not flag a literal assigned to a
    // named `const` — that IS the fix — only one used bare inside an
    // expression. `ignore` covers structural uses ADR-0007 itself carves
    // out: array indices, unit identities, and the odd sign flip.
    files: ['packages/engine/src/**/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          // structural: identities, divide-by-zero epsilons, and the
          // calendar/rate unit conversions ADR-0007 names outright (quarters
          // per year, per-cent, per-mille)
          ignore: [0, 1, -1, 2, 1e-12, 1e-9, 1e-6, 4, 100, 400, 1000, 4000],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },
  {
    // Declarative catalogues, not tuning surfaces: each entry is authored
    // once, commented in place, and read exactly once. Naming every entry
    // into constants.ts would force a reader back and forth between two
    // files to understand one line, which is the opposite of ADR-0007's
    // point — it exists so a REUSED coefficient is findable, not so a
    // one-off catalog row is renamed.
    files: [
      'packages/engine/src/constants.ts',
      'packages/engine/src/countries.ts',
      'packages/engine/src/countryDocument.ts',
      'packages/engine/src/hash.ts',
      'packages/engine/src/interregnum.ts',
      'packages/engine/src/pipeline/indicatorSpecs.ts',
      'packages/engine/src/events/catalogue.ts',
      'packages/engine/src/events/conditions.ts',
      'packages/engine/src/events/eras.ts',
      // xmur3/mulberry32: named, standard bit-mixing constants for a specific
      // published PRNG algorithm, not a tunable behavior of the simulation.
      'packages/engine/src/rng/rng.ts',
      // canonical schema contracts and id lists, not tuning knobs — a band
      // index tuple like WORKING_BANDS is already the named constant; its
      // own array elements are not a second thing to name.
      'packages/engine/src/state/schema.ts',
    ],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
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
