/**
 * The Narrow Corridor — the closest thing this game has to a map, docked
 * permanently. Connecting-tissue register: hand-drawn strategy-map linework,
 * its own quiet palette, neither dossier brass nor terminal phosphor.
 *
 * x = state capacity (the government's own stocks — known exactly).
 * y = societal power (from the country's setup: enfranchisement-weighted
 * population). Static until Layer 3 (M3) makes it move.
 */

import { WallTile } from '../WallTile/WallTile'

interface Trail {
  x: number
  y: number
}

// landscape: the corridor is docked in a wide, short bay, and a square
// viewBox letterboxed itself into a third of the space it was given
const W = 340
const H = 200
const PAD = 30

// a light hand wobble so straight lines read as pencil, not plotter
const wob = (x: number, y: number, i: number) =>
  `${(x + Math.sin(i * 3.7) * 1.4).toFixed(1)},${(y + Math.cos(i * 2.9) * 1.4).toFixed(1)}`

function roughLine(x0: number, y0: number, x1: number, y1: number, segs = 6): string {
  const pts: string[] = []
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    pts.push(wob(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, i))
  }
  return 'M' + pts.join(' L')
}

export function CorridorPlot({ trail }: { trail: Trail[] }) {
  const sx = (v: number) => PAD + v * (W - PAD - 12)
  const sy = (v: number) => H - PAD + v * (PAD + 12 - H)
  const dot = trail[trail.length - 1]

  return (
    <WallTile
      className="border border-map-line/60 bg-map-field"
      bodyClassName="p-1"
      header={
        <div className="border-b border-map-line/30 px-3 py-1.5 font-dossier text-[11px] italic tracking-wide text-map-line">
          The Narrow Corridor
        </div>
      }
      footer={
        <div className="border-t border-map-line/30 px-3 py-1 font-dossier text-[10px] italic text-map-line/80">
          Your nation drifts; the corridor does not wait.
        </div>
      }
    >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="block h-full w-full">
          {/* axes, penciled */}
          <path d={roughLine(PAD, H - PAD, W - 10, H - PAD)} fill="none" stroke="var(--color-map-line)" strokeWidth="1" />
          <path d={roughLine(PAD, H - PAD, PAD, 10)} fill="none" stroke="var(--color-map-line)" strokeWidth="1" />
          <text x={W - 12} y={H - PAD + 14} textAnchor="end" fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-map-line)" opacity="0.8">
            STATE CAPACITY →
          </text>
          <text x={PAD - 14} y={14} fontSize="8" fontFamily="var(--font-mono)" fill="var(--color-map-line)" opacity="0.8" transform={`rotate(-90 ${PAD - 14} 14)`} textAnchor="end">
            SOCIETAL POWER →
          </text>

          {/* the corridor: a band about the diagonal, sketched twice like a
              road on a field map */}
          <path
            d={roughLine(sx(0.02), sy(0.18), sx(0.82), sy(0.98), 8)}
            fill="none"
            stroke="var(--color-map-line)"
            strokeWidth="1.1"
            strokeDasharray="5 3"
            opacity="0.85"
          />
          <path
            d={roughLine(sx(0.18), sy(0.02), sx(0.98), sy(0.82), 8)}
            fill="none"
            stroke="var(--color-map-line)"
            strokeWidth="1.1"
            strokeDasharray="5 3"
            opacity="0.85"
          />
          <text x={sx(0.32)} y={sy(0.62)} fontSize="8.5" fontFamily="var(--font-dossier)" fontStyle="italic" fill="var(--color-map-line)" transform={`rotate(-38 ${sx(0.32)} ${sy(0.62)})`}>
            the corridor
          </text>
          <text x={sx(0.1)} y={sy(0.88)} fontSize="9" fontFamily="var(--font-dossier)" fontStyle="italic" fill="var(--color-map-line)" opacity="0.75">
            Anarchy
          </text>
          <text x={sx(0.62)} y={sy(0.1)} fontSize="9" fontFamily="var(--font-dossier)" fontStyle="italic" fill="var(--color-map-line)" opacity="0.75">
            Despotism
          </text>

          {/* the traced path and your dot */}
          {trail.length > 1 && (
            <path
              d={'M' + trail.map((p, i) => wob(sx(p.x), sy(p.y), i)).join(' L')}
              fill="none"
              stroke="var(--color-dossier-warn)"
              strokeWidth="1"
              opacity="0.65"
            />
          )}
          {dot && (
            <g>
              <circle cx={sx(dot.x)} cy={sy(dot.y)} r="4" fill="var(--color-dossier-warn)" opacity="0.9" />
              <circle cx={sx(dot.x)} cy={sy(dot.y)} r="7" fill="none" stroke="var(--color-dossier-warn)" strokeWidth="0.8" opacity="0.5" />
            </g>
          )}
        </svg>
    </WallTile>
  )
}
