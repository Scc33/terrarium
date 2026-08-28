/**
 * The paper: how a spike of dispatches becomes something a reader opens.
 *
 * The wire used to be a reversed array rendered as a list, and a list of
 * three hundred one-line strings is a log file rather than a newspaper — you
 * can search it, but you cannot READ it, and nothing in it says which of the
 * three hundred lines was the one that mattered. Every decision that turns
 * the spike into a page lives here rather than in the component, for the
 * usual reason: a layout choice pushed into JSX is a layout choice nothing
 * can test, and the failure mode is a front page that silently leads on the
 * wrong story for eighty years.
 *
 * Three views, one record:
 *
 * - **an edition** is one quarter's page — a lead, its columns, its briefs.
 * - **the run of editions** is what the reader pages back through, and it
 *   skips the quarters that carried nothing, because a newspaper that
 *   published four hundred numbers of which two hundred were blank is not a
 *   newspaper.
 * - **the archive** is the whole spike, filtered — the log file, kept,
 *   because searching a century for the last banking crisis is a real thing
 *   to want and a front page cannot do it.
 *
 * What is NOT here: any judgement about what a dispatch means. Prominence,
 * desk, tone and outlet are all sealed into the item by the engine at filing
 * time (`engine/src/events/`), and this module only sorts by them. The page
 * must never re-rank a story from the state it happens to be able to see —
 * the 1958 paper's idea of its own lead story is the one that goes in the
 * 1958 archive.
 */

import {
  DESK_IDS,
  OUTLETS,
  PRESS_ERA_IDS,
  type DeskId,
  type NewsItem,
  type Prominence,
} from '@terrarium/engine'

export const DESK_ORDER: readonly DeskId[] = DESK_IDS

/** How a sub-editor ranks the page. Authored in the engine; this is only the
 * order the three names sit in. */
const PROMINENCE_RANK: Record<Prominence, number> = { lead: 0, column: 1, brief: 2 }

export interface Edition {
  tick: number
  /** the story the page leads on, or null in a quarter that carried only
   * briefs — a page can be thin without being empty */
  lead: NewsItem | null
  /** everything below the fold that is not a one-liner */
  columns: NewsItem[]
  /** the one-liners down the side */
  briefs: NewsItem[]
  /** all of it, in page order, so a caller that wants the whole edition does
   * not have to reassemble the three above and get the order wrong */
  items: NewsItem[]
}

/**
 * Page order: prominence first, filing order second.
 *
 * The tiebreak is meaningful rather than incidental. Dispatches are appended
 * in pipeline order, so within one quarter a drought (step 0) precedes a
 * banking crisis (step 4) precedes the election that turned on both (step
 * 16) — the order the quarter actually happened in. `sort` is stable, so
 * ranking by prominence alone preserves it.
 */
export function pageOrder(items: readonly NewsItem[]): NewsItem[] {
  return [...items].sort((a, b) => PROMINENCE_RANK[a.prominence] - PROMINENCE_RANK[b.prominence])
}

/** Every quarter that carried at least one dispatch, oldest first. */
export function editionTicks(news: readonly NewsItem[]): number[] {
  const ticks = new Set<number>()
  for (const item of news) ticks.add(item.tick)
  return [...ticks].sort((a, b) => a - b)
}

/** The page for one quarter. An empty edition is a legitimate answer — the
 * caller decides whether to print ALL QUIET or to page past it. */
export function editionAt(news: readonly NewsItem[], tick: number): Edition {
  const items = pageOrder(news.filter((n) => n.tick === tick))
  const lead = items.find((n) => n.prominence === 'lead') ?? null
  return {
    tick,
    lead,
    columns: items.filter((n) => n !== lead && n.prominence !== 'brief'),
    briefs: items.filter((n) => n.prominence === 'brief'),
    items,
  }
}

