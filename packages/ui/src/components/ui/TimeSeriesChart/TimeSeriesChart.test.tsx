/**
 * The painter's contract. Geometry is held by `tests/ui/plot.test.ts` — what
 * is asserted here is only what a render can still get wrong: that a chart
 * does not resurrect dial-limit chrome, that every register paints something,
 * and that an accessible reading survives.
 *
 * jsdom has no layout engine, so nothing here can prove the chart fits its
 * slot. That is `verify-the-wall`'s job and it is not optional.
 */

import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TimeSeriesChart, type ChartRegister } from './TimeSeriesChart'

const calm = [
  { tick: 0, value: 60 },
  { tick: 4, value: 95 },
  { tick: 8, value: 88 },
]
/** the measured price_fuel excursion the old chart flattened at 130 */
const shock = [...calm, { tick: 12, value: 152.1 }]

describe('TimeSeriesChart', () => {
  it('draws the excursion on its own scale without dial-limit chrome', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart traces={[{ key: 'fuel', points: shock }]} pad={0.08} summary="Fuel prices." />,
    )
    expect(html).not.toContain('DIAL LIMIT')
    expect(html).toContain('<path')
    expect(html).not.toMatch(/NaN|Infinity|undefined/)
  })

  it('exposes point and range keyboard inspection when interactive', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart traces={[{ key: 'fuel', points: calm }]} summary="Fuel prices." hover />,
    )
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('aria-keyshortcuts="ArrowLeft ArrowRight Home End Shift+ArrowLeft Shift+ArrowRight Escape"')
    expect(html).toContain('data-chart-interactive=""')
  })

  it('carries the caller’s reading for assistive technology, without a native bubble', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart traces={[{ key: 'a', points: calm }]} summary="Fuel prices rose to 88." />,
    )
    expect(html).toContain('aria-label="Fuel prices rose to 88."')
    expect(html).toContain('Fuel prices rose to 88.</p>')
    // An SVG `<title>` renders as the browser's own tooltip: it drifts in after
    // about a second and covers the crosshair readout this chart paints under
    // the cursor. The sentence reaches assistive tech through `aria-label` and
    // the sr-only paragraph, so the element buys nothing and costs the hover.
    expect(html).not.toContain('<title>')
  })

  it('uses the caller’s empty state rather than an empty box', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart traces={[{ key: 'a', points: [{ tick: 0, value: 1 }] }]} summary="—" emptyLabel="NO RETURNS FILED" />,
    )
    expect(html).toContain('NO RETURNS FILED')
    expect(html).not.toContain('<svg')
  })

  it('paints in every register', () => {
    for (const register of ['dossier', 'terminal', 'map'] as ChartRegister[]) {
      const html = renderToStaticMarkup(
        <TimeSeriesChart traces={[{ key: 'a', points: calm }]} register={register} summary="x" />,
      )
      expect(html, register).toContain('<path')
    }
  })

  it('draws rules, ribbons, wedges and caller ink without emitting NaN', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart
        traces={[
          { key: 'over', points: calm, lead: true },
          { key: 'under', points: calm.map((p) => ({ ...p, value: p.value / 2 })) },
        ]}
        ribbon={{ points: calm.map((p) => ({ ...p, band: 3 })) }}
        wedge={{ over: 'over', under: 'under' }}
        rules={[{ axis: 'y', at: 100, label: 'BASELINE' }, { axis: 'x', at: 4 }]}
        overlay={({ sx, sy }) => <circle cx={sx(4)} cy={sy(95)} r="2" />}
        summary="x"
      />,
    )
    expect(html).toContain('BASELINE')
    expect(html).toContain('<circle')
    expect(html).not.toMatch(/NaN|Infinity|undefined/)
  })
})
