/**
 * THE FINANCIAL SYSTEM — the money dials, the two excesses, and the banks.
 *
 * The wall can tell you lending is growing and capital is dear. It cannot
 * tell you whether that combination is dangerous, and the engine's answer is
 * a PRODUCT rather than a sum:
 *
 *   hazard = base + fragility × max(0, leverage − rail) × max(0, valuation − rail)
 *
 * So either excess alone is harmless, and the old version of this overlay —
 * two unthresholded line charts side by side — drew a safe asset boom and a
 * country about to lose its banks in identical ink. THE POSITION view exists
 * to make the product visible: one axis each, one shaded corner, and a trail
 * showing how the country got where it is standing.
 *
 * Three views, because they answer three different questions:
 *
 *   THE POSITION  where the country stands, and what would have to be true
 *                 for a crisis. Fogged: both coordinates are surveys.
 *   THE STANCE    the three money dials over the whole run. EXACT — the
 *                 minute book, no band and no revision, deliberately drawn
 *                 beside the fogged charts so the difference is visible.
 *   THE BANKS     the shock absorber against the floor the government set,
 *                 which is the only way to see whether that lever binds.
 *
 * The fog lesson from the first version is kept and sharpened: a crash always
 * makes the wire, so crisis bands are drawn even over an empty plot. The
 * build-up is what you have to fund a statistical office to see. What changed
 * is that a crisis is now found by `NewsItem.kind`, not by matching prose —
 * see `../finance`.
 */

import { useState } from 'react'
import { FIRST_YEAR } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import {
  ChartFrame,
  EmptyState,
  Metric,
  Modal,
  OverlayLayout,
  PhaseChart,
  SegmentedControl,
  TimeSeriesChart,
  TooltipLabel,
} from '../components/ui'
import type { ChartRule } from '../components/ui'
import { NAMES } from '../components/labels'
import {
  LEVERAGE_RAIL,
  VALUATION_RAIL,
  STANDING_COPY,
  fragilityTrail,
  readFinance,
  readSeries,
  stanceLines,
  tracePoints,
  type CrisisEpisode,
} from '../finance'

const yearOf = (q: number) => FIRST_YEAR + Math.floor(q / 4)
const qtrLabel = (q: number) => `${yearOf(q)} Q${(q % 4) + 1}`
const pct1 = (v: number) => `${v.toFixed(1)}%`

type View = 'position' | 'stance' | 'banks'

const CW = 500
const CH = 132

/**
 * Crisis episodes as chart rules.
 *
 * An episode is drawn as its two edges rather than as a filled band, because
 * `TimeSeriesChart` takes rules and not regions — and two dashed edges read
 * correctly anyway: the crash and the recapitalization are the two dates the
 * wire actually printed, and the quarters between them are the wait.
 */
function crisisRules(episodes: readonly CrisisEpisode[], xMax: number): ChartRule[] {
  const rules: ChartRule[] = []
  for (const episode of episodes) {
    rules.push({ axis: 'x', at: episode.from, color: 'var(--color-dossier-warn)', opacity: 0.75, dashed: true })
    if (episode.to !== null && episode.to <= xMax) {
      rules.push({ axis: 'x', at: episode.to, color: 'var(--color-dossier-felt)', opacity: 0.5, dashed: true })
    }
  }
  return rules
}

/** A fogged market series, or the brass plate promising what would buy it —
 * with the crashes showing through either way. */
