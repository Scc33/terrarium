/**
 * The engine atlas: the game's account of how the game is built.
 *
 * Terrarium explains itself at every other level — a tooltip on each dial, the
 * handbook on each lever, the methodology on how a print is made. Below that
 * the explanation stopped, and the map that continued it lived in a separate
 * dev-only app nobody opened and nothing rebuilt (#128). It is here now, and
 * everything on the page is SCANNED from the repository by
 * `packages/architecture-visualizer` rather than written beside it — the same
 * bargain the handbook makes (ADR-0024), for the same reason: an architecture
 * document maintained by hand is wrong the first time somebody adds a pipeline
 * step, and wrong silently.
 *
 * This module is pure and takes the snapshot as an ARGUMENT. Two things follow,
 * and both are the point:
 *
 * - the 400KB of scanned repository is not in the main bundle. The overlay
 *   imports it dynamically, so a player who never opens the atlas never
 *   downloads it, and this module can be tested against a hand-built snapshot;
 * - nothing here can read the game. The atlas describes the code, never the
 *   country — no `PublishedState` reaches it, so it cannot become a second,
 *   unfogged instrument.
 *
 * Three decisions are load-bearing and none of them are visible in review:
 *
 * 1. **A source link is pinned to the revision the map was drawn at**, never to
 *    `master`. The line numbers belong to that commit; a link to the moving
 *    branch keeps working, keeps looking right, and lands a reader a few lines
 *    off the thing it promised — further off every month.
 * 2. **The layering is derived from the measured imports.** The retired
 *    renderer hard-coded `ui → observation → engine` and placed the other two
 *    packages by hand, so a sixth workspace package would have been absent from
 *    the system map without anything failing.
 * 3. **The pipeline notes are a `Partial` over step names with a derived
 *    fallback**, so a renamed step loses its authored aside and still gets a
 *    true sentence. `tests/ui/atlas.test.ts` fails by name when a key stops
 *    matching a step, which is the only half a fallback cannot cover.
 */

import type {
  ArchitectureSnapshot,
  ModuleNode,
  PackageEdge,
  PackageNode,
  PipelineStep,
  SourceLocation,
} from '@terrarium/architecture-visualizer'
import { REPOSITORY_URL } from './components/ProjectLinks/links'

export type AtlasView = 'pipeline' | 'system' | 'modules'

export interface AtlasViewSpec {
  id: AtlasView
  label: string
  /** what this view answers — the tab's own second line */
  question: string
}

export const ATLAS_VIEWS: readonly AtlasViewSpec[] = [
  { id: 'pipeline', label: 'THE QUARTER', question: 'What happens when you advance, in order.' },
  { id: 'system', label: 'THE SYSTEM', question: 'Which package may know about which, and where the seams are.' },
  { id: 'modules', label: 'THE FILES', question: 'Every source file, what it exports, and who reaches it.' },
]

export interface AtlasSummary {
  revision: string
  packages: number
  modules: number
  imports: number
  lines: number
  steps: number
}

export function atlasSummary(snapshot: ArchitectureSnapshot): AtlasSummary {
  return {
    revision: snapshot.revision,
    packages: snapshot.packages.length,
    modules: snapshot.modules.length,
    imports: snapshot.moduleEdges.length,
    lines: snapshot.packages.reduce((total, pkg) => total + pkg.lines, 0),
    steps: snapshot.pipeline.length,
  }
}

/**
 * A permalink into the repository at the commit the map was drawn at.
 *
 * `blob/<revision>/` and not `blob/master/`: the line came from the scan, and
 * master has moved since. A branch link degrades in the one way that never
 * looks broken — the file opens, the anchor lands, the code under it is not
 * the code the atlas was describing.
 */
export function sourceHref(snapshot: ArchitectureSnapshot, location: SourceLocation): string {
  return `${REPOSITORY_URL}/blob/${snapshot.revision}/${location.path}#L${location.line}`
}

export function sourceLabel(location: SourceLocation): string {
  return `${location.path}:${location.line}`
}

/** the file name, without the package prefix every row in the list shares */
export function shortPath(module: ModuleNode): string {
  return module.id.replace(`packages/${module.packageId}/`, '')
}

export function moduleIndex(snapshot: ArchitectureSnapshot): Map<string, ModuleNode> {
  return new Map(snapshot.modules.map((module) => [module.id, module]))
}

/**
 * How deep in the dependency stack each package sits: 0 is a package that
 * imports no other, and everything else is one past the deepest thing it
 * imports. Derived, never authored — see the module note.
 *
 * The walk is bounded by the package count rather than by a visited set,
 * because a cycle here would be an architectural emergency and not something
 * to render tidily: it settles at a finite depth and the map still draws.
 */
