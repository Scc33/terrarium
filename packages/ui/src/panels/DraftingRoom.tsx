/**
 * The drafting room: where a posting gets written instead of chosen.
 *
 * Same furniture as the posting room — felt board, manila panels, brass rules —
 * because writing a country is a thing the ministry does, not a settings
 * screen bolted to the side of it. The dev console is the surface that is
 * deliberately NOT diegetic; this one is.
 *
 * Every decision the editor makes lives in `countryDraft.ts`, which is pure and
 * tested. This file lays out controls and nothing else — the moment a bound or
 * a format lands here it becomes something nobody can test, and a bound that
 * disagrees with the engine's validator is invisible until a player drags a
 * slider to its own maximum and cannot save.
 *
 * The study on the right is the point of the room. A country you wrote is a
 * hypothesis; the batch runner is what turns it into a claim.
 */

import { useEffect, useMemo, useState } from 'react'
import { Button, SegmentedControl, SliderField } from '../components/ui'
import { useGame } from '../store/gameStore'
import {
  AGE_SHAPE_LABELS,
  COUNTRY_ARCHETYPE_IDS,
  DRAFT_GROUPS,
  DRAFT_GROUP_IDS,
  draftChanges,
  draftPopulation,
  fieldsInGroup,
  formatFieldValue,
  readField,
  reviseDraft,
  shareFilename,
  shareUrl,
  writeField,
  type CountryArchetypeId,
  type CountryDocument,
  type DraftGroupId,
} from '../countryDraft'
import { StudyReport } from './StudyReport'

const inputCls =
  'w-full border border-dossier-paper/25 bg-[#22382d]/40 px-2 py-1.5 font-dossier text-[13px] text-dossier-paper outline-none placeholder:text-dossier-paper/30 focus:border-dossier-brass'

