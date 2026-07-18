/**
 * The fog (§6.1). observe() is a pure function of (trueState, history,
 * seed): statistical capacity sets the lag, the noise, and whether an
 * indicator exists at all. Noise comes from `obs:*` substreams keyed by
 * (indicator, measured quarter, revision), so the whole published history
 * is reproducible from scratch each tick — and orthogonal to the economic
 * RNG: fog never perturbs the economy.
 */

import { rngFor, totalLaborForce, type Seed, type TrueState } from '@terrarium/engine'
import type { IndicatorId, IndicatorPoint, IndicatorSeries, NewsItem, PublishedState } from './published'

/** The per-tick true record the observation layer measures. Kept by the host
 * (worker or runner); a few numbers per quarter. */
export interface TrueSnapshot {
  tick: number
  realGdp: number
  nominalGdp: number
  inflationQ: number
  unemployment: number
  /** total employment outside agriculture, millions */
  payrolls: number
  capitalTotal: number
  confConsumer: number
  confBusiness: number
  statCapacity: number
  satisfiedAgri: number
  printedShare: number // printed / nominal GDP
  reservesQtrs: number // reserves / quarterly imports value
  utilization: number
  electionHeld: boolean
  electionWon: boolean
  // the treasury's own books — exact
  revenue: number
  outlays: number
  balance: number
  debt: number
  reserves: number
}

export function snapshotOf(prev: TrueState, next: TrueState): TrueSnapshot {
  const importsValue = next.flows.tariffBase
  return {
    tick: prev.meta.tick, // the quarter these flows describe
    realGdp: next.flows.realGdp,
    nominalGdp: next.flows.nominalGdp,
    inflationQ: next.flows.inflationQ,
    unemployment: next.flows.unemployment,
    payrolls: next.sectors.reduce((s, x) => s + (x.id === 'agri' ? 0 : x.employment), 0),
    capitalTotal: next.sectors.reduce((s, x) => s + x.capital, 0),
    confConsumer: next.ledger.confidence.consumer,
    confBusiness: next.ledger.confidence.business,
    statCapacity: next.gov.capacity.statistical,
    satisfiedAgri: next.flows.satisfied.agri,
    printedShare: next.flows.printedThisQtr / Math.max(next.flows.nominalGdp, 1e-9),
    reservesQtrs: next.external.reserves / Math.max(importsValue, 1e-9),
    utilization: next.sectors.reduce((s, x) => s + x.capacityUtilization, 0) / next.sectors.length,
    electionHeld: next.politics.quartersToElection === 16 || !next.politics.inPower,
    electionWon: next.politics.electionsWon > prev.politics.electionsWon,
    revenue: next.gov.budget.revenue,
    outlays: next.gov.budget.outlays,
    balance: next.gov.budget.balance,
    debt: next.gov.debt,
    reserves: next.external.reserves,
  }
}

interface IndicatorSpec {
  id: IndicatorId
  label: string
  unit: string
  /** annualized % value for measured quarter q (needs q−1 for growth) */
  trueValue(h: TrueSnapshot[], q: number): number
  baseSd: number // first-print noise, in indicator units, at zero capacity
  /** if set, baseSd is a fraction of the true value (level series) */
  relativeSd?: boolean
  /** minimum statistical capacity for the series to exist at all */
  fundedAt: number
  /** GDP only: attach level estimates to each print */
  withLevels?: boolean
}

const SPECS: IndicatorSpec[] = [
  {
    id: 'gdp_growth',
    label: 'GDP growth',
    unit: '% / yr',
    trueValue: (h, q) => {
      const prev = q > 0 ? h[q - 1].realGdp : h[q].realGdp
      return prev > 1e-9 ? (Math.pow(h[q].realGdp / prev, 4) - 1) * 100 : 0
    },
    baseSd: 2.5,
    fundedAt: 0, // customs receipts and guesswork — you always get *something*
    withLevels: true,
  },
  {
    id: 'inflation',
    label: 'Inflation',
    unit: '% / yr',
    trueValue: (h, q) => h[q].inflationQ * 4 * 100,
    baseSd: 3.0,
    fundedAt: 0.08, // somebody has to walk the markets writing down prices
  },
  {
    id: 'unemployment',
    label: 'Unemployment',
    unit: '%',
    trueValue: (h, q) => h[q].unemployment * 100,
    baseSd: 2.0,
    fundedAt: 0.35, // requires a labor force survey
  },
  {
    id: 'payrolls',
    label: 'Payrolls ex-agri',
    unit: 'M jobs',
    trueValue: (h, q) => h[q].payrolls,
    baseSd: 0.05,
    relativeSd: true,
    fundedAt: 0.3, // an establishment survey
  },
  {
    id: 'capital_stock',
    label: 'Capital stock',
    unit: 'index',
    trueValue: (h, q) => h[q].capitalTotal,
    baseSd: 0.05,
    relativeSd: true,
    fundedAt: 0.3, // a census of industry
  },
  {
    id: 'conf_consumer',
    label: 'Consumer confidence',
    unit: 'idx',
    trueValue: (h, q) => h[q].confConsumer * 100,
    baseSd: 5,
    fundedAt: 0.45, // door-to-door sentiment surveys are a luxury
  },
  {
    id: 'conf_business',
    label: 'Business confidence',
    unit: 'idx',
    trueValue: (h, q) => h[q].confBusiness * 100,
    baseSd: 5,
    fundedAt: 0.45,
  },
]

const REVISION_DELAYS = [0, 2, 5] // quarters after first publication

