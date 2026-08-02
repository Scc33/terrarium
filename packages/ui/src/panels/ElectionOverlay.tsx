/**
 * The election, as a scene (§3.1).
 *
 * Before M6 an election was one line on the wire that told you, after the
 * fact, whether you still had a job. The forcing function the whole design
 * rests on — "optimize the economy *while holding a coalition together*" —
 * had no moment where the player did anything about it.
 *
 * So the campaign gets a turn of its own. Two quarters out the ministry puts
 * this on the desk: the record you are running on, drawn from the published
 * numbers only (an election is fought on the figures in the newspaper, not on
 * the truth — §3.4), the arithmetic of the ballot box, and four ways to fight
 * it besides standing on your record. Each is a real fork with a real bill,
 * priced in the engine, and each is a different thing to mortgage:
 *
 *   largesse    the budget          — the transfers stay raised; you walk it back
 *   coalition   the levers          — a bloc's claim on you for a full term
 *   suppression the corridor        — repression, and a mandate that is not consent
 *   franchise   your own scorecard  — different people's approval now counts
 *
 * The choice is staged like any other action, so it costs PC, shows up in the
 * rail's tally, and can be discarded before the quarter turns.
 */

import type { BlocId, PlatformId, PublishedState } from '@terrarium/observation'
import { Overlay } from '../components/Overlay'
import { useGame } from '../store/gameStore'
import { BLOC_NAMES } from '../components/labels'

const yearOf = (q: number) => `${1946 + Math.floor(q / 4)}Q${(q % 4) + 1}`
const pct = (v: number) => `${(v * 100).toFixed(1)}%`

interface PlatformDef {
  id: PlatformId
  name: string
  pitch: string
  cost: string
  needsBloc?: boolean
}

const PLATFORMS: PlatformDef[] = [
  {
    id: 'record',
    name: 'Stand on the record',
    pitch: 'No promises, no theatre. The figures are what they are.',
    cost: 'Costs nothing beyond the campaign itself.',
  },
  {
    id: 'largesse',
    name: 'Open the treasury',
    pitch: 'A pre-election rise in transfers. Voters notice money in hand.',
    cost: 'Transfers stay raised by half — walking that back later is a cut, and cuts cost approval too. The money interest will not forget it.',
  },
  {
    id: 'coalition',
    name: 'Court a bloc',
    pitch: 'Trade a promise for a machine. Their people turn out for you.',
    cost: 'They hold a claim on you for a full term: everything they dislike costs double while the debt stands.',
    needsBloc: true,
  },
  {
    id: 'suppression',
    name: 'Clear the ballot',
    pitch: 'An opposition that cannot campaign does not appear in the count.',
    cost: 'Repression rises. Societal power falls, the dot walks toward despotism — and the historians record the mandate as taken, not won.',
  },
  {
    id: 'franchise',
    name: 'Extend the franchise',
    pitch: 'Bring the excluded to the ballot box and ask for their votes.',
    cost: 'You are rewriting the rubric you are scored on: different people’s approval now decides your fate. The landed interest will resist.',
  },
]

/** The record, from published figures only — the newspaper's version. */
function Record({ pub }: { pub: PublishedState }) {
  const rows: Array<{ label: string; value: string }> = []
  for (const id of ['gdp_growth', 'inflation', 'unemployment', 'approval'] as const) {
    const series = pub.indicators[id]
    const last = series?.points[series.points.length - 1]
    rows.push({
      label: series?.label ?? id.replace('_', ' '),
      value: last ? `${last.value.toFixed(1)} ${series!.unit}` : 'not measured',
    })
  }
  return (
    <section className="border border-dossier-ink/25 p-3">
      <div className="mb-2 font-mono text-[9px] font-medium tracking-[0.3em] text-dossier-ink/60">
        THE RECORD, AS PUBLISHED
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2">
            <span className="truncate font-dossier text-[12px] text-dossier-ink/75">{r.label}</span>
            <span className="shrink-0 font-mono text-[12px] tabular-nums text-dossier-ink">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 font-dossier text-[11px] italic leading-snug text-dossier-ink/60">
        An election is fought on the figures in the newspaper. Whether they were right is a
        question for the revisions.
      </p>
    </section>
  )
}

