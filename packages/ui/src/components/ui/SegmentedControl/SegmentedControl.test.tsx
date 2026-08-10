import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { SegmentedControl } from './SegmentedControl'

const options = [{ value: 'level', label: 'LEVELS' }, { value: 'share', label: 'SHARES' }] as const

describe('SegmentedControl', () => {
  it('announces the selected segment', () => {
    const html = renderToStaticMarkup(<SegmentedControl label="Chart mode" value="share" options={options} onChange={() => {}} />)
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('aria-label="Chart mode"')
  })

  it('renders every option as a non-submitting button', () => {
    const html = renderToStaticMarkup(<SegmentedControl label="Chart mode" value="level" options={options} onChange={() => {}} />)
    expect(html.match(/type="button"/g)).toHaveLength(2)
  })

  it('supports disabled choices and an inverted cabinet treatment', () => {
    const html = renderToStaticMarkup(
      <SegmentedControl
        label="Rule mode"
        value="level"
        tone="inverted"
        options={[options[0], { ...options[1], disabled: true }]}
        onChange={() => {}}
      />,
    )
    expect(html).toContain('disabled=""')
    expect(html).toContain('border-dossier-brass')
  })
})
