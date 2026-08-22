/**
 * Two trees and the gap. The frontier is history; what you attain
 * is absorption, and absorption is schools. These claims are the reason
 * "just buy the machines" fails and the reason education is a dial worth
 * a decade of budget.
 */

import { describe, expect, it } from 'vitest'
import {
  absorptiveCapacity,
  applyActions,
  BLOC_IDS,
  breakthroughHazard,
  frontierGrowthAt,
  init,
  researchAllocation,
  SECTOR_IDS,
  step,
  type TrueState,
} from '@terrarium/engine'
import { standardCountry } from '@terrarium/fixtures'

function run(seed: string, ticks: number, education?: number, invest = false): TrueState {
  const params =
    education === undefined
      ? standardCountry
      : { ...standardCountry, capacities: { ...standardCountry.capacities, education } }
  let s = init(params, seed)
  for (let t = 0; t < ticks; t++) {
    if (invest && t === 4) {
      s = applyActions(s, [
        { kind: 'investCapacity', target: 'education', amount: 0.35 * s.flows.nominalGdp },
      ])
    }
    s = step(s)
  }
  return s
}

function researchCountry(development: number, education = 0.7, administrative = 0.7) {
  return {
    ...standardCountry,
    development,
    capacities: { ...standardCountry.capacities, education, administrative },
  }
}

function runResearch(
  seed: string,
  ticks: number,
  development: number,
  research: boolean,
): TrueState {
  let s = init(researchCountry(development), seed)
  if (research) {
    s = applyActions(s, [
      { kind: 'setDial', path: 'spending.research', value: 0.02 * s.flows.nominalGdp },
    ])
  }
  for (let t = 0; t < ticks; t++) s = step(s)
  return s
}

