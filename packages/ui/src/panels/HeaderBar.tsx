/** Thin ministry letterhead: who you are, when it is, what you can spend —
 * and the treasury's exact books inline (the only numbers you get raw). */

import type { PublishedState } from '@terrarium/observation'

const qtrLabel = (q: number) => `${1946 + Math.floor(q / 4)} Q${(q % 4) + 1}`

function Fig({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-mono text-[9px] tracking-[0.15em] text-dossier-paper/50">{label}</span>
      <span className={`font-mono text-xs tabular-nums ${warn ? 'text-terminal-alert' : 'text-dossier-paper'}`}>
        {value}
      </span>
    </span>
  )
}

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
  const hBtn =
    'border border-dossier-paper/25 px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-dossier-paper/70 hover:border-dossier-brass hover:text-dossier-brass'
  return (
    <header className="flex min-w-0 items-center gap-5 overflow-hidden border-b-2 border-dossier-brass bg-dossier-felt px-4 py-2">
      <div className="flex items-baseline gap-3">
        <span className="font-dossier text-lg font-semibold tracking-wide text-dossier-paper">
          {pub.country}
        </span>
        <span className="font-mono text-xs tabular-nums text-dossier-brass">{qtrLabel(pub.tick)}</span>
      </div>
      <div className="h-5 w-px bg-dossier-paper/20" />
      <span title="Political capital — spent on every dial change and programme. Earned from enfranchisement-weighted approval.">
        <Fig label="POL.CAP" value={pub.politicalCapital.toFixed(0)} />
      </span>
      {pub.inPower ? (
        <span title="Quarters until the electorate weighs in. Approval below the line means the dials stop being yours.">
          <Fig label="ELECTION" value={`${pub.quartersToElection}Q`} warn={pub.quartersToElection <= 2} />
        </span>
      ) : (
        <span className="font-mono text-xs font-medium tracking-[0.2em] text-terminal-alert">DEPOSED</span>
      )}
      <button
        onClick={onCensus}
        className="cursor-pointer hover:opacity-80"
        title="Census figures: total population and labour force (millions), live — the transition is underway. Click for the age pyramid."
      >
        <Fig label="POP/LF" value={`${pub.population.total.toFixed(1)}/${pub.population.laborForce.toFixed(1)}M`} />
      </button>
      <div className="h-5 w-px bg-dossier-paper/20" />
      <div className="flex min-w-0 flex-1 items-center gap-4 overflow-x-auto">
        <span title="Tax revenue collected this quarter — gated by tax administration capacity, not by the true size of the economy.">
          <Fig label="REV" value={t.revenue.toFixed(1)} />
        </span>
        <span title="All spending this quarter: programmes, subsidies, capacity building, and debt interest.">
          <Fig label="OUT" value={t.outlays.toFixed(1)} />
        </span>
        <span title="Revenue minus outlays. Persistent deficits become debt; deficits the bond market won't fund become printing.">
          <Fig label="BAL" value={(t.balance >= 0 ? '+' : '') + t.balance.toFixed(1)} warn={t.balance < 0} />
        </span>
        <span title="Outstanding government debt. Interest costs rise with the debt burden.">
          <Fig label="DEBT" value={t.debt.toFixed(0)} />
        </span>
        <span title="Money the mint has created to cover deficits the bond market refused. Feeds inflation expectations directly.">
          <Fig label="PRINTED" value={t.printed.toFixed(1)} warn={t.printed > 0.5} />
        </span>
        <span title="Foreign-exchange reserves. When they run out, the currency depreciates and imports get dearer.">
          <Fig label="FX RES" value={pub.reserves.toFixed(1)} warn={pub.reserves < 2} />
        </span>
      </div>
      {onVerdict && (
        <button
          onClick={onVerdict}
          className="border border-dossier-warn px-2 py-1 font-mono text-[9px] tracking-[0.2em] text-dossier-warn hover:bg-dossier-warn hover:text-dossier-paper"
          title="The historians' verdict on your run."
        >
          VERDICT
        </button>
      )}
      <button onClick={onFinance} className={hBtn} title="The financial system: the asset-price bubble and the leverage build-up — and the banking crises they earned.">
        FINANCE
      </button>
      <button onClick={onStudy} className={hBtn} title="The Study: analysis drawn from your published statistics — the Phillips board.">
        STUDY
      </button>
      <button onClick={onSettings} className={hBtn} title="Records office: export, import, new country.">
        RECORDS
      </button>
    </header>
  )
}
