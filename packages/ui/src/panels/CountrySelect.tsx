/** The posting room: choose which country's 1946 settlement to inherit before
 * the worker creates any true state. This is game furniture, not a settings
 * form — six dossiers, one sealed appointment. */

import { useEffect, useState } from 'react'
import {
  COUNTRY_CATALOG,
  type CountryDifficulty,
  type CountryProfile,
  type CountryScenarioId,
  type GameMode,
} from '@terrarium/engine'
import { Button, SegmentedControl } from '../components/ui'

const DIFFICULTY: Record<CountryDifficulty, { label: string; className: string }> = {
  introductory: { label: 'INTRODUCTORY', className: 'text-[#2f5947]' },
  standard: { label: 'STANDARD', className: 'text-dossier-ink/65' },
  hard: { label: 'HARD', className: 'text-[#8a5a20]' },
  severe: { label: 'SEVERE', className: 'text-dossier-warn' },
}
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

export function CountrySelect({
  onStart,
  onCancel,
}: {
  onStart: (country: CountryScenarioId, seed: string | undefined, mode: GameMode) => void
  onCancel?: () => void
}) {
  const [selectedId, setSelectedId] = useState<CountryScenarioId>('meridia')
  const [seed, setSeed] = useState('')
  const [mode, setMode] = useState<GameMode>('standard')
  const selected = COUNTRY_CATALOG.find((profile) => profile.id === selectedId) ?? COUNTRY_CATALOG[0]

  useEffect(() => {
    if (!onCancel) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

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
                  selected={profile.id === selectedId}
                  onSelect={() => setSelectedId(profile.id)}
                />
              ))}
            </div>
          </section>

          <aside className="flex min-h-0 flex-col border border-dossier-brass bg-dossier-paper shadow-[6px_8px_0_rgba(0,0,0,0.24)] lg:overflow-hidden" aria-live="polite">
            <div className="h-1 shrink-0 bg-dossier-brass" aria-hidden="true" />
            <div className="border-b border-dossier-ink/20 px-4 py-3">
              <div className="font-mono text-[8px] tracking-[0.2em] text-dossier-ink/48">CABINET APPOINTMENT · FILE 46/{selected.id.toUpperCase()}</div>
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
              <Button
                variant="primary"
                fullWidth
                className="justify-between"
                onClick={() => onStart(selected.id, seed.trim() || undefined, mode)}
              >
                ACCEPT POSTING <span aria-hidden="true">→</span>
              </Button>
            </div>
          </aside>
        </main>
      </div>
    </div>
  )
}
