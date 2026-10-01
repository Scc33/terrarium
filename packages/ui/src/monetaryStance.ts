/**
 * The central-bank desk's reading of its own stance — below, near or above
 * the neutral rate, and a range for where neutral is (ADR-0043).
 *
 * The engine has an exact answer. Credit, asset valuation and private
 * investment all read one private real rate against a 2% anchor, so the
 * posted rate at which that term is zero is
 *
 *   neutral = 2% + expected inflation − funding spread + 0.2 × asset purchases
 *
 * and it is state-dependent enough that no handbook sentence can stand in for
 * it (investigation 0011: about 5% at the posting, negative during the early
 * deflation, 0.5–3.5% across surviving late paths). The government cannot
 * calculate it, because neither adaptive expectations nor the funding spread
 * is published — and they must stay unpublished, because the fog is what
 * politics reads. So this module estimates the same formula from what the
 * desk can legitimately hold: the office's inflation and debt prints, with
 * the bands the office confessed; the treasury's own exact books; the whip
 * count. It reads `PublishedState` and nothing else, so it cannot see the
 * truth even by accident — the compiler refuses the type.
 *
 * Two rules, each with the failure it prevents:
 *
 * - **The arithmetic is the engine's.** `neutralPolicyRateOf`,
 *   `privateFundingSpreadOf` and `sovereignRiskPremiumOf` are the very
 *   functions the truth runs, called on published figures. A second copy of
 *   the formula would be a briefing that drifts from the economy the day
 *   someone retunes a gain — and drifts silently, because a plausible wrong
 *   stance reads exactly like a right one.
 * - **The estimate carries its own uncertainty, and it is the office's.** The
 *   range is built only from confessed error bands. Below the band gate the
 *   office confesses nothing, and the desk says so (`confidence: 'low'`)
 *   rather than inventing a width from the noise model — reconstructing the
 *   band the office declined to publish would be routing around the fog.
 *
 * What it must never do is automate policy. It says where neutral is and which
 * side of it the posted rate sits; the order is still the player's.
 */

import {
  EXPECTATION_ADAPT,
  INIT_INFLATION_EXPECTATIONS,
  NATURAL_REAL_RATE,
  adaptExpectations,
  assetPurchaseRateEquivalent,
  clampExpectations,
  neutralPolicyRateOf,
  privateFundingSpreadOf,
  sovereignRiskPremiumOf,
} from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { shapeSeries, type ShapedPoint } from './components/series'
import { latestOfficialNominalGdp, officialNominalGdpByQuarter } from './spendingRules'

export type StanceReading = 'below' | 'near' | 'above'
export type StanceConfidence = 'low' | 'fair'

/**
 * How far the posted rate may sit from the estimated range and still read as
 * "near" neutral: half a point, two steps of the rate dial. Presentation, not
 * economics — it exists so that an office confessing no band (a range of zero
 * width) does not turn a rate a tenth of a point off the estimate into a
 * confident "above". The direct rate terms are linear, so half a point is
 * half a point of stance either way; the word just stops at the noise floor.
 */
export const NEAR_NEUTRAL_TOLERANCE = 0.005

/**
 * How far back the filter still remembers. Weight fades at
 * `1 − EXPECTATION_ADAPT` a quarter, so anything this many prints old carries
 * about an eighth of the estimate between it. Every print inside that window
 * has to be one the office put a band on before the desk can put a range on
 * the result: a print the office never made, or made without a band, sits in
 * the filter at full weight and zero declared width, and the range that
 * leaves out its error is narrower than anything the office actually said.
 * Crossing the band gate therefore buys a range sixteen quarters later, not
 * on the first banded release.
 */
export const EXPECTATIONS_MEMORY_QTRS = 16

export interface ExpectationsEstimate {
  /** expected annual inflation as the desk reads it, a fraction */
  value: number
  /** half-width, a fraction; 0 when the office confessed no band */
  band: number
  /** `value ± band`, cut to the rails the public's rule can reach at all —
   * in the early deflation expectations sit on the engine's floor, and an
   * interval reaching below it would include a reading the rule cannot give */
  low: number
  high: number
  /** the latest priced quarter the recurrence has consumed — the reading is
   * "through" it. Under a one-quarter lag the office's newest print is on the
   * desk but has not yet moved the public's expectations, so it is not in the
   * estimate either, and it is not counted toward the runs below. */
  throughQtr: number
  /** consecutive priced quarters ending at `throughQtr` */
  run: number
  /** consecutive priced quarters ending at `throughQtr` that carry a band —
   * the part of the filter's memory the office has actually bounded */
  bandedRun: number
}

