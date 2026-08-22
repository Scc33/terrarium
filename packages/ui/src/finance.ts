/**
 * The financial system's arithmetic, out of the component.
 *
 * The overlay this feeds answers one question the wall cannot: **why does a
 * banking crisis happen here?** The engine's answer is a product, not a sum —
 *
 *   hazard = base + CRISIS_FRAGILITY_P × max(0, leverage − LEVERAGE_SAFE)
 *                                      × max(0, valuation − ASSET_SAFE)
 *                 + imported pressure
 *
 * — and a product is exactly the shape two separate time-series charts cannot
 * show. Either excess ALONE is harmless: measured over a century of easy money
 * with a prudent bank-capital floor, valuation sits at a median of 1.43 and
 * nothing happens, because leverage never leaves the floor. The old overlay
 * drew those two series side by side with no thresholds on either, which
 * described a country in an asset boom and a country about to lose its banks
 * in identical ink.
 *
 * Everything here is pure for the usual reason, plus one specific to this
 * subject: a fragility reading that silently returns zero because a survey is
 * unfunded is indistinguishable, in review, from a country that is genuinely
 * safe. The distinction is `null` vs `0` throughout, and it is tested.
 *
 * ## What is exact and what is fogged, and why the split is the lesson
 *
 * The three central-bank dials come from `pub.policy` — the government's own
 * minute book, EXACT, every quarter, no band and no revision. The market
 * readings are surveys: leverage needs bank ledger returns, valuation needs an
 * exchange board, the capital ratio needs a supervisor. So the overlay draws
 * a perfectly sharp record of what you did against a foggy record of what it
 * did to you, which is the game's whole epistemology in one screen.
 */

import {
  CRISIS_ASSET_SAFE,
  CRISIS_LEVERAGE_SAFE,
  type NewsKind,
} from '@terrarium/engine'
import type { IndicatorId, NewsItem, PolicyPoint, PublishedState } from '@terrarium/observation'
import { shapeSeries, type ShapedPoint } from './components/series'
import type { PhasePoint, PlotPoint } from './plot'

/** the fragility rails, in the units the instruments publish (percent, index) */
export const LEVERAGE_RAIL = CRISIS_LEVERAGE_SAFE * 100
export const VALUATION_RAIL = CRISIS_ASSET_SAFE * 100

/** the three instruments this overlay reads, and the survey each one waits on */
export const FINANCE_INDICATORS = [
  'credit_to_gdp',
  'asset_prices',
  'bank_capital_ratio',
] as const satisfies readonly IndicatorId[]

/** Every published quarter of one indicator, latest revision first, oldest
 * first in the array. A thin wrapper so the overlay never re-derives it. */
export function readSeries(pub: PublishedState, id: IndicatorId): ShapedPoint[] {
  const series = pub.indicators[id]
  return series ? shapeSeries(series, Number.MAX_SAFE_INTEGER, pub.tick) : []
}

/** plot-ready points for the shared time painter */
export function tracePoints(points: readonly ShapedPoint[]): PlotPoint[] {
  return points.map((p) => ({ tick: p.forQtr, value: p.value }))
}

// ---------- what the banks did to you ----------

/**
 * A banking episode: the quarter the crash reached the wire, and the quarter
 * the banks were recapitalized (`null` while one is still running).
 *
 * Read off `NewsItem.kind`, never off the prose. The previous version matched
 * `/banking crisis|sudden stop/i` against `text`, which meant every crisis
 * marker on every chart was one copy-edit away from disappearing — and
 * disappearing silently, because a chart with no markers looks exactly like a
 * century with no crises.
 */
export interface CrisisEpisode {
  from: number
  /** null = still running at the current tick */
  to: number | null
}

const isKind = (item: NewsItem, kind: NewsKind) => item.kind === kind

