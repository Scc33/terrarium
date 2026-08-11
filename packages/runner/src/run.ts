/**
 * Single headless run: seed + script → trajectory. The trajectory is the
 * unit every metric, property test, and balance report is computed from.
 */

import {
  applyActions,
  createCountryParams,
  generateParams,
  hashState,
  init,
  rngFor,
  step,
  IllegalActionError,
  SECTOR_IDS,
  potentialOutput,
  totalLaborForce,
  type Action,
  type ActionLog,
  type CountryParams,
  type CountryScenarioId,
  type Rng,
  type SectorId,
  type TrueState,
} from '@terrarium/engine'

export interface TrajectoryPoint {
  tick: number
  realGdp: number
  nominalGdp: number
  inflationQ: number
  unemployment: number
  prices: Record<SectorId, number>
  debtToGdp: number
  printedThisQtr: number
  approval: number[]
  politicalCapital: number
  inPower: boolean
  /** First releases arriving this quarter, in the units printed on the wall.
   * Null means the office did not publish that indicator this quarter. */
  publishedInflation: number | null
  publishedRealGrowth: number | null
  /** Runner-only event tags. They make shock-conditioned balance analysis
   * independent of player-facing prose and never enter engine state. */
  events: MacroEvent[]
  /** True-state macro drivers retained only by the headless runner. These are
   * not published to the player; they let the stability harness explain a GDP
   * tail rather than merely report that one exists. */
  drivers: MacroDrivers
}

export interface MacroDrivers {
  laborForce: number
  employment: number
  laborProductivity: number
  realWage: number
  utilization: number
  demandSatisfaction: number
  tfpGrowthQ: number
  investmentRate: number
  finalDemand: number
  householdDemand: number
  investment: number
  governmentDemand: number
  exports: number
  /** Output-weighted foreign activity multiplier seen by exporters. */
  partnerDemand: number
}

export type MacroEvent = 'drought' | 'fuel' | 'banking_crisis' | 'world_crisis'

const WORLD_CRISIS_NEWS = new Set([
  'A commodity crash abroad: exporting nations slash output overnight.',
  'The manufacturing giant seizes up; global supply chains snarl.',
  'A sudden stop: the world’s money centres freeze, lending dries up.',
  'The regional economy collapses into crisis, and it is next door.',
])

export interface RunResult {
  seed: string
  /** scenario recipe used to create params; custom marks an explicit vector */
  countryId: CountryScenarioId | 'baseline' | 'custom'
  country: string
  ticks: number
  trajectory: TrajectoryPoint[]
  finalState: TrueState
  stateHash: string
  nanCount: number
  priceExplosions: number // ticks with any price > 50× or < 1/50× base
  illegalActionsSkipped: number
  deposedAt: number | null
}

export interface RunOptions {
  seed: string
  ticks: number
  script?: ActionLog
  params?: CountryParams
  /** ignored when an explicit params vector is supplied */
  country?: CountryScenarioId
  /** if set, generates actions on the fly (random-policy runs) */
  policy?: (state: TrueState, rng: Rng, tick: number) => Action[]
  /** tolerate illegal scripted/policy actions by skipping them (default true;
   * golden replays set false) */
  lenient?: boolean
}

export function eventsBetween(before: TrueState, after: TrueState): MacroEvent[] {
  const events: MacroEvent[] = []
  if (
    before.external.shocks.droughtQtrsLeft === 0 &&
    after.external.shocks.droughtQtrsLeft > 0
  ) {
    events.push('drought')
  }
  if (before.finance.crisisQtrsLeft === 0 && after.finance.crisisQtrsLeft > 0) {
    events.push('banking_crisis')
  }
  // Energy ruptures do not leave a dedicated state flag: the world step
  // immediately begins reverting the jumped price. The onset wire item is
  // therefore the durable runner-visible event marker.
  const newWire = after.stats.news.slice(before.stats.news.length)
  if (newWire.some((item) => item.text === 'Crisis abroad: world fuel markets are in tumult.')) {
    events.push('fuel')
  }
  if (newWire.some((item) => WORLD_CRISIS_NEWS.has(item.text))) events.push('world_crisis')
  return events
}