describe('two trees and the gap', () => {
  it('the frontier follows history: golden age, 1973 slowdown, ICT bump', () => {
    expect(frontierGrowthAt(40)).toBeGreaterThan(frontierGrowthAt(160)) // 1956 > 1986
    expect(frontierGrowthAt(210)).toBeGreaterThan(frontierGrowthAt(160)) // 1998 > 1986
  })

  it('catch-up is real, and schools set its speed', () => {
    const dark = run('tech-1', 200, 0.05)
    const schooled = run('tech-1', 200, 0.6)
    expect(schooled.tech.attained.manuf).toBeGreaterThan(1.15 * dark.tech.attained.manuf)
    // both chase the same frontier — nobody outruns it from behind
    expect(schooled.tech.attained.manuf).toBeLessThan(schooled.tech.frontier)
  })

  it('the ceiling: without human capital the gap widens for a century', () => {
    const dark = run('tech-2', 400, 0.05)
    const ratio = dark.tech.attained.manuf / dark.tech.frontier
    const startRatio = 0.45 + 0.5 * standardCountry.development // attained at init / frontier 1
    expect(ratio).toBeLessThan(startRatio) // fell further behind, relatively
  })

  it('Baumol: manufacturing rides the frontier, the string quartet does not', () => {
    const s = run('tech-3', 400)
    expect(s.tech.attained.manuf).toBeGreaterThan(1.5 * s.tech.attained.services)
  })

  it('education is a button on the dashboard: investCapacity(education) changes the century', () => {
    const passive = run('tech-4', 200)
    const invested = run('tech-4', 200, undefined, true)
    expect(invested.gov.capacity.education).toBeGreaterThan(passive.gov.capacity.education + 0.1)
    expect(invested.demography.humanCapital).toBeGreaterThan(
      passive.demography.humanCapital + 0.1,
    )
    expect(invested.tech.attained.manuf).toBeGreaterThan(passive.tech.attained.manuf)
    // and schooling pulls fertility down beyond the income channel
    expect(invested.demography.tfr).toBeLessThan(passive.demography.tfr)
  })

  it('schools are an institution; human capital is the slow stock of people they taught', () => {
    let state = init(standardCountry, 'tech-human-capital-lag')
    const inherited = state.demography.humanCapital
    state = applyActions(state, [
      { kind: 'investCapacity', target: 'education', amount: 0.35 * state.flows.nominalGdp },
    ])
    for (let t = 0; t < 16; t++) state = step(state)

    // The buildings have arrived, but a workforce is not built on the same
    // two-year project schedule. Skills have started moving and still lag far
    // behind the institution that is producing them.
    expect(state.gov.capacity.education).toBeGreaterThan(
      state.demography.humanCapital + 0.15,
    )
    expect(state.demography.humanCapital).toBeGreaterThan(inherited)

    const schoolShell: TrueState = {
      ...state,
      gov: {
        ...state.gov,
        capacity: { ...state.gov.capacity, education: 0.95 },
      },
    }
    const skilled: TrueState = {
      ...state,
      demography: { ...state.demography, humanCapital: 0.8 },
    }
    // Technology and research read the people, not the buildings. Merely
    // relabelling the current school system cannot create trained staff.
    expect(absorptiveCapacity(schoolShell)).toBeCloseTo(absorptiveCapacity(state), 12)
    expect(absorptiveCapacity(skilled)).toBeGreaterThan(absorptiveCapacity(state))

    const fundResearch = (s: TrueState): TrueState => ({
      ...s,
      gov: {
        ...s.gov,
        dials: {
          ...s.gov.dials,
          spending: { ...s.gov.dials.spending, research: 0.02 * s.flows.nominalGdp },
        },
      },
    })
    expect(researchAllocation(fundResearch(schoolShell)).effectiveShare).toBeCloseTo(
      researchAllocation(fundResearch(state)).effectiveShare,
      12,
    )
    expect(researchAllocation(fundResearch(skilled)).effectiveShare).toBeGreaterThan(
      researchAllocation(fundResearch(state)).effectiveShare,
    )
  })

  it('one research policy changes character with position: catch-up behind, invention near the frontier', () => {
    const poor = init(researchCountry(0.1), 'tech-rd-poor')
    const rich = init(researchCountry(0.9), 'tech-rd-rich')
    const fund = (s: TrueState) =>
      applyActions(s, [
        { kind: 'setDial', path: 'spending.research', value: 0.02 * s.flows.nominalGdp },
      ])

    const poorAllocation = researchAllocation(fund(poor))
    const richAllocation = researchAllocation(fund(rich))
    expect(poorAllocation.catchupShare).toBeGreaterThan(0.95)
    expect(poorAllocation.frontierShare).toBeLessThan(0.05)
    expect(richAllocation.frontierShare).toBeGreaterThan(0.5)
    expect(richAllocation.catchupShare).toBeLessThan(0.5)
  })

  it('research grants accelerate domestic attainment when the country is behind', () => {
    const passive = runResearch('tech-rd-catchup', 80, 0.1, false)
    const funded = runResearch('tech-rd-catchup', 80, 0.1, true)
    // a country this far back funds adaptation, and adaptation alone
    expect(funded.tech.frontier).toBeCloseTo(passive.tech.frontier, 10)
    // EVERY sector's technique improves. The assertion is deliberately
    // per-sector rather than on `technologyAttainment`: the aggregate is
    // output-weighted, research makes the economy grow, and growth shifts
    // output toward services — the sector Baumol keeps furthest from its own
    // frontier. So the index can fall in a quarter when every single sector
    // in it rose. That is a property of the measure, not of the policy, and
    // a test that pins the policy must not be hostage to it.
    for (const id of SECTOR_IDS) {
      expect(funded.tech.attained[id]).toBeGreaterThan(passive.tech.attained[id])
    }
    expect(funded.tech.attained.manuf).toBeGreaterThan(passive.tech.attained.manuf * 1.03)
  })

  it('near-frontier research pushes the frontier — in lumps, so on average', () => {
    // Invention is a hazard process now: effort buys shots on goal, not a
    // delivery date. Any ONE century is a coin the engine flips, so the claim
    // is about the mean — which is exactly the quantity BREAKTHROUGH_SIZE was
    // chosen to leave unchanged.
    const seeds = Array.from({ length: 12 }, (_, i) => `tech-rd-frontier-${i}`)
    let ratioSum = 0
    let everPushed = 0
    for (const seed of seeds) {
      const passive = runResearch(seed, 80, 0.9, false)
      const funded = runResearch(seed, 80, 0.9, true)
      // nobody's research ever makes the frontier RETREAT
      expect(funded.tech.frontier).toBeGreaterThanOrEqual(passive.tech.frontier)
      ratioSum += funded.tech.frontier / passive.tech.frontier
      if (funded.tech.frontier > passive.tech.frontier) everPushed++
    }
    const mean = ratioSum / seeds.length
    expect(mean).toBeGreaterThan(1.004)
    // Original research is the expensive end of the same policy, not a growth
    // cheat: twenty years of it buys low single-digit percents of frontier.
    expect(mean).toBeLessThan(1.03)
    // and it is a bet, not a purchase — some countries get nothing for it
    expect(everPushed).toBeGreaterThan(2)
    expect(everPushed).toBeLessThan(seeds.length)
  })

  it('a research base is inherited: it coasts through a bad budget year', () => {
    // The stock is the whole point. A programme cut to zero keeps delivering
    // for years, which is what makes strangling one a slow political act
    // rather than a switch the player flips.
    let s = init(researchCountry(0.5), 'tech-rd-stock')
    s = applyActions(s, [
      { kind: 'setDial', path: 'spending.research', value: 0.03 * s.flows.nominalGdp },
    ])
    for (let t = 0; t < 60; t++) s = step(s)
    const built = s.tech.researchStock
    expect(built).toBeGreaterThan(0)

    // the cheque stops entirely
    s = applyActions(s, [{ kind: 'setDial', path: 'spending.research', value: 0 }])
    let afterFourQuarters = 0
    for (let t = 0; t < 24; t++) {
      s = step(s)
      if (t === 3) afterFourQuarters = s.tech.researchStock
    }
    // a year later most of the base is still working…
    expect(afterFourQuarters).toBeGreaterThan(0.7 * built)
    // …six years later it has largely gone
    expect(s.tech.researchStock).toBeLessThan(0.35 * built)
  })

  it('entrenched incumbents veto invention, not just imitation', () => {
    // The gate this closes: absorption was already priced by creative
    // destruction, so a captured economy could not absorb what others had
    // invented — but could still buy original innovation with money. That is
    // backwards on this model's own logic, and on Acemoglu's.
    const base = runResearch('tech-rd-capture', 40, 0.9, true)
    const withCapture = (power: number): TrueState => ({
      ...base,
      institutions: {
        ...base.institutions,
        blocs: Object.fromEntries(
          BLOC_IDS.map((id) => [id, { ...base.institutions.blocs[id], power }]),
        ) as typeof base.institutions.blocs,
      },
    })
    const checked = withCapture(0.1)
    const captured = withCapture(0.95)
    const intensity = base.tech.researchStock * 0.05
    const hazardOf = (s: TrueState) =>
      breakthroughHazard(s, researchAllocation(s), intensity)

    expect(hazardOf(checked)).toBeGreaterThan(0)
    expect(hazardOf(captured)).toBeLessThan(hazardOf(checked))
    // and it damps rather than forbids — a bloc makes things expensive, never
    // impossible, the same rule every other veto in the game follows
    expect(hazardOf(captured)).toBeGreaterThan(0)
  })

  it('one budget, two programmes: invention where you lead, imitation where you lag', () => {
    // Sector-directed research is what lets an economy be honestly uneven.
    // A blended split could only ever say one thing about a whole country.
    const base = init(researchCountry(0.5), 'tech-rd-uneven')
    const uneven: TrueState = {
      ...base,
      tech: {
        ...base.tech,
        // machine shops at world practice, the fields a generation behind
        attained: { ...base.tech.attained, manuf: 0.99, agri: 0.4 },
      },
    }
    const split = researchAllocation(uneven)
    expect(split.frontierBySector.manuf).toBeGreaterThan(0.9)
    expect(split.frontierBySector.agri).toBe(0)
    expect(split.catchupBySector.agri).toBe(1)
    // the ministry-level number is the output-weighted blend of the two
    expect(split.frontierShare).toBeGreaterThan(0)
    expect(split.frontierShare).toBeLessThan(split.frontierBySector.manuf)
    expect(split.catchupShare).toBeCloseTo(1 - split.frontierShare, 12)
  })

  it('research money needs both administration and educated staff', () => {
    const allocate = (education: number, administrative: number) => {
      const s = init(researchCountry(0.4, education, administrative), `tech-rd-${education}`)
      return researchAllocation(
        applyActions(s, [
          { kind: 'setDial', path: 'spending.research', value: 0.02 * s.flows.nominalGdp },
        ]),
      ).effectiveShare
    }
    expect(allocate(0.8, 0.8)).toBeGreaterThan(allocate(0.05, 0.05) * 5)
  })
})
