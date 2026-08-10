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
}

export type MacroEvent = 'drought' | 'fuel' | 'banking_crisis'

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

function eventsBetween(before: TrueState, after: TrueState): MacroEvent[] {
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
  return events
}

function point(s: TrueState, events: MacroEvent[]): TrajectoryPoint {
  const prices = {} as Record<SectorId, number>
  for (const sid of SECTOR_IDS) prices[sid] = s.market.prices[sid]
  const firstPrint = (id: 'inflation' | 'gdp_growth'): number | null =>
    s.stats.series[id]
      ?.find((print) => print.publishedAt === s.meta.tick && print.revision === 0)
      ?.value ?? null
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
    const p = point(s, eventsBetween(before, s))
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
