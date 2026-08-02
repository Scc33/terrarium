import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('names the missing capability', () => {
    const html = renderToStaticMarkup(<EmptyState title="NO RETURNS FILED" requirement="EXCHANGE BOARD" />)
    expect(html).toContain('NO RETURNS FILED')
    expect(html).toContain('REQUIRES: EXCHANGE BOARD')
  })

  it('accepts an explanatory note', () => {
    expect(renderToStaticMarkup(<EmptyState title="NO DATA">Fund the office.</EmptyState>)).toContain('Fund the office.')
  })
})
