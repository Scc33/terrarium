/**
 * Step 6 — labor & capital. Employment chases demanded output with
 * friction; wages respond to labor-market tightness plus inflation
 * pass-through. Investment goods bought this tick become capital, allocated
 * where utilization is pressing against the ceiling.
 */

import {
  DEPRECIATION_Q,
  EMPLOYMENT_ADJUST,
  NATURAL_UNEMPLOYMENT,
  NORMAL_UTILIZATION,
  SUBSISTENCE_ABSORPTION_Q,
  SUBSISTENCE_CAP,
  UNION_FAVOR_WAGE,
  WAGE_DEMAND_GAIN,
  WAGE_SLACK_GAIN,
  WAGE_INFLATION_PASSTHROUGH,
  WAGE_MAX_DOWN,
  WAGE_MAX_UP,
} from '../constants'
import { clamp, sectorRecord } from '../math'
import type { PipelineStep } from './pipeline'
import {
  effectiveBlocPower,
  laborForce,
  laborForOutput,
  minimumWageFloor,
  totalLaborForce,
} from './derive'

export const labor: PipelineStep = {
  name: 'labor',
  run(state) {
    const { market, flows } = state
    const lf = totalLaborForce(state)

    // employment moves toward staffing demanded output *with normal
    // headroom* — firms keep spare capacity, so hiring targets potential
    // above current demand rather than exactly at it
    const targets = state.sectors.map((s) => {
      const demanded = Math.min(flows.grossDemand[s.id], 1.25 * Math.max(s.output, 1e-9))
      return laborForOutput(s, demanded / NORMAL_UTILIZATION)
    })
    let newEmployment = state.sectors.map((s, i) =>
      Math.max(0.01, s.employment + EMPLOYMENT_ADJUST * (targets[i] - s.employment)),
    )
    // the subsistence valve: idle hands drift onto the family farm rather
    // than a dole queue that doesn't exist — open unemployment becomes
    // agricultural underemployment at falling marginal product. Farms can
    // only stretch as far as the rural labor force reaches.
    const agriIdx = state.sectors.findIndex((s) => s.id === 'agri')
    const ruralLf = laborForce(state).rural_workers
    const idle = Math.max(0, lf - newEmployment.reduce((a, b) => a + b, 0))
    newEmployment[agriIdx] = Math.min(
      newEmployment[agriIdx] + SUBSISTENCE_ABSORPTION_Q * idle,
      SUBSISTENCE_CAP * ruralLf,
    )
    // the economy can't employ more people than exist
    const totalEmp = newEmployment.reduce((a, b) => a + b, 0)
    const ceiling = 0.97 * lf
    if (totalEmp > ceiling) newEmployment = newEmployment.map((e) => (e * ceiling) / totalEmp)

    // last tick's unemployment: bargaining power for this round of raises
    const uLast = flows.unemployment
    // workers capture REALIZED productivity gains near full employment, none
    // in a slump; slack drags wage growth (Phillips) — the cost→price→export
    // channel is what re-anchors the economy to full employment
    const tfpTerm =
      Math.max(0, state.tech.tfpGrowthQ) * clamp(1 - 5 * (uLast - NATURAL_UNEMPLOYMENT), 0, 1)
    const slackTerm = WAGE_SLACK_GAIN * (NATURAL_UNEMPLOYMENT - uLast)
    // An aggrieved and legally organized labor movement does not petition,
    // it bargains — and the wage push then runs through costs into prices like
    // any other wage. Weak unions can be as angry as they like for nothing.
    const wagePush =
      UNION_FAVOR_WAGE *
      Math.max(0, -state.institutions.blocs.unions.favor) *
      effectiveBlocPower(state, 'unions')
    // A minimum wage is a floor under the bargain, not a term inside it: it
    // applies after the ordinary move, to whatever the market arrived at. From
    // here it is an ordinary wage — it enters unit labour cost in `prices`,
    // the cost anchor carries it into every price in the table, and employment
    // responds only through the demand that survives. There is no scripted
    // disemployment term, and adding one would be the effect arrow ADR-0027
    // forbids.
    const floor = minimumWageFloor(state)
    const newWages = sectorRecord((sid, i) => {
      const s = state.sectors[i]
      const tightness = (targets[i] - s.employment) / Math.max(s.employment, 1e-9)
      const move = clamp(
        WAGE_DEMAND_GAIN * tightness +
          WAGE_INFLATION_PASSTHROUGH * flows.inflationQ +
          tfpTerm +
          slackTerm +
          wagePush,
        -WAGE_MAX_DOWN,
        WAGE_MAX_UP,
      )
      return Math.max(floor, Math.max(0.05, market.wages[sid] * (1 + move)))
    })

    // capital: depreciate, then allocate this tick's investment by
    // utilization pressure (public investment spreads as infrastructure)
    const pressures = state.sectors.map((s) => Math.max(0.05, s.capacityUtilization - 0.5))
    const pressureSum = pressures.reduce((a, b) => a + b, 0)
    const sectors = state.sectors.map((s, i) => ({
      ...s,
      employment: newEmployment[i],
      capital: Math.max(
        1,
        s.capital * (1 - DEPRECIATION_Q) + flows.investmentReal * (pressures[i] / pressureSum),
      ),
    }))
    const capitalTotal = sectors.reduce((sum, sector) => sum + sector.capital, 0)
    const foreignOwnedCapital = Math.min(
      capitalTotal,
      Math.max(
        0,
        state.external.foreignOwnedCapital * (1 - DEPRECIATION_Q) +
          flows.foreignDirectInvestmentReal,
      ),
    )

    const unemployment = clamp(1 - sectors.reduce((a, s) => a + s.employment, 0) / lf, 0, 1)

    return {
      ...state,
      sectors,
      external: { ...state.external, foreignOwnedCapital },
      market: { ...market, wages: newWages },
      flows: { ...flows, unemployment },
    }
  },
}
