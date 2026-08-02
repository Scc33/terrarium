/// <reference types="vite/client" />

/**
 * True only in a `vite serve` build. Substituted with a literal by `define` in
 * `vite.config.ts`, so `if (__DEV_TOOLS__)` is `if (false)` when shipping and
 * the bundler drops the branch and everything it reaches.
 *
 * Use this — not `import.meta.env.DEV` — to gate anything that must never
 * reach a player. See the comment in `vite.config.ts` for why.
 */
declare const __DEV_TOOLS__: boolean
