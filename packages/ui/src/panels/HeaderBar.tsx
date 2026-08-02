/** Thin ministry letterhead: who you are, when it is, what you can spend —
 * and the treasury's exact books inline (the only numbers you get raw). */

import type { PublishedState } from '@terrarium/observation'
import { Button, Metric } from '../components/ui'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

export function HeaderBar({
  pub,
  onStudy,
  onSettings,
  onCensus,
  onFinance,
  onVerdict,
}: {
  pub: PublishedState
  onStudy: () => void
  onSettings: () => void
  onCensus: () => void
  onFinance: () => void
  /** present only once the run has ended and a report card exists */
  onVerdict?: () => void
}) {
  const t = pub.treasury
  return (
    <header className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2 border-b border-dossier-brass/70 bg-[#294235] px-3 py-2 shadow-[0_2px_0_rgba(0,0,0,0.22)] sm:px-4 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex min-w-[150px] items-center gap-3 border-r border-dossier-paper/15 pr-4">
        <div className="h-7 w-1 bg-dossier-brass" aria-hidden="true" />
        <div>
          <div className="font-dossier text-base font-semibold leading-none tracking-wide text-dossier-paper sm:text-lg">
            {pub.country}
          </div>
          <div className="mt-1 font-mono text-[9px] tabular-nums tracking-[0.14em] text-dossier-brass">{qtrLabel(pub.tick)}</div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-4 overflow-x-auto [scrollbar-width:none]">
        <Metric compact inverted label="POL.CAP" value={pub.politicalCapital.toFixed(0)} title="Political capital available for staged decisions." />
        <Metric compact inverted label={pub.inPower ? 'ELECTION' : 'STATUS'} value={pub.inPower ? `${pub.quartersToElection}Q` : 'DEPOSED'} tone={!pub.inPower || pub.quartersToElection <= 2 ? 'danger' : 'default'} title="Quarters until the electorate weighs in." />
        <button type="button" onClick={onCensus} className="shrink-0 text-left hover:opacity-75" title="Open the national census.">
          <Metric compact inverted label="POP/LF" value={`${pub.population.total.toFixed(1)}/${pub.population.laborForce.toFixed(1)}M`} />
        </button>
        <span className="h-6 w-px shrink-0 bg-dossier-paper/15" />
        <Metric compact inverted label="REVENUE" value={t.revenue.toFixed(1)} />
        <Metric compact inverted label="OUTLAYS" value={t.outlays.toFixed(1)} />
        <Metric compact inverted label="BALANCE" value={(t.balance >= 0 ? '+' : '') + t.balance.toFixed(1)} tone={t.balance < 0 ? 'danger' : 'default'} />
        <Metric compact inverted label="DEBT" value={t.debt.toFixed(0)} />
        <Metric compact inverted label="PRINTED" value={t.printed.toFixed(1)} tone={t.printed > 0.5 ? 'danger' : 'default'} />
        <Metric compact inverted label="FX RES" value={pub.reserves.toFixed(1)} tone={pub.reserves < 2 ? 'danger' : 'default'} />
      </div>

      <nav className="col-span-2 flex items-center justify-end gap-1 lg:col-span-1" aria-label="Ministry offices">
        {onVerdict && <Button onClick={onVerdict} variant="danger" size="compact">VERDICT</Button>}
        <Button onClick={onFinance} variant="secondary" size="compact" title="The financial system.">FINANCE</Button>
        <Button onClick={onStudy} variant="secondary" size="compact" title="The Study.">STUDY</Button>
        <Button onClick={onSettings} variant="secondary" size="compact" title="Records office.">RECORDS</Button>
      </nav>
    </header>
  )
}
