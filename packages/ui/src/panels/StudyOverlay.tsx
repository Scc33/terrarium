/**
 * The Study — where the minister pins published prints to the corkboard and
 * draws curves through them. The Phillips scatter uses only what the
 * statistical office has actually released: no survey, no dot. Drawn in the
 * hand-annotated map register.
 */

import type { PublishedState } from '@terrarium/observation'
import { Modal, OverlayLayout, Tooltip } from '../components/ui'
import { shapeSeries } from '../components/series'

const W = 460
const H = 340
const PAD = 42

export function StudyOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const infl = pub.indicators.inflation
  const unemp = pub.indicators.unemployment

  let body: React.ReactNode
  if (!infl || !unemp) {
    body = (
      <div className="border border-dashed border-map-line/50 p-8 text-center font-mono text-[11px] text-map-line">
        THE PHILLIPS BOARD NEEDS BOTH PRICE COLLECTION AND A LABOUR FORCE SURVEY.
        <div className="mt-2 opacity-70">FUND THE STATISTICAL OFFICE.</div>
      </div>
    )
  } else {
    const ip = shapeSeries(infl, Number.MAX_SAFE_INTEGER, pub.tick)
    const up = shapeSeries(unemp, Number.MAX_SAFE_INTEGER, pub.tick)
    const uByQtr = new Map(up.map((p) => [p.forQtr, p]))
    const pts = ip
      .filter((p) => uByQtr.has(p.forQtr))
      .map((p) => ({ q: p.forQtr, infl: p.value, u: uByQtr.get(p.forQtr)!.value }))
    if (pts.length < 8) {
      body = (
        <div className="border border-dashed border-map-line/50 p-8 text-center font-mono text-[11px] text-map-line">
          TOO FEW OVERLAPPING PRINTS YET — GIVE THE SURVEYS A FEW YEARS.
        </div>
      )
    } else {
      const uLo = Math.min(...pts.map((p) => p.u)) - 0.5
      const uHi = Math.max(...pts.map((p) => p.u)) + 0.5
      const iLo = Math.min(...pts.map((p) => p.infl)) - 0.5
      const iHi = Math.max(...pts.map((p) => p.infl)) + 0.5
      const sx = (u: number) => PAD + ((u - uLo) / (uHi - uLo)) * (W - PAD - 14)
      const sy = (v: number) => H - PAD + ((v - iLo) / (iHi - iLo)) * (PAD + 14 - H)
      const last = pts[pts.length - 1]
      body = (
        <div className="bg-map-field p-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
            <line x1={PAD} x2={W - 10} y1={H - PAD} y2={H - PAD} stroke="var(--color-map-line)" strokeWidth="1" />
            <line x1={PAD} x2={PAD} y1={14} y2={H - PAD} stroke="var(--color-map-line)" strokeWidth="1" />
            <Tooltip content="The share of people who want work and cannot find it, at the date each dot was printed. Rightward is a slacker labour market.">
              <text x={W - 12} y={H - PAD + 16} textAnchor="end" fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-map-line)" className="cursor-help">
                UNEMPLOYMENT % →
              </text>
            </Tooltip>
            <Tooltip content="How fast prices rose over the year to that print. The board asks whether the two move against each other — cheap jobs bought with dearer bread — and whether that bargain holds once you start spending it.">
              <text x={PAD - 26} y={20} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-map-line)" transform={`rotate(-90 ${PAD - 26} 20)`} textAnchor="end" className="cursor-help">
                INFLATION %/YR →
              </text>
            </Tooltip>
            {sy(0) < H - PAD && sy(0) > 14 && (
              <line x1={PAD} x2={W - 10} y1={sy(0)} y2={sy(0)} stroke="var(--color-map-line)" strokeWidth="0.7" strokeDasharray="3 3" opacity="0.5" />
            )}
            {/* the traced loop, faint — history is a path, not a cloud */}
            <path
              d={'M' + pts.map((p) => `${sx(p.u).toFixed(1)},${sy(p.infl).toFixed(1)}`).join(' L')}
              fill="none"
              stroke="var(--color-map-line)"
              strokeWidth="0.7"
              opacity="0.35"
            />
            {pts.map((p) => (
              <circle key={p.q} cx={sx(p.u)} cy={sy(p.infl)} r="2.2" fill="var(--color-map-line)" opacity="0.55">
                <title>{`${1946 + Math.floor(p.q / 4)} Q${(p.q % 4) + 1}: u ${p.u.toFixed(1)}%, π ${p.infl.toFixed(1)}%`}</title>
              </circle>
            ))}
            <circle cx={sx(last.u)} cy={sy(last.infl)} r="4.5" fill="var(--color-dossier-warn)" />
            <text x={sx(last.u) + 8} y={sy(last.infl) + 3} fontSize="9" fontFamily="var(--font-mono)" fill="var(--color-dossier-warn)">
              NOW
            </text>
          </svg>
          <div className="px-2 pb-1 font-dossier text-[11px] italic text-map-line/80">
            Each dot is a quarter as the office printed it. If a stable trade-off appears, ask
            yourself how long it will survive your exploiting it.
          </div>
        </div>
      )
    }
  }

  return (
    <Modal title="THE STUDY — PHILLIPS BOARD" onClose={onClose} size="wide">
      <OverlayLayout
        note="Each dot is one quarter as the statistical office printed it. The faint line preserves sequence: a loop through time can look like a stable trade-off when a cloud of disconnected points would not."
        footer="PUBLISHED PRINTS ONLY · REVISIONS CHANGE THE RECORD"
      >
        {body}
      </OverlayLayout>
    </Modal>
  )
}
