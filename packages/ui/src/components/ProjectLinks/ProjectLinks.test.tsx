import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NEW_ISSUE_URL, ProjectLinks, REPOSITORY_URL } from './ProjectLinks'

describe('ProjectLinks', () => {
  it('links to the source repository and a new GitHub issue', () => {
    const html = renderToStaticMarkup(<ProjectLinks />)

    expect(html).toContain(`href="${REPOSITORY_URL}"`)
    expect(html).toContain(`href="${NEW_ISSUE_URL}"`)
    expect(html.match(/target="_blank"/g)).toHaveLength(2)
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(2)
    expect(html).toContain('SOURCE CODE')
    expect(html).toContain('REPORT AN ISSUE')
  })
})