export function ElectionOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const { staged, stage } = useGame()
  const campaign = pub.campaign
  const stagedAction = staged.get('campaign')
  if (!campaign) return null

  const committed = campaign.committed
  const chosen: PlatformId | null =
    committed?.platform ?? (stagedAction?.kind === 'campaign' ? stagedAction.platform : null)
  const chosenBloc: BlocId | null =
    committed?.bloc ?? (stagedAction?.kind === 'campaign' ? (stagedAction.bloc ?? null) : null)
  const margin = campaign.support - campaign.threshold

  return (
    <Overlay title="THE CAMPAIGN" onClose={onClose} wide>
      <div className="flex flex-col gap-4">
        <div className="text-center">
          <div className="font-dossier text-2xl font-semibold text-dossier-ink">
            {campaign.quartersToElection === 1
              ? 'The country votes next quarter'
              : `The country votes in ${campaign.quartersToElection} quarters`}
          </div>
          <div className="mt-1 font-mono text-[11px] tabular-nums tracking-[0.2em] text-dossier-ink/70">
            {yearOf(pub.tick + campaign.quartersToElection)} · {pub.country}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Record pub={pub} />

          <section className="border border-dossier-ink/25 p-3">
            <div className="mb-2 font-mono text-[9px] font-medium tracking-[0.3em] text-dossier-ink/60">
              THE ARITHMETIC
            </div>
            <div className="flex flex-col gap-1 font-mono text-[12px] tabular-nums text-dossier-ink">
              <div className="flex justify-between">
                <span className="font-dossier text-dossier-ink/75">Support among voters</span>
                <span>{pct(campaign.support)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-dossier text-dossier-ink/75">The bar to clear</span>
                <span>{pct(campaign.threshold)}</span>
              </div>
              {committed && committed.swing !== 0 && (
                <div className="flex justify-between text-dossier-brass">
                  <span className="font-dossier">The campaign is worth</span>
                  <span>
                    {committed.swing >= 0 ? '+' : ''}
                    {pct(committed.swing)}
                  </span>
                </div>
              )}
              <div
                className={`mt-1 flex justify-between border-t border-dossier-ink/20 pt-1 font-medium ${
                  margin + (committed?.swing ?? 0) >= 0 ? 'text-dossier-felt' : 'text-dossier-warn'
                }`}
              >
                <span className="font-dossier">Margin</span>
                <span>
                  {margin + (committed?.swing ?? 0) >= 0 ? '+' : ''}
                  {pct(margin + (committed?.swing ?? 0))}
                </span>
              </div>
            </div>
            <p className="mt-2 font-dossier text-[11px] italic leading-snug text-dossier-ink/60">
              The count carries a swing of a few points either way. A margin this side of zero is
              a likelihood, never a promise.
            </p>
          </section>
        </div>

        <section>
          <div className="mb-2 font-mono text-[9px] font-medium tracking-[0.3em] text-dossier-ink/60">
            HOW WILL YOU FIGHT IT?
          </div>
          <div className="flex flex-col gap-1.5">
            {PLATFORMS.map((p) => {
              const isChosen = chosen === p.id
              return (
                <div
                  key={p.id}
                  className={`border p-2.5 ${
                    isChosen ? 'border-dossier-brass bg-dossier-brass/10' : 'border-dossier-ink/20'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-dossier text-[14px] font-semibold text-dossier-ink">
                      {p.name}
                    </span>
                    <button
                      disabled={committed !== null}
                      onClick={() =>
                        stage(
                          'campaign',
                          isChosen && !committed
                            ? null
                            : {
                                kind: 'campaign',
                                platform: p.id,
                                ...(p.needsBloc ? { bloc: chosenBloc ?? 'industrialists' } : {}),
                              },
                        )
                      }
                      className={`shrink-0 border px-2 py-0.5 font-mono text-[10px] tracking-[0.15em] disabled:opacity-40 ${
                        isChosen
                          ? 'border-dossier-brass bg-dossier-brass text-dossier-ink'
                          : 'border-dossier-ink/30 text-dossier-ink/70 hover:border-dossier-brass hover:text-dossier-brass'
                      }`}
                    >
                      {committed ? (isChosen ? 'ANNOUNCED' : '—') : isChosen ? 'STAGED' : 'CHOOSE'}
                    </button>
                  </div>
                  <p className="mt-0.5 font-dossier text-[12px] leading-snug text-dossier-ink/80">
                    {p.pitch}
                  </p>
                  <p className="mt-1 font-mono text-[10px] leading-snug text-dossier-warn/85">
                    {p.cost}
                  </p>
                  {p.needsBloc && isChosen && !committed && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pub.blocs.map((b) => (
                        <button
                          key={b.id}
                          onClick={() =>
                            stage('campaign', { kind: 'campaign', platform: 'coalition', bloc: b.id })
                          }
                          title={`Power ${(b.power * 100).toFixed(0)} of 100 · goodwill ${b.favor.toFixed(2)}`}
                          className={`border px-1.5 py-0.5 font-mono text-[10px] ${
                            chosenBloc === b.id
                              ? 'border-dossier-brass bg-dossier-brass text-dossier-ink'
                              : 'border-dossier-ink/30 text-dossier-ink/70 hover:border-dossier-brass'
                          }`}
                        >
                          {BLOC_NAMES[b.id]} · {(b.power * 100).toFixed(0)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <p className="text-center font-mono text-[9px] tracking-[0.2em] text-dossier-ink/50">
          {committed
            ? 'THE PLATFORM IS ANNOUNCED. THERE IS NO TAKING IT BACK.'
            : 'A PLATFORM IS COMMITTED WHEN THE QUARTER TURNS.'}
        </p>
      </div>
    </Overlay>
  )
}
