/**
 * The maintenance hatch. Deliberately NOT diegetic: this is the one surface in
 * the app that is not part of the fiction, and it is styled to be unmistakable
 * about that — no brass, no manila, no instrument register. If a dev tool ever
 * reads as game furniture, someone will eventually ship it to a player.
 *
 * A drawer rather than a modal, so you can run a scenario and watch the wall
 * change behind it.
 *
 * Two jobs:
 *
 *  1. **Scenario** — build a country and run it to a year. There is no way to
 *     *set* GDP (ADR-0001: state is derived from (params, seed, actionLog)), so
 *     you specify opening conditions and let the economy live. A scenario is
 *     fully described by the fields here, which is what makes a bug found at
 *     1975 reachable by anyone.
 *
 *  2. **Truth** — what the fog is hiding. The published wall shows lagged,
 *     noisy, revised numbers; this shows what is actually true underneath. It
 *     arrives as an unnamed tree (see `DevNode`) so the boundary survives the
 *     convenience.
 */

import { useEffect, useState } from 'react'
import { COUNTRY_CATALOG, type CountryScenarioId } from '@terrarium/engine'
import { useGame } from '../store/gameStore'
import type { DevNode } from '../worker/protocol'
import { DEFAULT_SCENARIO, YEAR_ZERO, tickLabel, type DevScenario } from '../devScenario'
import { Tooltip } from '../components/ui'

const CAPACITIES = ['tax', 'statistical', 'administrative', 'education'] as const

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  const field = (
    <label tabIndex={hint ? 0 : undefined} className="flex flex-col gap-1">
      <span className="font-mono text-[10px] tracking-[0.15em] text-terminal-primary/60">{label}</span>
      {children}
    </label>
  )
  return hint ? <Tooltip content={hint}>{field}</Tooltip> : field
}

const inputCls =
  'w-full border border-terminal-grid bg-terminal-bg px-2 py-1 font-mono text-[11px] tabular-nums text-terminal-primary outline-none focus:border-terminal-primary'

/** One row of the truth tree. Collapsed by default below the top level — the
 * state object is large and an auto-expanded dump is unreadable. */
