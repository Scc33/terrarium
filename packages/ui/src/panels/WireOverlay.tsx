/**
 * The paper.
 *
 * This was a reversed array printed as three hundred monospace lines, which
 * is a log file: readable in the sense that the characters are legible, and
 * unreadable in the sense that nothing in it tells you which line was the one
 * that mattered. #160's complaint — the wire is boring and repetitive — was
 * half a content problem and half this: even a good dispatch disappears into
 * an undifferentiated column of shouting capitals.
 *
 * So the overlay is a newspaper, in two views:
 *
 * - **FRONT PAGE** is one quarter, laid out — the lead story with its
 *   standfirst, its columns beside it, its briefs down the side, and a byline
 *   on every one of them. It pages back through editions, skipping the
 *   quarters that carried nothing, so paging is always a step to real news.
 * - **ARCHIVE** is the old view, kept, because searching a century for the
 *   last banking crisis is a real thing to want and a front page cannot do
 *   it. Now with the section rail and a search box.
 *
 * The arithmetic is in `../newspaper`; this file is a painter. The one thing
 * worth knowing while reading it is that NOTHING here decides what a dispatch
 * means: desk, tone, prominence and masthead were all sealed into the item by
 * the engine on the quarter it was filed, so an archived 1958 page is the
 * page of 1958 and not this decade's opinion of it.
 */

import { useMemo, useState } from 'react'
import { DESK_IDS, PRESS_ERAS, eraAtTick, type DeskId, type NewsItem } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { Button, EmptyState, Modal, SectionHeading, SegmentedControl } from '../components/ui'
import {
  adjacentEdition,
  archive,
  deskCounts,
  editionTicks,
  editionAt,
  filedUnderCensorship,
  latestEdition,
  pageBands,
  type Edition,
} from '../newspaper'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const qtrLabel = (q: number) => `${yearOf(q)} Q${(q % 4) + 1}`
const eraLabel = (q: number) => PRESS_ERAS.find((e) => e.id === eraAtTick(q))?.label ?? ''

/** What each desk is called on the rail. A total `Record` over the engine's
 * `DeskId`, so a desk added in the engine fails the build here until the
 * paper has a name for its section — the same rule the ledger's tax and
 * spending labels follow. */
const DESK_NAMES: Record<DeskId, string> = {
  home: 'HOME',
  labour: 'LABOUR',
  finance: 'FINANCE',
  industry: 'INDUSTRY',
  land: 'THE LAND',
  politics: 'POLITICS',
  abroad: 'ABROAD',
  science: 'SCIENCE',
}

const toneClass = (tone: NewsItem['tone']) =>
  tone === 'bad' ? 'text-dossier-warn' : tone === 'good' ? 'text-dossier-felt' : 'text-wire-ink'

function Byline({ item }: { item: NewsItem }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2 font-mono text-[8px] tracking-[0.16em] text-wire-ink/50">
      <span>{item.outlet}</span>
      <span aria-hidden="true">·</span>
      <span>{DESK_NAMES[item.desk]}</span>
      <span aria-hidden="true">·</span>
      <span className="tabular-nums">{qtrLabel(item.tick)}</span>
    </div>
  )
}

/** The lead: the one story the page is built around. Set in the serif at a
 * size nothing else on the page uses, because a front page whose lead is the
 * same size as its briefs has no lead. */
function LeadStory({ item }: { item: NewsItem }) {
  return (
    // Labelled, and h3 rather than h2: the dialog's title is the h1 and the
    // shared `SectionHeading` above is the h2, so a lead set at h2 would sit
    // at the same level as the word THE EDITION and outrank nothing.
    <article aria-label="Lead story" className="border-b-2 border-wire-ink/25 pb-3">
      <Byline item={item} />
      <h3 className={`mt-1.5 font-dossier text-[26px] leading-[1.1] font-semibold ${toneClass(item.tone)}`}>
        {item.text}
      </h3>
      <p className="mt-2 font-dossier text-[13px] leading-relaxed text-wire-ink/85">{item.body}</p>
    </article>
  )
}

function ColumnStory({ item }: { item: NewsItem }) {
  return (
    <article className="break-inside-avoid border-t border-wire-ink/15 pt-2 first:border-t-0 first:pt-0">
      <Byline item={item} />
      <h4 className={`mt-1 font-dossier text-[15px] leading-tight font-semibold ${toneClass(item.tone)}`}>
        {item.text}
      </h4>
      <p className="mt-1 font-dossier text-[12px] leading-snug text-wire-ink/75">{item.body}</p>
    </article>
  )
}

