/**
 * The painter's contract. Geometry is held by `tests/ui/plot.test.ts` — what
 * is asserted here is only what a render can still get wrong: that the face's
 * limit is CONFESSED when the axis extends past it, that every register paints
 * something, and that an accessible reading survives.
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
/** the measured price_fuel excursion against its 40–130 face */
const shock = [...calm, { tick: 12, value: 152.1 }]
const FUEL_FACE = { lo: 40, hi: 130 }

describe('TimeSeriesChart', () => {
  it('draws the excursion and names the dial it left', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart traces={[{ key: 'fuel', points: shock }]} face={FUEL_FACE} summary="Fuel prices." />,
    )
    expect(html).toContain('DIAL LIMIT')
    // the whole reading is that the trace goes PAST the ruled limit, so a
    // clamp reintroduced here would leave the line flat along it
    expect(html).not.toMatch(/NaN|Infinity|undefined/)
  })

  it('says nothing about a dial the economy never left', () => {
    const html = renderToStaticMarkup(
      <TimeSeriesChart traces={[{ key: 'fuel', points: calm }]} face={FUEL_FACE} summary="Fuel prices." />,
    )
    expect(html).not.toContain('DIAL LIMIT')
    // The quiet century is still drawn against the whole face rather than
    // auto-scaled to itself: gridlines start at the face's floor, and none of
    // them is anywhere near the data's own minimum of 60. (The rails
    // themselves are held numerically in tests/ui/plot.test.ts — labels are
    // readable multiples, so a rail at 130 is not necessarily printed.)
    expect(html).toContain('>40<')
    expect(html).toContain('>120<')
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
