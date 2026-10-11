/**
 * Runner-only goods-accounting spike for #85, following investigation 0024.
 *   pnpm investment-delivery -- --runs 12 --ticks 400
 *
 * This measures necessary resource constraints, not actual deliveries. The
 * engine has no allocation of scarce final goods to buyers or inventory stock.
 */
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CURATED_COUNTRY_IDS,
  SCHEMA_VERSION,
  SECTOR_IDS,
  rngFor,
  type TrueState,
} from '../packages/engine/src/index'
import {
  DEPRECIATION_Q,
  INVESTMENT_DEMAND_MANUF_SHARE,
  INVESTMENT_DEMAND_SERVICES_SHARE,
} from '../packages/engine/src/constants'
import { sectorRecord } from '../packages/engine/src/math'
import { cohorts } from '../packages/engine/src/pipeline/cohorts'
import { labor } from '../packages/engine/src/pipeline/labor'
import { production } from '../packages/engine/src/pipeline/production'
import { developmentalPolicy, randomPolicy } from '../packages/runner/src/policies'
import { runSummary } from '../packages/runner/src/run'
import { auditQuarter, createAudit, studyProvenance } from './measure-capital-ownership'

const TOLERANCE = 1e-9
const sum = (values: readonly number[]): number => values.reduce((a, b) => a + b, 0)
const capital = (s: TrueState): number => sum(s.sectors.map((sector) => sector.capital))

/** Imports are generously available to ANY domestic use, including the
 * imported FDI machinery. Exports, households and government consumption
 * take nothing here. The envelope counts complete bundles at the order book's
 * authored 60/40 goods mix. That fixed composition is a measurement assumption;
 * the engine has no delivery technology that enforces it. This is an optimistic
 * necessary bound for those bundles at recorded output, not actual delivery.
 * A negative balance means even these gross outputs need unavailable inputs.
 */
export function deliveryWorksheet(state: Pick<TrueState, 'sectors' | 'io' | 'flows'>) {
  const output = sectorRecord((sid) => state.sectors.find((sector) => sector.id === sid)!.output)
  const intermediateUse = sectorRecord((_, i) =>
    sum(SECTOR_IDS.map((sid, j) => state.io.coeff[i][j] * output[sid])),
  )
  const afterInputs = sectorRecord((sid) =>
    output[sid] + state.flows.importsReal[sid] - intermediateUse[sid],
  )
  const inputDeficit = sectorRecord((sid) => Math.max(0, -afterInputs[sid]))
  const hasInputDeficit = SECTOR_IDS.some((sid) =>
    inputDeficit[sid] > TOLERANCE * Math.max(1, intermediateUse[sid]),
  )
  const investment = state.flows.investmentReal
  const investmentEnvelope = Math.max(0, Math.min(
    investment,
    afterInputs.manuf / INVESTMENT_DEMAND_MANUF_SHARE,
    afterInputs.services / INVESTMENT_DEMAND_SERVICES_SHARE,
  ))
  const capacityConstrained = (['manuf', 'services'] as const).some((sid) =>
    output[sid] + TOLERANCE * Math.max(1, state.flows.grossDemand[sid]) < state.flows.grossDemand[sid],
  )
  return {
    intermediateUse,
    afterInputs,
    inputDeficit,
    hasInputDeficit,
    capacityConstrained,
    investment,
    investmentEnvelope,
    investmentOutsideEnvelope: investment - investmentEnvelope,
  }
}

export function createTally() {
  return {
    quarters: 0,
    capacityConstrainedQuarters: 0,
    capacityConstrainedAfterQ4: 0,
    inputDeficitQuarters: 0,
    investmentOutsideEnvelopeQuarters: 0,
    orderedInvestment: 0,
    investmentOutsideEnvelope: 0,
    inputDeficitQuartersBySector: sectorRecord(() => 0),
  }
}
type Tally = ReturnType<typeof createTally>

export function tallyQuarter(tally: Tally, state: TrueState): void {
  const row = deliveryWorksheet(state)
  tally.quarters++
  tally.capacityConstrainedQuarters += Number(row.capacityConstrained)
  tally.capacityConstrainedAfterQ4 += Number(row.capacityConstrained && state.meta.tick > 4)
  tally.inputDeficitQuarters += Number(row.hasInputDeficit)
  tally.investmentOutsideEnvelopeQuarters += Number(
    row.investmentOutsideEnvelope > TOLERANCE * Math.max(1, row.investment),
  )
  tally.orderedInvestment += row.investment
  tally.investmentOutsideEnvelope += row.investmentOutsideEnvelope
  for (const sid of SECTOR_IDS) {
    tally.inputDeficitQuartersBySector[sid] += Number(
      row.inputDeficit[sid] > TOLERANCE * Math.max(1, row.intermediateUse[sid]),
    )
  }
}