function BriefStory({ item }: { item: NewsItem }) {
  return (
    <article className="border-t border-wire-ink/15 py-1.5 first:border-t-0 first:pt-0">
      <h5 className={`font-dossier text-[12px] leading-tight font-semibold ${toneClass(item.tone)}`}>
        {item.text}
      </h5>
      <p className="mt-0.5 font-dossier text-[11px] leading-snug text-wire-ink/65">{item.body}</p>
      <div className="mt-0.5 font-mono text-[8px] tracking-[0.14em] text-wire-ink/40">
        {item.outlet}
      </div>
    </article>
  )
}

function Masthead({ edition, editionCount }: { edition: Edition; editionCount: number }) {
  const censored = filedUnderCensorship(edition)
  return (
    <header className="border-b-4 border-double border-wire-ink/60 pb-2">
      {/* Not a heading. The dialog's own title already announces THE WIRE, so
          a second one here would have a screen reader say the paper's name
          twice before reaching a single story — and would make the masthead
          and the lead the same heading level, which is backwards. */}
      <p
        aria-hidden="true"
        className="text-center font-dossier text-[30px] leading-none font-bold tracking-[0.12em] text-wire-ink"
      >
        THE WIRE
      </p>
      <div className="mt-1.5 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-0.5 border-t border-wire-ink/25 pt-1 font-mono text-[8px] tracking-[0.2em] text-wire-ink/60">
        <span className="tabular-nums">{qtrLabel(edition.tick)}</span>
        <span aria-hidden="true">·</span>
        <span>{eraLabel(edition.tick).toUpperCase()}</span>
        <span aria-hidden="true">·</span>
        <span className="tabular-nums">{editionCount} EDITIONS</span>
        {censored === true && (
          <>
            <span aria-hidden="true">·</span>
            {/* Not decoration. Every byline on this page belongs to the state's
                own wire service, which is the one place the game says out loud
                what the press-freedom stock has been doing to what the player
                is allowed to read. */}
            <span className="text-dossier-warn">FILED UNDER LICENCE</span>
          </>
        )}
      </div>
    </header>
  )
}

