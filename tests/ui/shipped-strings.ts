/**
 * The strings a production build must not contain, and why they are these
 * strings and not others.
 *
 * `dev-build-strip.test.ts` greps the built bundle for them: the dev console
 * serializes `TrueState` and posts it to the UI, which is the one thing
 * ADR-0004 exists to prevent, and the entire difference between a build that
 * does that and one that does not is a handful of `__DEV_TOOLS__` guards.
 *
 * The list lives here rather than inside that test because a SECOND thing now
 * has to respect it. Since ADR-0038 the game ships a scanned map of its own
 * repository, and that map prints every module's exported symbol NAMES as
 * data. A needle that happens to be one of those names stops being evidence:
 * it is in the bundle either way, so it can no longer tell a leak from a map.
 * `atlas.test.ts` asserts the snapshot prints none of these, which turns that
 * collision into a named failure the day somebody adds a colliding needle,
 * rather than a mysterious one in the build check.
 *
 * That constraint is cheap to satisfy because a good needle here is not an
 * identifier anyway. **The production build minifies**, so an internal
 * identifier is renamed and a grep for it passes whether the code shipped or
 * not — measured: `HeaderGroup`, `SectionBlock` and `EntryRow` are all absent
 * from a bundle that unquestionably contains those components. What survives
 * minification is string LITERALS and PROPERTY names, which are also exactly
 * what a map of exported symbols cannot produce. The two rules agree.
 */

export const FORBIDDEN_IN_BUNDLE: ReadonlyArray<readonly [needle: string, why: string]> = [
  ['dev:scenario', 'the scenario request message'],
  ['dev:inspect', 'the truth request message'],
  ['dev:truth', 'the true-state reply message'],
  ['DEV CONSOLE', 'the panel chrome'],
  ['RUN SCENARIO', 'the panel controls'],
  // reaches the scenario BUILDER: `applyScenario` reads `sc.populationScale`,
  // and a property name is preserved where the function's own name is not
  ['populationScale', 'a scenario-only field the builder reads'],
]
