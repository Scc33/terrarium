/**
 * The atlas's three views, and the two links that stitch them together.
 *
 * Split out of `AtlasOverlay` rather than folded into it because they are
 * genuinely three readings of one snapshot — a quarter, a system, a file — and
 * because the shell around them is about loading and switching, which is a
 * different job. Everything derived lives in `../atlas`; these are painters.
 */

import { useId, useMemo } from 'react'
import type { ArchitectureSnapshot, ModuleNode, PipelineStep, SourceLocation } from '@terrarium/architecture-visualizer'
import { Button, EmptyState, SectionHeading } from '../components/ui'
import {
  filterModules,
  moduleCategories,
  moduleIndex,
  packageLayers,
  packageRelations,
  positionNote,
  shortPath,
  sourceHref,
  sourceLabel,
} from '../atlas'

const count = (value: number) => new Intl.NumberFormat('en-US').format(value)

function SourceLink({
  snapshot,
  at,
  label,
}: {
  snapshot: ArchitectureSnapshot
  at: SourceLocation
  label?: string
}) {
  return (
    <a
      href={sourceHref(snapshot, at)}
      target="_blank"
      rel="noopener noreferrer"
      title={`${sourceLabel(at)} on GitHub, at the revision this map was drawn (opens in a new tab)`}
      className="inline-flex max-w-full items-center gap-1 break-all border border-dossier-ink/20 px-1.5 py-0.5 font-mono text-[9px] text-dossier-ink/70 transition-colors hover:border-dossier-brass hover:bg-dossier-brass/10 hover:text-dossier-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass"
    >
      <span aria-hidden="true">↗</span>
      <span>{label ?? sourceLabel(at)}</span>
    </a>
  )
}

/** a path the reader can click through to the file list, rather than read */
function ModuleLink({ id, label, onOpen }: { id: string; label: string; onOpen: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      title={id}
      className="max-w-full truncate border border-dossier-ink/15 px-1.5 py-0.5 text-left font-mono text-[9px] text-dossier-ink/70 hover:border-dossier-brass hover:bg-dossier-brass/10 hover:text-dossier-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass"
    >
      {label}
    </button>
  )
}

