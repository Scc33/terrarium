/**
 * Single headless run: seed + script → trajectory or streamed summary. The
 * detailed trajectory remains the unit for property and stability analysis;
 * the ordinary batch report reduces it as the simulation runs.
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
  type GameMode,
  type GameRules,
  type Qtr,
  type Rng,
  type SectorId,
  type TurnActions,
  type TrueState,
} from '@terrarium/engine'
import { DEBT_FREE_RATIO, debtToGdp } from './debt'

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
  population: number
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
  /** Orders that did not take effect. Under `lenient: 'turn'` a refused order
   * costs its whole turn, so every action in that turn is counted. */
  illegalActionsSkipped: number
  deposedAt: number | null
}

export type RunResultWithoutHash = Omit<RunResult, 'stateHash'>

/** The ordinary batch report only needs one aggregate row per simulation.
 * Keeping these values instead of the full diagnostic trajectory makes its
 * memory proportional to runs, rather than runs × quarters. */
export interface RunSummary {
  seed: string
  countryId: RunResult['countryId']
  country: string
  ticks: number
  realGrowth: number
  meanAnnualInflation: number
  meanUnemployment: number
  finalDebtToGdp: number
  firstDebtFreeQuarter: number | null
  nanCount: number
  priceExplosions: number
  illegalActionsSkipped: number
  deposedAt: number | null
}

/** Fine-grained, read-only hooks for diagnostic tooling. Action attempts are
 * reported before application and accepted actions immediately afterward, so
 * a caller can preserve the exact trigger even when a later action throws. */
export interface RunObserver {
  beforeTurn?(state: TrueState): void
  onActionAttempt?(turn: TurnActions): void
  onActionAccepted?(turn: TurnActions): void
  /** Retained for callers that want the accepted actions batched by turn. */
  onActions?(turn: TurnActions): void
  afterActions?(state: TrueState): void
  afterStep?(state: TrueState): void
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
  /** Independent from the simulation seed when an experiment needs country,
   * shocks, and government behavior to vary on separate axes. */
  policySeed?: string
  /** Immutable rules for the run. Ordinary balance baselines omit this and
   * retain the standard rules. */
  rules?: GameMode | Partial<GameRules>
  /** The quarter the player takes office (ADR-0021). Balance baselines omit
   * it and open in 1946. It exists here so a tool can replay a real save on
   * the runner: `init` has always taken it, and a run that dropped it would
   * quietly score a different country from the one the save holds. */
  appointedAt?: Qtr
  /** Read-only probes for research and fuzz tooling. Successful generated or
   * scripted actions are reported before the tick; state is reported after it. */
  observer?: RunObserver
  /** How to survive an order this build refuses. `true` (default) skips the
   * individual action; `false` throws, which is what golden replays want.
   *
   * `'turn'` discards the WHOLE scripted turn instead, because that is what
   * the game's own loader does (`ui/src/worker/sim.worker.ts` catches around
   * one `applyActions` call per turn). A tool that replays somebody's save and
   * calls the result "the century they played" has to agree with the country
   * the game would actually open from that file — and the two only diverge on
   * a save from an older engine, which is precisely the save worth analysing.
   * Generated policy actions stay per-action lenient under `'turn'`: a runner
   * policy deliberately over-offers and relies on the skip. */
  lenient?: boolean | 'turn'
  /** Exact state hashing serializes the full statistical archive. Keep it on
   * by default for callers that compare runs; bulk diagnostics can opt out. */
  includeStateHash?: boolean
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
  // Energy ruptures and foreign crises leave no dedicated state flag: the
  // world step immediately begins reverting the jumped price. The onset wire
  // item is therefore the durable runner-visible event marker — matched on
  // `kind`, never on prose.
  //
  // It WAS matched on prose, against four exact sentences and a fifth in a
  // Set, and #160 is how that was found: rewording the wire silently stopped
  // every fuel and world-crisis window being excluded from the quiet tails,
  // and the stability harness reported a growth upside that was really an
  // unexcluded oil shock. It failed loudly here only by luck of a threshold.
  // This is the same failure the finance overlay's crisis markers were moved
  // off prose to avoid; `kind` exists for exactly this.
  let fuel = false
  let worldCrisis = false
  for (let i = before.stats.news.length; i < after.stats.news.length; i++) {
    const { kind } = after.stats.news[i]
    if (kind === 'fuel_shock') fuel = true
    if (kind === 'partner_crisis') worldCrisis = true
  }
  if (fuel) events.push('fuel')
  if (worldCrisis) events.push('world_crisis')
  return events
}

