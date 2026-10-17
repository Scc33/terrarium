/**
 * Per-person views of quantities already on the desk. A print belongs to its
 * measured quarter, not its release date or today's census. Convert every
 * vintage before shaping, smoothing or calculating growth, so revisions and
 * bands describe the same quantity as the headline. This makes no new survey.
 */
import type { IndicatorId, IndicatorSeries, PublishedState } from '@terrarium/observation'
import type { Domain } from './domains'
import { NAMES, type IndicatorNames } from './components/labels'

export type PopulationBasis = 'total' | 'perPerson'
export interface InstrumentPresentation {
  names: IndicatorNames
  face: Domain | 'ratchet'
}

/** Opt in actual additive levels. Indices, rates and existing per-person
 * accounts cannot acquire a meaningful denominator just because they are numbers. */
export const PER_PERSON_INSTRUMENTS = {
  capital_stock: {
    factor: 1, unit: 'real / head', face: 'ratchet',
    names: { ...NAMES.capital_stock, dossier: 'CAPITAL PER PERSON · REAL',
      terminal: 'CAP.PERSON REAL', plate: 'CAPITAL PER PERSON', short: 'CAP/HEAD',
      note: 'Productive buildings, machines and infrastructure per resident, in real stock units. Uses the census for the quarter surveyed. This is productive capital, not household net worth.' },
  },
  payrolls: {
    factor: 100, unit: 'jobs / 100 residents', face: { lo: 0, hi: 100 },
    names: { ...NAMES.payrolls, dossier: 'NON-FARM JOBS · /100 PEOPLE',
      terminal: 'JOBS.XA /100POP', plate: 'NON-FARM JOBS PER 100 PEOPLE', short: 'JOBS/100',
      note: 'Paid jobs outside farming per 100 residents, including children and retirees in the denominator. This is not the employment rate of the labour force.' },
  },
} satisfies Partial<Record<IndicatorId, InstrumentPresentation & { factor: number; unit: string }>>

export function censusByQuarter(pub: Pick<PublishedState, 'census'>): Map<number, number> {
  return new Map(pub.census.filter(row => Number.isFinite(row.population) && row.population > 0)
    .map(row => [row.tick, row.population]))
}

export function perPerson(value: number, population: number | undefined, factor = 1): number | null {
  if (!Number.isFinite(value) || population === undefined || !Number.isFinite(population) || population <= 0) return null
  const result = factor * value / population
  return Number.isFinite(result) ? result : null
}

export function instrumentView(pub: PublishedState, id: IndicatorId, basis: PopulationBasis): {
  series: IndicatorSeries | undefined; presentation?: InstrumentPresentation
} {
  const series = pub.indicators[id]
  if (basis === 'total' || !(id in PER_PERSON_INSTRUMENTS)) return { series }
  const spec = PER_PERSON_INSTRUMENTS[id as keyof typeof PER_PERSON_INSTRUMENTS]
  if (!series) return { series, presentation: spec }
  const census = censusByQuarter(pub)
  return {
    presentation: spec,
    series: { ...series, label: spec.names.plate, unit: spec.unit,
      points: series.points.flatMap(point => {
        const population = census.get(point.forQtr)
        const value = perPerson(point.value, population, spec.factor)
        const errorBand = perPerson(point.errorBand, population, spec.factor)
        return value === null || errorBand === null ? [] : [{ ...point, value, errorBand }]
      }),
    },
  }
}

/** Used for exact books and vector surveys as well as scalar instruments.
 * A missing census drops its row; it never means a country with zero wealth. */
export function populationRows<T extends { tick: number; values: Record<string, number> }>(
  rows: readonly T[], pub: Pick<PublishedState, 'census'>,
): T[] {
  const census = censusByQuarter(pub)
  return rows.flatMap(row => {
    const population = census.get(row.tick)
    const entries = Object.entries(row.values).map(([key, value]) => [key, perPerson(value, population)] as const)
    return entries.some(([, value]) => value === null) ? [] :
      [{ ...row, values: Object.fromEntries(entries) as T['values'] }]
  })
}

/** Classify the exact books exhaustively: a new field must declare its units
 * before it can appear in a per-person ledger. The exchange rate is a price. */
const BOOK_BASIS: Record<keyof PublishedState['books'][number], 'money' | 'split' | 'unchanged'> = {
  tick: 'unchanged', exchangeRate: 'unchanged', revenueBySource: 'split', outlaysByProgramme: 'split',
  revenue: 'money', outlays: 'money', balance: 'money', debt: 'money', fund: 'money', reserves: 'money',
  centralBankAssets: 'money', assetPurchases: 'money', assetRunoff: 'money', debtMaturing: 'money',
  bondsRefinanced: 'money', debtBuybackAdjustment: 'money', fxIntervention: 'money', fundFlow: 'money',
  fiscalRebate: 'money', bondsIssued: 'money', debtRepaid: 'money', deficitPrinting: 'money',
}

export function treasuryBasis(pub: PublishedState, basis: PopulationBasis): PublishedState | null {
  if (basis === 'total') return pub
  const census = censusByQuarter(pub)
  const population = pub.books.length ? census.get(pub.books[pub.books.length - 1].tick) : pub.population.total
  if (perPerson(1, population) === null) return null
  const divide = (value: number, heads = population!) => value / heads
  const split = <T extends Record<string, number>>(values: T, heads = population!): T =>
    Object.fromEntries(Object.entries(values).map(([id, value]) => [id, divide(value, heads)])) as T
  const books = pub.books.flatMap(book => {
    const heads = census.get(book.tick)
    if (heads === undefined) return []
    return [Object.fromEntries(Object.entries(book).map(([key, value]) => {
      const kind = BOOK_BASIS[key as keyof typeof BOOK_BASIS]
      return [key, kind === 'money' ? divide(value as number, heads) : kind === 'split' ? split(value as Record<string, number>, heads) : value]
    })) as PublishedState['books'][number]]
  })
  const treasury = Object.fromEntries(Object.entries(pub.treasury).map(([key, value]) => {
    if (key === 'bonds') return [key, pub.treasury.bonds.map(lot => ({ ...lot, principal: divide(lot.principal) }))]
    if (key === 'domesticBondShare') return [key, value]
    return [key, typeof value === 'number' ? divide(value) : split(value as Record<string, number>)]
  })) as PublishedState['treasury']
  return { ...pub, books, treasury, reserves: divide(pub.reserves),
    centralBank: split(pub.centralBank) }
}

export const POPULATION_BASIS_KEY = 'terrarium:population-basis'
const basisListeners = new Set<() => void>()
let sessionBasis: PopulationBasis = 'total'
export function loadPopulationBasis(): PopulationBasis {
  try { return localStorage.getItem(POPULATION_BASIS_KEY) === 'perPerson' ? 'perPerson' : 'total' } catch { return sessionBasis }
}
export function savePopulationBasis(basis: PopulationBasis): void {
  sessionBasis = basis
  try { localStorage.setItem(POPULATION_BASIS_KEY, basis) } catch { /* the current view still works */ }
  for (const listener of basisListeners) listener()
}

/** Share changes with mounted offices and the wall. */
export function subscribePopulationBasis(listener: () => void): () => void {
  basisListeners.add(listener)
  return () => { basisListeners.delete(listener) }
}
