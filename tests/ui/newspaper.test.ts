/**
 * How the spike becomes a page (`ui/src/newspaper.ts`).
 *
 * The module is pure for the reason every layout decision in this repo is
 * pulled out of its component: jsdom has no layout engine, so a render test
 * passes happily while the front page leads on a brief and buries the coup.
 * These are the decisions worth pinning.
 */

import { describe, expect, it } from 'vitest'
import { DESK_IDS, OUTLETS, type Prominence } from '@terrarium/engine'
import type { NewsItem } from '@terrarium/observation'
import {
  adjacentEdition,
  archive,
  deskCounts,
  editionAt,
  editionTicks,
  filedUnderCensorship,
  latestEdition,
  pageBands,
  pageOrder,
  tickerHeadlines,
} from '../../packages/ui/src/newspaper'

let n = 0
const item = (
  tick: number,
  prominence: Prominence,
  over: Partial<NewsItem> = {},
): NewsItem => ({
  tick,
  event: 'bread_queues',
  kind: 'rumor',
  desk: 'home',
  tone: 'neutral',
  prominence,
  outlet: 'THE DAILY RECORD',
  text: `headline ${(n += 1)}`,
  body: `standfirst ${n}`,
  ...over,
})

describe('page order', () => {
  it('puts the lead first and the briefs last', () => {
    const page = pageOrder([item(4, 'brief'), item(4, 'lead'), item(4, 'column')])
    expect(page.map((i) => i.prominence)).toEqual(['lead', 'column', 'brief'])
  })

  it('keeps filing order inside a rank', () => {
    // Dispatches are appended in pipeline order, so within one quarter a
    // drought precedes the banking crisis precedes the election that turned
    // on both — the order the quarter actually happened in. A sort that
    // scrambled equals would throw that away.
    const first = item(4, 'column', { text: 'first filed' })
    const second = item(4, 'column', { text: 'second filed' })
    expect(pageOrder([first, second]).map((i) => i.text)).toEqual(['first filed', 'second filed'])
  })
})

describe('an edition', () => {
  const news = [
    item(0, 'brief'),
    item(8, 'lead', { text: 'the lead' }),
    item(8, 'column'),
    item(8, 'column'),
    item(8, 'brief'),
    item(12, 'column'),
  ]

  it('splits one quarter into a lead, its columns and its briefs', () => {
    const edition = editionAt(news, 8)
    expect(edition.lead?.text).toBe('the lead')
    expect(edition.columns).toHaveLength(2)
    expect(edition.briefs).toHaveLength(1)
    expect(edition.items).toHaveLength(4)
  })

  it('never puts the lead in the columns as well', () => {
    const edition = editionAt(news, 8)
    expect(edition.columns).not.toContain(edition.lead)
  })

  it('has no lead in a quarter that carried only columns', () => {
    // A page can be thin without being empty, and a column promoted to lead
    // because nothing better arrived would misreport a quiet quarter as a
    // dramatic one.
    const edition = editionAt(news, 12)
    expect(edition.lead).toBeNull()
    expect(edition.columns).toHaveLength(1)
  })

  it('lists only the quarters that carried something', () => {
    expect(editionTicks(news)).toEqual([0, 8, 12])
  })
})

describe('the latest edition', () => {
  const news = [item(4, 'lead'), item(20, 'column')]

  it('shows the most recent edition at or before now', () => {
    // The wire is quiet in more than half of all quarters. A front page that
    // went blank whenever THIS quarter carried nothing would be blank most of
    // the time, and the player would read that as a broken feature rather
    // than a calm country.
    expect(latestEdition(news, 30)?.tick).toBe(20)
    expect(latestEdition(news, 10)?.tick).toBe(4)
  })

  it('is null before the paper has ever published', () => {
    expect(latestEdition(news, 2)).toBeNull()
    expect(latestEdition([], 400)).toBeNull()
  })
})

describe('paging through back numbers', () => {
  const news = [item(4, 'lead'), item(20, 'column'), item(64, 'brief')]

  it('skips the quiet quarters in both directions', () => {
    expect(adjacentEdition(news, 20, -1)).toBe(4)
    expect(adjacentEdition(news, 20, 1)).toBe(64)
  })

  it('stops at either end rather than wrapping', () => {
    expect(adjacentEdition(news, 4, -1)).toBeNull()
    expect(adjacentEdition(news, 64, 1)).toBeNull()
  })
})

describe('the archive', () => {
  const news = [
    item(4, 'column', { desk: 'finance', tone: 'bad', text: 'The banks have stopped lending' }),
    item(8, 'brief', { desk: 'land', tone: 'good', text: 'A harvest to remember' }),
    item(12, 'column', { desk: 'finance', tone: 'good', text: 'Reserves are comfortable' }),
  ]

  it('runs newest first', () => {
    expect(archive(news).map((i) => i.tick)).toEqual([12, 8, 4])
  })

  it('filters by desk, and an empty desk list means every desk', () => {
    expect(archive(news, { desks: ['finance'] })).toHaveLength(2)
    expect(archive(news, { desks: [] })).toHaveLength(3)
    expect(archive(news, {})).toHaveLength(3)
  })

  it('filters by tone', () => {
    expect(archive(news, { tone: 'bad' })).toHaveLength(1)
  })

  it('searches headline, standfirst and masthead alike', () => {
    expect(archive(news, { query: 'HARVEST' })).toHaveLength(1)
    expect(archive(news, { query: 'standfirst' })).toHaveLength(3)
    expect(archive(news, { query: 'daily record' })).toHaveLength(3)
    expect(archive(news, { query: 'a word nobody wrote' })).toHaveLength(0)
  })

  it('treats a blank query as no query', () => {
    expect(archive(news, { query: '   ' })).toHaveLength(3)
  })
})