export function trajectoryPoint(s: TrueState, events: MacroEvent[]): TrajectoryPoint {
  const prices = {} as Record<SectorId, number>
  for (const sid of SECTOR_IDS) prices[sid] = s.market.prices[sid]
  const firstPrint = (id: 'inflation' | 'gdp_growth'): number | null => {
    const series = s.stats.series[id]
    if (!series || series.length === 0) return null
    // Prints are appended in release-date order. Search the newest handful,
    // not the office's entire century-long archive, for today's first print.
    let firstToday = series.length - 1
    if (series[firstToday].publishedAt !== s.meta.tick) return null
    while (firstToday > 0 && series[firstToday - 1].publishedAt === s.meta.tick) firstToday--
    for (let i = firstToday; i < series.length; i++) {
      const print = series[i]
      if (print.revision === 0) return print.value
    }
    return null
  }
  const employment = s.sectors.reduce((sum, sector) => sum + sector.employment, 0)
  const population = s.demography.pyramid.reduce((sum, size) => sum + size, 0)
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
    // The ledger carries the ratio fiscal policy saw before this quarter's
    // borrowing or redemption. Diagnostics report the debt that is actually
    // on the books after the fiscal step, matching the treasury worksheet.
    debtToGdp: debtToGdp(s.gov.debt, s.flows.nominalGdp),
    printedThisQtr: s.flows.printedThisQtr,
    approval: s.cohorts.map((c) => c.approval),
    politicalCapital: s.politics.politicalCapital,
    inPower: s.politics.inPower,
    publishedInflation: firstPrint('inflation'),
    publishedRealGrowth: firstPrint('gdp_growth'),
    events,
    drivers: {
      population,
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

interface SimulationResult {
  seed: string
  countryId: RunResult['countryId']
  country: string
  ticks: number
  finalState: TrueState
  nanCount: number
  priceExplosions: number
  illegalActionsSkipped: number
  deposedAt: number | null
}

function simulate(opts: RunOptions, onPoint: (point: TrajectoryPoint) => void): SimulationResult {
  const countryId = opts.params ? 'custom' : (opts.country ?? 'baseline')
  const params = opts.params ?? (opts.country ? createCountryParams(opts.country, opts.seed) : generateParams(opts.seed))
  const byTick = new Map<number, Action[]>()
  for (const t of opts.script ?? []) byTick.set(t.tick, t.actions)
  const lenient = opts.lenient !== false
  const turnAtomic = opts.lenient === 'turn'

  let s = init(params, opts.seed, opts.rules, opts.appointedAt ?? 0)
  let nanCount = 0
  let priceExplosions = 0
  let illegalActionsSkipped = 0
  let deposedAt: number | null = null

  for (let t = 0; t < opts.ticks; t++) {
    opts.observer?.beforeTurn?.(s)
    const scripted = byTick.get(t) ?? []
    const generated = opts.policy
      ? opts.policy(s, rngFor(opts.policySeed ?? opts.seed, 'runner:policy', t), t)
      : []
    const accepted: Action[] = []
    // The scripted turn goes in atomically under `'turn'`, so a refused order
    // takes its whole turn with it exactly as the loader's catch does.
    if (turnAtomic && scripted.length > 0) {
      opts.observer?.onActionAttempt?.({ tick: t, actions: scripted })
      try {
        s = applyActions(s, scripted)
        accepted.push(...scripted)
        opts.observer?.onActionAccepted?.({ tick: t, actions: scripted })
      } catch (e) {
        if (e instanceof IllegalActionError) illegalActionsSkipped += scripted.length
        else throw e
      }
    }
    for (const a of turnAtomic ? generated : [...scripted, ...generated]) {
      opts.observer?.onActionAttempt?.({ tick: t, actions: [a] })
      try {
        s = applyActions(s, [a])
        accepted.push(a)
        opts.observer?.onActionAccepted?.({ tick: t, actions: [a] })
      } catch (e) {
        if (lenient && e instanceof IllegalActionError) illegalActionsSkipped++
        else throw e
      }
    }
    if (accepted.length > 0) opts.observer?.onActions?.({ tick: t, actions: accepted })
    opts.observer?.afterActions?.(s)
    const before = s
    s = step(s)
    opts.observer?.afterStep?.(s)
    const p = trajectoryPoint(s, eventsBetween(before, s))
    onPoint(p)
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
    finalState: s,
    nanCount,
    priceExplosions,
    illegalActionsSkipped,
    deposedAt,
  }
}

export function runOne(opts: RunOptions & { includeStateHash: false }): RunResultWithoutHash
export function runOne(opts: RunOptions): RunResult
export function runOne(opts: RunOptions): RunResult | RunResultWithoutHash {
  const trajectory: TrajectoryPoint[] = []
  const result = simulate(opts, (point) => trajectory.push(point))
  const unhashed: RunResultWithoutHash = { ...result, trajectory }
  if (opts.includeStateHash === false) return unhashed
  return { ...unhashed, stateHash: hashState(result.finalState) }
}

export function runSummary(opts: RunOptions): RunSummary {
  let first: TrajectoryPoint | undefined
  let last: TrajectoryPoint | undefined
  let inflationSum = 0
  let unemploymentSum = 0
  let points = 0
  let firstDebtFreeQuarter: number | null = null
  const result = simulate(opts, (point) => {
    first ??= point
    last = point
    inflationSum += point.inflationQ
    unemploymentSum += point.unemployment
    points++
    if (firstDebtFreeQuarter === null && point.debtToGdp <= DEBT_FREE_RATIO) {
      firstDebtFreeQuarter = point.tick
    }
  })
  const years = first && last ? (last.tick - first.tick) / 4 : 0
  const realGrowth = years > 0 && first!.realGdp > 0
    ? (Math.pow(last!.realGdp / first!.realGdp, 1 / years) - 1) * 100
    : 0
  return {
    seed: result.seed,
    countryId: result.countryId,
    country: result.country,
    ticks: result.ticks,
    realGrowth,
    meanAnnualInflation: (inflationSum / Math.max(points, 1)) * 4 * 100,
    meanUnemployment: (unemploymentSum / Math.max(points, 1)) * 100,
    finalDebtToGdp: last?.debtToGdp ?? Number.NaN,
    firstDebtFreeQuarter,
    nanCount: result.nanCount,
    priceExplosions: result.priceExplosions,
    illegalActionsSkipped: result.illegalActionsSkipped,
    deposedAt: result.deposedAt,
  }
}