function MarketChart({
  id,
  title,
  points,
  color,
  include,
  mark,
  markLabel,
  rules,
  blurb,
}: {
  id: 'credit_to_gdp' | 'asset_prices' | 'bank_capital_ratio'
  title: string
  points: Array<{ tick: number; value: number }>
  color: string
  /** semantic anchors the axis must hold. Deliberately EMPTY for borrowing:
   * zero is a real anchor for a share of GDP, but the reading here is distance
   * to the fragility rail, and spanning 0–80 for a series that lives at 55–62
   * draws a century of leverage as a flat line (ADR-0025 — scale the record). */
  include: number[]
  mark?: number
  markLabel?: string
  rules: ChartRule[]
  blurb: string
}) {
  const funded = points.length >= 2
  const latest = points[points.length - 1]
  const needs = NAMES[id].needs
  const summary = funded
    ? `${title}. Latest reading ${latest.value.toFixed(1)}.`
    : `${title}. No series: the government has not funded ${needs.toLowerCase()}.`
  const markRule: ChartRule[] =
    mark === undefined
      ? []
      : [{ axis: 'y', at: mark, label: markLabel, color: 'var(--color-dossier-warn)', opacity: 0.6, dashed: true }]

  return (
    <ChartFrame
      title={title}
      detail={funded ? 'PUBLISHED RETURNS' : `REQUIRES ${needs}`}
      value={funded ? <span style={{ color }}>{latest.value.toFixed(1)}</span> : '—'}
      legend={rules.length > 0 ? [{ label: 'CRISIS', color: 'var(--color-dossier-warn)', dashed: true }] : []}
      summary={summary}
    >
      {funded ? (
        <TimeSeriesChart
          width={CW}
          height={CH}
          traces={[{ key: id, points, color, lead: true }]}
          include={[...include, ...(mark === undefined ? [] : [mark])]}
          pad={0.08}
          rules={[...markRule, ...rules]}
          formatTick={(t) => String(yearOf(t))}
          formatReading={(v) => v.toFixed(1)}
          summary={summary}
          hover
        />
      ) : (
        <EmptyState title="NO RETURNS FILED" requirement={needs} compact>
          {blurb}
        </EmptyState>
      )}
    </ChartFrame>
  )
}