function TreeRow({ node, depth }: { node: DevNode; depth: number }) {
  const [open, setOpen] = useState(depth < 1)
  const isBranch = node.children !== undefined && node.children.length > 0

  if (!isBranch) {
    return (
      <div className="flex justify-between gap-3 py-px" style={{ paddingLeft: depth * 10 }}>
        <span className="text-terminal-primary/50">{node.key}</span>
        <span className="tabular-nums text-terminal-primary">{String(node.value)}</span>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1 py-px text-left text-terminal-primary hover:bg-terminal-primary/10"
        style={{ paddingLeft: depth * 10 }}
      >
        <span className="text-terminal-primary/40">{open ? '▾' : '▸'}</span>
        <span>{node.key}</span>
        <span className="text-terminal-primary/30">({node.children!.length})</span>
      </button>
      {open && node.children!.map((c, i) => <TreeRow key={`${c.key}-${i}`} node={c} depth={depth + 1} />)}
    </div>
  )
}

export function DevConsole({ onClose }: { onClose: () => void }) {
  const { runScenario, inspectTruth, devTruth, published } = useGame()
  const [sc, setSc] = useState<DevScenario>(DEFAULT_SCENARIO)
  const [tab, setTab] = useState<'scenario' | 'truth'>('scenario')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const set = <K extends keyof DevScenario>(k: K, v: DevScenario[K]) => setSc((s) => ({ ...s, [k]: v }))

  const num = (raw: string): number | undefined => {
    if (raw.trim() === '') return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }

  return (
    <div className="fixed right-0 top-0 z-[60] flex h-full w-[380px] max-w-full flex-col border-l-2 border-terminal-alert bg-terminal-bg font-mono text-[11px] text-terminal-primary">
      <div className="flex items-center justify-between border-b border-terminal-alert px-3 py-2">
        <span className="tracking-[0.2em] text-terminal-alert">DEV CONSOLE — NOT IN THE GAME</span>
        <Tooltip content="Close the developer console. Escape works too.">
          <button onClick={onClose} aria-label="Close developer console" className="text-terminal-primary/60 hover:text-terminal-alert">
            ✕
          </button>
        </Tooltip>
      </div>

      <div className="flex border-b border-terminal-grid">
        {(['scenario', 'truth'] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t)
              if (t === 'truth') inspectTruth()
            }}
            className={`flex-1 px-3 py-1.5 tracking-[0.2em] ${
              tab === t ? 'bg-terminal-primary/15 text-terminal-primary' : 'text-terminal-primary/40 hover:text-terminal-primary/70'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {tab === 'scenario' ? (
          <div className="flex flex-col gap-3">
            <p className="leading-relaxed text-terminal-primary/50">
              State is derived from (params, seed, log), so there is nothing to set directly. Give
              the country its opening conditions and a year; the economy gets there by living.
            </p>

            <Field label="COUNTRY RECIPE" hint="Choose a fixed country or the bounded procedural generator.">
              <select
                className={inputCls}
                value={sc.country ?? 'procedural'}
                onChange={(e) => set('country', e.target.value as CountryScenarioId)}
              >
                {COUNTRY_CATALOG.map((country) => (
                  <option key={country.id} value={country.id}>{country.name} — {country.byline}</option>
                ))}
              </select>
            </Field>

            <Field label="SEED" hint="Same seed + same scenario = same run, always.">
              <input className={inputCls} value={sc.seed} onChange={(e) => set('seed', e.target.value)} />
            </Field>

            <Field label={`YEAR — ${YEAR_ZERO} to 2050`} hint="Quarters to fast-forward before handing you the controls.">
              <input
                className={inputCls}
                type="number"
                min={YEAR_ZERO}
                max={2050}
                value={sc.year}
                onChange={(e) => set('year', num(e.target.value) ?? YEAR_ZERO)}
              />
            </Field>

            <Field label="DEVELOPMENT — blank = recipe" hint="0.05..1. Scales starting capital, TFP and capacities.">
              <input
                className={inputCls}
                type="number"
                step="0.05"
                min={0.05}
                max={1}
                placeholder="(generated)"
                value={sc.development ?? ''}
                onChange={(e) => set('development', num(e.target.value))}
              />
            </Field>

            <Field label="POPULATION SCALE — blank = 1×" hint="Multiplies every cohort and the age pyramid together.">
              <input
                className={inputCls}
                type="number"
                step="0.25"
                min={0.05}
                placeholder="1"
                value={sc.populationScale ?? ''}
                onChange={(e) => set('populationScale', num(e.target.value))}
              />
            </Field>

            <Field label="OPENNESS — blank = recipe" hint="Trade exposure multiplier.">
              <input
                className={inputCls}
                type="number"
                step="0.1"
                min={0}
                placeholder="(generated)"
                value={sc.openness ?? ''}
                onChange={(e) => set('openness', num(e.target.value))}
              />
            </Field>

            <div className="mt-1 tracking-[0.15em] text-terminal-primary/60">STARTING CAPACITIES</div>
            <div className="grid grid-cols-2 gap-2">
              {CAPACITIES.map((c) => (
                <Field
                  key={c}
                  label={c.toUpperCase()}
                  hint={c === 'statistical' ? 'Raise this to burn off the fog and see clean numbers.' : undefined}
                >
                  <input
                    className={inputCls}
                    type="number"
                    step="0.05"
                    min={0}
                    max={1}
                    placeholder="(gen)"
                    value={sc.capacities?.[c] ?? ''}
                    onChange={(e) =>
                      set('capacities', { ...sc.capacities, [c]: num(e.target.value) })
                    }
                  />
                </Field>
              ))}
            </div>

            <button
              onClick={() => runScenario(sc)}
              className="mt-2 border border-terminal-primary px-3 py-2 tracking-[0.2em] text-terminal-primary hover:bg-terminal-primary hover:text-terminal-bg"
            >
              RUN SCENARIO
            </button>

            <button
              onClick={() => setSc(DEFAULT_SCENARIO)}
              className="border border-terminal-grid px-3 py-1.5 tracking-[0.2em] text-terminal-primary/50 hover:border-terminal-primary/50 hover:text-terminal-primary"
            >
              RESET FIELDS
            </button>

            <p className="leading-relaxed text-terminal-primary/40">
              This produces an ordinary save — same init, same pipeline, same RNG. Export it from
              the records office and it replays anywhere.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-terminal-primary/50">
                {devTruth ? `TRUE STATE @ ${tickLabel(devTruth.tick)}` : 'NO SNAPSHOT'}
                {published && devTruth && devTruth.tick !== published.tick && (
                  <span className="text-terminal-alert"> · STALE</span>
                )}
              </span>
              <button
                onClick={inspectTruth}
                className="border border-terminal-grid px-2 py-0.5 tracking-[0.2em] text-terminal-primary/70 hover:border-terminal-primary hover:text-terminal-primary"
              >
                REFRESH
              </button>
            </div>
            <p className="leading-relaxed text-terminal-primary/40">
              What the wall shows is lagged, noisy and subject to revision. This is what is
              actually true underneath it.
            </p>
            <div className="border-t border-terminal-grid pt-2">
              {devTruth?.tree.map((n, i) => <TreeRow key={`${n.key}-${i}`} node={n} depth={0} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
