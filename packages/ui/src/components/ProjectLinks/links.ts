/**
 * Where the project lives, as plain data.
 *
 * Separate from the component beside it because `ui/src/atlas.ts` builds source
 * permalinks from `REPOSITORY_URL` and is a pure module: importing a `.tsx`
 * from it drags JSX into a graph the repo-root typecheck compiles without
 * `--jsx`, and the failure is a compiler error about a file nobody touched.
 */

export const REPOSITORY_URL = 'https://github.com/Scc33/terrarium'
export const NEW_ISSUE_URL = `${REPOSITORY_URL}/issues/new`
