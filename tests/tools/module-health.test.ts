import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { analyzeRepo } from '../../packages/architecture-visualizer/scripts/analyze'
import type { ModuleNode } from '../../packages/architecture-visualizer/src/model'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const snapshot = analyzeRepo(repoRoot)

const NEW_MODULE_LINE_CAP = 600

/**
 * Implementation-HEAD sizes for every production module over 400 lines.
 *
 * This is a one-way ratchet, not a catalogue to extend whenever a file grows. A
 * listed module may shrink; an unlisted module gets the more generous new-file
 * cap below. Inline notes preserve why a large cohesive record is different
 * from executable code that remains a useful candidate for decomposition.
 *
 * The exception the ratchet cannot refuse is a SCHEMA-ADDING change: a new dial
 * or a new stock has to be declared in `schema.ts`, seeded in `init.ts`, priced
 * in `apply.ts` and exported from `index.ts`, because every one of those is a
 * total record the compiler checks. Raising those four rows for v44's surplus
 * destination (#211) is that case, and it is the only reason to raise a row.
 *
 * `manual.ts` is the same case in the UI: the handbook is generated from the
 * game, so a lever that ships without a chapter is a lever nobody can look up
 * (ADR-0024). `derive.ts` is the same case once more: the two shared
 * household-income bases live there, and a new income field has to appear in
 * both or the survey reports a country that never received it.
 *
 * A module DELIBERATELY SPLIT keeps its row at the post-split size even once it
 * falls under the new-file cap, so it cannot quietly reabsorb what was lifted
 * out of it — dropping the row would hand `ControlRail` and `App` back every
 * line their splits removed, with nothing in CI to notice.
 */
const MODULE_LINE_BASELINE = {
  // Executable hotspot: action legality, political pricing, and application share one seam.
  'packages/engine/src/actions/apply.ts': 800,
  // Cohesive ledger: the total, lint-enforced home for every behavioral constant.
  // Ratcheted from 1609 by #179: a lint-enforced no-magic-numbers pass moved
  // ~100 previously-scattered coefficients here (including
  // PC_INCOME_APPROVAL_NEUTRAL, naming the accrual formula's approval
  // break-even), which is this file doing its one job, not scope creep —
  // the split that would relieve it (domain tuning modules) stays blocked
  // on a superseding ADR, per this file's own note. Ratcheted from 1996 by
  // the labour-market survey (#230): a schema-adding change declaring
  // LABOUR_SURVEY_FUNDED_AT, LABOUR_JOBLESS_SD and LABOUR_UNDEREMPLOYED_SD.
  // Ratcheted from 1999 by the labour desk (#198): five measured wire
  // thresholds, which the hard rule says may live nowhere else.
  'packages/engine/src/constants.ts': 2027,
  // Cohesive catalogue: authored and procedural country recipes plus their materialization.
  'packages/engine/src/countries.ts': 567,
  // Cohesive catalogue: total event copy records across all press eras.
  // `EVENT_CATALOGUE` is a total `Record<EventId, EventDef>`, so a new id
  // cannot compile without a row here — the schema-adding case above, in the
  // wire's register (ADR-0031). Ratcheted from 2157 by the labour desk's
  // three dispatches (#198).
  'packages/engine/src/events/catalogue.ts': 2203,
  // Executable hotspot: condition eligibility, page budgets, and escalating cooldowns.
  // Ratcheted from 828 by the labour desk's three rules (#198), because
  // `CONDITION_RULES` is where ADR-0031 says a condition rule goes and a
  // second rule table beside it was refused in review. The table is more
  // than half the file and grows with every event; the relief is the #205
  // shape — lift the declarative table out and leave the machinery — not a
  // side registry per desk.
  'packages/engine/src/events/conditions.ts': 880,
  // Public facade: engine exports plus save/replay orchestration at the package boundary.
  'packages/engine/src/index.ts': 421,
  // Cohesive derivation library: shared read models consumed across the ordered pipeline.
  // Ratcheted from 1080 by #179: named constants replacing bare literals.
  'packages/engine/src/pipeline/derive.ts': 1090,
  // Executable hotspot: institution power, compliance, and appointment updates.
  // Ratcheted from 435 by #179: the bloc-favor formulas' ~30 coefficients
  // are now named constants instead of bare literals.
  'packages/engine/src/pipeline/institutions.ts': 467,
  // Executable hotspot: funding, lag, noise, revision, and vector-publication machinery.
  // Ratcheted from 900 when #205 lifted the declarative catalogue into
  // `indicatorSpecs.ts`; what is left is the machinery, and it should not
  // reabsorb the half that grows every time an instrument ships.
  'packages/engine/src/pipeline/statistics.ts': 581,
  // Executable hotspot: deterministic construction of the complete opening state.
  // Ratcheted from 655 by #179: named constants replacing bare literals,
  // including two spots that had silently re-typed INCOME_TAX_1946 /
  // CORPORATE_TAX_1946 / POLICY_RATE_1946 as fresh numbers.
  'packages/engine/src/state/init.ts': 669,
  // Cohesive schema: total state contracts and canonical id lists.
  'packages/engine/src/state/schema.ts': 1386,
  // Analysis tool: whole-validator country sampling and stability reporting.
  'packages/runner/src/country-fuzz.ts': 507,
  // Analysis tool: export-feedback measures, aggregation, and report formatting.
  'packages/runner/src/export-feedback.ts': 508,
  // Headless facade: policy runs, metrics, and the shared batch result contract.
  'packages/runner/src/run.ts': 418,
  // Analysis tool: multi-seed stability probes and their diagnostics.
  'packages/runner/src/stability.ts': 600,
  // Screen composition root: boot, keyboard, scene precedence and cabinet chrome
  // are hooks in `shell/`. Ratcheted from 487 by #208.
  'packages/ui/src/App.tsx': 352,
  // Cohesive painter: shared chart geometry, inspection, comparison, and accessibility.
  'packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx': 642,
  // Cohesive total record: generated country fields and validator-mirroring arithmetic.
  'packages/ui/src/countryDraft.ts': 441,
  // Cohesive catalogue: generated handbook chapters plus authored mechanism prose.
  'packages/ui/src/manual.ts': 706,
  // Presentation hotspot: exact census summaries and charts in one dossier.
  'packages/ui/src/panels/CensusOverlay.tsx': 502,
  // Composition root: cabinet tab strip, drawer bodies, and the enact footer.
  'packages/ui/src/panels/ControlRail.tsx': 372,
  // Executable hotspot: posting-room selection, drafting, rules, and appointment flows.
  'packages/ui/src/panels/CountrySelect.tsx': 644,
  // Presentation hotspot: banking diagnostics, phase chart, and crisis episodes.
  'packages/ui/src/panels/FinanceOverlay.tsx': 412,
  // Presentation hotspot: policy record, rules, statutes, and compliance views.
  'packages/ui/src/panels/PolicyOverlay.tsx': 419,
  // Cohesive geometry library: the pure, shared time-series path calculations.
  'packages/ui/src/plot.ts': 434,
} as const satisfies Record<string, number>

