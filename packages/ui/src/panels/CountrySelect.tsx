/** The posting room: choose which country's 1946 settlement to inherit before
 * the worker creates any true state. This is game furniture, not a settings
 * form — six dossiers, one sealed appointment.
 *
 * Below the appointments is the drafting room's door. It gets its own band
 * rather than a seventh dossier for two reasons, and both matter: the grid is
 * `sm:2 / xl:3` over exactly six profiles, so a seventh card leaves a ragged
 * orphan at both breakpoints — and, more importantly, choosing a posting and
 * writing one are different acts. A drafted country appearing as one more sealed
 * appointment would imply somebody has balanced it. Nobody has. */

import { useEffect, useRef, useState } from 'react'
import {
  COUNTRY_CATALOG,
  CURATED_COUNTRY_IDS,
  InvalidCountryError,
  type CountryDifficulty,
  type CountryProfile,
  type CountryScenarioId,
  type CuratedCountryId,
  type GameMode,
} from '@terrarium/engine'
import { Button, SegmentedControl } from '../components/ui'
import { draftKey, draftPopulation, parseCountryDocument, type CountryDocument } from '../countryDraft'

const DIFFICULTY: Record<CountryDifficulty, { label: string; className: string }> = {
  introductory: { label: 'INTRODUCTORY', className: 'text-[#2f5947]' },
  standard: { label: 'STANDARD', className: 'text-dossier-ink/65' },
  hard: { label: 'HARD', className: 'text-[#8a5a20]' },
  severe: { label: 'SEVERE', className: 'text-dossier-warn' },
}

/** What the aside needs, whichever kind of posting is selected. A draft has no
 * difficulty at all: the catalogue's stamps are prose backed by a thousand-run
 * matrix, and a country nobody has run does not get to claim one. */
interface Posting {
  key: string
  name: string
  byline: string
  summary: string
  difficulty: CountryDifficulty | null
  population: number | null
  development: number | null
  openness: number | null
  opportunities: readonly string[]
  pressures: readonly string[]
}

const fromProfile = (profile: CountryProfile): Posting => ({
  key: `catalogue:${profile.id}`,
  name: profile.name,
  byline: profile.byline,
  summary: profile.summary,
  difficulty: profile.difficulty,
  population: profile.population,
  development: profile.development,
  openness: profile.openness,
  opportunities: profile.opportunities,
  pressures: profile.pressures,
})

const fromDraft = (doc: CountryDocument): Posting => ({
  key: `draft:${draftKey(doc)}`,
  name: doc.params.name,
  byline: doc.dossier.byline,
  summary: doc.dossier.summary,
  difficulty: null,
  population: draftPopulation(doc),
  development: doc.params.development,
  openness: doc.params.openness,
  opportunities: doc.dossier.opportunities,
  pressures: doc.dossier.pressures,
})

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-dossier-ink/20 pl-2">
      <div className="font-mono text-[8px] tracking-[0.16em] text-dossier-ink/45">{label}</div>
      <div className="mt-0.5 font-mono text-[12px] font-semibold tabular-nums text-dossier-ink">{value}</div>
    </div>
  )
}