export function FinanceOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [view, setView] = useState<View>('position')
  const reading = readFinance(pub)
  const trail = fragilityTrail(pub)
  const rules = crisisRules(reading.episodes, pub.tick)
  const standing = reading.standing ? STANDING_COPY[reading.standing] : null

  const leverage = tracePoints(readSeries(pub, 'credit_to_gdp'))
  const valuation = tracePoints(readSeries(pub, 'asset_prices'))
  const capital = tracePoints(readSeries(pub, 'bank_capital_ratio'))
  const floor = pub.policy.map((p) => ({ tick: p.tick, value: p.capitalRequirement * 100 }))
  const stance = stanceLines(pub)

  const crises = reading.episodes.length

  return (
    <Modal title="THE FINANCIAL SYSTEM" onClose={onClose} size="wide">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <Metric
              label="STANDING"
              value={standing ? standing.label : 'UNOBSERVED'}
              tone={reading.standing === 'fragile' || reading.standing === 'crisis' ? 'danger' : 'default'}
              title={
                standing
                  ? standing.note
                  : 'Neither the lending returns nor the exchange quotes have been funded, so the ministry cannot say where the financial system stands.'
              }
            />
            <Metric
              label="BORROWING"
              value={reading.leverage === null ? '—' : `${reading.leverage.toFixed(0)}% GDP`}
              title={`${NAMES.credit_to_gdp.note} Above ${LEVERAGE_RAIL.toFixed(0)}% it starts to matter — but only while assets are also expensive.`}
            />
            <Metric
              label="ASSET VALUATION"
              value={reading.valuation === null ? '—' : reading.valuation.toFixed(0)}
              title={`${NAMES.asset_prices.note} Above ${VALUATION_RAIL.toFixed(0)} they count as expensive — but only while borrowing is also high.`}
            />
            <Metric
              label="BANK CAPITAL"
              value={reading.bankCapital === null ? '—' : pct1(reading.bankCapital)}
              tone={reading.floorBinds ? 'danger' : 'default'}
              title={
                reading.floorBinds
                  ? `The banks are at or near the ${pct1(reading.capitalFloor)} floor you set, so the floor is now limiting new lending.`
                  : `${NAMES.bank_capital_ratio.note} Your floor is ${pct1(reading.capitalFloor)}.`
              }
            />
            <Metric
              label="BANKING CRISES"
              value={String(crises)}
              tone={reading.inCrisis ? 'danger' : 'default'}
              title="Bank failures since 1946. A crash always reaches the wire, whether or not the government funded anything."
            />
          </div>
        )}
        toolbar={(
          <SegmentedControl
            label="Finance view"
            value={view}
            onChange={setView}
            options={[
              { value: 'position', label: 'THE POSITION', title: 'Borrowing against asset valuation. Only the shaded corner is dangerous.' },
              { value: 'stance', label: 'THE STANCE', title: 'The three money dials over the whole run, exactly as they were set.' },
              { value: 'banks', label: 'THE BANKS', title: 'What the banks can absorb, against the floor you set them.' },
            ]}
          />
        )}
        note={NOTE[view]}
        footer="THE CRASH ALWAYS MAKES THE PAPERS · THE BUILD-UP ONLY MAKES YOURS"
      >
        {view === 'position' && (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="flex min-w-0 flex-col gap-1">
              <div className="flex items-baseline justify-between font-mono text-[9px] tracking-[0.2em] text-dossier-ink/60">
                <span>WHERE THE COUNTRY STANDS</span>
                <TooltipLabel
                  label="The shaded corner"
                  content="A banking crisis needs high borrowing AND expensive assets together. Crossing one line alone does nothing; the risk climbs with both."
                  className="tracking-[0.1em] text-dossier-ink/45"
                >
                  ⓘ
                </TooltipLabel>
              </div>
              {trail.length >= 2 ? (
                <PhaseChart
                  points={trail}
                  corner={{ x: LEVERAGE_RAIL, y: VALUATION_RAIL }}
                  cornerLabel="CRISIS RISK"
                  includeX={[LEVERAGE_RAIL]}
                  includeY={[VALUATION_RAIL, 100]}
                  labelX="BORROWING · % GDP"
                  labelY="ASSET VALUATION · COST=100"
                  formatPoint={(p) => qtrLabel(p.tick)}
                  summary={
                    standing
                      ? `Borrowing against asset valuation, one point per surveyed quarter. The country now stands at ${standing.label.toLowerCase()}. ${standing.note}`
                      : 'Borrowing against asset valuation, one point per surveyed quarter.'
                  }
                />
              ) : (
                <EmptyState title="THE POSITION CANNOT BE PLOTTED" requirement="BANK LEDGER RETURNS + EXCHANGE BOARD">
                  Both halves are needed. Borrowing alone or asset valuation alone cannot say whether
                  the financial system is dangerous — that is the whole point of the figure.
                </EmptyState>
              )}
              {standing && (
                <p className="mt-1 font-dossier text-[11px] leading-snug text-dossier-ink/70">{standing.note}</p>
              )}
            </div>

            <div className="flex min-w-0 flex-col gap-3">
              <MarketChart
                id="credit_to_gdp"
                title="BORROWING · % OF GDP"
                points={leverage}
                color="var(--color-dossier-brass)"
                include={[]}
                mark={LEVERAGE_RAIL}
                markLabel="FRAGILE"
                rules={rules}
                blurb="Everything the banks have lent, against a year of output. Only the supervisor's ledger returns say where the stock stands."
              />
              <MarketChart
                id="asset_prices"
                title="ASSET VALUATION · COST=100"
                points={valuation}
                color="var(--color-dossier-felt)"
                include={[100]}
                mark={VALUATION_RAIL}
                markLabel="RICH"
                rules={rules}
                blurb="What existing productive assets sell for against the cost of replacing them. At 100 the two are equal; a growing economy can stay there indefinitely."
              />
            </div>
          </div>
        )}

        {view === 'stance' && (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {stance.map((line) => (
              <ChartFrame
                key={line.key}
                title={`${line.label} · ${line.unit}`}
                detail="THE MINUTE BOOK · EXACT"
                value={<span style={{ color: line.ink }}>{line.latest.toFixed(2)}</span>}
                legend={rules.length > 0 ? [{ label: 'CRISIS', color: 'var(--color-dossier-warn)', dashed: true }] : []}
                summary={`${line.label}, exactly as the government set it, every quarter since ${FIRST_YEAR}. It now stands at ${line.latest.toFixed(2)} ${line.unit.toLowerCase()}.`}
              >
                <TimeSeriesChart
                  width={CW}
                  height={CH}
                  traces={[{ key: line.key, points: line.points, color: line.ink, lead: true }]}
                  include={[0]}
                  pad={0.08}
                  rules={rules}
                  xDomain={{ x0: 0, x1: Math.max(pub.tick, 1) }}
                  formatTick={(t) => String(yearOf(t))}
                  formatReading={(v) => v.toFixed(2)}
                  summary={`${line.label} over the run.`}
                  hover
                />
              </ChartFrame>
            ))}
          </div>
        )}

        {view === 'banks' && (
          // Side by side rather than stacked: two full-height frames one above
          // the other push the second below the modal's fold, and the second
          // one is the CAUSE of the first — a floor is a rule about lending,
          // so the two have to be readable together or the view is just two
          // charts that happen to share a screen.
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartFrame
              title="BANK CAPITAL · % OF CREDIT, AGAINST YOUR FLOOR"
              detail={capital.length >= 2 ? 'PUBLISHED RETURNS · FLOOR EXACT' : `REQUIRES ${NAMES.bank_capital_ratio.needs}`}
              value={
                reading.bankCapital === null ? (
                  '—'
                ) : (
                  <span style={{ color: reading.floorBinds ? 'var(--color-dossier-warn)' : 'var(--color-dossier-felt)' }}>
                    {pct1(reading.bankCapital)}
                  </span>
                )
              }
              legend={[
                { label: 'HELD', color: 'var(--color-dossier-felt)' },
                { label: 'FLOOR', color: 'var(--color-dossier-warn)', dashed: true },
              ]}
              summary={
                reading.bankCapital === null
                  ? `The banks' capital is unsurveyed. The floor you set stands at ${pct1(reading.capitalFloor)}.`
                  : `The banks hold ${pct1(reading.bankCapital)} of what they have lent, against a floor of ${pct1(reading.capitalFloor)}. ${reading.floorBinds ? 'The floor is limiting new lending.' : 'The floor is slack.'}`
              }
            >
              {capital.length >= 2 ? (
                <TimeSeriesChart
                  width={CW}
                  height={CH}
                  traces={[
                    { key: 'held', points: capital, color: 'var(--color-dossier-felt)', lead: true },
                    { key: 'floor', points: floor, color: 'var(--color-dossier-warn)', dashed: true },
                  ]}
                  wedge={{ over: 'held', under: 'floor', color: 'var(--color-dossier-felt)', opacity: 0.12 }}
                  include={[0]}
                  pad={0.08}
                  rules={rules}
                  formatTick={(t) => String(yearOf(t))}
                  formatReading={(v) => pct1(v)}
                  summary="Bank capital held, against the floor the government set."
                  hover
                />
              ) : (
                <EmptyState title="NO SUPERVISORY RETURNS" requirement={NAMES.bank_capital_ratio.needs}>
                  The floor you set is exact and in force whether or not anyone audits it. What a
                  survey buys is knowing whether the banks are anywhere near it.
                </EmptyState>
              )}
            </ChartFrame>

            <MarketChart
              id="credit_to_gdp"
              title="BORROWING · % OF GDP"
              points={leverage}
              color="var(--color-dossier-brass)"
              include={[]}
              mark={LEVERAGE_RAIL}
              markLabel="FRAGILE"
              rules={rules}
              blurb="What the floor is acting on. Raising the floor slows lending; a crisis writes capital down and the floor then does the cutting for you."
            />
          </div>
        )}
      </OverlayLayout>
    </Modal>
  )
}

/**
 * The reading note under each view. One paragraph, and each states a fact the
 * figure above it cannot state on its own — never a restatement of the axes.
 * The words for individual levers and instruments live in the handbook
 * (`levers.ts`, `NAMES`); nothing here duplicates them.
 */
const NOTE: Record<View, string> = {
  position:
    'A crash needs both at once. High borrowing with cheap capital is a country that owes a lot and can pay; expensive capital with little borrowing is an exuberant market with nothing lent against it. The shaded corner is where the two meet, and the risk climbs with the product of the two excesses rather than with either one.',
  stance:
    'These are the government’s own minutes: exact, unrevised, and available whether or not a single survey was ever funded. Cheap money and asset purchases work on the same channel and stack; the capital floor works on a different one and can hold lending back while both are running. Compare them against the crisis marks — the crash a government gets is usually the one its own rate cut paid for.',
  banks:
    'The floor is a share of lending banks must fund with their own money. Above it the rule is slack and does nothing; at it, lending stops growing however cheap money is. That is why it is worth raising in a boom and why it bites hardest just after a crisis has written capital down.',
}
