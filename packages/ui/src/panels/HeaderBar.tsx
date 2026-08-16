/** Thin ministry letterhead: who you are, when it is, what you can spend —
 * and the treasury's exact books inline (the only numbers you get raw). */

import type { PublishedState } from '@terrarium/observation'
import { Button, Metric } from '../components/ui'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

function HeaderGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex shrink-0 flex-col gap-0.5 border-l border-dossier-paper/15 pl-2.5" aria-label={label}>
      <span className="font-mono text-[8px] font-semibold tracking-[0.22em] text-dossier-brass/80">{label}</span>
      <div className="flex items-baseline gap-2">{children}</div>
    </section>
  )
}

export function HeaderBar({
  pub,
  onStudy,
  onSettings,
  onCensus,
  onFinance,
  onAccounts,
  onVerdict,
}: {
  pub: PublishedState
  onStudy: () => void
  onSettings: () => void
  onCensus: () => void
  onFinance: () => void
  onAccounts: () => void
  /** present only once the run has ended and a report card exists */
  onVerdict?: () => void
}) {
  const t = pub.treasury
  return (
    <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 border-b border-dossier-brass/70 bg-[#294235] px-3 py-2 shadow-[0_2px_0_rgba(0,0,0,0.22)] sm:px-4 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex min-w-[150px] items-center gap-3 border-r border-dossier-paper/15 pr-4">
        <div className="h-7 w-1 bg-dossier-brass" aria-hidden="true" />
        <div>
          <div className="font-dossier text-base font-semibold leading-none tracking-wide text-dossier-paper sm:text-lg">
            {pub.country}
          </div>
          <div className="mt-1 font-mono text-[9px] tabular-nums tracking-[0.14em] text-dossier-brass">
            {qtrLabel(pub.tick)}
            {pub.mode === 'god' && <span className="ml-1.5 text-dossier-paper/70">· GOD MODE</span>}
            {pub.countryAuthored && (
              <span
                className="ml-1.5 text-dossier-paper/70"
                title="A posting somebody wrote. It runs through the same engine as every other country, but nobody has balanced it — the catalogue's difficulty stamps do not apply."
              >
                · DRAFTED
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="order-3 col-span-2 flex min-w-0 items-center gap-3 overflow-x-auto pb-0.5 [scrollbar-width:none] xl:order-none xl:col-span-1 xl:pb-0">
        <HeaderGroup label="POLITICAL">
          <Metric compact inverted label="CAPITAL" value={pub.politicalCapital.toFixed(0)} title="Political capital available for staged decisions." />
          <Metric compact inverted label={pub.inPower ? 'ELECTION' : 'STATUS'} value={pub.inPower ? `${pub.quartersToElection}Q` : 'DEPOSED'} tone={!pub.inPower || pub.quartersToElection <= 2 ? 'danger' : 'default'} title="Quarters until the electorate weighs in." />
        </HeaderGroup>
        <HeaderGroup label="DEMOGRAPHY">
          <button type="button" onClick={onCensus} className="shrink-0 text-left hover:opacity-75 focus-visible:outline-2 focus-visible:outline-dossier-brass" title="Open the national census.">
            <Metric compact inverted label="POP / LABOUR" value={`${pub.population.total.toFixed(1)} / ${pub.population.laborForce.toFixed(1)}M`} />
          </button>
        </HeaderGroup>
        <HeaderGroup label="TREASURY">
          <Metric compact inverted label="REV / OUT" value={`${t.revenue.toFixed(1)} / ${t.outlays.toFixed(1)}`} />
          <Metric compact inverted label="BALANCE" value={(t.balance >= 0 ? '+' : '') + t.balance.toFixed(1)} tone={t.balance < 0 ? 'danger' : 'default'} />
          <Metric compact inverted label="DEBT" value={t.debt.toFixed(0)} />
          <div className="hidden lg:block">
            <Metric compact inverted label="FX RESERVES" value={pub.reserves.toFixed(1)} tone={pub.reserves < 2 ? 'danger' : 'default'} />
          </div>
          {t.printed > 0.05 && <Metric compact inverted label="PRINTED" value={t.printed.toFixed(1)} tone="danger" />}
        </HeaderGroup>
      </div>

      <nav className="hidden items-center justify-end gap-1 xl:flex" aria-label="Ministry offices">
        {onVerdict && <Button onClick={onVerdict} variant="danger" size="compact">VERDICT</Button>}
        <Button onClick={onAccounts} variant="secondary" size="compact" title="The expenditure accounts: who the economy’s output is for.">ACCOUNTS</Button>
        <Button onClick={onFinance} variant="secondary" size="compact" title="The financial system.">FINANCE</Button>
        <Button onClick={onStudy} variant="secondary" size="compact" title="The Study.">STUDY</Button>
        <Button onClick={onSettings} variant="secondary" size="compact" title="Records office.">RECORDS</Button>
      </nav>
      <details className="relative justify-self-end xl:hidden">
        <summary className="flex min-h-8 list-none items-center border border-dossier-paper/30 px-2.5 font-mono text-[9px] font-medium tracking-[0.15em] text-dossier-paper marker:hidden hover:border-dossier-brass hover:text-dossier-brass">
          OFFICES <span className="ml-2 text-dossier-brass" aria-hidden="true">▾</span>
        </summary>
        <nav className="absolute right-0 top-full z-40 mt-1 flex min-w-36 flex-col gap-1 border border-dossier-brass bg-[#22382d] p-2 shadow-[6px_8px_0_rgba(0,0,0,0.28)]" aria-label="Ministry offices">
          {onVerdict && <Button onClick={onVerdict} variant="danger" size="compact">VERDICT</Button>}
          <Button onClick={onAccounts} variant="secondary" size="compact">ACCOUNTS</Button>
          <Button onClick={onFinance} variant="secondary" size="compact">FINANCE</Button>
          <Button onClick={onStudy} variant="secondary" size="compact">STUDY</Button>
          <Button onClick={onSettings} variant="secondary" size="compact">RECORDS</Button>
        </nav>
      </details>
    </header>
  )
}
