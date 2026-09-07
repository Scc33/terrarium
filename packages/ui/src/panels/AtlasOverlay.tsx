/**
 * The engine atlas — the deepest floor of the same building the handbook is on.
 *
 * A dial has a tooltip, a lever has a handbook entry, a published figure has a
 * methodology. Under all of that is a repository, and until now the game had
 * nothing to say about it (#128). Everything on this page is scanned out of the
 * source by `packages/architecture-visualizer`; the arithmetic and the
 * derivations live in `../atlas`, and this file is the shell around the three
 * views in `./AtlasViews`.
 *
 * Two things about the shape:
 *
 * - **The snapshot arrives by dynamic import.** It is 400KB of scanned
 *   repository, which has no business in the bundle a player downloads to run a
 *   country. It is fetched the first time the atlas is opened and never again,
 *   which is also why this component has a loading state at all.
 * - **Only the file list gets an inner scroll.** The modal body already
 *   scrolls, and nesting a second scroller inside it hides content behind a
 *   scrollbar the reader has no reason to expect. 154 files are the one list
 *   long enough to be worse without one.
 *
 * The three views themselves are in `./AtlasViews`.
 */

import { useEffect, useState } from 'react'
import type { ArchitectureSnapshot } from '@terrarium/architecture-visualizer'
import { EmptyState, Metric, Modal, OverlayLayout, SegmentedControl } from '../components/ui'
import { ATLAS_VIEWS, atlasSummary, type AtlasView } from '../atlas'
import { ModulesView, PipelineView, SystemView } from './AtlasViews'

const count = (value: number) => new Intl.NumberFormat('en-US').format(value)

export function AtlasOverlay({ onClose }: { onClose: () => void }) {
  const [snapshot, setSnapshot] = useState<ArchitectureSnapshot | null>(null)
  const [failed, setFailed] = useState(false)
  const [view, setView] = useState<AtlasView>('pipeline')
  const [step, setStep] = useState('statistics')
  const [packageId, setPackageId] = useState('engine')
  const [module, setModule] = useState('packages/engine/src/pipeline/pipeline.ts')
  const [filters, setFilters] = useState({ query: '', packageId: 'all', category: 'all' })

  useEffect(() => {
    let live = true
    import('@terrarium/architecture-visualizer')
      .then((loaded) => {
        if (live) setSnapshot(loaded.architecture)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [])

  const openModule = (id: string) => {
    setModule(id)
    setView('modules')
  }

  const summary = snapshot ? atlasSummary(snapshot) : null

  return (
    <Modal title="THE ENGINE ATLAS — HOW THIS GAME IS BUILT" size="full" onClose={onClose}>
      {failed ? (
        <EmptyState title="THE MAP DID NOT ARRIVE">
          The scanned repository is fetched separately from the game and this browser could not
          load it. The atlas is a reading of the source, so nothing about the run is affected.
        </EmptyState>
      ) : !snapshot || !summary ? (
        <EmptyState title="READING THE REPOSITORY…" />
      ) : (
        <OverlayLayout
          summary={
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <Metric compact label="PACKAGES" value={String(summary.packages)} />
              <Metric compact label="FILES" value={count(summary.modules)} />
              <Metric compact label="IMPORTS" value={count(summary.imports)} />
              <Metric compact label="LINES" value={count(summary.lines)} />
              <Metric
                compact
                label="SCANNED AT"
                value={summary.revision}
                title="The commit this map was drawn from. Every source link on this page points at the repository as it stood then, so the line numbers still mean what they say."
              />
            </div>
          }
          toolbar={
            <SegmentedControl
              label="Atlas views"
              value={view}
              onChange={setView}
              options={ATLAS_VIEWS.map((entry) => ({
                value: entry.id,
                label: entry.label,
                title: entry.question,
              }))}
            />
          }
          note="Nothing here is fogged, and nothing here is about your country. The atlas reads the repository — the same source you can open — rather than the state of the run."
          footer="SCANNED FROM THE TYPESCRIPT AST · TICK ORDER · IMPORTS · EXPORTS · STATE REFERENCES"
        >
          {view === 'pipeline' && (
            <PipelineView snapshot={snapshot} selected={step} onSelect={setStep} onOpenModule={openModule} />
          )}
          {view === 'system' && (
            <SystemView
              snapshot={snapshot}
              selected={packageId}
              onSelect={setPackageId}
              onInspect={(id) => {
                setFilters({ query: '', packageId: id, category: 'all' })
                setModule(snapshot.modules.find((entry) => entry.packageId === id)?.id ?? module)
                setView('modules')
              }}
            />
          )}
          {view === 'modules' && (
            <ModulesView
              snapshot={snapshot}
              selected={module}
              onSelect={setModule}
              filters={filters}
              onFilters={setFilters}
            />
          )}
        </OverlayLayout>
      )}
    </Modal>
  )
}