export interface FundingEstimate {
  /** the whole spread the desk expects the state's own borrowing to add to
   * private funding costs, a fraction */
  value: number
  /** the flow term: the bond issue of the latest quarter the office has put a
   * level on, against that level */
  auction: number
  /** the quarter that auction and level are both for */
  auctionQtr: number
  /** the stock term: the private share of the sovereign premium */
  premium: number
  /** the spread at the low and high ends of the debt ratio's confessed band */
  low: number
  high: number
  /** the quarter the debt ratio was printed for */
  debtRatioQtr: number
}

export interface MonetaryStance {
  /** the rate the bank has posted, exact */
  posted: number
  /** the desk's central estimate of the neutral posted rate */
  neutral: number
  /** the range the confessed bands allow; both equal `neutral` at low
   * confidence, where no band the desk could stand behind exists */
  low: number
  high: number
  reading: StanceReading
  confidence: StanceConfidence
  /** even a rate at the dial's floor reads above neutral: the rate alone
   * cannot get there, and asset purchases are the instrument that still moves
   * the same private rate */
  belowFloor: boolean
  expectations: ExpectationsEstimate
  funding: FundingEstimate
  /** the rate-equivalent of the purchase pace, a fraction (raises neutral) */
  assetPurchases: number
  /** the anchor every driver is measured from */
  anchor: number
}

const latestPrints = (pub: PublishedState, id: 'inflation' | 'debt_to_gdp'): ShapedPoint[] => {
  const series = pub.indicators[id]
  return series ? shapeSeries(series, Number.MAX_SAFE_INTEGER, pub.tick) : []
}

/**
 * Expected inflation, estimated by running the public's own adaptive rule over
 * the office's prints instead of over the truth.
 *
 * The engine's expectations chase last quarter's realized inflation and take
 * a direct push from money-financed deficits; `adaptExpectations` IS that
 * step, and the desk calls it rather than restating it. A quarter's inflation
 * is the latest revision the office has put
 * on it, the printing is the treasury's own exact book, and the denominator is
 * the office's latest level for the nearest quarter at or before it that it
 * has priced. A quarter with no print carries the estimate forward unadapted —
 * the desk did not see that quarter, and pretending it did would draw
 * certainty through a period the state never measured. Printing enters only
 * for a quarter the office has put a level on: the treasury knows what it
 * printed, but dividing it by a level carried forward from an earlier quarter
 * would invent pressure out of whatever output did in between, so a quarter
 * not yet priced is dropped, and the filter — re-run from the record every
 * quarter — picks it up when its level arrives.
 *
 * The band is the root-sum-square of the prints' bands through the same
 * weights. Each print's error is its own independent draw — that is how the
 * office makes them — so the filter genuinely averages the noise down, and a
 * bound that ignored that would be so wide the briefing said nothing. A
 * quarter with no confessed band contributes zero width, which is why the
 * caller downgrades confidence rather than trusting a narrow range.
 */
export function expectationsFromPrints(pub: PublishedState): ExpectationsEstimate | null {
  const prints = latestPrints(pub, 'inflation')
  if (prints.length === 0) return null
  const priced = new Map(prints.map((p) => [p.forQtr, p]))
  const official = officialNominalGdpByQuarter(pub)
  const printing = new Map(pub.books.map((b) => [b.tick, b.deficitPrinting]))

  let value = INIT_INFLATION_EXPECTATIONS
  let bandSq = 0
  let throughQtr: number | null = null
  // The recurrence is indexed the engine's way: the step at quarter t reads
  // the inflation of t − 1 and the printing of t itself. Nothing was booked
  // before the posting, so the step at the posting reads that quarter as zero
  // inflation — the same convention the public's own expectations start from.
  // A quarter the office never priced adapts toward the estimate itself,
  // which is to say not at all; printing in a quarter with no level of its
  // own is fed through as nothing rather than divided by another quarter's.
  for (let t = 0; t < pub.tick; t++) {
    const level = official.get(t)
    const print = t === 0 ? { value: 0, errorBand: 0 } : priced.get(t - 1)
    if (print) {
      if (t > 0) throughQtr = t - 1
      const keep = 1 - EXPECTATION_ADAPT
      bandSq = keep * keep * bandSq + EXPECTATION_ADAPT * EXPECTATION_ADAPT * (print.errorBand / 100) ** 2
    }
    value = adaptExpectations(
      value,
      print ? print.value / 100 : value,
      level === undefined ? 0 : (printing.get(t) ?? 0),
      level ?? 1,
    )
  }

  // a release the public has not yet reacted to is not yet evidence
  if (throughQtr === null) return null
  let run = 0
  while (priced.has(throughQtr - run)) run += 1
  let bandedRun = 0
  while ((priced.get(throughQtr - bandedRun)?.errorBand ?? 0) > 0) bandedRun += 1
  const band = Math.sqrt(bandSq)
  return {
    value,
    band,
    low: clampExpectations(value - band),
    high: clampExpectations(value + band),
    throughQtr,
    run,
    bandedRun,
  }
}

