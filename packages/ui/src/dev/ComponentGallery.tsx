import { useState } from 'react'
import {
  Button,
  ChartFrame,
  DonutChart,
  EmptyState,
  LineChart,
  Metric,
  OverlayLayout,
  Panel,
  ProgressBar,
  SegmentedControl,
  SliderField,
} from '../components/ui'
import { SHARE_INKS } from '../shares'
import { BlankPlate } from '../components/BlankPlate/BlankPlate'

const TREND = [
  { tick: 0, value: 100 },
  { tick: 4, value: 102 },
  { tick: 8, value: 99 },
  { tick: 12, value: 106 },
  { tick: 16, value: 112 },
]

/** A deterministic, data-rich surface for visual review at `/?gallery=1`.
 * It deliberately includes every register, interactive state, populated
 * chart, and empty state that a screenshot suite needs to pin. */
export function ComponentGallery() {
  const [rate, setRate] = useState(0.18)
  const [mode, setMode] = useState<'levels' | 'shares'>('levels')

  return (
    <main className="min-h-full bg-[#22382d] p-4 text-dossier-ink sm:p-6">
      <header className="mx-auto mb-4 flex max-w-[1180px] flex-wrap items-end justify-between gap-3 border-b border-dossier-brass/60 pb-3">
        <div>
          <div className="font-mono text-[9px] tracking-[0.24em] text-dossier-brass">VISUAL REGRESSION SURFACE</div>
          <h1 className="font-dossier text-3xl font-semibold text-dossier-paper">Terrarium component gallery</h1>
        </div>
        <div className="font-mono text-[9px] tracking-[0.12em] text-dossier-paper/55">POPULATED · EMPTY · INTERACTIVE · OVERLAY</div>
      </header>

      <div className="mx-auto grid max-w-[1180px] grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel tone="felt" title="DECISION CONTROLS" bodyClassName="space-y-3 p-3">
          <div className="flex flex-wrap gap-5">
            <Metric inverted label="POLITICAL CAPITAL" value="18.9" detail="AFTER DRAFT" tone="accent" />
            <Metric inverted label="BALANCE" value="−4.2" tone="danger" />
            <Metric inverted label="ELECTION" value="6Q" />
          </div>
          <SliderField
            label="Income tax"
            min={0}
            max={0.8}
            step={0.01}
            value={rate}
            displayValue={`${(rate * 100).toFixed(0)}%`}
            currentDisplayValue="15%"
            changeDisplayValue={`+${(rate * 100 - 15).toFixed(0)} PT`}
            dirty
            politicalCost={1.1}
            onChange={(event) => setRate(Number(event.target.value))}
            onStep={(direction) => setRate((current) => Math.max(0, Math.min(0.8, current + direction * 0.01)))}
            onReset={() => setRate(0.15)}
          />
          <div className="flex flex-wrap gap-2">
            <Button variant="primary">ENACT &amp; ADVANCE</Button>
            <Button variant="secondary">CLEAR DRAFT</Button>
            <Button variant="danger">DEPOSED</Button>
          </div>
          <ProgressBar value={0.62} label="Political capital remaining" />
        </Panel>

        <Panel title="ANALYTICAL PRIMITIVES" bodyClassName="space-y-3 p-3">
          <SegmentedControl
            label="Chart mode"
            value={mode}
            onChange={setMode}
            options={[{ value: 'levels', label: 'LEVELS' }, { value: 'shares', label: 'SHARES' }]}
          />
          <ChartFrame
            title="NATIONAL OUTPUT"
            detail="1946=100 · PUBLISHED"
            value="112.0"
            legend={[{ label: 'OUTPUT', color: 'var(--color-dossier-felt)' }]}
            summary="National output rose from 100 to 112 between 1946 and 1950."
          >
            <div className="p-2"><LineChart data={TREND} primaryColor="var(--color-dossier-felt)" /></div>
          </ChartFrame>
          <DonutChart
            shares={[
              { key: 'income', label: 'Income tax', value: 18, ink: SHARE_INKS[0] },
              { key: 'corporate', label: 'Corporate', value: 12, ink: SHARE_INKS[1] },
              { key: 'tariff', label: 'Tariff', value: 7, ink: SHARE_INKS[2] },
            ]}
            format={(value) => value.toFixed(1)}
          />
        </Panel>

        <Panel tone="terminal" title="TERMINAL REGISTER" bodyClassName="p-4">
          <div className="font-mono text-xs leading-relaxed text-terminal-primary">
            CPI.INFL&nbsp;&nbsp;&nbsp;4.7 %/YR<br />
            UNEMP&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8.2 %<br />
            APPROVAL&nbsp;&nbsp;51.0 %<span className="terminal-cursor">_</span>
          </div>
        </Panel>

        <Panel tone="map" title="EMPTY AND LOCKED STATES" bodyClassName="grid gap-3 p-3 sm:grid-cols-2">
          <EmptyState title="NO RETURNS FILED" requirement="BANK SUPERVISION">Fund the supervisor before the leverage becomes legible.</EmptyState>
          <EmptyState title="RECORD TOO SHORT" compact>Advance several quarters to establish a trend.</EmptyState>
        </Panel>

        <div className="lg:col-span-2">
          <Panel tone="felt" title="INSTRUMENT ACCESS STATES" bodyClassName="grid gap-3 p-3 sm:grid-cols-2">
            <div className="h-52">
              <BlankPlate indicator="unemployment" currentCapacity={0.18} fundedAt={0.35} onOpenCapacity={() => undefined} />
            </div>
            <div className="h-52">
              <BlankPlate indicator="inflation" availability="awaiting" currentCapacity={0.18} fundedAt={0.08} />
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="OVERLAY INFORMATION ARCHITECTURE" bodyClassName="p-4">
            <OverlayLayout
              summary={<div className="flex gap-6"><Metric label="REVENUE" value="37.0" /><Metric label="OUTLAYS" value="41.2" /><Metric label="BALANCE" value="−4.2" tone="danger" /></div>}
              toolbar={<SegmentedControl label="Ledger side" value="revenue" onChange={() => undefined} options={[{ value: 'revenue', label: 'REVENUE' }, { value: 'outlays', label: 'OUTLAYS' }]} />}
              note="A consistent explanatory note tells the player what is exact, what is estimated, and which institution changes the view."
              footer="SOURCE · FREQUENCY · REVISION STATUS"
            >
              <ChartFrame title="QUARTERLY RECORD" detail="EXACT" summary="Example populated chart region.">
                <div className="p-3"><LineChart data={TREND} /></div>
              </ChartFrame>
            </OverlayLayout>
          </Panel>
        </div>
      </div>
    </main>
  )
}
