/**
 * The ministry handbook — the in-game manual (#80), the place the methodology
 * is written down (#32), and where the opening walkthrough hands the player
 * when it runs out of cards (#33).
 *
 * It paints `../manual` and knows nothing else. Every chapter that lists
 * something the game HAS is generated there from the engine's own id lists, so
 * this component must not hard-code a lever, an instrument or a bloc — the
 * whole point of the split is that a new one appears here without an edit.
 *
 * The spine is a tablist rather than a set of links because the handbook lives
 * inside a modal: there is nowhere to navigate to, and a player who arrives
 * from the records office wanting the methodology must land on that chapter
 * rather than on the first one.
 */

import { useId, useMemo, useState } from 'react'
import { Button, SectionHeading } from '../components/ui'
import {
  MANUAL_CHAPTERS,
  manualChapter,
  searchManual,
  type ManualChapterId,
  type ManualEntry,
  type ManualSection,
} from '../manual'

function EntryRow({ entry }: { entry: ManualEntry }) {
  return (
    <li className="border-l-2 border-dossier-brass/40 py-1 pl-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-dossier-ink">
          {entry.term.toUpperCase()}
        </span>
        {entry.meta && (
          <span className="shrink-0 font-mono text-[8px] tracking-[0.14em] text-dossier-ink/50">
            {entry.meta.toUpperCase()}
          </span>
        )}
      </div>
      <p className="mt-0.5 font-dossier text-[12px] leading-relaxed text-dossier-ink/78">{entry.detail}</p>
    </li>
  )
}

function SectionBlock({ section }: { section: ManualSection }) {
  return (
    <section className="mb-5">
      <SectionHeading>{section.heading}</SectionHeading>
      {section.body?.map((paragraph) => (
        <p key={paragraph.slice(0, 40)} className="mb-2 font-dossier text-[13px] leading-relaxed text-dossier-ink/85">
          {paragraph}
        </p>
      ))}
      {section.entries && (
        <ul className="mt-2 flex flex-col gap-1.5">
          {section.entries.map((entry) => (
            <EntryRow key={entry.term} entry={entry} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function ManualOverlay({
  initialChapter = 'briefing',
  onWalkthrough,
}: {
  initialChapter?: ManualChapterId
  /** replay the opening walkthrough; the handbook is where a player who
   * skipped it goes looking for it */
  onWalkthrough: () => void
}) {
  const [openId, setOpenId] = useState<ManualChapterId>(initialChapter)
  const [query, setQuery] = useState('')
  const searchId = useId()
  const hits = useMemo(() => searchManual(query), [query])
  const searching = query.trim().length >= 2
  const open = manualChapter(openId)

  return (
    <div className="grid min-h-0 gap-4 md:grid-cols-[200px_minmax(0,1fr)]">
      <nav
        className="flex min-w-0 flex-col gap-2 md:sticky md:top-0 md:self-start"
        aria-label="Handbook chapters"
      >
        <label htmlFor={searchId} className="font-mono text-[8px] tracking-[0.2em] text-dossier-ink/55">
          SEARCH THE HANDBOOK
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="fuel excise, revisions…"
          className="min-h-8 border border-dossier-ink/25 bg-dossier-paper px-2 font-mono text-[10px] text-dossier-ink placeholder:text-dossier-ink/35 focus-visible:outline-2 focus-visible:outline-dossier-brass"
        />
        <div className="flex flex-col gap-1" role="tablist" aria-orientation="vertical" aria-label="Handbook chapters">
          {MANUAL_CHAPTERS.map((chapter) => {
            const selected = !searching && chapter.id === openId
            return (
              <button
                key={chapter.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setQuery('')
                  setOpenId(chapter.id)
                }}
                className={`border px-2 py-1.5 text-left font-mono text-[9px] font-semibold tracking-[0.16em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass ${
                  selected
                    ? 'border-dossier-brass bg-dossier-brass/20 text-dossier-ink'
                    : 'border-dossier-ink/15 text-dossier-ink/65 hover:border-dossier-brass hover:text-dossier-ink'
                }`}
              >
                {chapter.title}
                <span className="mt-0.5 block font-dossier text-[10px] font-normal normal-case tracking-normal text-dossier-ink/50">
                  {chapter.blurb}
                </span>
              </button>
            )
          })}
        </div>
        <Button variant="quiet" size="compact" fullWidth onClick={onWalkthrough} className="mt-1">
          REPLAY THE TOUR
        </Button>
      </nav>

      <div className="min-w-0">
        {searching ? (
          <div>
            <SectionHeading aside={`${hits.length} PASSAGE${hits.length === 1 ? '' : 'S'}`}>
              SEARCH — “{query.trim().toUpperCase()}”
            </SectionHeading>
            {hits.length === 0 ? (
              <p className="font-dossier text-[13px] italic leading-relaxed text-dossier-ink/60">
                Nothing in the handbook uses that word. Try the name a minister would use — a lever,
                an instrument, or a bloc.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {hits.map((hit, index) => (
                  <li key={`${hit.chapter}-${hit.heading}-${hit.term ?? index}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery('')
                        setOpenId(hit.chapter)
                      }}
                      className="w-full border border-dossier-ink/15 px-2.5 py-1.5 text-left hover:border-dossier-brass focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass"
                    >
                      <span className="font-mono text-[8px] tracking-[0.16em] text-dossier-ink/50">
                        {hit.chapterTitle} · {hit.heading}
                      </span>
                      <span className="mt-0.5 block font-dossier text-[12px] leading-snug text-dossier-ink/80">
                        {hit.term && <strong className="font-semibold">{hit.term} — </strong>}
                        {hit.text.length > 180 ? `${hit.text.slice(0, 180)}…` : hit.text}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <article aria-label={open.title}>
            <header className="mb-4 border-b border-dossier-ink/20 pb-2">
              <h2 className="font-mono text-[12px] font-semibold tracking-[0.24em] text-dossier-ink">{open.title}</h2>
              <p className="mt-1 font-dossier text-[12px] italic text-dossier-ink/60">{open.blurb}</p>
            </header>
            {open.sections.map((section) => (
              <SectionBlock key={section.heading} section={section} />
            ))}
          </article>
        )}
      </div>
    </div>
  )
}
