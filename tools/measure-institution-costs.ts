/**
 * Institution-cost spike (#50, #48): isolated collection channels and the
 * ministry bids a player could see under ordinary tenure, fog and turbulence.
 * pnpm institution-costs -- --runs 20 --ticks 416
 * The legacy bid is a counterfactual UI quote, not an enacted extra order.
 */
import {
  CAPACITY_IDS,
  COUNTRY_CATALOG,
  INSTITUTION_IDS,
  IllegalActionError,
  applyAction,
  createCountryParams,
  init,
  politicalCostOfAction,
  rngFor,
  step,
  type TrueState,
} from '../packages/engine/src/index'
import {
  CAPACITY_BUILD_QTRS,
  CAPACITY_COST_PER_POINT,
  CAPACITY_DECAY_BY_ID,
  CAPACITY_MINISTRY_FULL_STRENGTH_GATE,
  adminEffectiveness,
  taxEfficiency,
} from '../packages/engine/src/constants'
import { fiscal } from '../packages/engine/src/pipeline/fiscal'
import { policyFor } from '../packages/runner/src/policies'
import { capacityFunding } from '../packages/ui/src/capacityFunding'

function arg(name: string, fallback: string): number {
  const index = process.argv.indexOf(`--${name}`)
  return Number(index < 0 ? fallback : process.argv[index + 1])
}
const runs = arg('runs', '20')
const ticks = arg('ticks', '416')
if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer')
if (!Number.isInteger(ticks) || ticks < 8) throw new Error('--ticks must be at least 8')
const round = (value: number) => Number(value.toFixed(4))
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length)
const runFiscal = (state: TrueState) => fiscal.run(state, rngFor(state.meta.seed, 'fiscal', state.meta.tick))

console.log(JSON.stringify({
  study: 'collection-and-delivery',
  capacity: [0, 0.2, 0.3, 0.5, 1].map((value) => ({
    value, incomeAndCorporateCollection: round(taxEfficiency(value)),
    programmeDelivery: round(adminEffectiveness(value)),
  })),
  tenPointBuild: { total: CAPACITY_COST_PER_POINT * 0.1, quarters: CAPACITY_BUILD_QTRS },
}))

for (const { id } of COUNTRY_CATALOG) {
  const seed = `institution-cost-${id}-0`
  let state = init(createCountryParams(id, seed), seed)
  for (let tick = 0; tick < 16; tick++) state = step(state)
  const baseline = runFiscal(state)
  const low = runFiscal({ ...state, gov: { ...state.gov, capacity: { ...state.gov.capacity, tax: 0.2 } } })
  const high = runFiscal({ ...state, gov: { ...state.gov, capacity: { ...state.gov.capacity, tax: 0.3 } } })
  const calm = { ...state, institutions: { ...state.institutions, unrest: 0 } }
  const crisis = { ...state, institutions: { ...state.institutions, unrest: 0.5 } }
  const bid = Math.max(2, state.gov.budget.revenue * 0.8)
  console.log(JSON.stringify({
    study: 'fixed-bases', country: id, seed, tick: state.meta.tick,
    revenueGainPercent: round(100 * (high.gov.budget.revenue / low.gov.budget.revenue - 1)),
    revenueBySourceGainPercent: Object.fromEntries(Object.keys(low.flows.revenueBySource).map((key) => {
      const source = key as keyof typeof low.flows.revenueBySource
      return [source, low.flows.revenueBySource[source] > 0
        ? round(100 * (high.flows.revenueBySource[source] / low.flows.revenueBySource[source] - 1)) : null]
    })),
    legacyMinistryBid: round(bid), legacyBillPerQtr: round(bid / CAPACITY_BUILD_QTRS),
    legacyBillPercentOfReceipts: round(100 * bid / CAPACITY_BUILD_QTRS / state.gov.budget.revenue),
    reform: INSTITUTION_IDS.map((institution) => {
      const action = { kind: 'reform', institution, direction: 1 } as const
      const after = applyAction({ ...calm, politics: { ...calm.politics, politicalCapital: 1e9 } }, action)
      return {
        institution, calmPc: round(politicalCostOfAction(calm, action)),
        crisisPc: round(politicalCostOfAction(crisis, action)),
        isolatedRevenuePercent: round(100 * (runFiscal(after).gov.budget.revenue / baseline.gov.budget.revenue - 1)),
        actionCashChange: after.gov.budget.balance - calm.gov.budget.balance,
      }
    }),
  }))
}