export function PipelineView({
  snapshot,
  selected,
  onSelect,
  onOpenModule,
}: {
  snapshot: ArchitectureSnapshot
  selected: string
  onSelect: (name: string) => void
  onOpenModule: (id: string) => void
}) {
  const modules = useMemo(() => moduleIndex(snapshot), [snapshot])
  const step: PipelineStep | undefined =
    snapshot.pipeline.find((candidate) => candidate.name === selected) ?? snapshot.pipeline[0]
  if (!step) return <EmptyState title="THE SCAN FOUND NO PIPELINE" />
  const module = modules.get(step.moduleId)

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-[210px_minmax(0,1fr)]">
      <nav className="min-w-0" aria-label="Steps of a quarter">
        <SectionHeading aside={`${snapshot.pipeline.length} STEPS`}>ORDERED FOLD</SectionHeading>
        <ol className="flex flex-col gap-0.5">
          {snapshot.pipeline.map((candidate) => {
            const current = candidate.name === step.name
            return (
              <li key={candidate.name}>
                <button
                  type="button"
                  aria-current={current ? 'true' : undefined}
                  onClick={() => onSelect(candidate.name)}
                  className={`flex w-full items-baseline gap-2 border px-1.5 py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass ${
                    current
                      ? 'border-dossier-brass bg-dossier-brass/20 text-dossier-ink'
                      : 'border-transparent text-dossier-ink/70 hover:border-dossier-ink/20 hover:text-dossier-ink'
                  }`}
                >
                  <span className="font-mono text-[9px] tabular-nums text-dossier-ink/45">
                    {String(candidate.order).padStart(2, '0')}
                  </span>
                  <span className="min-w-0 font-mono text-[10px] font-semibold tracking-[0.1em]">
                    {candidate.name}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>

      <article className="min-w-0" aria-label={`Step ${step.order}: ${step.name}`}>
        <SectionHeading aside={`STEP ${String(step.order).padStart(2, '0')} OF ${snapshot.pipeline.length}`}>
          {step.name.toUpperCase()}
        </SectionHeading>
        <p className="font-dossier text-[13px] leading-relaxed text-dossier-ink/85">{step.description}</p>

        <aside className="mt-3 border-l-2 border-dossier-brass bg-dossier-brass/8 px-3 py-2">
          <div className="font-mono text-[8px] tracking-[0.2em] text-dossier-ink/55">WHY HERE</div>
          <p className="mt-0.5 font-dossier text-[12px] leading-relaxed text-dossier-ink/78">
            {positionNote(snapshot, step)}
          </p>
        </aside>

        {step.summary && (
          <section className="mt-3">
            <SectionHeading>WHAT THE SOURCE SAYS</SectionHeading>
            <p className="font-dossier text-[12px] leading-relaxed text-dossier-ink/72">{step.summary}</p>
          </section>
        )}

        <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
          <section className="min-w-0">
            <SectionHeading>STATE IT TOUCHES</SectionHeading>
            {step.stateAreas.length === 0 ? (
              <p className="font-dossier text-[12px] italic text-dossier-ink/55">
                No top-level state region referenced directly.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-1">
                {step.stateAreas.map((area) => (
                  <li
                    key={area}
                    className="border border-dossier-ink/20 bg-dossier-ink/5 px-1.5 py-0.5 font-mono text-[9px] text-dossier-ink/75"
                  >
                    {area}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="min-w-0">
            <SectionHeading aside={`${step.dependencies.length}`}>WHAT IT IMPORTS</SectionHeading>
            {step.dependencies.length === 0 ? (
              <p className="font-dossier text-[12px] italic text-dossier-ink/55">Nothing inside the repository.</p>
            ) : (
              <ul className="flex flex-wrap gap-1">
                {step.dependencies.map((id) => (
                  <li key={id} className="min-w-0">
                    <ModuleLink id={id} label={modules.get(id)?.label ?? id} onOpen={onOpenModule} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dossier-ink/15 pt-2">
          <SourceLink snapshot={snapshot} at={step} />
          {module && (
            <span className="font-mono text-[9px] text-dossier-ink/50">
              {count(module.lines)} lines · {module.exports.length} exports
            </span>
          )}
        </div>
      </article>
    </div>
  )
}

export function SystemView({
  snapshot,
  selected,
  onSelect,
  onInspect,
}: {
  snapshot: ArchitectureSnapshot
  selected: string
  onSelect: (id: string) => void
  onInspect: (packageId: string) => void
}) {
  const layers = useMemo(() => packageLayers(snapshot), [snapshot])
  const relations = packageRelations(snapshot, selected)
  const pkg = snapshot.packages.find((candidate) => candidate.id === selected)
  const dependedOn = new Set(relations.imports.map((edge) => edge.packageId))

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div className="min-w-0">
        <SectionHeading aside="IMPORTS POINT DOWN">WHO MAY KNOW ABOUT WHOM</SectionHeading>
        <div className="flex flex-col gap-1.5">
          {layers.map((layer, index) => (
            <div key={layer.map((entry) => entry.id).join('-')} className="min-w-0">
              <ul className="grid min-w-0 gap-1.5 sm:grid-cols-3">
                {layer.map((entry) => {
                  const current = entry.id === selected
                  const under = dependedOn.has(entry.id)
                  return (
                    <li key={entry.id} className="min-w-0">
                      <button
                        type="button"
                        aria-pressed={current}
                        onClick={() => onSelect(entry.id)}
                        className={`flex h-full w-full flex-col gap-0.5 border px-2 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass ${
                          current
                            ? 'border-dossier-brass bg-dossier-brass/20'
                            : under
                              ? 'border-dossier-brass/45 bg-dossier-brass/6 hover:border-dossier-brass'
                              : 'border-dossier-ink/20 hover:border-dossier-ink/45'
                        }`}
                      >
                        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-dossier-ink">
                          {entry.id}
                        </span>
                        <span className="font-mono text-[8px] tabular-nums text-dossier-ink/55">
                          {entry.moduleCount} FILES · {count(entry.lines)} LINES
                        </span>
                        <span className="font-dossier text-[11px] leading-snug text-dossier-ink/70">
                          {entry.description}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {index < layers.length - 1 && (
                <div
                  className="mt-1.5 flex items-center gap-2 font-mono text-[8px] tracking-[0.2em] text-dossier-ink/45"
                  aria-hidden="true"
                >
                  <span className="h-px flex-1 bg-dossier-ink/15" />
                  <span>↓ MAY IMPORT ↓</span>
                  <span className="h-px flex-1 bg-dossier-ink/15" />
                </div>
              )}
            </div>
          ))}
        </div>

        <section className="mt-4">
          <SectionHeading aside={`${snapshot.seams.length} SEAMS`}>WHERE THE JOINS ARE</SectionHeading>
          <ul className="grid min-w-0 gap-2 md:grid-cols-2">
            {snapshot.seams.map((seam) => (
              <li key={seam.id} className="min-w-0 border border-dossier-ink/20 px-2.5 py-2">
                <h3 className="font-mono text-[9px] font-semibold tracking-[0.16em] text-dossier-ink">
                  {seam.title.toUpperCase()}
                </h3>
                <p className="mt-1 font-dossier text-[12px] leading-relaxed text-dossier-ink/75">{seam.summary}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {seam.locations.map((location) => (
                    <SourceLink
                      key={`${location.path}:${location.line}`}
                      snapshot={snapshot}
                      at={location}
                      label={`${location.path.split('/').at(-1)}:${location.line}`}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {pkg && (
        <aside className="min-w-0 border-l-2 border-dossier-brass bg-dossier-brass/6 px-3 py-2" aria-label="Selected package">
          <div className="font-mono text-[8px] tracking-[0.2em] text-dossier-ink/55">SELECTED</div>
          <h3 className="font-mono text-[11px] font-semibold tracking-[0.12em] text-dossier-ink">{pkg.name}</h3>
          <p className="mt-1 font-dossier text-[12px] leading-relaxed text-dossier-ink/75">{pkg.description}</p>
          <dl className="mt-2 flex flex-col gap-1">
            {relations.imports.map((edge) => (
              <div key={`out-${edge.packageId}`} className="flex items-baseline justify-between gap-2">
                <dt className="font-mono text-[9px] tracking-[0.12em] text-dossier-ink/60">IMPORTS {edge.packageId}</dt>
                <dd className="font-mono text-[10px] tabular-nums text-dossier-ink">
                  {edge.count}
                  {edge.typeOnlyCount > 0 && (
                    <span className="ml-1 text-[8px] text-dossier-ink/50">{edge.typeOnlyCount} TYPE-ONLY</span>
                  )}
                </dd>
              </div>
            ))}
            {relations.importedBy.map((edge) => (
              <div key={`in-${edge.packageId}`} className="flex items-baseline justify-between gap-2">
                <dt className="font-mono text-[9px] tracking-[0.12em] text-dossier-ink/60">USED BY {edge.packageId}</dt>
                <dd className="font-mono text-[10px] tabular-nums text-dossier-ink">{edge.count}</dd>
              </div>
            ))}
            {relations.imports.length + relations.importedBy.length === 0 && (
              <p className="font-dossier text-[12px] italic text-dossier-ink/55">
                No package here imports it, and it imports none.
              </p>
            )}
          </dl>
          <Button variant="quiet" size="compact" fullWidth className="mt-2" onClick={() => onInspect(pkg.id)}>
            OPEN ITS {pkg.moduleCount} FILES
          </Button>
        </aside>
      )}
    </div>
  )
}

export function ModulesView({
  snapshot,
  selected,
  onSelect,
  filters,
  onFilters,
}: {
  snapshot: ArchitectureSnapshot
  selected: string
  onSelect: (id: string) => void
  filters: { query: string; packageId: string; category: string }
  onFilters: (next: { query: string; packageId: string; category: string }) => void
}) {
  const searchId = useId()
  const packageId = useId()
  const categoryId = useId()
  const categories = useMemo(() => moduleCategories(snapshot), [snapshot])
  const matches = useMemo(() => filterModules(snapshot, filters), [snapshot, filters])
  const modules = useMemo(() => moduleIndex(snapshot), [snapshot])
  // A filter that excludes the open file leaves a detail panel describing
  // something the list beside it no longer offers; show the first match instead.
  const module: ModuleNode | undefined =
    matches.find((candidate) => candidate.id === selected) ?? matches[0] ?? modules.get(selected)

  const field =
    'min-h-8 w-full border border-dossier-ink/25 bg-dossier-paper px-2 font-mono text-[10px] text-dossier-ink placeholder:text-dossier-ink/35 focus-visible:outline-2 focus-visible:outline-dossier-brass'
  const fieldLabel = 'font-mono text-[8px] tracking-[0.2em] text-dossier-ink/55'

  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-[260px_minmax(0,1fr)]">
      <div className="min-w-0">
        <SectionHeading aside={`${matches.length} OF ${snapshot.modules.length}`}>SOURCE FILES</SectionHeading>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={searchId} className={fieldLabel}>
            SEARCH PATHS, NOTES AND EXPORTS
          </label>
          <input
            id={searchId}
            type="search"
            value={filters.query}
            onChange={(event) => onFilters({ ...filters, query: event.target.value })}
            placeholder="politicalCostOfAction, rngFor…"
            className={field}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <div className="min-w-0">
              <label htmlFor={packageId} className={fieldLabel}>
                PACKAGE
              </label>
              <select
                id={packageId}
                value={filters.packageId}
                onChange={(event) => onFilters({ ...filters, packageId: event.target.value })}
                className={field}
              >
                <option value="all">all</option>
                {snapshot.packages.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.id}
                  </option>
                ))}
              </select>
            </div>
            <div className="min-w-0">
              <label htmlFor={categoryId} className={fieldLabel}>
                LAYER
              </label>
              <select
                id={categoryId}
                value={filters.category}
                onChange={(event) => onFilters({ ...filters, category: event.target.value })}
                className={field}
              >
                <option value="all">all</option>
                {categories.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        {matches.length === 0 ? (
          <p className="mt-2 font-dossier text-[12px] italic leading-relaxed text-dossier-ink/60">
            No file in the repository matches that. Try a symbol you saw elsewhere in the atlas.
          </p>
        ) : (
          <ul className="mt-2 flex max-h-[42vh] flex-col gap-0.5 overflow-y-auto">
            {matches.map((candidate) => {
              const current = candidate.id === module?.id
              return (
                <li key={candidate.id}>
                  <button
                    type="button"
                    aria-pressed={current}
                    onClick={() => onSelect(candidate.id)}
                    title={candidate.id}
                    className={`flex w-full min-w-0 flex-col border px-1.5 py-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass ${
                      current
                        ? 'border-dossier-brass bg-dossier-brass/20'
                        : 'border-transparent hover:border-dossier-ink/20'
                    }`}
                  >
                    <span className="truncate font-mono text-[10px] font-semibold text-dossier-ink">
                      {candidate.label}
                    </span>
                    <span className="truncate font-mono text-[8px] text-dossier-ink/50">{shortPath(candidate)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {module ? (
        <article className="min-w-0" aria-label={module.id}>
          <SectionHeading aside={`${count(module.lines)} LINES`}>
            {module.packageId.toUpperCase()} · {module.category.toUpperCase()}
          </SectionHeading>
          <h3 className="font-mono text-[12px] font-semibold tracking-[0.12em] text-dossier-ink">{module.label}</h3>
          <p className="break-all font-mono text-[9px] text-dossier-ink/50">{module.id}</p>
          <p className="mt-2 font-dossier text-[12px] leading-relaxed text-dossier-ink/78">
            {module.summary || 'No leading note in the source. Read the exports and the neighbourhood below.'}
          </p>

          <section className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SectionHeading aside={`${module.exports.length}`}>WHAT IT EXPORTS</SectionHeading>
            </div>
            {module.exports.length === 0 ? (
              <p className="font-dossier text-[12px] italic text-dossier-ink/55">Nothing named.</p>
            ) : (
              <ul className="flex flex-wrap gap-1">
                {module.exports.map((symbol) => (
                  <li key={`${symbol.name}-${symbol.line}`} className="min-w-0">
                    <SourceLink snapshot={snapshot} at={symbol} label={`${symbol.name} · ${symbol.kind}`} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-3 grid min-w-0 gap-4 lg:grid-cols-2">
            <section className="min-w-0">
              <SectionHeading aside={`${module.imports.length}`}>IT IMPORTS</SectionHeading>
              {module.imports.length === 0 ? (
                <p className="font-dossier text-[12px] italic text-dossier-ink/55">Nothing inside the repository.</p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {module.imports.map((id) => (
                    <li key={id} className="min-w-0">
                      <ModuleLink id={id} label={id} onOpen={onSelect} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section className="min-w-0">
              <SectionHeading aside={`${module.importedBy.length}`}>IT IS IMPORTED BY</SectionHeading>
              {module.importedBy.length === 0 ? (
                <p className="font-dossier text-[12px] italic text-dossier-ink/55">
                  Nothing in the repository reaches it.
                </p>
              ) : (
                <ul className="flex flex-col gap-0.5">
                  {module.importedBy.map((id) => (
                    <li key={id} className="min-w-0">
                      <ModuleLink id={id} label={id} onOpen={onSelect} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="mt-3 border-t border-dossier-ink/15 pt-2">
            <SourceLink snapshot={snapshot} at={module} label={`open ${shortPath(module)}`} />
          </div>
        </article>
      ) : (
        <EmptyState title="NO FILE SELECTED" />
      )}
    </div>
  )
}