export function describeTally(tally: Tally) {
  const pct = (n: number) => tally.quarters ? 100 * n / tally.quarters : null
  return {
    ...tally,
    capacityConstrainedQuarterPct: pct(tally.capacityConstrainedQuarters),
    inputDeficitQuarterPct: pct(tally.inputDeficitQuarters),
    investmentOutsideEnvelopeQuarterPct: pct(tally.investmentOutsideEnvelopeQuarters),
    investmentOutsideEnvelopePct: tally.orderedInvestment
      ? 100 * tally.investmentOutsideEnvelope / tally.orderedInvestment : null,
  }
}

function pool(tallies: readonly Tally[]) {
  const result = createTally()
  for (const tally of tallies) {
    for (const key of ['quarters', 'capacityConstrainedQuarters', 'capacityConstrainedAfterQ4', 'inputDeficitQuarters',
      'investmentOutsideEnvelopeQuarters', 'orderedInvestment', 'investmentOutsideEnvelope'] as const) {
      result[key] += tally[key]
    }
    for (const sid of SECTOR_IDS) result.inputDeficitQuartersBySector[sid] += tally.inputDeficitQuartersBySector[sid]
  }
  return describeTally(result)
}

/** A direct-channel intervention on a snapshot: leave investment's inputs
 * fixed, but take 99% of manufacturing and service workers offline before
 * production. It is not a legal order or a complete counterfactual quarter.
 */
export function outageProbe(state: TrueState) {
  const outage = { ...state, sectors: state.sectors.map((sector) => ({
    ...sector,
    employment: sector.employment * (sector.id === 'manuf' || sector.id === 'services' ? 0.01 : 1),
  })) }
  const produced = production.run(state, rngFor(state.meta.seed, production.name, state.meta.tick))
  const blocked = production.run(outage, rngFor(state.meta.seed, production.name, state.meta.tick))
  assert.equal(blocked.flows.investmentReal, produced.flows.investmentReal,
    'the outage changed investment intentions; this probe no longer isolates delivery')
  const hired = labor.run(blocked, rngFor(state.meta.seed, labor.name, state.meta.tick))
  const audit = createAudit()
  // Settle households as well so the existing complete stock audit can check
  // this probe. Cohorts does not alter capital; this is still no full tick.
  const settled = cohorts.run(hired, rngFor(state.meta.seed, cohorts.name, state.meta.tick))
  auditQuarter(blocked, settled, audit)
  return {
    orderedInvestment: blocked.flows.investmentReal,
    capitalAdditionBeforeFloors: capital(hired) - (1 - DEPRECIATION_Q) * capital(blocked) - audit.capitalFloorAddition,
    baseline: deliveryWorksheet(produced),
    outage: deliveryWorksheet(blocked),
  }
}

const ARM_IDS = ['passive', 'developmental', 'random', 'works-control', 'works-gdp-2', 'works-gdp-5', 'works-gdp-50'] as const
type ArmId = (typeof ARM_IDS)[number]

function sample(seed: string, country: (typeof CURATED_COUNTRY_IDS)[number], arm: ArmId, ticks: number) {
  const all = createTally()
  const reachable = createTally()
  const drought = createTally()
  const nonDrought = createTally()
  const audit = createAudit()
  let before: TrueState
  let final: TrueState
  let deposed = false
  const works = arm.startsWith('works-')
  const worksShare = arm === 'works-gdp-2' ? 0.02 : arm === 'works-gdp-5' ? 0.05 : arm === 'works-gdp-50' ? 0.5 : null
  const summary = runSummary({
    seed, country, ticks, turbulence: 'ordinary',
    rules: works ? { protectedTenure: true, unlimitedCapital: true } : undefined,
    policy: arm === 'developmental' ? developmentalPolicy : arm === 'random' ? randomPolicy : undefined,
    // The lever under test is strict; ordinary policy sampling alone skips
    // refused orders. The GDP-share order goes in at Q4, after the first print.
    lenient: !works,
    script: worksShare !== null ? [{ tick: 4, actions: [{
      kind: 'setSpendingRule', programme: 'investment', mode: 'gdpShare',
      value: worksShare,
    }] }] : undefined,
    observer: {
      afterActions(state) { before = state },
      afterStep(state) {
        final = state
        auditQuarter(before, state, audit)
        tallyQuarter(all, state)
        // Include the deposition quarter, exclude every subsequent one. A
        // protected works arm is an economic experiment, not reachable play.
        if (!deposed) {
          tallyQuarter(reachable, state)
          tallyQuarter(state.external.shocks.droughtQtrsLeft > 0 ? drought : nonDrought, state)
        }
        deposed ||= !state.politics.inPower
      },
    },
  })
  assert.equal(summary.nanCount, 0, 'non-finite simulation')
  return {
    arm, country, seed, protectedExperiment: works, publicWorksGdpShare: worksShare,
    deposedAt: summary.deposedAt, illegalActionsSkipped: summary.illegalActionsSkipped,
    priceExplosionQuarters: summary.priceExplosions,
    all: describeTally(all), retained: describeTally(reachable),
    drought: describeTally(drought), nonDrought: describeTally(nonDrought),
    audit, probe: outageProbe(final!),
  }
}

