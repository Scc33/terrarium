/**
 * observe() — a pure projection of what the government can see (§6.1). The
 * fog itself (lag, noise, revisions, funding gates) lives in the engine's
 * statistics step, because politics now reads the prints too; this function
 * only attaches presentation and assembles the desk: published series, the
 * treasury's exact books, the dials, the wire. The UI remains architecturally
 * unable to name true state.
 */

import {
  END_OF_HISTORY_TICK,
  INDICATOR_IDS,
  LEGITIMACY_GRADE_ELECTIONS,
  PROSPERITY_GRADE_CUTS,
  totalLaborForce,
  WELFARE_DISCOUNT_Q,
  type TrueState,
} from '@terrarium/engine'
import type { Grade, IndicatorId, PublishedState, ReportCard } from './published'

const PRESENTATION: Record<IndicatorId, { label: string; unit: string }> = {
  gdp_growth: { label: 'GDP growth', unit: '% / yr' },
  inflation: { label: 'Inflation', unit: '% / yr' },
  price_food: { label: 'Food price board', unit: '1946=100' },
  price_fuel: { label: 'Fuel price board', unit: '1946=100' },
  unemployment: { label: 'Unemployment', unit: '%' },
  payrolls: { label: 'Payrolls ex-agri', unit: 'M jobs' },
  capital_stock: { label: 'Capital stock', unit: 'index' },
  conf_consumer: { label: 'Consumer confidence', unit: 'idx' },
  conf_business: { label: 'Business confidence', unit: 'idx' },
  approval: { label: 'Approval poll', unit: '%' },
  gini: { label: 'Income inequality', unit: 'Gini pts' },
  birth_rate: { label: 'Birth rate', unit: 'per 1000/yr' },
  death_rate: { label: 'Death rate', unit: 'per 1000/yr' },
  terms_of_trade: { label: 'Terms of trade', unit: '1946=100' },
  asset_prices: { label: 'Asset prices', unit: '1946=100' },
  credit_growth: { label: 'Credit growth', unit: '% / yr' },
}

/** Discounted effective duration of an n-quarter tenure — the denominator
 * that makes prosperity a rate, so grades don't re-punish short tenures for
 * what the legitimacy axis already judges. */
function effectiveQuarters(n: number): number {
  let weight = 0
  let weightedT = 0
  for (let t = 0; t < n; t++) {
    const b = Math.pow(WELFARE_DISCOUNT_Q, t)
    weight += b
    weightedT += b * t
  }
  return weight > 0 ? weightedT / weight : 1
}

/** The card only exists when the book is closed — mid-run, the cumulative
 * welfare number would be a quarterly drip-feed of true consumption. */
function reportCardOf(state: TrueState): ReportCard | undefined {
  const { politics, score, meta } = state
  const over = !politics.inPower || meta.tick >= END_OF_HISTORY_TICK
  if (!over || score.discountWeight <= 0 || score.baselineWelfare === null) return undefined
  const meanLog = score.discountedWelfare / score.discountWeight
  const quartersGoverned = politics.deposedAt ?? Math.min(meta.tick, END_OF_HISTORY_TICK)
  const prosperityRate =
    (400 * (meanLog - score.baselineWelfare)) / Math.max(effectiveQuarters(quartersGoverned), 1)
  const prosperityGrade: Grade =
    PROSPERITY_GRADE_CUTS.find((c) => prosperityRate >= c.atLeast)?.grade ?? 'F'
  const legitimacyGrade: Grade = politics.inPower
    ? 'A'
    : (LEGITIMACY_GRADE_ELECTIONS.find((c) => politics.electionsWon >= c.atLeast)?.grade ?? 'F')
  return {
    endedBy: politics.inPower ? 'history' : 'deposition',
    quartersGoverned,
    electionsWon: politics.electionsWon,
    prosperity: Math.exp(meanLog),
    vsBaseline: Math.exp(meanLog - score.baselineWelfare),
    prosperityRate,
    prosperityGrade,
    legitimacyGrade,
  }
}

export function observe(state: TrueState): PublishedState {
  const indicators: PublishedState['indicators'] = {}
  for (const id of INDICATOR_IDS) {
    const points = state.stats.series[id]
    if (points && points.length > 0) {
      indicators[id] = { id, ...PRESENTATION[id], points }
    }
  }
  return {
    tick: state.meta.tick,
    country: state.params.name,
    indicators,
    dials: structuredClone(state.gov.dials),
    treasury: { ...state.gov.budget, debt: state.gov.debt, printed: state.gov.printed },
    capacity: { ...state.gov.capacity },
    capacityBuilding: state.gov.pipeline.map((b) => ({ target: b.target, remaining: b.remaining })),
    books: state.stats.record.map((r) => ({
      tick: r.tick,
      revenue: r.revenue,
      outlays: r.outlays,
      balance: r.balance,
      debt: r.debt,
      reserves: r.reserves,
    })),
    population: {
      // census-grade facts: heads are countable without a statistical office
      total: state.demography.pyramid.reduce((a, b) => a + b, 0),
      laborForce: totalLaborForce(state),
      pyramid: [...state.demography.pyramid],
    },
    // the census over time — exact, like the treasury's books; the WHY of the
    // population's change (birth/death rates) stays fogged in the indicators
    census: state.stats.record.map((r) => ({
      tick: r.tick,
      population: r.population,
      pyramid: r.pyramid,
    })),
    reserves: state.external.reserves,
    exchangeRate: state.external.exchangeRate,
    politicalCapital: state.politics.politicalCapital,
    quartersToElection: state.politics.quartersToElection,
    inPower: state.politics.inPower,
    electionsWon: state.politics.electionsWon,
    news: state.stats.news,
    reportCard: reportCardOf(state),
  }
}