export function crisisEpisodes(news: readonly NewsItem[]): CrisisEpisode[] {
  const ordered = [...news].sort((a, b) => a.tick - b.tick)
  const episodes: CrisisEpisode[] = []
  for (const item of ordered) {
    if (isKind(item, 'banking_crisis')) {
      // A second onset while one is open is not a new episode — the engine
      // cannot start a crisis during a crisis, so this only ever happens if
      // the wire is replayed oddly. Extending the open one is the safe read.
      const open = episodes[episodes.length - 1]
      if (!open || open.to !== null) episodes.push({ from: item.tick, to: null })
    } else if (isKind(item, 'banking_recovery')) {
      const open = episodes[episodes.length - 1]
      if (open && open.to === null) open.to = item.tick
    }
  }
  return episodes
}

/** quarters at which speculation was reported cresting — context, not danger */
export function bubbleTicks(news: readonly NewsItem[]): number[] {
  return news.filter((n) => isKind(n, 'asset_bubble')).map((n) => n.tick)
}

// ---------- the fragility plane ----------

/**
 * One quarter as a position: leverage against valuation.
 *
 * Only quarters where BOTH surveys reported are plotted. Carrying a quarter
 * with one coordinate would mean inventing the other, and the invented one
 * would decide which side of a rail the dot fell on.
 */
export function fragilityTrail(pub: PublishedState): PhasePoint[] {
  const leverage = new Map(readSeries(pub, 'credit_to_gdp').map((p) => [p.forQtr, p.value]))
  const valuation = readSeries(pub, 'asset_prices')
  const trail: PhasePoint[] = []
  for (const point of valuation) {
    const x = leverage.get(point.forQtr)
    if (x === undefined) continue
    trail.push({ tick: point.forQtr, x, y: point.value })
  }
  return trail.sort((a, b) => a.tick - b.tick)
}

/**
 * The hazard's own product term, in published units, or `null` when either
 * survey is missing.
 *
 * Deliberately NOT scaled into a probability. The engine multiplies this by
 * `CRISIS_FRAGILITY_P` and adds a background rate and an imported term, and
 * publishing a percentage would be quoting the crisis clock — a true-state
 * reading the fog exists to withhold. What the player gets is the shape:
 * zero unless both rails are crossed, and rising with the product after that.
 */
export function fragility(point: PhasePoint): number {
  return Math.max(0, point.x - LEVERAGE_RAIL) * Math.max(0, point.y - VALUATION_RAIL)
}

export type Standing = 'calm' | 'rich' | 'levered' | 'fragile' | 'crisis'

/** Which corner of the plane the country is standing in. */
export function standingAt(point: PhasePoint | null, inCrisis: boolean): Standing | null {
  if (inCrisis) return 'crisis'
  if (!point) return null
  const levered = point.x > LEVERAGE_RAIL
  const rich = point.y > VALUATION_RAIL
  if (levered && rich) return 'fragile'
  if (levered) return 'levered'
  if (rich) return 'rich'
  return 'calm'
}

/**
 * The plate under each standing. `rich` and `levered` both say "and nothing
 * is happening", because that is the fact the product structure teaches and
 * the fact a two-chart overlay could never state.
 */
export const STANDING_COPY: Record<Standing, { label: string; note: string }> = {
  calm: {
    label: 'CALM',
    note: 'Borrowing is moderate and capital is priced near what it earns. Nothing in the financial system is adding to the ordinary risk of a crash.',
  },
  rich: {
    label: 'ASSETS DEAR',
    note: 'Capital is priced well above what it earns. On its own this is not dangerous: a crash needs borrowing to be high at the same time.',
  },
  levered: {
    label: 'HEAVILY BORROWED',
    note: 'Lending is high against the size of the economy. On its own this is not dangerous: a crash needs assets to be expensive at the same time.',
  },
  fragile: {
    label: 'FRAGILE',
    note: 'Borrowing is high AND capital is expensive. This is the combination that makes a banking crisis likely, and the risk climbs with both together.',
  },
  crisis: {
    label: 'IN CRISIS',
    note: 'The banks are impaired. Lending is being cut back, and it will not resume until their capital is rebuilt.',
  },
}

