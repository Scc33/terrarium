/**
 * The atlas.
 *
 * The failure that matters here is not a broken page — it is a page that draws
 * perfectly and describes a repository that no longer exists. A map missing the
 * pipeline step somebody added last month does not look wrong; it looks like a
 * simpler engine, which is exactly what a reader has come to the atlas to
 * believe. So the first block below crosses the import boundary the way
 * `manual.test.ts` does — a test may, where production code may not — and
 * compares the SCANNED pipeline against the engine's live `TICK_ORDER`.
 *
 * `pnpm architecture:check` in CI is the general form of that guarantee. This
 * file is the specific one: it fails by NAME, and it fails in the ordinary test
 * run, for the part of the map a reader is most likely to trust.
 */

import { describe, expect, it } from 'vitest'
import { architecture } from '@terrarium/architecture-visualizer'
import { TICK_ORDER } from '../../packages/engine/src/pipeline/pipeline'
import { FORBIDDEN_IN_BUNDLE } from './shipped-strings'
import {
  ATLAS_VIEWS,
  PIPELINE_NOTES,
  atlasSummary,
  filterModules,
  moduleCategories,
  moduleIndex,
  packageDepths,
  packageLayers,
  packageRelations,
  positionNote,
  shortPath,
  sourceHref,
  sourceLabel,
} from '../../packages/ui/src/atlas'

const modules = moduleIndex(architecture)

describe('the map is of this repository', () => {
  it('scans the engine’s own tick order, in order', () => {
    expect(architecture.pipeline.map((step) => step.name)).toEqual(TICK_ORDER.map((step) => step.name))
  })

  it('numbers the steps from one, without a gap', () => {
    expect(architecture.pipeline.map((step) => step.order)).toEqual(
      TICK_ORDER.map((_, index) => index + 1),
    )
  })

  it('points every step at a file the scan actually found', () => {
    for (const step of architecture.pipeline) {
      expect(modules.get(step.moduleId), `${step.name} → ${step.moduleId}`).toBeDefined()
    }
  })

  it('found the load-bearing files, so an empty scan cannot pass as a small codebase', () => {
    for (const path of [
      'packages/engine/src/pipeline/pipeline.ts',
      'packages/engine/src/pipeline/statistics.ts',
      'packages/engine/src/actions/apply.ts',
      'packages/observation/src/observe.ts',
      'packages/ui/src/worker/sim.worker.ts',
    ]) {
      expect(modules.get(path), path).toBeDefined()
    }
  })

  it('resolves every seam to a file, so no seam links at line 1 of nothing', () => {
    for (const seam of architecture.seams) {
      expect(seam.locations.length).toBeGreaterThan(0)
      for (const location of seam.locations) {
        expect(modules.get(location.path), `${seam.id} → ${location.path}`).toBeDefined()
      }
    }
  })

  it('keeps the import graph closed — every edge lands on a scanned file', () => {
    for (const edge of architecture.moduleEdges) {
      expect(modules.get(edge.source), edge.source).toBeDefined()
      expect(modules.get(edge.target), edge.target).toBeDefined()
    }
  })

  it('gives every package at least one file and a description of its own', () => {
    for (const pkg of architecture.packages) {
      expect(pkg.moduleCount, pkg.id).toBeGreaterThan(0)
      expect(pkg.lines, pkg.id).toBeGreaterThan(0)
      expect(pkg.description.length, pkg.id).toBeGreaterThan(20)
    }
  })
})

describe('the map cannot alibi the dev console', () => {
  /**
   * The atlas prints every module's exported symbol NAMES as data, and it
   * ships in the same bundle `dev-build-strip.test.ts` greps for evidence that
   * the true-state inspector was stripped. A needle that is also one of those
   * names is in the bundle either way, so it stops being evidence — the build
   * check would go on passing while proving nothing, which is the exact
   * failure mode that test exists to prevent.
   *
   * This is where that collision surfaces, by name, on the day it is created.
   * It caught one on arrival: `applyScenario` was a needle and is an export of
   * `ui/src/devScenario.ts`. It was also already a weak needle — the build
   * minifies, so the identifier is renamed and the grep passed regardless —
   * and the property it reads, `populationScale`, covers the same module and
   * survives both minification and this rule.
   */
  const printed = JSON.stringify(architecture)

  it.each([...FORBIDDEN_IN_BUNDLE.map(([needle]) => needle), 'toTree'])(
    'never prints %s, which the bundle check reads as a leak',
    (needle) => {
      expect(printed).not.toContain(needle)
    },
  )
})

describe('a source link points at the code it was read from', () => {
  it('pins the revision the map was drawn at rather than the moving branch', () => {
    const href = sourceHref(architecture, { path: 'packages/engine/src/constants.ts', line: 42 })
    expect(href).toContain(`/blob/${architecture.revision}/`)
    expect(href).not.toContain('/blob/master/')
    expect(href.endsWith('#L42')).toBe(true)
  })

  it('labels itself the way a path is quoted anywhere else', () => {
    expect(sourceLabel({ path: 'packages/ui/src/atlas.ts', line: 7 })).toBe('packages/ui/src/atlas.ts:7')
  })
})

