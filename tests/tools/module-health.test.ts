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
 */
const MODULE_LINE_BASELINE = {
  // Executable hotspot: action legality, political pricing, and application share one seam.
  'packages/engine/src/actions/apply.ts': 782,
  // Cohesive ledger: the total, lint-enforced home for every behavioral constant.
  'packages/engine/src/constants.ts': 1593,
  // Cohesive catalogue: authored and procedural country recipes plus their materialization.
  'packages/engine/src/countries.ts': 567,
  // Cohesive catalogue: total event copy records across all press eras.
  'packages/engine/src/events/catalogue.ts': 2157,
  // Executable hotspot: condition eligibility, page budgets, and escalating cooldowns.
  'packages/engine/src/events/conditions.ts': 828,
  // Public facade: engine exports plus save/replay orchestration at the package boundary.
  'packages/engine/src/index.ts': 416,
  // Cohesive derivation library: shared read models consumed across the ordered pipeline.
  'packages/engine/src/pipeline/derive.ts': 1066,
  // Executable hotspot: institution power, compliance, and appointment updates.
  'packages/engine/src/pipeline/institutions.ts': 435,
  // Executable hotspot: funding, lag, noise, revision, and vector-publication machinery.
  'packages/engine/src/pipeline/statistics.ts': 899,
  // Executable hotspot: deterministic construction of the complete opening state.
  'packages/engine/src/state/init.ts': 638,
  // Cohesive schema: total state contracts and canonical id lists.
  'packages/engine/src/state/schema.ts': 1314,
  // Analysis tool: whole-validator country sampling and stability reporting.
  'packages/runner/src/country-fuzz.ts': 507,
  // Analysis tool: export-feedback measures, aggregation, and report formatting.
  'packages/runner/src/export-feedback.ts': 508,
  // Headless facade: policy runs, metrics, and the shared batch result contract.
  'packages/runner/src/run.ts': 418,
  // Analysis tool: multi-seed stability probes and their diagnostics.
  'packages/runner/src/stability.ts': 600,
  // Executable hotspot: top-level game orchestration and overlay routing.
  'packages/ui/src/App.tsx': 487,
  // Cohesive painter: shared chart geometry, inspection, comparison, and accessibility.
  'packages/ui/src/components/ui/TimeSeriesChart/TimeSeriesChart.tsx': 642,
  // Cohesive total record: generated country fields and validator-mirroring arithmetic.
  'packages/ui/src/countryDraft.ts': 441,
  // Cohesive catalogue: generated handbook chapters plus authored mechanism prose.
  'packages/ui/src/manual.ts': 697,
  // Presentation hotspot: exact census summaries and charts in one dossier.
  'packages/ui/src/panels/CensusOverlay.tsx': 502,
  // Executable hotspot: cabinet drawers, controls, quoting, and action dispatch.
  'packages/ui/src/panels/ControlRail.tsx': 960,
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