describe('the section rail', () => {
  it('counts every desk the engine has, including the empty ones', () => {
    const counts = deskCounts([item(1, 'brief', { desk: 'politics' })])
    expect(Object.keys(counts).sort()).toEqual([...DESK_IDS].sort())
    expect(counts.politics).toBe(1)
    // A desk missing from the rail would be indistinguishable from a desk
    // that has never filed, and only one of those is a bug.
    for (const desk of DESK_IDS) expect(typeof counts[desk]).toBe('number')
  })
})

describe('reading the mastheads', () => {
  const official = OUTLETS.wireless.official[0]
  const free = OUTLETS.wireless.independent[0]

  it('calls an edition censored only when every byline is the state’s', () => {
    expect(filedUnderCensorship(editionAt([item(4, 'lead', { outlet: official })], 4))).toBe(true)
    expect(
      filedUnderCensorship(
        editionAt([item(4, 'lead', { outlet: official }), item(4, 'brief', { outlet: free })], 4),
      ),
    ).toBe(false)
  })

  it('has no answer for a page with nothing on it', () => {
    // Not `false`: "no dispatches" and "a free press" are different states,
    // and printing the second when you mean the first is the shape of every
    // unfunded-survey-reads-as-zero bug in this codebase.
    expect(filedUnderCensorship(editionAt([], 4))).toBeNull()
  })

  it('reads the state’s roster out of the engine rather than a copy', () => {
    // A hand-typed list of official mastheads would be one copy-edit away
    // from reporting a captured press as a free one.
    const everyOfficial = Object.values(OUTLETS).flatMap((roster) => roster.official)
    for (const outlet of everyOfficial) {
      expect(filedUnderCensorship(editionAt([item(4, 'lead', { outlet })], 4))).toBe(true)
    }
  })
})

describe('setting a thin edition', () => {
  it('leaves a full page alone', () => {
    const edition = editionAt([item(4, 'lead'), item(4, 'column'), item(4, 'brief')], 4)
    const { main, side } = pageBands(edition)
    expect(main.map((i) => i.prominence)).toEqual(['column'])
    expect(side.map((i) => i.prominence)).toEqual(['brief'])
  })

  it('promotes the briefs when there is nothing else to print', () => {
    // A quarter that carried nothing but briefs, set literally, is an empty
    // main column beside a populated sidebar — which reads as a rendering
    // fault rather than as a slow news day. Invisible in jsdom; this is the
    // only thing that catches it.
    const edition = editionAt([item(4, 'brief'), item(4, 'brief')], 4)
    const { main, side } = pageBands(edition)
    expect(main).toHaveLength(2)
    expect(side).toHaveLength(0)
  })

  it('keeps the sidebar when a lead carries the page on its own', () => {
    const edition = editionAt([item(4, 'lead'), item(4, 'brief')], 4)
    const { main, side } = pageBands(edition)
    expect(main).toHaveLength(0)
    expect(side).toHaveLength(1)
  })

  it('has nothing in either band for an edition with nothing in it', () => {
    const { main, side } = pageBands(editionAt([], 4))
    expect(main).toHaveLength(0)
    expect(side).toHaveLength(0)
  })
})

describe('the ticker', () => {
  it('leads on the same story the front page leads on', () => {
    const news = [item(8, 'brief'), item(8, 'lead', { text: 'the lead' }), item(8, 'column')]
    expect(tickerHeadlines(news)[0].text).toBe('the lead')
  })

  it('shows the newest edition first at equal prominence', () => {
    const news = [item(4, 'column', { text: 'older' }), item(8, 'column', { text: 'newer' })]
    expect(tickerHeadlines(news).map((i) => i.text)).toEqual(['newer', 'older'])
  })

  it('keeps filing order inside one edition', () => {
    // The trap: `news` arrives in filing order, so reversing it to get
    // "newest first" also reverses two same-quarter, same-prominence
    // dispatches — and the ticker then disagrees with the front page about
    // which came first, for the same quarter, on the same screen.
    const news = [item(8, 'column', { text: 'filed first' }), item(8, 'column', { text: 'filed second' })]
    expect(tickerHeadlines(news).map((i) => i.text)).toEqual(['filed first', 'filed second'])
    expect(tickerHeadlines(news).map((i) => i.text)).toEqual(
      editionAt(news, 8).columns.map((i) => i.text),
    )
  })

  it('carries nothing when the wire is empty', () => {
    expect(tickerHeadlines([])).toEqual([])
  })
})