// ---------- what you set ----------

/** One central-bank dial, as an exact century of the government's own record. */
export interface StanceLine {
  key: 'policyRate' | 'assetPurchaseRate' | 'capitalRequirement'
  label: string
  /** short unit shown on the readout */
  unit: string
  ink: string
  points: PlotPoint[]
  latest: number
}

const STANCE_FACE: Array<{
  key: StanceLine['key']
  label: string
  unit: string
  ink: string
  read: (p: PolicyPoint) => number
}> = [
  {
    key: 'policyRate',
    label: 'POLICY RATE',
    unit: '%',
    ink: 'var(--color-dossier-brass)',
    read: (p) => p.policyRate * 100,
  },
  {
    key: 'assetPurchaseRate',
    label: 'ASSET PURCHASES',
    unit: '% GDP/YR',
    ink: 'var(--color-dossier-felt)',
    read: (p) => p.assetPurchaseRate * 100,
  },
  {
    key: 'capitalRequirement',
    label: 'BANK CAPITAL FLOOR',
    unit: '% OF CREDIT',
    ink: 'var(--color-dossier-warn)',
    read: (p) => p.capitalRequirement * 100,
  },
]

/**
 * The three money dials over the whole run, exact.
 *
 * They are kept as three separate lines rather than one shared axis on
 * purpose: a policy rate runs to 30, purchases to 25 and the capital floor to
 * 25, and while those happen to be similar magnitudes today they are three
 * unrelated quantities. Stacking them on one axis would invite the reading
 * "purchases have overtaken the rate", which means nothing.
 */
export function stanceLines(pub: PublishedState): StanceLine[] {
  return STANCE_FACE.map((face) => {
    const points = pub.policy.map((p) => ({ tick: p.tick, value: face.read(p) }))
    return {
      key: face.key,
      label: face.label,
      unit: face.unit,
      ink: face.ink,
      points,
      latest: points.length > 0 ? points[points.length - 1].value : 0,
    }
  })
}

// ---------- the desk's summary ----------

export interface FinanceReading {
  /** null until the survey exists */
  leverage: number | null
  valuation: number | null
  bankCapital: number | null
  /** the capital floor in force, exact — always available */
  capitalFloor: number
  /** true when the ratio has fallen to the floor the government set, so the
   * constraint is actually binding on new lending rather than decorative */
  floorBinds: boolean
  position: PhasePoint | null
  standing: Standing | null
  episodes: CrisisEpisode[]
  inCrisis: boolean
}

/**
 * How close to its floor a capital ratio counts as constrained.
 *
 * The engine has no boolean for this — credit is capped at
 * `bankCapital / (requirement × annualGdp)` and the cap either bites or does
 * not, continuously. A margin is therefore a presentation choice, and it is
 * deliberately generous: the useful warning is "your floor is about to start
 * cutting lending", not "it did last quarter". A tenth of the floor's own
 * value, so a 6% floor warns at 6.6% and a 25% floor at 27.5%.
 */
export const FLOOR_MARGIN = 0.1

export function readFinance(pub: PublishedState): FinanceReading {
  const trail = fragilityTrail(pub)
  const position = trail.length > 0 ? trail[trail.length - 1] : null
  const episodes = crisisEpisodes(pub.news)
  const open = episodes[episodes.length - 1]
  const inCrisis = Boolean(open && open.to === null)

  const last = (id: IndicatorId): number | null => {
    const points = readSeries(pub, id)
    return points.length > 0 ? points[points.length - 1].value : null
  }
  const bankCapital = last('bank_capital_ratio')
  const capitalFloor = pub.dials.capitalRequirement * 100

  return {
    leverage: last('credit_to_gdp'),
    valuation: last('asset_prices'),
    bankCapital,
    capitalFloor,
    floorBinds: bankCapital !== null && bankCapital <= capitalFloor * (1 + FLOOR_MARGIN),
    position,
    standing: standingAt(position, inCrisis),
    episodes,
    inCrisis,
  }
}
