import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PublishedCorridor } from '@terrarium/observation'
import { CorridorPlot } from './CorridorPlot'

/** Both coordinates are live engine state and the plot is handed the
 * whole published corridor, not a store-local trail of points. */
const corridor = (over: Partial<PublishedCorridor> = {}): PublishedCorridor => ({
  statePower: 0.4,
  societalPower: 0.45,
  offset: -0.05,
  halfWidth: 0.16,
  inCorridor: true,
  trail: [{ tick: 0, x: 0.2, y: 0.22 }],
  ...over,
})

describe('CorridorPlot', () => {
  it('labels both strategic axes', () => {
    const html = renderToStaticMarkup(<CorridorPlot corridor={corridor({ trail: [] })} />)
    expect(html).toContain('STATE CAPACITY')
    expect(html).toContain('SOCIETAL POWER')
  })

  it('draws the current nation', () => {
    const html = renderToStaticMarkup(<CorridorPlot corridor={corridor()} />)
    expect(html).toContain('r="4"')
  })

  it('says plainly where you stand, and which way you left', () => {
    expect(renderToStaticMarkup(<CorridorPlot corridor={corridor()} />)).toContain(
      'Within the corridor',
    )
    const despotic = corridor({ statePower: 0.7, societalPower: 0.2, offset: 0.5, inCorridor: false })
    expect(renderToStaticMarkup(<CorridorPlot corridor={despotic} />)).toContain('despotism')
    const anarchic = corridor({ statePower: 0.1, societalPower: 0.6, offset: -0.5, inCorridor: false })
    expect(renderToStaticMarkup(<CorridorPlot corridor={anarchic} />)).toContain('anarchy')
  })

  it('rings the dot when you are outside the band — a standing condition, not a reading', () => {
    const inside = renderToStaticMarkup(<CorridorPlot corridor={corridor()} />)
    const outside = renderToStaticMarkup(
      <CorridorPlot corridor={corridor({ offset: 0.5, inCorridor: false })} />,
    )
    expect(inside).not.toContain('r="11"')
    expect(outside).toContain('r="11"')
  })
})