/**
 * The two printed bands, once the page has decided what to do with a thin
 * edition.
 *
 * `editionAt` describes the edition faithfully — what the engine filed, at
 * what prominence. This decides how to SET it, which is a different question
 * with one awkward case: a quarter that carried nothing but briefs. Printed
 * literally, the main column stands empty beside a populated sidebar, which
 * reads as a rendering fault rather than as a slow news day. So when there is
 * neither a lead nor a column, the briefs are promoted into the main band and
 * the sidebar is dropped.
 *
 * It lives here rather than in the component for the reason every layout
 * decision in this repo does: jsdom has no layout engine, so an empty column
 * beside a full one passes a render test and only appears in a browser.
 */
export function pageBands(edition: Edition): { main: NewsItem[]; side: NewsItem[] } {
  const thin = edition.lead === null && edition.columns.length === 0
  return thin
    ? { main: edition.briefs, side: [] }
    : { main: edition.columns, side: edition.briefs }
}

/**
 * The most recent edition at or before `tick`, and null if the paper has
 * never published.
 *
 * "At or before" rather than "at" because the wire is quiet in more than half
 * of all quarters: a front page that went blank whenever the current quarter
 * happened to carry nothing would be blank most of the time, and the player
 * would conclude the feature was broken rather than that the country was
 * calm. The date on the masthead says which edition they are looking at.
 */
export function latestEdition(news: readonly NewsItem[], tick: number): Edition | null {
  const ticks = editionTicks(news).filter((t) => t <= tick)
  const latest = ticks[ticks.length - 1]
  return latest === undefined ? null : editionAt(news, latest)
}

/** The edition before / after this one, skipping the quiet quarters. Null at
 * either end of the run. */
export function adjacentEdition(
  news: readonly NewsItem[],
  tick: number,
  direction: -1 | 1,
): number | null {
  const ticks = editionTicks(news)
  if (direction < 0) {
    const earlier = ticks.filter((t) => t < tick)
    return earlier[earlier.length - 1] ?? null
  }
  return ticks.find((t) => t > tick) ?? null
}

export interface ArchiveFilter {
  /** empty means every desk — an explicit set, so "none selected" cannot be
   * confused with "all selected" the way a nullable field would */
  desks?: readonly DeskId[]
  tone?: NewsItem['tone']
  /** matched against headline, standfirst and masthead, case-insensitively */
  query?: string
}

/** The whole spike, filtered, newest first. */
export function archive(news: readonly NewsItem[], filter: ArchiveFilter = {}): NewsItem[] {
  const query = filter.query?.trim().toLowerCase() ?? ''
  const desks = filter.desks && filter.desks.length > 0 ? new Set(filter.desks) : null
  return news
    .filter((item) => {
      if (desks && !desks.has(item.desk)) return false
      if (filter.tone && item.tone !== filter.tone) return false
      if (query.length === 0) return true
      return (
        item.text.toLowerCase().includes(query) ||
        item.body.toLowerCase().includes(query) ||
        item.outlet.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => b.tick - a.tick)
}

/** How many dispatches each desk has ever carried — the section rail's
 * counts. Total over `DESK_IDS`, so a desk added in the engine appears on the
 * rail at zero rather than being missing from it. */
export function deskCounts(news: readonly NewsItem[]): Record<DeskId, number> {
  const counts = Object.fromEntries(DESK_IDS.map((d) => [d, 0])) as Record<DeskId, number>
  for (const item of news) counts[item.desk] += 1
  return counts
}

/**
 * Whether this edition came to the reader over the state's own wire.
 *
 * Read off the mastheads the engine sealed into the items rather than off the
 * current press-freedom stock, because those are different questions: the
 * stock says what the press is like NOW, and an archived 1958 page should
 * report the press of 1958. A page with no items has no answer, which is why
 * this returns null rather than false.
 */
export function filedUnderCensorship(edition: Edition): boolean | null {
  if (edition.items.length === 0) return null
  return edition.items.every((item) => OFFICIAL_OUTLETS.has(item.outlet))
}

/** Derived from the engine's own roster, never retyped. A hand-copied list of
 * the state's mastheads would be one copy-edit away from reporting a captured
 * press as a free one, and the reader would have no way to tell. */
const OFFICIAL_OUTLETS: ReadonlySet<string> = new Set(
  PRESS_ERA_IDS.flatMap((era) => OUTLETS[era].official),
)
