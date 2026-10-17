/**
 * Trade follows markets, not capacity (#290, ADR-0049). Exports sell from a
 * foothold in the partners' markets that the WORLD grows; imports answer to
 * what the country uses. Neither reads the sector's own potential, which only
 * caps what can be shipped.
 */

import { describe, expect, it } from 'vitest'
import {
  CURATED_COUNTRY_IDS,
  createCountryParams,
  init,
  rngFor,
  SECTOR_IDS,
  TICK_ORDER,
  type TrueState,
} from '@terrarium/engine'
import { EXPORT_BASE_SHARE } from '../../packages/engine/src/constants'
import { potentialOutput } from '../../packages/engine/src/pipeline/derive'
import { exportMarketGrowth } from '../../packages/engine/src/pipeline/world'

function runStep(name: string, state: TrueState): TrueState {
  const pipelineStep = TICK_ORDER.find((candidate) => candidate.name === name)!
  return pipelineStep.run(state, rngFor(state.meta.seed, pipelineStep.name, state.meta.tick))
}

/** The same state with one sector's capital scaled — more or less capacity,
 * nothing else. */
function withCapital(state: TrueState, sid: (typeof SECTOR_IDS)[number], factor: number): TrueState {
  return {
    ...state,
    sectors: state.sectors.map((s) => (s.id === sid ? { ...s, capital: s.capital * factor } : s)),
  }
}

describe('the foothold abroad', () => {
  it('opens at the 1946 export order, in every country', () => {
    for (const id of CURATED_COUNTRY_IDS) {
      const s = init(createCountryParams(id, 'foothold'), 'foothold')
      for (const [i, sid] of SECTOR_IDS.entries()) {
        const order = EXPORT_BASE_SHARE[sid] * potentialOutput(s.sectors[i]) * s.params.openness
        expect(s.external.exportMarket[sid], `${id}/${sid}`).toBeCloseTo(order, 9)
      }
    }
  })

  it('grows with the world and not with the country', () => {
    const s = init(createCountryParams('meridia', 'grow'), 'grow')
    const grown = runStep('world', s)
    const bigger = runStep('world', withCapital(s, 'agri', 3))
    for (const sid of SECTOR_IDS) {
      expect(bigger.external.exportMarket[sid], sid).toBe(grown.external.exportMarket[sid])
    }
    // the world's appetite follows its income per head through each good's
    // elasticity: the farm gate's grows slowest, services' fastest
    const g = exportMarketGrowth(0)
    expect(g.agri).toBeLessThan(g.manuf)
    expect(g.manuf).toBeLessThan(g.services)
    expect(g.agri).toBeGreaterThan(0)
  })

  it('caps what a sector ships at its own capacity, and only caps it', () => {
    const s = init(createCountryParams('meridia', 'cap'), 'cap')
    const base = runStep('production', s)
    const bigger = runStep('production', withCapital(s, 'manuf', 3))
    // more capacity does not sell more abroad at the same prices
    expect(bigger.flows.exportsReal.manuf).toBeCloseTo(base.flows.exportsReal.manuf, 9)
  })
})

describe('imports follow absorption', () => {
  it('rise when the farm falls behind its own country, rather than fall with it', () => {
    const s = init(createCountryParams('meridia', 'absorb'), 'absorb')
    const base = runStep('production', s)
    const starved = runStep('production', withCapital(s, 'agri', 0.5))
    // the farm's capacity is gone, the appetite is not: food imports hold, so
    // the shortfall is made up abroad rather than the order shrinking with it
    expect(starved.flows.importsReal.agri).toBeGreaterThanOrEqual(base.flows.importsReal.agri * 0.999)
  })

  it('opens the market on the balance the first order produces', () => {
    // `init` seals the reserve book from `production`'s own opening order, so
    // the cover the bank holds is measured on the figure it will compare it to
    for (const id of CURATED_COUNTRY_IDS) {
      const s = init(createCountryParams(id, 'seal'), 'seal')
      const first = runStep('production', s)
      let imports = 0
      for (const sid of SECTOR_IDS) {
        imports += s.external.worldPrices[sid] * s.external.exchangeRate * first.flows.importsReal[sid]
      }
      expect(s.external.reserves / s.external.coverTarget, id).toBeCloseTo(imports, 9)
    }
  })
})
