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
})