function seriesFor(spec: IndicatorSpec, history: TrueSnapshot[], now: number, seed: Seed): IndicatorSeries | null {
  const points: IndicatorPoint[] = []
  for (let q = 0; q < history.length; q++) {
    const capAtMeasure = history[q].statCapacity
    if (capAtMeasure < spec.fundedAt) continue // the survey didn't exist that quarter
    const lag = capAtMeasure >= 0.5 ? 1 : 2
    const truth = spec.trueValue(history, q)
    const sd0 =
      spec.baseSd * (spec.relativeSd ? Math.abs(truth) : 1) * (1 - 0.85 * capAtMeasure)
    for (let r = 0; r < REVISION_DELAYS.length; r++) {
      const publishedAt = q + lag + REVISION_DELAYS[r]
      if (publishedAt > now) break
      const rng = rngFor(seed, `obs:${spec.id}:${q}:${r}`, 0)
      const sd = sd0 * Math.pow(0.45, r)
      const point: IndicatorPoint = {
        forQtr: q,
        publishedAt,
        value: truth + rng.normal(0, sd),
        revision: r,
        errorBand: capAtMeasure >= 0.45 ? 1.96 * sd : 0,
      }
      if (spec.withLevels) {
        const relErr = 1 + rng.normal(0, 0.03 * (1 - 0.85 * capAtMeasure) * Math.pow(0.45, r))
        point.levels = {
          real: history[q].realGdp * relErr,
          nominal: history[q].nominalGdp * relErr,
        }
      }
      points.push(point)
    }
  }
  if (points.length === 0) return null
  return { id: spec.id, label: spec.label, unit: spec.unit, points }
}

const NEWS_RULES: Array<{
  when(s: TrueSnapshot): boolean
  tone: NewsItem['tone']
  texts: string[]
}> = [
  {
    when: (s) => s.satisfiedAgri < 0.93,
    tone: 'bad',
    texts: [
      'Bread queues reported in the capital.',
      'Grain merchants say the warehouses are thin.',
      'Provincial papers report empty market stalls.',
    ],
  },
  {
    when: (s) => s.inflationQ * 4 > 0.12,
    tone: 'bad',
    texts: [
      'Shopkeepers are repricing goods by the week.',
      'Housewives protest the cost of the market basket.',
      'Wage earners say pay packets no longer stretch.',
    ],
  },
  {
    when: (s) => s.unemployment > 0.12,
    tone: 'bad',
    texts: [
      'Idle men gather at the factory gates.',
      'The unions demand public works.',
      'Provincial governors report men riding the rails for work.',
    ],
  },
  {
    when: (s) => s.printedShare > 0.005,
    tone: 'bad',
    texts: [
      'Bank clerks whisper that the mint is running hot.',
      'The treasury bill auction found few takers, dealers say.',
    ],
  },
  {
    when: (s) => s.reservesQtrs < 0.7,
    tone: 'bad',
    texts: [
      'Importers scramble for foreign exchange.',
      'The central bank is said to be counting its gold twice.',
    ],
  },
  {
    when: (s) => s.utilization > 0.97,
    tone: 'neutral',
    texts: [
      'Factories report order books full to year’s end.',
      'Employers complain they cannot find hands.',
    ],
  },
  {
    when: (s) => s.inflationQ * 4 < 0.005 && s.unemployment < 0.08 && s.utilization > 0.8,
    tone: 'good',
    texts: [
      'Steady trade and quiet prices, the merchants report.',
      'The chamber of commerce calls conditions satisfactory.',
    ],
  },
]

function newsFor(history: TrueSnapshot[], seed: Seed): NewsItem[] {
  const news: NewsItem[] = []
  for (const snap of history) {
    const rng = rngFor(seed, 'obs:news', snap.tick)
    if (snap.electionHeld) {
      news.push({
        tick: snap.tick,
        text: snap.electionWon
          ? 'The government is returned at the polls.'
          : 'The government has fallen at the polls.',
        tone: snap.electionWon ? 'good' : 'bad',
      })
    }
    for (const rule of NEWS_RULES) {
      // rumor mill is unreliable: real conditions surface ~60% of the time
      if (rule.when(snap) && rng.next() < 0.6) {
        news.push({
          tick: snap.tick,
          text: rule.texts[Math.floor(rng.next() * rule.texts.length)],
          tone: rule.tone,
        })
        break // one rumor per quarter is plenty
      }
    }
  }
  return news
}

export function observe(state: TrueState, history: TrueSnapshot[], seed: Seed): PublishedState {
  const now = state.meta.tick
  const indicators: PublishedState['indicators'] = {}
  for (const spec of SPECS) {
    const series = seriesFor(spec, history, now, seed)
    if (series) indicators[spec.id] = series
  }
  return {
    tick: now,
    country: state.params.name,
    indicators,
    dials: structuredClone(state.gov.dials),
    treasury: { ...state.gov.budget, debt: state.gov.debt, printed: state.gov.printed },
    capacity: { ...state.gov.capacity },
    capacityBuilding: state.gov.pipeline.map((b) => ({ target: b.target, remaining: b.remaining })),
    books: history.map((s) => ({
      tick: s.tick,
      revenue: s.revenue,
      outlays: s.outlays,
      balance: s.balance,
      debt: s.debt,
      reserves: s.reserves,
    })),
    population: {
      total: Object.values(state.params.cohortSizes).reduce((a, b) => a + b, 0),
      laborForce: totalLaborForce(state),
    },
    reserves: state.external.reserves,
    exchangeRate: state.external.exchangeRate,
    politicalCapital: state.politics.politicalCapital,
    quartersToElection: state.politics.quartersToElection,
    inPower: state.politics.inPower,
    electionsWon: state.politics.electionsWon,
    news: newsFor(history, seed),
  }
}
