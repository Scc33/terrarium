import { describe, expect, it } from 'vitest'
import { TURBULENCE, TURBULENCE_IDS } from '@terrarium/engine'
import { howOften, TURBULENCE_COPY } from '../../packages/ui/src/turbulence'

describe('the words for the world abroad', () => {
  it('stamps only a world that is not the calibrated one', () => {
    expect(TURBULENCE_COPY.ordinary.mark).toBeNull()
    for (const id of TURBULENCE_IDS) {
      if (id !== 'ordinary') expect(TURBULENCE_COPY[id].mark, id).not.toBeNull()
    }
  })

  it('reads its frequencies off the engine, so a retune cannot leave the copy lying', () => {
    expect(TURBULENCE_COPY.calm.caption).toContain(howOften(TURBULENCE.calm.hazard))
    expect(TURBULENCE_COPY.turbulent.caption).toContain(howOften(TURBULENCE.turbulent.hazard))
  })

  it('says a multiplier the way a reader would', () => {
    expect(howOften(0.5)).toBe('half as often')
    expect(howOften(2)).toBe('twice as often')
    expect(howOften(1.5)).toBe('1.5× as often')
    expect(howOften(3)).toBe('3× as often')
  })
})
