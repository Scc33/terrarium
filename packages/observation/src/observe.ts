/**
 * observe() — a pure projection of what the government can see (§6.1). The
 * fog itself (lag, noise, revisions, funding gates) lives in the engine's
 * statistics step, because politics now reads the prints too; this function
 * only attaches presentation and assembles the desk: published series, the
 * treasury's exact books, the dials, the wire. The UI remains architecturally
 * unable to name true state.
 */

import { INDICATOR_IDS, totalLaborForce, type TrueState } from '@terrarium/engine'
import type { IndicatorId, PublishedState } from './published'

const PRESENTATION: Record<IndicatorId, { label: string; unit: string }> = {
  gdp_growth: { label: 'GDP growth', unit: '% / yr' },
  inflation: { label: 'Inflation', unit: '% / yr' },
  unemployment: { label: 'Unemployment', unit: '%' },
  payrolls: { label: 'Payrolls ex-agri', unit: 'M jobs' },
  capital_stock: { label: 'Capital stock', unit: 'index' },
  conf_consumer: { label: 'Consumer confidence', unit: 'idx' },
  conf_business: { label: 'Business confidence', unit: 'idx' },
  approval: { label: 'Approval poll', unit: '%' },
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
      total: Object.values(state.params.cohortSizes).reduce((a, b) => a + b, 0),
      laborForce: totalLaborForce(state),
    },
    reserves: state.external.reserves,
    exchangeRate: state.external.exchangeRate,
    politicalCapital: state.politics.politicalCapital,
    quartersToElection: state.politics.quartersToElection,
    inPower: state.politics.inPower,
    electionsWon: state.politics.electionsWon,
    news: state.stats.news,
  }
}