describe('the system map is derived, not authored', () => {
  it('puts the engine at the foundation and the interface at the top', () => {
    const depths = packageDepths(architecture)
    expect(depths.get('engine')).toBe(0)
    expect(depths.get('observation')).toBe(1)
    // ui reaches the engine THROUGH observation, so it cannot share a layer
    expect(depths.get('ui')).toBeGreaterThan(depths.get('observation') ?? 0)
  })

  it('places every package exactly once, so a new one cannot fall off the map', () => {
    const placed = packageLayers(architecture).flat().map((pkg) => pkg.id)
    expect([...placed].sort()).toEqual(architecture.packages.map((pkg) => pkg.id).sort())
  })

  it('reads a package’s traffic in both directions', () => {
    const engine = packageRelations(architecture, 'engine')
    expect(engine.imports).toEqual([])
    expect(engine.importedBy.map((edge) => edge.packageId)).toContain('ui')
    const ui = packageRelations(architecture, 'ui')
    expect(ui.imports.map((edge) => edge.packageId)).toContain('observation')
    // the counts are ordered heaviest first, which is what makes the panel readable
    expect(ui.imports.map((edge) => edge.count)).toEqual([...ui.imports.map((e) => e.count)].sort((a, b) => b - a))
  })
})

describe('the file list answers the question a reader arrives with', () => {
  it('finds a module by an export name, not only by its path', () => {
    const hits = filterModules(architecture, { query: 'politicalCostOfAction' })
    expect(hits.map((module) => module.id)).toContain('packages/engine/src/actions/apply.ts')
  })

  it('narrows by package and by layer', () => {
    const enginePipeline = filterModules(architecture, { packageId: 'engine', category: 'Pipeline' })
    expect(enginePipeline.length).toBeGreaterThan(architecture.pipeline.length)
    expect(enginePipeline.every((module) => module.packageId === 'engine')).toBe(true)
    expect(enginePipeline.every((module) => module.category === 'Pipeline')).toBe(true)
  })

  it('returns everything when nothing is asked of it', () => {
    expect(filterModules(architecture)).toHaveLength(architecture.modules.length)
    expect(filterModules(architecture, { query: '  ', packageId: 'all', category: 'all' })).toHaveLength(
      architecture.modules.length,
    )
  })

  it('offers only layers the files are actually filed under', () => {
    const categories = moduleCategories(architecture)
    expect(categories).toEqual([...new Set(categories)].sort())
    expect(categories).toContain('Pipeline')
    expect(categories).toContain('Worker boundary')
  })

  it('drops the package prefix every row in a list already shares', () => {
    const module = modules.get('packages/engine/src/pipeline/statistics.ts')
    expect(module && shortPath(module)).toBe('src/pipeline/statistics.ts')
  })
})

describe('the aside on a step', () => {
  /**
   * The one place the atlas is authored rather than scanned, so the one place
   * it can quietly stop matching the game. A renamed step falls back to the
   * derived sentence — which is true, just less useful — and this is what says
   * so out loud instead.
   */
  it('names steps that exist', () => {
    const steps = new Set(architecture.pipeline.map((step) => step.name))
    for (const name of Object.keys(PIPELINE_NOTES)) {
      expect(steps.has(name), `${name} has an authored note and is not a pipeline step`).toBe(true)
    }
  })

  it('says something true about every step, authored or not', () => {
    for (const step of architecture.pipeline) {
      expect(positionNote(architecture, step).length, step.name).toBeGreaterThan(20)
    }
  })

  it('falls back to the neighbours when a step has no authored note', () => {
    const production = architecture.pipeline.find((step) => step.name === 'production')
    expect(production).toBeDefined()
    if (!production) return
    expect(PIPELINE_NOTES.production).toBeUndefined()
    expect(positionNote(architecture, production)).toContain('foreignInvestment')
    expect(positionNote(architecture, production)).toContain('environment')
  })

  it('closes the fold without pointing at a step after the last one', () => {
    const last = architecture.pipeline.at(-1)
    expect(last?.name).toBe('politics')
  })
})

describe('the masthead figures', () => {
  it('counts what the map holds', () => {
    const summary = atlasSummary(architecture)
    expect(summary.packages).toBe(architecture.packages.length)
    expect(summary.modules).toBe(architecture.modules.length)
    expect(summary.imports).toBe(architecture.moduleEdges.length)
    expect(summary.steps).toBe(architecture.pipeline.length)
    expect(summary.lines).toBe(architecture.packages.reduce((total, pkg) => total + pkg.lines, 0))
    expect(summary.revision).toBe(architecture.revision)
  })

  it('offers three views, each with a question of its own', () => {
    expect(ATLAS_VIEWS.map((view) => view.id)).toEqual(['pipeline', 'system', 'modules'])
    for (const view of ATLAS_VIEWS) expect(view.question.length).toBeGreaterThan(20)
  })
})
