/**
 * The central-bank desk's briefing on where the posted rate sits against
 * neutral — painted from `../../monetaryStance`, which decides everything.
 * Advice, not an order: it names a side and a range and leaves the dial alone.
 * The words are deliberately the desk's ("puts neutral near", "cannot stand
 * behind a range") rather than the engine's, because the number is an estimate
 * from the office's prints and the treasury's books, never the truth.
 */

import { TooltipLabel } from '../../components/ui'
import { qtrLabel } from '../../components/series'
import { monetaryStance, type MonetaryStance, type StanceReading } from '../../monetaryStance'
import type { PublishedState } from '@terrarium/observation'
import { pct1 } from './format'

const READING_LABEL: Record<StanceReading, string> = {
  below: 'BELOW NEUTRAL',
  near: 'NEAR NEUTRAL',
  above: 'ABOVE NEUTRAL',
}

/** a driver's contribution in points, signed the way it moves neutral */
const points = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(1)} PT`

function Driver({ label, content, value }: { label: string; content: string; value: number }) {
  return (
    <li className="flex items-baseline justify-between gap-2 font-mono text-[9px] text-dossier-paper/70">
      <TooltipLabel label={label} content={content} className="truncate text-dossier-paper/70" />
      <span className="shrink-0 tabular-nums text-dossier-paper/85">{points(value)}</span>
    </li>
  )
}

function Estimate({ stance }: { stance: MonetaryStance }) {
  const { expectations, funding } = stance
  const range =
    stance.confidence === 'fair'
      ? `between ${pct1(stance.low)} and ${pct1(stance.high)}`
      : `roughly ${pct1(stance.neutral)}`
  return (
    <>
      <p className="mt-1 font-dossier text-[11px] leading-snug text-dossier-paper/80">
        The desk puts neutral {range}, against the {pct1(stance.posted)} posted.
        {stance.belowFloor &&
          ' That is below the floor of the dial: the rate alone cannot get there, and asset purchases are the instrument that still moves the same private rate.'}
      </p>
      <ul className="mt-1.5 flex flex-col gap-0.5">
        <Driver
          label="Real-rate anchor"
          content="The real rate at which the bank's own push on credit, asset valuations and private investment is exactly zero. A constant the desk knows; everything else on this list is an estimate."
          value={stance.anchor}
        />
        <Driver
          label="Expected inflation"
          content={`What the public expects prices to do, as the desk reads it: the office's inflation prints through ${qtrLabel(expectations.throughQtr)} (${expectations.run} consecutive quarters), filtered with the same adaptive rule the public follows, plus what the treasury printed. Neutral rises point for point with it.`}
          value={expectations.value}
        />
        <Driver
          label="Sovereign funding"
          content={`What the state's own borrowing adds to private funding costs, so it LOWERS neutral: last quarter's bond issue against official output (${points(-funding.auction).toLowerCase()}) and the private share of the sovereign premium the office's debt ratio for ${qtrLabel(funding.debtRatioQtr)} implies (${points(-funding.premium).toLowerCase()}).`}
          value={-funding.value}
        />
        <Driver
          label="Asset purchases"
          content="Purchases lower the same private rate a cut does, so they raise the posted rate that counts as neutral — a fifth of a point for every one percent of output bought a year."
          value={stance.assetPurchases}
        />
      </ul>
      <div className="mt-1.5 font-mono text-[8px] leading-snug tracking-[0.08em] text-dossier-paper/45">
        {stance.confidence === 'fair'
          ? `FAIR CONFIDENCE · RANGE FROM THE OFFICE'S OWN ERROR BANDS`
          : expectations.banded
            ? 'LOW CONFIDENCE · TOO SHORT A RUN OF PRINTS TO STAND BEHIND A RANGE'
            : 'LOW CONFIDENCE · THE OFFICE CONFESSES NO ERROR BAND'}
      </div>
    </>
  )
}

export function StanceBriefing({ pub }: { pub: PublishedState }) {
  const stance = monetaryStance(pub)
  return (
    <section
      aria-label="Monetary stance briefing"
      className="mb-2 border-l-2 border-dossier-brass/60 bg-[#22382d]/40 px-2 py-1.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <TooltipLabel
          label="Monetary stance"
          content="Neutral is the posted rate at which the bank's own contribution to credit, asset valuations and private investment is zero. It is a rate term, not a growth target: near neutral, the economy still moves with everything else. Above it the bank is leaning against borrowing; below it, pushing."
          className="font-mono text-[8px] tracking-[0.12em] text-dossier-paper/45"
        >
          MONETARY STANCE
        </TooltipLabel>
        <span className="shrink-0 font-mono text-[9px] font-semibold tracking-[0.12em] text-dossier-brass">
          {stance ? READING_LABEL[stance.reading] : 'NO BRIEFING'}
        </span>
      </div>
      {stance ? (
        <Estimate stance={stance} />
      ) : (
        <p className="mt-1 font-dossier text-[11px] italic leading-snug text-dossier-paper/60">
          The desk cannot place neutral yet: it needs a published price index and the first official
          output and debt releases to work from.
        </p>
      )}
    </section>
  )
}