export function packageDepths(snapshot: ArchitectureSnapshot): Map<string, number> {
  const depths = new Map(snapshot.packages.map((pkg) => [pkg.id, 0]))
  for (let pass = 0; pass < snapshot.packages.length; pass += 1) {
    let moved = false
    for (const edge of snapshot.packageEdges) {
      const target = depths.get(edge.target) ?? 0
      if ((depths.get(edge.source) ?? 0) <= target) {
        depths.set(edge.source, target + 1)
        moved = true
      }
    }
    if (!moved) break
  }
  return depths
}

/**
 * The packages as layers, consumers first and the foundation last.
 *
 * No layer can come back empty: a package sits one past the deepest thing it
 * imports, so something at depth d implies something at d − 1. That is why the
 * view can put a divider between every pair of rows without checking.
 */
export function packageLayers(snapshot: ArchitectureSnapshot): PackageNode[][] {
  const depths = packageDepths(snapshot)
  const deepest = Math.max(0, ...depths.values())
  return Array.from({ length: deepest + 1 }, (_, index) =>
    snapshot.packages
      .filter((pkg) => (depths.get(pkg.id) ?? 0) === deepest - index)
      .sort((a, b) => b.lines - a.lines),
  )
}

export interface PackageTraffic {
  packageId: string
  name: string
  count: number
  typeOnlyCount: number
}

export interface PackageRelations {
  imports: PackageTraffic[]
  importedBy: PackageTraffic[]
}

export function packageRelations(snapshot: ArchitectureSnapshot, packageId: string): PackageRelations {
  const name = (id: string) => snapshot.packages.find((pkg) => pkg.id === id)?.name ?? id
  const traffic = (edges: readonly PackageEdge[], other: 'source' | 'target'): PackageTraffic[] =>
    edges
      .map((edge) => ({
        packageId: edge[other],
        name: name(edge[other]),
        count: edge.count,
        typeOnlyCount: edge.typeOnlyCount,
      }))
      .sort((a, b) => b.count - a.count)
  return {
    imports: traffic(snapshot.packageEdges.filter((edge) => edge.source === packageId), 'target'),
    importedBy: traffic(snapshot.packageEdges.filter((edge) => edge.target === packageId), 'source'),
  }
}

export function moduleCategories(snapshot: ArchitectureSnapshot): string[] {
  return [...new Set(snapshot.modules.map((module) => module.category))].sort()
}

export interface ModuleFilter {
  query?: string
  packageId?: string
  category?: string
}

/**
 * The file list, filtered.
 *
 * The query covers the EXPORT NAMES as well as the path and the leading note,
 * because the question a reader arrives with is almost always a symbol they
 * saw somewhere else — `politicalCostOfAction`, `rngFor` — and not a filename.
 */
export function filterModules(snapshot: ArchitectureSnapshot, filter: ModuleFilter = {}): ModuleNode[] {
  const query = (filter.query ?? '').trim().toLowerCase()
  return snapshot.modules.filter((module) => {
    if (filter.packageId && filter.packageId !== 'all' && module.packageId !== filter.packageId) return false
    if (filter.category && filter.category !== 'all' && module.category !== filter.category) return false
    if (!query) return true
    const haystack = `${module.id} ${module.label} ${module.summary} ${module.exports
      .map((symbol) => symbol.name)
      .join(' ')}`
    return haystack.toLowerCase().includes(query)
  })
}

/**
 * Why a step sits where it does — the part of the order that is a DESIGN
 * decision rather than a consequence of the one before it.
 *
 * Authored, because no scan can recover an intention, and `Partial` so that
 * renaming a step degrades to the derived sentence rather than to a lie.
 */
export const PIPELINE_NOTES: Partial<Record<string, string>> = {
  shocks:
    'Shocks land first, so every producer, trader, household and voter lives through the same rupture in the same quarter.',
  finance:
    'Finance sees the world shock and last quarter’s profits; production then receives the asset price, the credit and the crisis state that came out of it.',
  institutions:
    'Institutions read the economy to decide who holds power. This is one of the two places the economic machine and the political one touch — the other is the price of an order.',
  statistics:
    'Load-bearing: the office makes the public print BEFORE politics awards or withdraws political capital, so the country reacts to the published figure rather than to the truth (ADR-0003).',
  politics:
    'Politics closes the quarter, after households, institutions and the statistical office have each recorded what the government and the electorate are allowed to know.',
}

export function positionNote(snapshot: ArchitectureSnapshot, step: PipelineStep): string {
  const authored = PIPELINE_NOTES[step.name]
  if (authored) return authored
  const previous = snapshot.pipeline[step.order - 2]
  const next = snapshot.pipeline[step.order]
  if (previous && next) {
    return `Receives the state ${previous.name} left behind; ${next.name} is the next subsystem to read the result.`
  }
  if (next) return `${next.name} is the first subsystem to consume the state this step leaves behind.`
  if (previous) return `Receives the state ${previous.name} left behind, and closes the ordered fold.`
  return 'The pipeline order is the model’s within-quarter causal order.'
}
