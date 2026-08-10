/**
 * M4 §9 — two trees and the gap. The frontier is history; what you attain
 * is absorption, and absorption is schools. These claims are the reason
 * "just buy the machines" fails and the reason education is a dial worth
 * a decade of budget.
 */

import { describe, expect, it } from 'vitest'
import {
  applyActions,
  frontierGrowthAt,
  init,
  researchAllocation,
  step,
  technologyAttainment,
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

describe('two trees and the gap (§9)', () => {
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
    expect(invested.tech.attained.manuf).toBeGreaterThan(passive.tech.attained.manuf)
    // and schooling pulls fertility down beyond the income channel (§8)
    expect(invested.demography.tfr).toBeLessThan(passive.demography.tfr)
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
    const passive = runResearch('tech-rd-catchup', 40, 0.1, false)
    const funded = runResearch('tech-rd-catchup', 40, 0.1, true)
    expect(funded.tech.frontier).toBeCloseTo(passive.tech.frontier, 10)
    expect(funded.tech.attained.manuf).toBeGreaterThan(passive.tech.attained.manuf * 1.03)
    expect(technologyAttainment(funded)).toBeGreaterThan(technologyAttainment(passive) + 0.02)
  })

  it('near-frontier research pushes the frontier, slowly', () => {
    const passive = runResearch('tech-rd-frontier', 40, 0.9, false)
    const funded = runResearch('tech-rd-frontier', 40, 0.9, true)
    expect(funded.tech.frontier).toBeGreaterThan(passive.tech.frontier * 1.005)
    expect(funded.tech.attained.manuf).toBeGreaterThan(passive.tech.attained.manuf)
    // Original research is the expensive end of the same policy, not a growth cheat.
    expect(funded.tech.frontier).toBeLessThan(passive.tech.frontier * 1.02)
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