function isTestModule(module: ModuleNode): boolean {
  return /(?:^|\/)(?:__tests__|tests?)(?:\/|$)/.test(module.id) || /\.(?:spec|test)\.tsx?$/.test(module.id)
}

const productionModules = snapshot.modules.filter((module) => !isTestModule(module))
const productionById = new Map(productionModules.map((module) => [module.id, module]))

function moduleHealth(module: ModuleNode): string {
  return [
    `category=${module.category}`,
    `fan-in=${module.importedBy.length}`,
    `fan-out=${module.imports.length}`,
    `exports=${module.exports.length}`,
  ].join(', ')
}

function expectNoViolations(rule: string, violations: string[]): void {
  expect(violations, `${rule}\n${violations.join('\n')}`).toEqual([])
}

describe('production module health', () => {
  it('ratchets implementation-HEAD hotspots without blocking shrinkage', () => {
    const violations: string[] = []

    for (const [id, allowedLines] of Object.entries(MODULE_LINE_BASELINE)) {
      const module = productionById.get(id)
      if (!module) {
        violations.push(`${id}: measured=missing, allowed<=${allowedLines} lines; remove this stale baseline row`)
      } else if (module.lines > allowedLines) {
        violations.push(
          `${id}: measured=${module.lines} lines, allowed<=${allowedLines} lines (${moduleHealth(module)})`,
        )
      }
    }

    expectNoViolations(
      'Existing production hotspots may shrink but may not grow; remove stale rows after a module disappears.',
      violations,
    )
  })

  it(`caps unlisted production modules at ${NEW_MODULE_LINE_CAP} lines`, () => {
    const violations = productionModules
      .filter(
        (module) =>
          !Object.hasOwn(MODULE_LINE_BASELINE, module.id) && module.lines > NEW_MODULE_LINE_CAP,
      )
      .map(
        (module) =>
          `${module.id}: measured=${module.lines} lines, allowed<=${NEW_MODULE_LINE_CAP} lines (${moduleHealth(module)})`,
      )

    expectNoViolations('New production modules over the cap need to be split or justified in review.', violations)
  })
})
