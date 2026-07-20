/**
 * Step 8 — statistics. The office measures the quarter, files the worksheet,
 * and releases whatever falls due: first prints after a lag, revisions at
 * +2 and +5 quarters. Noise draws come from `obs:*` substreams keyed by
 * (indicator, measured quarter, revision) — orthogonal to the economic RNG,
 * so the fog never perturbs the economy, only what anyone believes about it.
 * The office lives inside TrueState because its output is now causal:
 * politics reads these prints, not the truth (§3.4).
 */

import { rngFor, type Seed } from '../rng/rng'
import type {
  IndicatorId,
  NewsItem,
  StatPrint,
  StatRecord,
  TrueState,
} from '../state/schema'
import type { PipelineStep } from './pipeline'
import { approvalIndex, effectivePrice, giniIndex, termsOfTrade } from './derive'

interface IndicatorSpec {
  id: IndicatorId
  /** true value for measured quarter q (may need q−1 for growth) */
  trueValue(record: StatRecord[], q: number): number
  baseSd: number // first-print noise, in indicator units, at zero capacity
  /** if set, baseSd is a fraction of the true value (level series) */
  relativeSd?: boolean
  /** minimum statistical capacity for the series to exist at all */
  fundedAt: number
  /** GDP only: attach level estimates to each print */
  withLevels?: boolean
  /** price boards are read off the market same-quarter: always lag 1,
   * even when the office is too poor to compile anything else quickly */
  fastLag?: boolean
}

export const INDICATOR_SPECS: IndicatorSpec[] = [
  {
    id: 'gdp_growth',
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
    trueValue: (h, q) => h[q].inflationQ * 4 * 100,
    baseSd: 3.0,
    fundedAt: 0.08, // somebody has to walk the markets writing down prices
  },
  {
    id: 'price_food',
    trueValue: (h, q) => h[q].priceFood * 100,
    baseSd: 0.04,
    relativeSd: true,
    fundedAt: 0.2, // a price bureau: clerks copying the market boards
    fastLag: true,
  },
  {
    id: 'price_fuel',
    trueValue: (h, q) => h[q].priceFuel * 100,
    baseSd: 0.04,
    relativeSd: true,
    fundedAt: 0.2, // same clerks, the depot price list
    fastLag: true,
  },
  {
    id: 'unemployment',
    trueValue: (h, q) => h[q].unemployment * 100,
    baseSd: 2.0,
    fundedAt: 0.35, // requires a labor force survey
  },
  {
    id: 'payrolls',
    trueValue: (h, q) => h[q].payrolls,
    baseSd: 0.05,
    relativeSd: true,
    fundedAt: 0.3, // an establishment survey
  },
  {
    id: 'capital_stock',
    trueValue: (h, q) => h[q].capitalTotal,
    baseSd: 0.05,
    relativeSd: true,
    fundedAt: 0.3, // a census of industry
  },
  {
    id: 'conf_consumer',
    trueValue: (h, q) => h[q].confConsumer * 100,
    baseSd: 5,
    fundedAt: 0.45, // door-to-door sentiment surveys are a luxury
  },
  {
    id: 'conf_business',
    trueValue: (h, q) => h[q].confBusiness * 100,
    baseSd: 5,
    fundedAt: 0.45,
  },
  {
    id: 'approval',
    trueValue: (h, q) => h[q].approvalIndex * 100,
    baseSd: 6,
    fundedAt: 0.25, // field polling: clipboards on doorsteps nationwide
  },
  {
    id: 'gini',
    trueValue: (h, q) => h[q].gini * 100,
    baseSd: 3,
    fundedAt: 0.55, // a full household income & expenditure survey
  },
  {
    id: 'birth_rate',
    trueValue: (h, q) => h[q].birthRate,
    baseSd: 2.5,
    fundedAt: 0.3, // a civil registry: every birth recorded at the parish
  },
  {
    id: 'death_rate',
    trueValue: (h, q) => h[q].deathRate,
    baseSd: 2,
    fundedAt: 0.3, // …and every death — vital registration, the old duty
  },
  {
    id: 'terms_of_trade',
    trueValue: (h, q) => h[q].termsOfTrade,
    baseSd: 2.5,
    fundedAt: 0.4, // customs statisticians compiling the trade accounts
  },
  {
    id: 'asset_prices',
    trueValue: (h, q) => h[q].assetPrice * 100,
    baseSd: 0.05,
    relativeSd: true,
    fundedAt: 0.45, // a stock/property price board — the exchanges quote it
    fastLag: true, // markets mark to market same-quarter
  },
  {
    id: 'credit_growth',
    trueValue: (h, q) => {
      const prev = q > 0 ? h[q - 1].creditToGdp : h[q].creditToGdp
      return prev > 1e-9 ? (Math.pow(h[q].creditToGdp / prev, 4) - 1) * 100 : 0
    },
    baseSd: 4,
    fundedAt: 0.55, // bank supervision: a returns office reading the ledgers
  },
]