/**
 * The state's own claim on private funding, priced from the desk's side of
 * the counter: the bond issue (exact) of the latest quarter the office has put
 * a level on, over that level; the share of it domestic balance sheets carry
 * (the debt office knows its buyers); and the sovereign premium run on the
 * office's published debt ratio and the whip count's exact reading of the
 * money interest. The auction is a share, and a share is taken against its
 * own release's total — the treasury has newer auctions than the office has
 * levels, and pairing this quarter's issue with an older quarter's output
 * would move the spread with whatever output did in between.
 */
export function fundingFromBooks(pub: PublishedState): FundingEstimate | null {
  const ratios = latestPrints(pub, 'debt_to_gdp')
  const output = latestOfficialNominalGdp(pub)
  const auction = output === null ? undefined : pub.books.find((b) => b.tick === output.forQtr)
  if (ratios.length === 0 || output === null || auction === undefined) return null
  const latest = ratios[ratios.length - 1]
  const ratio = latest.value / 100
  const band = latest.errorBand / 100
  const financiers = pub.blocs.find((b) => b.id === 'financiers')
  const anger = financiers ? Math.max(0, -financiers.favor) * financiers.effectivePower : 0
  const auctionShare = Math.max(0, auction.bondsIssued) / output.value
  const domestic = pub.treasury.domesticBondShare
  const spreadAt = (debtToGdp: number) =>
    privateFundingSpreadOf(auctionShare, domestic, sovereignRiskPremiumOf(Math.max(0, debtToGdp), anger))
  const value = spreadAt(ratio)
  const flow = privateFundingSpreadOf(auctionShare, domestic, 0)
  return {
    value,
    auction: flow,
    auctionQtr: output.forQtr,
    premium: value - flow,
    low: spreadAt(ratio - band),
    high: spreadAt(ratio + band),
    debtRatioQtr: latest.forQtr,
  }
}

/**
 * The briefing, or `null` when the desk has nothing to work from — no price
 * index has been published (the survey is unfunded, or the first release has
 * not arrived), no release has yet had a quarter to move expectations, or the
 * debt return and the first output estimate are not yet on the desk. Null,
 * never a stance at zero: an "unavailable" that rendered as "near neutral"
 * would be the most confident thing on the rail.
 */
export function monetaryStance(pub: PublishedState): MonetaryStance | null {
  const expectations = expectationsFromPrints(pub)
  const funding = fundingFromBooks(pub)
  if (expectations === null || funding === null) return null

  const posted = pub.dials.policyRate
  const assetPurchases = assetPurchaseRateEquivalent(pub.dials.assetPurchaseRate)
  const neutral = neutralPolicyRateOf(expectations.value, funding.value, pub.dials.assetPurchaseRate)

  // The filter is only as good as what it has seen. The range is built from
  // confessed bands, so every print still carrying weight has to have one:
  // an office below the gate (or decayed back under it) confesses nothing,
  // an office that has just crossed it has bounded one print while fifteen
  // unbounded ones still steer the estimate, and a quarter never priced sits
  // in the memory the same way. Only the quarters before the posting are
  // exempt — the prior is exact, not an unbanded print — which is what the
  // `throughQtr + 1` is for. Until the memory is clean the range collapses to
  // the point rather than print a width nobody confessed.
  const memory = Math.min(EXPECTATIONS_MEMORY_QTRS, expectations.throughQtr + 1)
  const confidence: StanceConfidence =
    expectations.bandedRun >= memory && expectations.band > 0 ? 'fair' : 'low'
  // a wider spread lowers neutral, so the low end pairs the low inflation
  // reading with the high spread, and the high end the reverse
  const low = confidence === 'fair'
    ? neutralPolicyRateOf(expectations.low, funding.high, pub.dials.assetPurchaseRate)
    : neutral
  const high = confidence === 'fair'
    ? neutralPolicyRateOf(expectations.high, funding.low, pub.dials.assetPurchaseRate)
    : neutral

  const reading: StanceReading =
    posted > high + NEAR_NEUTRAL_TOLERANCE ? 'above' : posted < low - NEAR_NEUTRAL_TOLERANCE ? 'below' : 'near'

  return {
    posted,
    neutral,
    low,
    high,
    reading,
    confidence,
    belowFloor: high + NEAR_NEUTRAL_TOLERANCE < 0,
    expectations,
    funding,
    assetPurchases,
    anchor: NATURAL_REAL_RATE,
  }
}