function grouped(samples: ReturnType<typeof sample>[], arm: ArmId, country: string) {
  const rows = samples.filter((row) => row.arm === arm && (country === 'all' || row.country === country))
  return {
    arm, country, paths: rows.length, protectedExperiment: arm.startsWith('works-'),
    deposedRuns: rows.filter((row) => row.deposedAt !== null).length,
    priceExplosionRuns: rows.filter((row) => row.priceExplosionQuarters > 0).length,
    illegalActionsSkipped: sum(rows.map((row) => row.illegalActionsSkipped)),
    all: pool(rows.map((row) => row.all)),
    retained: pool(rows.map((row) => row.retained)),
    drought: pool(rows.map((row) => row.drought)),
    nonDrought: pool(rows.map((row) => row.nonDrought)),
    outage: {
      zeroInvestmentEnvelopeProbes: rows.filter((row) => row.probe.outage.investmentEnvelope === 0).length,
      inputDeficitProbes: rows.filter((row) => row.probe.outage.hasInputDeficit).length,
      maxCapitalBookingResidual: Math.max(...rows.map((row) =>
        Math.abs(row.probe.capitalAdditionBeforeFloors - row.probe.orderedInvestment))),
    },
  }
}

function arg(name: string, fallback: string): string {
  const inline = process.argv.find((value) => value.startsWith(`--${name}=`))
  const index = process.argv.indexOf(`--${name}`)
  return inline ? inline.slice(name.length + 3) : index < 0 ? fallback : process.argv[index + 1] ?? fallback
}

function main(): void {
  const provenance = studyProvenance()
  const runs = Number(arg('runs', '12'))
  const ticks = Number(arg('ticks', '400'))
  const country = arg('country', 'all')
  const arm = arg('arm', 'all')
  assert(Number.isInteger(runs) && runs > 0, '--runs must be a positive integer')
  assert(Number.isInteger(ticks) && ticks > 4, '--ticks must be an integer greater than 4')
  assert(country === 'all' || (CURATED_COUNTRY_IDS as readonly string[]).includes(country), 'unknown --country')
  assert(arm === 'all' || (ARM_IDS as readonly string[]).includes(arm), 'unknown --arm')
  const countries = country === 'all' ? CURATED_COUNTRY_IDS : [country as (typeof CURATED_COUNTRY_IDS)[number]]
  const arms = arm === 'all' ? ARM_IDS : [arm as ArmId]
  const samples: ReturnType<typeof sample>[] = []
  for (const id of countries) {
    for (let run = 0; run < runs; run++) for (const scenario of arms) {
      samples.push(sample(`delivery-${id}-${run}`, id, scenario, ticks))
    }
    console.error(`Measured ${id}: ${runs} seeds × ${arms.length} arms × ${ticks} quarters`)
  }
  const groups = arms.flatMap((scenario) => ['all', ...countries].map((id) => grouped(samples, scenario, id)))
  process.stdout.write(JSON.stringify({
    ...provenance, schemaVersion: SCHEMA_VERSION, runs, ticks, turbulence: 'ordinary',
    envelopeAssumptions: {
      goodsMix: { manuf: INVESTMENT_DEMAND_MANUF_SHARE, services: INVESTMENT_DEMAND_SERVICES_SHARE },
      imports: 'All recorded imports, including FDI machinery, can cover domestic inputs and investment.',
      competingFinalUses: 'Households, exports and government consumption receive nothing.',
      interpretation: 'Complete fixed-mix bundles at recorded output; no delivery estimate or forecast.',
    },
    groups, samples,
  }, null, 2) + '\n')
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) main()