const REVISION_DELAYS = [0, 2, 5] // quarters after first publication
const LAGS = [1, 2]
const lagFor = (cap: number) => (cap >= 0.5 ? 1 : 2)
const noiseScale = (cap: number) => 1 - 0.85 * cap

function recordOf(state: TrueState): StatRecord {
  const { flows, sectors, gov, external, ledger, finance } = state
  return {
    tick: state.meta.tick,
    realGdp: flows.realGdp,
    nominalGdp: flows.nominalGdp,
    inflationQ: flows.inflationQ,
    unemployment: flows.unemployment,
    payrolls: sectors.reduce((s, x) => s + (x.id === 'agri' ? 0 : x.employment), 0),
    capitalTotal: sectors.reduce((s, x) => s + x.capital, 0),
    confConsumer: ledger.confidence.consumer,
    confBusiness: ledger.confidence.business,
    approvalIndex: approvalIndex(state),
    priceFood: effectivePrice(state, 'agri'),
    priceFuel: effectivePrice(state, 'energy'),
    gini: giniIndex(state),
    birthRate: state.demography.crudeBirthRate,
    deathRate: state.demography.crudeDeathRate,
    population: state.demography.pyramid.reduce((s, n) => s + n, 0),
    pyramid: [...state.demography.pyramid],
    termsOfTrade: termsOfTrade(state),
    assetPrice: finance.assetPrice,
    creditToGdp: finance.creditToGdp,
    statCapacity: gov.capacity.statistical,
    satisfiedAgri: flows.satisfied.agri,
    printedShare: flows.printedThisQtr / Math.max(flows.nominalGdp, 1e-9),
    reservesQtrs: external.reserves / Math.max(flows.tariffBase, 1e-9),
    utilization: sectors.reduce((s, x) => s + x.capacityUtilization, 0) / sectors.length,
    revenue: gov.budget.revenue,
    outlays: gov.budget.outlays,
    balance: gov.budget.balance,
    debt: gov.debt,
    reserves: external.reserves,
  }
}

/** Every print of this indicator whose release date is exactly `publishedAt`.
 * Candidates are enumerated backward: for each (revision, lag) the measured
 * quarter is fixed, and the lag frozen at measurement time must match. */
function printsDue(
  spec: IndicatorSpec,
  record: StatRecord[],
  publishedAt: number,
  seed: Seed,
): StatPrint[] {
  const out: StatPrint[] = []
  for (let r = 0; r < REVISION_DELAYS.length; r++) {
    for (const lag of LAGS) {
      const q = publishedAt - lag - REVISION_DELAYS[r]
      if (q < 0 || q >= record.length) continue
      const cap = record[q].statCapacity
      if (cap < spec.fundedAt) continue // the survey didn't exist that quarter
      if ((spec.fastLag ? 1 : lagFor(cap)) !== lag) continue
      const truth = spec.trueValue(record, q)
      const sd =
        spec.baseSd * (spec.relativeSd ? Math.abs(truth) : 1) * noiseScale(cap) * Math.pow(0.45, r)
      const rng = rngFor(seed, `obs:${spec.id}:${q}:${r}`, 0)
      const print: StatPrint = {
        forQtr: q,
        publishedAt,
        value: truth + rng.normal(0, sd),
        revision: r,
        errorBand: cap >= 0.45 ? 1.96 * sd : 0,
      }
      if (spec.withLevels) {
        const relErr = 1 + rng.normal(0, 0.03 * noiseScale(cap) * Math.pow(0.45, r))
        print.levels = {
          real: record[q].realGdp * relErr,
          nominal: record[q].nominalGdp * relErr,
        }
      }
      out.push(print)
    }
  }
  return out
}

const NEWS_RULES: Array<{
  when(s: StatRecord): boolean
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

/** The rumor mill: unreliable — real conditions surface ~60% of the time,
 * and one rumor per quarter is plenty. */
function rumorFor(snap: StatRecord, seed: Seed): NewsItem | null {
  const rng = rngFor(seed, 'obs:news', snap.tick)
  for (const rule of NEWS_RULES) {
    if (rule.when(snap) && rng.next() < 0.6) {
      return {
        tick: snap.tick,
        text: rule.texts[Math.floor(rng.next() * rule.texts.length)],
        tone: rule.tone,
      }
    }
  }
  return null
}

export const statistics: PipelineStep = {
  name: 'statistics',
  run(state) {
    const seed = state.meta.seed
    const record = [...state.stats.record, recordOf(state)]
    // releases dated t+1 are what lands on the desk as the next quarter opens
    const releaseDate = state.meta.tick + 1
    const series = { ...state.stats.series }
    for (const spec of INDICATOR_SPECS) {
      const due = printsDue(spec, record, releaseDate, seed)
      if (due.length > 0) series[spec.id] = [...(series[spec.id] ?? []), ...due]
    }
    const rumor = rumorFor(record[record.length - 1], seed)
    const news = rumor ? [...state.stats.news, rumor] : state.stats.news
    return { ...state, stats: { record, series, news } }
  },
}