function FrontPage({ pub }: { pub: PublishedState }) {
  const ticks = useMemo(() => editionTicks(pub.news), [pub.news])
  const [openTick, setOpenTick] = useState<number | null>(null)
  const edition = useMemo(() => {
    if (openTick !== null) return editionAt(pub.news, openTick)
    return latestEdition(pub.news, pub.tick)
  }, [pub.news, pub.tick, openTick])

  if (!edition) {
    return (
      <EmptyState title="THE PAPER HAS NOT PUBLISHED">
        Nothing has yet happened that anybody thought worth setting in type. Advance the quarter.
      </EmptyState>
    )
  }

  const older = adjacentEdition(pub.news, edition.tick, -1)
  const newer = adjacentEdition(pub.news, edition.tick, 1)
  const { main, side } = pageBands(edition)

  return (
    <div className="flex flex-col gap-3 bg-wire-paper p-4">
      <Masthead edition={edition} editionCount={ticks.length} />

      {/* Three bands, not a grid of equals: a lead across the top, then the
          columns and the briefs beside each other. A page where every story
          is the same size has no editorial judgement in it, which is the
          whole difference between this and the list it replaced. */}
      {edition.lead && <LeadStory item={edition.lead} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="flex min-w-0 flex-col gap-2.5">
          {edition.items.length === 0 && (
            <div className="font-mono text-[10px] tracking-[0.18em] text-wire-ink/50">
              +++ A QUIET EDITION +++
            </div>
          )}
          {main.map((item, i) =>
            item.prominence === 'brief' ? (
              <BriefStory key={`${item.tick}-${item.event}-${i}`} item={item} />
            ) : (
              <ColumnStory key={`${item.tick}-${item.event}-${i}`} item={item} />
            ),
          )}
        </div>
        {side.length > 0 && (
          <aside className="min-w-0 border-l border-wire-ink/20 pl-3 sm:pl-4">
            <div className="mb-1.5 font-mono text-[8px] tracking-[0.22em] text-wire-ink/55">
              IN BRIEF
            </div>
            <div className="flex flex-col">
              {side.map((item, i) => (
                <BriefStory key={`${item.tick}-${item.event}-${i}`} item={item} />
              ))}
            </div>
          </aside>
        )}
      </div>

      <nav
        className="flex items-center justify-between gap-2 border-t border-wire-ink/25 pt-2 text-[10px]"
        aria-label="Back numbers"
      >
        <Button
          variant="quiet"
          size="compact"
          onClick={() => older !== null && setOpenTick(older)}
          disabled={older === null}
          title={older === null ? 'This is the first edition' : `Back to ${qtrLabel(older)}`}
        >
          ← EARLIER
        </Button>
        <span className="font-mono text-[8px] tracking-[0.18em] text-wire-ink/50">
          BACK NUMBERS
        </span>
        <Button
          variant="quiet"
          size="compact"
          onClick={() => setOpenTick(newer)}
          disabled={newer === null}
          title={newer === null ? 'This is the latest edition' : `Forward to ${qtrLabel(newer)}`}
        >
          LATER →
        </Button>
      </nav>
    </div>
  )
}

function Archive({ pub }: { pub: PublishedState }) {
  const [desk, setDesk] = useState<DeskId | 'all'>('all')
  const [query, setQuery] = useState('')
  const counts = useMemo(() => deskCounts(pub.news), [pub.news])
  const items = useMemo(
    () => archive(pub.news, { desks: desk === 'all' ? undefined : [desk], query }),
    [pub.news, desk, query],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* The type size sits on the ROW, not on the input: `index.css` sets
            `button, input { font: inherit }` unlayered, and an unlayered rule
            beats every Tailwind utility — a `text-[10px]` on the input itself
            is in the source, in the DOM, in the stylesheet, and inert. */}
        <label className="flex min-w-0 flex-1 items-center gap-2 border border-wire-ink/30 bg-wire-paper px-2 py-1 font-mono text-[10px] tracking-[0.1em] text-wire-ink">
          <span className="shrink-0 text-wire-ink/50">SEARCH</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="a word in a headline, a standfirst, or a masthead"
            className="min-w-0 flex-1 bg-transparent text-wire-ink outline-none placeholder:text-wire-ink/35"
            aria-label="Search every dispatch"
          />
        </label>
        <span className="shrink-0 font-mono text-[9px] tracking-[0.16em] text-dossier-ink/55">
          {items.length} OF {pub.news.length}
        </span>
      </div>

      {/* Nine sections and a count apiece is a rail wider than the dialog, and
          `SegmentedControl` does not wrap — so the last desk was sheared off
          the right edge, inside `overflow-hidden`, where no vertical overflow
          probe can see it. The counts moved to the tooltips; the section
          names alone fit, with room for a tenth desk. */}
      <SegmentedControl
        label="Section"
        value={desk}
        onChange={setDesk}
        options={[
          { value: 'all' as const, label: 'ALL', title: `Every dispatch ever filed (${pub.news.length})` },
          ...DESK_IDS.map((id) => ({
            value: id,
            label: DESK_NAMES[id],
            disabled: counts[id] === 0,
            title:
              counts[id] === 0
                ? `The ${DESK_NAMES[id].toLowerCase()} desk has filed nothing`
                : `${counts[id]} from the ${DESK_NAMES[id].toLowerCase()} desk`,
          })),
        ]}
      />

      <div className="bg-wire-paper p-3">
        {items.length === 0 ? (
          <div className="font-mono text-[11px] text-wire-ink/60">
            +++ NOTHING IN THE SPIKE MATCHES +++
          </div>
        ) : (
          <ol className="flex flex-col gap-2">
            {items.map((item, i) => (
              <li
                key={`${item.tick}-${item.event}-${i}`}
                className="border-t border-wire-ink/15 pt-2 first:border-t-0 first:pt-0"
              >
                <Byline item={item} />
                <div className={`mt-0.5 font-dossier text-[13px] leading-tight font-semibold ${toneClass(item.tone)}`}>
                  {item.text}
                </div>
                <p className="mt-0.5 font-dossier text-[11px] leading-snug text-wire-ink/70">
                  {item.body}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}

export function WireOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [view, setView] = useState<'front' | 'archive'>('front')
  return (
    <Modal title="THE WIRE" size="wide" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionHeading>
            {view === 'front' ? 'THE EDITION' : 'THE SPIKE'}
          </SectionHeading>
          <SegmentedControl
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'front' as const, label: 'FRONT PAGE', title: 'One quarter, laid out' },
              { value: 'archive' as const, label: 'ARCHIVE', title: 'Every dispatch ever filed' },
            ]}
          />
        </div>
        {view === 'front' ? <FrontPage pub={pub} /> : <Archive pub={pub} />}
      </div>
    </Modal>
  )
}