for (const policy of ['passive', 'developmental', 'random'] as const) {
  let offered = 0, overRoom = 0, blockedByPending = 0, clippedOffers = 0
  let legacyTooLarge = 0, boundedTooLarge = 0
  const budgetShares: number[] = []
  let example: unknown = null
  for (const { id } of COUNTRY_CATALOG) for (let run = 0; run < runs; run++) {
    const seed = `institution-cost-${id}-${run}`
    let state = init(createCountryParams(id, seed), seed)
    for (let tick = 0; tick < ticks && state.politics.inPower; tick++) {
      // Only the exact government fields the helper reads; avoid projecting
      // the entire growing survey archive just to inspect a cabinet bid.
      const pub = { capacity: state.gov.capacity, capacityBuilding: state.gov.pipeline,
        treasury: { revenue: state.gov.budget.revenue } }
      budgetShares.push(state.gov.budget.outlays > 0 ? 100 * state.flows.outlaysByProgramme.capacity / state.gov.budget.outlays : 0)
      for (const target of CAPACITY_IDS) {
        if (state.gov.capacity[target] >= CAPACITY_MINISTRY_FULL_STRENGTH_GATE) continue
        offered++
        const amount = Math.max(2, state.gov.budget.revenue * 0.8)
        const pipeline = state.gov.pipeline.filter((build) => build.target === target)
        const pending = pipeline.reduce((sum, build) => sum + build.perQtr * build.remaining, 0)
        const blocked = state.gov.capacity[target] + pending >= CAPACITY_MINISTRY_FULL_STRENGTH_GATE
        let legal = true
        try { politicalCostOfAction(state, { kind: 'investCapacity', target, amount }) }
        catch (error) {
          if (!(error instanceof IllegalActionError)) throw error
          legal = false
          if (error.message.includes('too large')) legacyTooLarge++
          else if (!error.message.includes('full strength')) throw error
        }
        if (blocked) blockedByPending++
        if (state.gov.capacity[target] + pending + amount / CAPACITY_COST_PER_POINT > 1) overRoom++
        // Account for decay before calling an offer wasteful. Existing builds
        // plus this bid are projected through the deterministic fiscal clamp.
        let capacity = state.gov.capacity[target], lostPoints = 0
        for (let quarter = 0; quarter < CAPACITY_BUILD_QTRS; quarter++) {
          const delivery = amount / CAPACITY_COST_PER_POINT / CAPACITY_BUILD_QTRS +
            pipeline.reduce((sum, build) => sum + (build.remaining > quarter ? build.perQtr : 0), 0)
          const delivered = (capacity + delivery) * (1 - CAPACITY_DECAY_BY_ID[target])
          lostPoints += Math.max(0, delivered - 1)
          capacity = Math.min(1, delivered)
        }
        if (legal && lostPoints > 1e-9) {
          clippedOffers++
          example ??= { country: id, seed, tick, target, capacity: round(state.gov.capacity[target]),
            pending: round(pending), legacyAmount: round(amount), clippedPoints: round(lostPoints),
            boundedAmount: round(capacityFunding(pub, target).amount) }
        }
        const quote = capacityFunding(pub, target)
        if (!quote.full) {
          try { politicalCostOfAction(state, { kind: 'investCapacity', target, amount: quote.amount }) }
          catch (error) {
            if (!(error instanceof IllegalActionError) || !error.message.includes('too large')) throw error
            boundedTooLarge++
          }
        }
      }
      // Baseline policies may over-offer a full or unaffordable ministry;
      // exactly those known refusals are skipped, as in the ordinary runner.
      for (const action of policyFor(policy)?.(state, rngFor(seed, 'runner:policy', tick), tick) ?? []) {
        try { state = applyAction(state, action) }
        catch (error) {
          if (!(error instanceof IllegalActionError)) throw error
        }
      }
      state = step(state)
    }
  }
  console.log(JSON.stringify({
    study: 'reachable-offers', policy, runs: runs * COUNTRY_CATALOG.length, ticks,
    offered, overRoom, blockedByPending, clippedOffers, legacyTooLarge, boundedTooLarge,
    ministryMeanShareOfOutlays: round(mean(budgetShares)), example,
  }))
}
