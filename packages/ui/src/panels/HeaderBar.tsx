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

export function HeaderBar({ pub }: { pub: PublishedState }) {
  const t = pub.treasury
  return (
    <header className="flex items-center gap-5 border-b-2 border-dossier-brass bg-dossier-felt px-4 py-2">
      <div className="flex items-baseline gap-3">
        <span className="font-dossier text-lg font-semibold tracking-wide text-dossier-paper">
          {pub.country}
        </span>
        <span className="font-mono text-xs tabular-nums text-dossier-brass">{qtrLabel(pub.tick)}</span>
      </div>
      <div className="h-5 w-px bg-dossier-paper/20" />
      <Fig label="POL.CAP" value={pub.politicalCapital.toFixed(0)} />
      {pub.inPower ? (
        <Fig label="ELECTION" value={`${pub.quartersToElection}Q`} warn={pub.quartersToElection <= 2} />
      ) : (
        <span className="font-mono text-xs font-medium tracking-[0.2em] text-terminal-alert">DEPOSED</span>
      )}
      <div className="h-5 w-px bg-dossier-paper/20" />
      <div className="flex flex-1 items-center gap-4 overflow-x-auto">
        <Fig label="REV" value={t.revenue.toFixed(1)} />
        <Fig label="OUT" value={t.outlays.toFixed(1)} />
        <Fig label="BAL" value={(t.balance >= 0 ? '+' : '') + t.balance.toFixed(1)} warn={t.balance < 0} />
        <Fig label="DEBT" value={t.debt.toFixed(0)} />
        <Fig label="PRINTED" value={t.printed.toFixed(1)} warn={t.printed > 0.5} />
        <Fig label="FX RES" value={pub.reserves.toFixed(1)} warn={pub.reserves < 2} />
      </div>
    </header>
  )
}
