import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Every extension TypeScript compiles. A matcher spelled `*.ts` skips an
// `.mts` beside it, and a file no block matches is not linted at all — so
// the engine gate below would simply not run on one.
const TS = '**/*.{ts,tsx,mts,cts}'

const NO_IO = 'engine depends on nothing and reads no environment (§1.1) — relative imports only.'

const ENGINE_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'packages/engine/src')

// "Depends on nothing" enforced literally: an import is legal iff it is a
// relative specifier AND resolves inside packages/engine/src. The first half
// subsumes React, the workspace siblings, node builtins and any npm package
// at once. The second exists because a relative path can still leave —
// `../../observation/src` from src/index.ts resolves, and the root tsconfig
// typechecks it — and no pattern over `../` runs can tell `./a/../../b`
// (stays) from `./../..` (leaves); resolving against the importing file can.
// Dynamic `import()` is not here because the engine block bans it outright.
const RELATIVE_SPECIFIER = /^\.\.?(\/|$)/

const importsStayWithin = {
  meta: {
    type: 'problem',
    schema: [{ type: 'object', properties: { root: { type: 'string' } }, required: ['root'] }],
  },
  create(context) {
    const { root } = context.options[0]
    const dir = path.dirname(context.filename)
    const check = (node) => {
      const spec = node.source?.value
      if (typeof spec !== 'string') return
      const inside =
        RELATIVE_SPECIFIER.test(spec) &&
        !path.relative(root, path.resolve(dir, spec)).startsWith('..')
      if (!inside) context.report({ node: node.source, message: NO_IO })
    }
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check }
  },
}

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
    files: [TS],
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
    files: [`packages/engine/${TS}`],
    plugins: { boundary: { rules: { 'imports-stay-within': importsStayWithin } } },
    rules: {
      // a pure deterministic core has nothing to say to the console
      'no-console': 'error',
      // Engine-scoped: reading a clock is legitimate elsewhere — runner,
      // worker/trial.ts and every tools/measure-*.ts time themselves.
      'no-restricted-properties': ['error', ...DETERMINISM_PROPERTIES],
      // "Reads no environment" as an allowlist rather than a list of names:
      // this block declares no `globals`, so the only identifiers the engine
      // may reach for are the language's own builtins. Node's ambient surface
      // (`process`, `Buffer`, `require`, `__dirname`), the web's (`fetch`,
      // `crypto`, `setTimeout`, `structuredClone`) and the clock
      // (`performance`, #249) are all simply undefined here, and the next
      // host API to ship is too. typescript-eslint turns this rule off
      // because the typechecker covers it — but the root tsconfig checks the
      // engine with node types, so here it does not. Never give this block
      // `globals`: flat config MERGES them, so one `globals.node` upstream
      // would quietly reopen the whole surface.
      'no-undef': ['error', { typeof: true }],
      // The one language builtin that is a door to all of the above.
      'no-restricted-globals': ['error', { name: 'globalThis', message: NO_IO }],
      // The constructor forms no-restricted-properties cannot see. `Date()`
      // called as a function ignores its arguments and returns the current
      // time, so every call is the clock; only `new Date(value)` is arithmetic.
      'no-restricted-syntax': [
        'error',
        { selector: "NewExpression[callee.name='Date'][arguments.length=0]", message: NO_CLOCK },
        { selector: "CallExpression[callee.name='Date']", message: NO_CLOCK },
        // A dynamic import is a Promise a synchronous engine cannot await,
        // and it is invisible to the static-import rule below.
        { selector: 'ImportExpression', message: NO_IO },
        // `import.meta` is where the host tells a module where it lives —
        // url, dirname, resolve — and it is a MetaProperty, not an
        // identifier, so no-undef never sees it.
        { selector: "MetaProperty[meta.name='import']", message: NO_IO },
        // JSX compiles to an import of a runtime the file never writes down,
        // so the import rule cannot see it either.
        { selector: 'JSXElement, JSXFragment', message: NO_IO },
      ],
      'boundary/imports-stay-within': ['error', { root: ENGINE_SRC }],
    },
  },
  {
    // Every behavioral constant lives in constants.ts, tune there, nowhere
    // else (ADR-0007, #179). This does not flag a literal assigned to a
    // named `const` — that IS the fix — only one used bare inside an
    // expression. `ignore` covers structural uses ADR-0007 itself carves
    // out: array indices, unit identities, and the odd sign flip.
    files: [`packages/engine/src/${TS}`],
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
    files: [`packages/ui/${TS}`],
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
    files: [`packages/ui/src/worker/${TS}`],
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