function Dossier({ profile, selected, onSelect }: { profile: CountryProfile; selected: boolean; onSelect: () => void }) {
  const difficulty = DIFFICULTY[profile.difficulty]
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group relative min-h-32 overflow-hidden border p-3 text-left shadow-[3px_4px_0_rgba(0,0,0,0.16)] transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass ${
        selected
          ? 'translate-x-0.5 translate-y-0.5 border-dossier-brass bg-[#f7efdf] shadow-[1px_2px_0_rgba(0,0,0,0.2)]'
          : 'border-dossier-ink/25 bg-dossier-paper hover:-translate-y-0.5 hover:border-dossier-brass'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${selected ? 'bg-dossier-brass' : 'bg-dossier-ink/12'}`} aria-hidden="true" />
      <span className="flex items-start justify-between gap-2 pl-1">
        <span>
          <span className="block font-dossier text-xl font-semibold leading-none text-dossier-ink">{profile.name}</span>
          <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.17em] text-dossier-ink/50">{profile.byline}</span>
        </span>
        <span className={`shrink-0 border border-current/30 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.13em] ${difficulty.className}`}>
          {difficulty.label}
        </span>
      </span>
      <span className="mt-3 block pl-1 font-dossier text-[11px] leading-snug text-dossier-ink/67">{profile.summary}</span>
      <span className="mt-3 flex gap-3 border-t border-dossier-ink/10 pl-1 pt-2 font-mono text-[8px] tabular-nums text-dossier-ink/48">
        <span>POP {profile.population === null ? 'SEALED' : `${profile.population.toFixed(1)}M`}</span>
        <span>DEV {profile.development === null ? '—' : `${Math.round(profile.development * 100)}`}</span>
        <span>OPEN {profile.openness === null ? '—' : profile.openness.toFixed(2)}</span>
      </span>
    </button>
  )
}

/** A draft on the shelf. Deliberately a leaner card in the paper's own colour
 * rather than a dossier: it is a file somebody wrote, not an appointment the
 * ministry is offering. */
function DraftCard({
  doc,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  doc: CountryDocument
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className={`relative flex items-center gap-2 border px-2.5 py-2 ${
        selected ? 'border-dossier-brass bg-dossier-paper/12' : 'border-dossier-paper/20 bg-dossier-paper/5'
      }`}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        onClick={onSelect}
        className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass"
      >
        <span className="block truncate font-dossier text-[15px] font-semibold leading-tight text-dossier-paper">
          {doc.params.name}
        </span>
        <span className="mt-0.5 block truncate font-mono text-[8px] uppercase tracking-[0.14em] text-dossier-paper/45">
          {draftPopulation(doc).toFixed(1)}M · DEV {Math.round(doc.params.development * 100)} · OPEN{' '}
          {doc.params.openness.toFixed(2)}
        </span>
      </button>
      <Button variant="secondary" size="compact" onClick={onEdit} title={`Open ${doc.params.name} in the drafting room`}>
        EDIT
      </Button>
      <Button
        variant="secondary"
        size="compact"
        onClick={onDelete}
        title={`Remove ${doc.params.name} from the shelf`}
        aria-label={`Remove ${doc.params.name} from the shelf`}
      >
        ✕
      </Button>
    </div>
  )
}

/** Every draft opens as a copy of a country the engine has actually been
 * calibrated on — forty empty fields is not an opening move anybody makes, and
 * a draft that starts from a balanced country stays in a neighbourhood where
 * the numbers mean something. Lives here rather than in the drafting room so
 * the posting room does not have to import the engine host to render. */
function ForkPicker({
  onPick,
  onCancel,
}: {
  onPick: (id: CuratedCountryId) => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="font-mono text-[9px] tracking-[0.16em] text-dossier-paper/55">OPEN AS A DRAFT:</span>
      {CURATED_COUNTRY_IDS.map((id) => (
        <Button key={id} variant="secondary" size="compact" onClick={() => onPick(id)}>
          {id.toUpperCase()}
        </Button>
      ))}
      <Button variant="secondary" size="compact" onClick={onCancel}>
        CANCEL
      </Button>
    </div>
  )
}

export function CountrySelect({
  onStart,
  onStartDraft,
  onCancel,
  notice,
  drafts,
  onNewDraft,
  onEditDraft,
  onImportDraft,
  onDeleteDraft,
}: {
  onStart: (country: CountryScenarioId, seed: string | undefined, mode: GameMode) => void
  onStartDraft: (doc: CountryDocument, seed: string | undefined, mode: GameMode) => void
  onCancel?: () => void
  /** why the player is standing here rather than in the run they left — set
   * when a save could not be reopened. Ordinary arrivals pass nothing. */
  notice?: string | null
  drafts: CountryDocument[]
  onNewDraft: (from: CuratedCountryId) => void
  onEditDraft: (doc: CountryDocument) => void
  onImportDraft: (doc: CountryDocument) => void
  onDeleteDraft: (key: string) => void
}) {
  const [selectedKey, setSelectedKey] = useState('catalogue:meridia')
  const [seed, setSeed] = useState('')
  const [mode, setMode] = useState<GameMode>('standard')
  const [forking, setForking] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  const postings = [
    ...COUNTRY_CATALOG.map(fromProfile),
    ...drafts.map(fromDraft),
  ]
  const selectedDraft = drafts.find((doc) => `draft:${draftKey(doc)}` === selectedKey) ?? null
  const selected = postings.find((posting) => posting.key === selectedKey) ?? postings[0]
  const catalogueId = selectedKey.startsWith('catalogue:')
    ? (selectedKey.slice('catalogue:'.length) as CountryScenarioId)
    : null

  useEffect(() => {
    if (!onCancel) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  const importFile = (file: File) => {
    setImportError(null)
    void file
      .text()
      .then((text) => {
        const doc = parseCountryDocument(JSON.parse(text) as unknown)
        onImportDraft(doc)
        setSelectedKey(`draft:${draftKey(doc)}`)
      })
      .catch((error: unknown) => {
        setImportError(
          error instanceof InvalidCountryError
            ? error.message
            : 'That file is not a Terrarium country document.',
        )
      })
  }

  const accept = () => {
    if (selectedDraft) onStartDraft(selectedDraft, seed.trim() || undefined, mode)
    else if (catalogueId) onStart(catalogueId, seed.trim() || undefined, mode)
  }

  return (
    <div className="fixed inset-0 z-[70] min-h-0 overflow-y-auto bg-[#22382d] text-dossier-ink">
      <div className="mx-auto flex min-h-full w-full max-w-[1280px] flex-col px-4 py-4 sm:px-6 lg:h-full lg:px-8 lg:py-5">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-dossier-brass/50 pb-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-12 w-1 bg-dossier-brass" aria-hidden="true" />
            <div>
              <div className="font-mono text-[9px] tracking-[0.35em] text-dossier-brass">MINISTRY OF NATIONAL ECONOMY</div>
              <h1 className="mt-1 font-dossier text-3xl font-semibold leading-none text-dossier-paper">Choose your posting</h1>
              <p className="mt-1.5 font-dossier text-[12px] italic text-dossier-paper/55">January 1946. The telegram names a country; the inheritance is yours.</p>
            </div>
          </div>
          {onCancel && <Button variant="secondary" size="compact" onClick={onCancel}>RETURN TO RECORDS</Button>}
        </header>

        {notice && (
          <p
            role="status"
            className="mt-3 shrink-0 border-l-2 border-dossier-warn bg-dossier-warn/10 px-2.5 py-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/85"
          >
            {/* the stripe carries the warning; `dossier-warn` is an ink for the
                paper register and goes nearly black against the felt, so the
                label is brass like every other small caption on this screen */}
            <span className="mr-1.5 font-mono text-[8px] tracking-[0.16em] text-dossier-brass">ARCHIVE</span>
            {notice}
          </p>
        )}

        <main className="grid min-h-0 flex-1 gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_330px] lg:overflow-hidden">
          <section className="min-h-0 lg:overflow-y-auto" aria-labelledby="posting-list-title">
            <div className="mb-2 flex items-center gap-3">
              <h2 id="posting-list-title" className="font-mono text-[9px] font-semibold tracking-[0.24em] text-dossier-brass">AVAILABLE APPOINTMENTS</h2>
              <span className="h-px flex-1 bg-dossier-brass/25" aria-hidden="true" />
              <span className="font-mono text-[8px] tracking-[0.12em] text-dossier-paper/45">OPENINGS ARE REPLAYABLE</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="radiogroup" aria-label="Country posting">
              {COUNTRY_CATALOG.map((profile) => (
                <Dossier
                  key={profile.id}
                  profile={profile}
                  selected={`catalogue:${profile.id}` === selectedKey}
                  onSelect={() => setSelectedKey(`catalogue:${profile.id}`)}
                />
              ))}
            </div>

            {/* ---------------- the drafting room's door ---------------- */}
            <div className="mt-5 border-t border-dossier-brass/25 pt-4">
              <div className="mb-2 flex items-center gap-3">
                <h2 className="font-mono text-[9px] font-semibold tracking-[0.24em] text-dossier-brass">THE DRAFTING ROOM</h2>
                <span className="h-px flex-1 bg-dossier-brass/25" aria-hidden="true" />
                <span className="font-mono text-[8px] tracking-[0.12em] text-dossier-paper/45">NOBODY HAS BALANCED THESE</span>
              </div>

              {forking ? (
                <ForkPicker
                  onPick={(id) => {
                    setForking(false)
                    onNewDraft(id)
                  }}
                  onCancel={() => setForking(false)}
                />
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  <Button variant="secondary" size="compact" onClick={() => setForking(true)}>
                    OPEN A NEW FILE
                  </Button>
                  <Button variant="secondary" size="compact" onClick={() => fileInput.current?.click()}>
                    FILE A DOSSIER FROM THE POUCH
                  </Button>
                </div>
              )}

              <input
                ref={fileInput}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) importFile(file)
                  event.target.value = ''
                }}
              />

              {importError && (
                <p className="mt-2 border-l-2 border-dossier-warn bg-dossier-warn/10 px-2.5 py-1.5 font-dossier text-[11px] leading-snug text-dossier-paper/85">
                  {importError}
                </p>
              )}

              {drafts.length > 0 && (
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2" role="radiogroup" aria-label="Drafted countries">
                  {drafts.map((doc) => (
                    <DraftCard
                      key={draftKey(doc)}
                      doc={doc}
                      selected={`draft:${draftKey(doc)}` === selectedKey}
                      onSelect={() => setSelectedKey(`draft:${draftKey(doc)}`)}
                      onEdit={() => onEditDraft(doc)}
                      onDelete={() => {
                        onDeleteDraft(draftKey(doc))
                        if (`draft:${draftKey(doc)}` === selectedKey) setSelectedKey('catalogue:meridia')
                      }}
                    />
                  ))}
                </div>
              )}

              {drafts.length === 0 && !forking && (
                <p className="mt-2 font-dossier text-[11px] italic leading-snug text-dossier-paper/45">
                  A draft opens as a copy of a country the engine has actually been calibrated on. Change what you
                  like, then commission a study before anyone has to live there.
                </p>
              )}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col border border-dossier-brass bg-dossier-paper shadow-[6px_8px_0_rgba(0,0,0,0.24)] lg:overflow-hidden" aria-live="polite">
            <div className="h-1 shrink-0 bg-dossier-brass" aria-hidden="true" />
            <div className="border-b border-dossier-ink/20 px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div className="font-mono text-[8px] tracking-[0.2em] text-dossier-ink/48">
                  CABINET APPOINTMENT · FILE 46/{selected.name.toUpperCase()}
                </div>
                {selected.difficulty === null && (
                  <span
                    className="shrink-0 border border-dossier-brass/50 px-1.5 py-0.5 font-mono text-[7px] tracking-[0.13em] text-dossier-brass"
                    title="Difficulty stamps on the catalogue are backed by a thousand-run matrix. A country nobody has run does not get one — commission a study instead."
                  >
                    UNRATED
                  </span>
                )}
              </div>
              <div className="mt-2 font-dossier text-3xl font-semibold leading-none">{selected.name}</div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-dossier-brass">{selected.byline}</div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
              <p className="font-dossier text-[13px] leading-relaxed text-dossier-ink/72">{selected.summary}</p>
              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-dossier-ink/15 py-3">
                <Fact label="POPULATION" value={selected.population === null ? 'SEALED' : `${selected.population.toFixed(1)}M`} />
                <Fact label="DEVELOPMENT" value={selected.development === null ? 'SEALED' : `${Math.round(selected.development * 100)}/100`} />
                <Fact label="OPENNESS" value={selected.openness === null ? 'SEALED' : `${selected.openness.toFixed(2)}×`} />
              </div>
              {(selected.opportunities.length > 0 || selected.pressures.length > 0) && (
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-mono text-[8px] font-semibold tracking-[0.18em] text-[#2f5947]">OPPORTUNITY</h3>
                    <ul className="mt-2 space-y-1.5 font-dossier text-[11px] leading-snug text-dossier-ink/68">
                      {selected.opportunities.map((item) => <li key={item}>+ {item}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-warn">PRESSURE</h3>
                    <ul className="mt-2 space-y-1.5 font-dossier text-[11px] leading-snug text-dossier-ink/68">
                      {selected.pressures.map((item) => <li key={item}>− {item}</li>)}
                    </ul>
                  </div>
                </div>
              )}
              {selectedDraft && (
                <div className="mt-4 border-t border-dossier-ink/15 pt-3">
                  <Button variant="quiet" size="compact" fullWidth onClick={() => onEditDraft(selectedDraft)}>
                    OPEN IN THE DRAFTING ROOM
                  </Button>
                  <p className="mt-1.5 font-dossier text-[10px] italic leading-snug text-dossier-ink/48">
                    A drafted posting runs through the same engine as every other. Its report card will say it was
                    served somewhere nobody has balanced.
                  </p>
                </div>
              )}
              <div className="mt-5 border-t border-dossier-ink/15 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-ink/55">
                    TENURE RULE
                  </span>
                  <SegmentedControl
                    label="Tenure rule"
                    value={mode}
                    onChange={setMode}
                    options={[
                      { value: 'standard', label: 'STANDARD' },
                      { value: 'god', label: 'GOD MODE' },
                    ]}
                  />
                </div>
                <p className="mt-1.5 font-dossier text-[10px] italic leading-snug text-dossier-ink/48">
                  {mode === 'god'
                    ? 'Testing safeguard: lost elections, revolts, and coups are recorded, but never end your run.'
                    : 'The electorate, the street, or the palace can remove your government.'}
                </p>
              </div>
              <label className="mt-4 block border-t border-dossier-ink/15 pt-3">
                <span className="font-mono text-[8px] font-semibold tracking-[0.18em] text-dossier-ink/55">POSTING CODE · OPTIONAL</span>
                <input
                  value={seed}
                  onChange={(event) => setSeed(event.target.value)}
                  placeholder="blank draws a new code"
                  className="mt-1.5 w-full border border-dossier-ink/30 bg-transparent px-2.5 py-2 font-mono text-[11px] text-dossier-ink outline-none placeholder:text-dossier-ink/35 focus:border-dossier-brass"
                />
                <span className="mt-1.5 block font-dossier text-[10px] italic leading-snug text-dossier-ink/48">Country + code reproduces the same shocks and world history. Your orders remain the only other input.</span>
              </label>
            </div>

            <div className="shrink-0 border-t border-dossier-ink/20 p-3">
              <Button variant="primary" fullWidth className="justify-between" onClick={accept}>
                ACCEPT POSTING <span aria-hidden="true">→</span>
              </Button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