export function DraftingRoom({
  draft,
  origin,
  onChange,
  onClose,
  onAccept,
}: {
  draft: CountryDocument
  /** the country this draft was opened from, for the DRAFTED marks */
  origin: CountryDocument
  onChange: (next: CountryDocument) => void
  onClose: () => void
  onAccept: (doc: CountryDocument) => void
}) {
  const { study, runStudy, clearStudy, saveDraft } = useGame()
  const [group, setGroup] = useState<DraftGroupId>('people')
  const [filed, setFiled] = useState<string | null>(null)

  const changed = useMemo(() => draftChanges(draft, origin), [draft, origin])
  const population = draftPopulation(draft)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const notice = (text: string) => {
    setFiled(text)
    window.setTimeout(() => setFiled((current) => (current === text ? null : current)), 2400)
  }

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = shareFilename(draft)
    anchor.click()
    URL.revokeObjectURL(url)
    notice('Filed to your downloads.')
  }

  const copyLink = () => {
    const url = shareUrl(draft, window.location.href)
    void navigator.clipboard
      ?.writeText(url)
      .then(() => notice('Link copied. The country travels in the address itself.'))
      .catch(() => notice('Could not reach the clipboard — export the file instead.'))
  }

  const file = () => {
    void saveDraft(draft).then(() => notice(`Filed as ${draft.params.name}.`))
  }

  return (
    <div className="fixed inset-0 z-[80] min-h-0 overflow-y-auto bg-[#1d3027] text-dossier-paper">
      <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:h-full lg:px-8 lg:py-5">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-dossier-brass/50 pb-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-11 w-1 bg-dossier-brass" aria-hidden="true" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.35em] text-dossier-brass">
                DRAFTING ROOM · FILE 46/{(draft.params.name || 'UNTITLED').toUpperCase()}
              </div>
              <h1 className="mt-1 font-dossier text-3xl font-semibold leading-none text-dossier-paper">
                Write a posting
              </h1>
              <p className="mt-1.5 font-dossier text-[12px] italic text-dossier-paper/55">
                There is no way to set an economy — you give a country its 1946 conditions and let it live.
              </p>
            </div>
          </div>
          <Button variant="secondary" size="compact" onClick={onClose}>
            BACK TO POSTINGS
          </Button>
        </header>

        <main className="grid min-h-0 flex-1 gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_368px] lg:overflow-hidden">
          {/* ---------------- the vector ---------------- */}
          <section className="flex min-h-0 flex-col gap-3 lg:overflow-hidden" aria-label="Country parameters">
            <div className="grid shrink-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <label className="block">
                <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-brass">COUNTRY NAME</span>
                <input
                  className={`mt-1 ${inputCls}`}
                  value={draft.params.name}
                  maxLength={40}
                  onChange={(event) => onChange(reviseDraft(draft, { name: event.target.value || 'Untitled' }))}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-brass">BYLINE</span>
                <input
                  className={`mt-1 ${inputCls}`}
                  value={draft.dossier.byline}
                  maxLength={80}
                  onChange={(event) => onChange(reviseDraft(draft, { byline: event.target.value }))}
                />
              </label>
            </div>
            <label className="block shrink-0">
              <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-brass">THE SUMMARY ON THE FILE</span>
              <input
                className={`mt-1 ${inputCls}`}
                value={draft.dossier.summary}
                maxLength={400}
                onChange={(event) => onChange(reviseDraft(draft, { summary: event.target.value }))}
              />
            </label>

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <SegmentedControl
                label="Parameter group"
                tone="inverted"
                value={group}
                onChange={setGroup}
                options={DRAFT_GROUP_IDS.map((id) => ({
                  value: id,
                  label: DRAFT_GROUPS[id].short,
                  title: DRAFT_GROUPS[id].note,
                }))}
              />
              <span className="ml-auto font-mono text-[9px] tabular-nums tracking-[0.12em] text-dossier-paper/50">
                {population.toFixed(1)}M PEOPLE · {changed.size} DRAFTED
              </span>
            </div>

            <p className="shrink-0 border-l-2 border-dossier-brass bg-dossier-paper/[0.06] px-2.5 py-1.5 font-dossier text-[11px] italic leading-snug text-dossier-paper/65">
              {DRAFT_GROUPS[group].note}
            </p>

            <div className="min-h-0 flex-1 lg:overflow-y-auto">
              {group === 'people' && (
                <label className="mb-2 block border-l-2 border-dossier-paper/10 bg-[#22382d]/20 px-2 py-2">
                  <span className="font-mono text-[11px] font-medium tracking-wide text-dossier-paper">Age shape</span>
                  <select
                    className={`mt-1.5 ${inputCls} font-mono text-[11px]`}
                    value={draft.ageShape}
                    onChange={(event) =>
                      onChange(reviseDraft(draft, { ageShape: event.target.value as CountryArchetypeId }))
                    }
                  >
                    {COUNTRY_ARCHETYPE_IDS.map((shape) => (
                      <option key={shape} value={shape} className="text-dossier-ink">
                        {AGE_SHAPE_LABELS[shape]}
                      </option>
                    ))}
                  </select>
                  <span className="mt-1 block font-mono text-[8px] tracking-[0.1em] text-dossier-paper/40">
                    THE PYRAMID IS DERIVED FROM THIS AND THE CLASS SIZES
                  </span>
                </label>
              )}

              <div className="grid gap-1.5 sm:grid-cols-2">
                {fieldsInGroup(group).map((field) => {
                  const value = readField(draft.params, field.path)
                  const dirty = changed.has(field.path)
                  const write = (next: number) =>
                    onChange(reviseDraft(draft, { params: writeField(draft.params, field, next) }))
                  return (
                    <SliderField
                      key={field.path}
                      label={field.label}
                      hint={field.hint}
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={Number.isFinite(value) ? value : field.min}
                      dirty={dirty}
                      displayValue={formatFieldValue(value, field.format)}
                      currentDisplayValue={
                        dirty ? formatFieldValue(readField(origin.params, field.path), field.format) : undefined
                      }
                      onChange={(event) => write(Number(event.target.value))}
                      onStep={(direction) => write(value + direction * field.step)}
                      onReset={dirty ? () => write(readField(origin.params, field.path)) : undefined}
                    />
                  )
                })}
              </div>
            </div>
          </section>

          {/* ---------------- the study ---------------- */}
          <aside
            className="flex min-h-0 flex-col border border-dossier-brass bg-dossier-paper text-dossier-ink shadow-[6px_8px_0_rgba(0,0,0,0.24)] lg:overflow-hidden"
            aria-label="Feasibility study"
          >
            <div className="h-1 shrink-0 bg-dossier-brass" aria-hidden="true" />
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <StudyReport
                study={study}
                draft={draft}
                onRun={() => runStudy(draft)}
                onClear={clearStudy}
              />
            </div>
            <div className="shrink-0 border-t border-dossier-ink/20 p-3">
              {filed && (
                <p className="mb-2 font-dossier text-[11px] italic leading-snug text-[#2f5947]">{filed}</p>
              )}
              <div className="grid grid-cols-3 gap-1.5">
                <Button variant="quiet" size="compact" onClick={file} title="Keep this country on the shelf in this browser.">
                  FILE
                </Button>
                <Button variant="quiet" size="compact" onClick={exportFile} title="Download the country as a JSON file.">
                  EXPORT
                </Button>
                <Button variant="quiet" size="compact" onClick={copyLink} title="Copy a link that carries the whole country in its address.">
                  LINK
                </Button>
              </div>
              <Button
                variant="primary"
                fullWidth
                className="mt-1.5 justify-between"
                onClick={() => onAccept(draft)}
              >
                ACCEPT THIS POSTING <span aria-hidden="true">→</span>
              </Button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