export function trajectoryPoint(s: TrueState, events: MacroEvent[]): TrajectoryPoint {
  const prices = {} as Record<SectorId, number>
  for (const sid of SECTOR_IDS) prices[sid] = s.market.prices[sid]
  const firstPrint = (id: 'inflation' | 'gdp_growth'): number | null =>
    s.stats.series[id]
      ?.find((print) => print.publishedAt === s.meta.tick && print.revision === 0)
      ?.value ?? null
  const employment = s.sectors.reduce((sum, sector) => sum + sector.employment, 0)
  const potential = s.sectors.reduce((sum, sector) => sum + potentialOutput(sector), 0)
  const output = s.sectors.reduce((sum, sector) => sum + sector.output, 0)
  const grossDemand = SECTOR_IDS.reduce((sum, sid) => sum + s.flows.grossDemand[sid], 0)
  const wage = s.sectors.reduce(
    (sum, sector) => sum + s.market.wages[sector.id] * sector.employment,
    0,
  ) / Math.max(employment, 1e-9)
  const householdDemand = SECTOR_IDS.reduce(
    (sum, sid) => sum + s.flows.householdDemand[sid],
    0,
  )
  const exports = SECTOR_IDS.reduce((sum, sid) => sum + s.flows.exportsReal[sid], 0)
  const partnerDemand = SECTOR_IDS.reduce((sum, sid) => {
    const weight = exports > 1e-9 ? s.flows.exportsReal[sid] / exports : 1 / SECTOR_IDS.length
    return sum + weight * s.external.world.exportDemand[sid]
  }, 0)
  const cpi = SECTOR_IDS.reduce((sum, sid) => {
    const weight = householdDemand > 1e-9 ? s.flows.householdDemand[sid] / householdDemand : 0.2
    const fuel = sid === 'energy' ? 1 + s.gov.dials.taxRates.fuel : 1
    return sum + weight * s.market.prices[sid] * fuel
  }, 0)
  return {
    tick: s.meta.tick,
    realGdp: s.flows.realGdp,
    nominalGdp: s.flows.nominalGdp,
    inflationQ: s.flows.inflationQ,
    unemployment: s.flows.unemployment,
    prices,
    debtToGdp: s.ledger.debtToGdp,
    printedThisQtr: s.flows.printedThisQtr,
    approval: s.cohorts.map((c) => c.approval),
    politicalCapital: s.politics.politicalCapital,
    inPower: s.politics.inPower,
    publishedInflation: firstPrint('inflation'),
    publishedRealGrowth: firstPrint('gdp_growth'),
    events,
    drivers: {
      laborForce: totalLaborForce(s),
      employment,
      laborProductivity: s.flows.realGdp / Math.max(employment, 1e-9),
      realWage: wage / Math.max(cpi, 1e-9),
      utilization: output / Math.max(potential, 1e-9),
      demandSatisfaction: output / Math.max(grossDemand, 1e-9),
      tfpGrowthQ: s.tech.tfpGrowthQ,
      investmentRate: s.flows.investmentReal / Math.max(s.flows.realGdp, 1e-9),
      finalDemand: SECTOR_IDS.reduce((sum, sid) => sum + s.flows.finalDemand[sid], 0),
      householdDemand,
      investment: s.flows.investmentReal,
      governmentDemand: s.flows.governmentDomesticDemandReal,
      exports,
      partnerDemand,
    },
  }
}

export function runOne(opts: RunOptions): RunResult {
  const countryId = opts.params ? 'custom' : (opts.country ?? 'baseline')
  const params = opts.params ?? (opts.country ? createCountryParams(opts.country, opts.seed) : generateParams(opts.seed))
  const byTick = new Map<number, Action[]>()
  for (const t of opts.script ?? []) byTick.set(t.tick, t.actions)
  const lenient = opts.lenient !== false

  let s = init(params, opts.seed)
  const trajectory: TrajectoryPoint[] = []
  let nanCount = 0
  let priceExplosions = 0
  let illegalActionsSkipped = 0
  let deposedAt: number | null = null

  for (let t = 0; t < opts.ticks; t++) {
    const scripted = byTick.get(t) ?? []
    const generated = opts.policy ? opts.policy(s, rngFor(opts.seed, 'runner:policy', t), t) : []
    for (const a of [...scripted, ...generated]) {
      try {
        s = applyActions(s, [a])
      } catch (e) {
        if (lenient && e instanceof IllegalActionError) illegalActionsSkipped++
        else throw e
      }
    }
    const before = s
    s = step(s)
    const p = trajectoryPoint(s, eventsBetween(before, s))
    trajectory.push(p)
    for (const v of [p.realGdp, p.nominalGdp, p.inflationQ, p.unemployment, ...Object.values(p.prices)]) {
      if (!Number.isFinite(v)) nanCount++
    }
    if (Object.values(p.prices).some((x) => x > 50 || x < 0.02)) priceExplosions++
    if (deposedAt === null && !p.inPower) deposedAt = p.tick
  }

  return {
    seed: opts.seed,
    countryId,
    country: params.name,
    ticks: opts.ticks,
    trajectory,
    finalState: s,
    stateHash: hashState(s),
    nanCount,
    priceExplosions,
    illegalActionsSkipped,
    deposedAt,
  }
}
