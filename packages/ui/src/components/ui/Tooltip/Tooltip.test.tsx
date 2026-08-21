import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Tooltip, TooltipLabel } from './Tooltip'
import { placeTooltip } from './placement'

describe('Tooltip', () => {
  it('marks a custom trigger without falling back to a native title', () => {
    const html = renderToStaticMarkup(
      <Tooltip content="Money available for cabinet decisions.">
        <button type="button">CAPITAL</button>
      </Tooltip>,
    )
    expect(html).toContain('data-tooltip-trigger=""')
    expect(html).not.toContain('title=')
  })

  it('gives explanatory labels an explicit keyboard trigger', () => {
    const html = renderToStaticMarkup(
      <TooltipLabel label="Inflation" content="How quickly prices are rising.">INFLATION</TooltipLabel>,
    )
    expect(html).toContain('aria-label="Explain Inflation"')
    expect(html).toContain('border-dotted')
  })
})

describe('placeTooltip', () => {
  const size = { width: 220, height: 64 }
  const viewport = { width: 1280, height: 720 }

  it('uses the space above a trigger by default', () => {
    expect(placeTooltip({ left: 500, right: 600, top: 300, bottom: 330, width: 100 }, size, 'auto', viewport)).toMatchObject({
      x: 440,
      y: 227,
      side: 'top',
    })
  })

  it('flips below a trigger near the top edge', () => {
    expect(placeTooltip({ left: 500, right: 600, top: 8, bottom: 38, width: 100 }, size, 'top', viewport)).toMatchObject({
      y: 47,
      side: 'bottom',
    })
  })

  it('keeps the bubble and arrow inside the viewport', () => {
    const placed = placeTooltip({ left: 2, right: 42, top: 300, bottom: 330, width: 40 }, size, 'auto', viewport)
    expect(placed.x).toBe(10)
    expect(placed.arrowX).toBe(12)
  })
})
