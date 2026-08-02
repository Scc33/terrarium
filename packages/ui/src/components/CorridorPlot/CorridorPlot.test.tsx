import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CorridorPlot } from './CorridorPlot'

describe('CorridorPlot', () => {
  it('labels both strategic axes', () => {
    const html = renderToStaticMarkup(<CorridorPlot trail={[]} />)
    expect(html).toContain('STATE CAPACITY')
    expect(html).toContain('SOCIETAL POWER')
  })

  it('draws the current nation when a trail exists', () => {
    const html = renderToStaticMarkup(<CorridorPlot trail={[{ x: 0.4, y: 0.6 }]} />)
    expect(html).toContain('r="4"')
  })
})
