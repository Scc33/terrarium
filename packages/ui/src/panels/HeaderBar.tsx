/** Thin ministry letterhead: who you are, when it is, what you can spend —
 * and the treasury's exact books inline (the only numbers you get raw). */

import { FIRST_YEAR } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useRef } from 'react'
import { Button, Metric, Tooltip, TooltipLabel } from '../components/ui'
import { activeRuleMarks, capitalReading } from '../gameRules'

const qtrLabel = (q: number) => `${FIRST_YEAR + Math.floor(q / 4)} Q${(q % 4) + 1}`

function HeaderGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="flex max-w-full shrink-0 flex-col gap-0.5 border-l border-dossier-paper/15 pl-2" aria-label={label}>
      <span className="font-mono text-[8px] font-semibold tracking-[0.22em] text-dossier-brass/80">{label}</span>
      <div className="flex flex-wrap items-baseline gap-1.5 [&_div]:!gap-1 xl:flex-nowrap">{children}</div>
    </section>
  )
}

export function HeaderBar({
  pub,
  onStudy,
  onManual,
  onSettings,
  onCensus,
  onFinance,
  onAccounts,
  onIndustry,
  onHouseholds,
  onVerdict,
}: {
  pub: PublishedState
  onStudy: () => void
  onManual: () => void
  onSettings: () => void
  onCensus: () => void
  onFinance: () => void
  onAccounts: () => void
  onIndustry: () => void
  onHouseholds: () => void
  /** present only once the run has ended and a report card exists */
  onVerdict?: () => void
}) {
  const t = pub.treasury
  const capital = capitalReading(pub, null)
  const ruleMarks = activeRuleMarks(pub.rules)
  const officesMenuRef = useRef<HTMLDetailsElement>(null)
  const openOffice = (open: () => void) => {
    officesMenuRef.current?.querySelector<HTMLElement>('summary')?.focus()
    if (officesMenuRef.current) officesMenuRef.current.open = false
    open()
  }
  return (
    <header className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-2 border-b border-dossier-brass/70 bg-[#294235] px-3 py-2 shadow-[0_2px_0_rgba(0,0,0,0.22)] sm:px-4 xl:grid-cols-[auto_minmax(0,1fr)_auto]">
      <div className="flex min-w-[150px] items-center gap-2.5 border-r border-dossier-paper/15 pr-3">
        <div className="h-7 w-1 bg-dossier-brass" aria-hidden="true" />
        <div>
          <div className="font-dossier text-base font-semibold leading-none tracking-wide text-dossier-paper sm:text-lg">
            {pub.country}
          </div>
          <div className="mt-1 font-mono text-[9px] tabular-nums tracking-[0.14em] text-dossier-brass">
            {qtrLabel(pub.tick)}
            {ruleMarks.length > 0 && (
              <TooltipLabel
                label={`${ruleMarks.length} standing ${ruleMarks.length === 1 ? 'order' : 'orders'} in force`}
                content={`Standing orders in force: ${ruleMarks.join(', ')}.`}
                className="ml-1.5 text-dossier-paper/70"
              >
                · {ruleMarks.length} {ruleMarks.length === 1 ? 'ORDER' : 'ORDERS'}
              </TooltipLabel>
            )}
            {pub.countryAuthored && (
              <TooltipLabel
                label="Drafted country"
                content="A player-made country. It uses the same rules, but its difficulty has not been tested."
                className="ml-1.5 text-dossier-paper/70"
              >
                · DRAFTED
              </TooltipLabel>
            )}
          </div>
        </div>
      </div>

      <div data-header-metrics className="order-3 col-span-2 flex min-w-0 flex-wrap items-center gap-2 overflow-visible pb-0.5 xl:order-none xl:col-span-1 xl:flex-nowrap xl:overflow-x-auto xl:pb-0 xl:[scrollbar-width:none]">
        <HeaderGroup label="POLITICAL">
          <Metric
            compact
            inverted
            label="CAPITAL"
            value={pub.rules.unlimitedCapital ? capital.available : pub.politicalCapital.toFixed(0)}
            title={
              pub.rules.unlimitedCapital
                ? 'Points you spend to change policy. Orders are priced as usual under this rule, but the cabinet is never charged.'
                : 'Points you spend to change policy. Opposition from powerful groups makes some changes cost more.'
            }
          />
          <Metric compact inverted label={pub.inPower ? 'ELECTION' : 'STATUS'} value={pub.inPower ? `${pub.quartersToElection}Q` : 'DEPOSED'} tone={!pub.inPower || pub.quartersToElection <= 2 ? 'danger' : 'default'} title="Quarters until the next election. Lose it and your run may end." />
        </HeaderGroup>
        <HeaderGroup label="DEMOGRAPHY">
          <Tooltip content="Total population and people working or looking for work, in millions. Select to open the census.">
            <button type="button" onClick={onCensus} className="shrink-0 text-left hover:opacity-75 focus-visible:outline-2 focus-visible:outline-dossier-brass">
              <Metric compact inverted label="POP / LABOUR" value={`${pub.population.total.toFixed(1)} / ${pub.population.laborForce.toFixed(1)}M`} />
            </button>
          </Tooltip>
        </HeaderGroup>
        <HeaderGroup label="TREASURY">
          <Metric compact inverted label="REV / OUT" value={`${t.revenue.toFixed(1)} / ${t.outlays.toFixed(1)}`} title="Money collected and spent this quarter." />
          <Metric compact inverted label="BALANCE" value={(t.balance >= 0 ? '+' : '') + t.balance.toFixed(1)} tone={t.balance < 0 ? 'danger' : 'default'} title="Revenue minus spending this quarter. Below zero is a deficit." />
          <Metric compact inverted label="DEBT" value={t.debt.toFixed(0)} title="Money the government still owes." />
          <Metric className="hidden lg:flex" compact inverted label="RESERVES" value={pub.reserves.toFixed(1)} tone={pub.reserves < 2 ? 'danger' : 'default'} title="Foreign money held by the central bank. It pays for imports when foreign earnings fall." />
          {t.printed > 0.05 && <Metric compact inverted label="PRINTED" value={t.printed.toFixed(1)} tone="danger" title="New money used to cover a deficit that lenders would not finance. Too much can raise inflation." />}
        </HeaderGroup>
      </div>

      {/* Seven offices cost more than the ordinary desktop header can spare
          before the conditional verdict joins them.
          Keep the direct row to genuinely wide screens so a new office cannot
          silently buy its space by shearing the Treasury figures again. */}
      <nav data-tour="offices" className="hidden items-center justify-end gap-1 min-[2048px]:flex" aria-label="Ministry offices">
        {onVerdict && <Button onClick={onVerdict} variant="danger" size="compact" title="See how historians judge the finished run.">VERDICT</Button>}
        <Button onClick={onHouseholds} variant="secondary" size="compact" title="See poverty and real household income for every fifth of the population.">HOUSEHOLDS</Button>
        <Button onClick={onIndustry} variant="secondary" size="compact" title="See which industries make the economy’s output and where people work.">INDUSTRY</Button>
        <Button onClick={onAccounts} variant="secondary" size="compact" title="See who buys the economy’s output: households, investors, government or other countries.">ACCOUNTS</Button>
        <Button onClick={onFinance} variant="secondary" size="compact" title="See lending, banks and asset prices, including signs of a bubble or crisis.">FINANCE</Button>
        <Button onClick={onStudy} variant="secondary" size="compact" title="Test this country across many possible futures before playing it.">STUDY</Button>
        <Button onClick={onSettings} variant="secondary" size="compact" title="Save, load or leave this run.">RECORDS</Button>
        <Button onClick={onManual} variant="secondary" size="compact" title="The manual: every lever, every instrument, how the published figures are made, and what happens when you advance a quarter.">HANDBOOK</Button>
      </nav>
      <details ref={officesMenuRef} data-tour="offices" className="relative justify-self-end min-[2048px]:hidden">
        <summary className="flex min-h-8 list-none items-center border border-dossier-paper/30 px-2.5 font-mono text-[9px] font-medium tracking-[0.15em] text-dossier-paper marker:hidden hover:border-dossier-brass hover:text-dossier-brass">
          OFFICES <span className="ml-2 text-dossier-brass" aria-hidden="true">▾</span>
        </summary>
        <nav className="absolute right-0 top-full z-40 mt-1 flex min-w-36 flex-col gap-1 border border-dossier-brass bg-[#22382d] p-2 shadow-[6px_8px_0_rgba(0,0,0,0.28)]" aria-label="Ministry offices">
          {onVerdict && <Button onClick={() => openOffice(onVerdict)} variant="danger" size="compact" title="See how historians judge the finished run.">VERDICT</Button>}
          <Button onClick={() => openOffice(onHouseholds)} variant="secondary" size="compact" title="See poverty and income across the population.">HOUSEHOLDS</Button>
          <Button onClick={() => openOffice(onIndustry)} variant="secondary" size="compact" title="See which industries make the economy’s output.">INDUSTRY</Button>
          <Button onClick={() => openOffice(onAccounts)} variant="secondary" size="compact" title="See who buys the economy’s output.">ACCOUNTS</Button>
          <Button onClick={() => openOffice(onFinance)} variant="secondary" size="compact" title="See lending, banks and asset prices.">FINANCE</Button>
          <Button onClick={() => openOffice(onStudy)} variant="secondary" size="compact" title="Test this country across many possible futures.">STUDY</Button>
          <Button onClick={() => openOffice(onSettings)} variant="secondary" size="compact" title="Save, load or leave this run.">RECORDS</Button>
          <Button onClick={() => openOffice(onManual)} variant="secondary" size="compact" title="The manual: every lever, every instrument, and how the figures are made.">HANDBOOK</Button>
        </nav>
      </details>
    </header>
  )
}
