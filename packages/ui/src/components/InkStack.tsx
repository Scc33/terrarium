/**
 * The same shares, over the whole century: a stacked band chart in ink on
 * paper. The pie beside it answers "what is the mix now"; this answers "what
 * did the mix do when I moved the dial", which is the question a headline
 * total can never answer.
 *
 * `share` mode normalizes every quarter to its own total — the only way to
 * read composition across a century in which the totals grow tenfold.
 * Geometry lives in `../shares`; this file paints.
 */

import { stackPlot, thin, type Share, type StackRow } from '../shares'

interface Props {
  rows: readonly StackRow[]
  /** draw order, and the colour pinned to each category */
  keys: readonly Share[]
  mode: 'money' | 'share'
  /** the quarter to mark — the one the pie beside this is showing */
  markTick?: number
  height?: number
  format?: (value: number) => string
}

const W = 560
const yearOf = (q: number) => 1946 + Math.floor(q / 4)

export function InkStack({ rows, keys, mode, markTick, height = 150, format = (v) => v.toFixed(0) }: Props) {
  const box = { w: W, h: height, padL: 30, padR: 6, padT: 6, padB: 14 }
  const plot = stackPlot(thin(rows, W / 2), keys, box, mode)

  if (plot.bands.length === 0) {
    return (
      <div
        className="flex items-center justify-center border border-dossier-ink/25 font-mono text-[9px] tracking-[0.2em] text-dossier-ink/45"
        style={{ height }}
      >
        THE RECORD IS ONE QUARTER OLD
      </div>
    )
  }

  const ticks = mode === 'share' ? [0, 0.25, 0.5, 0.75, 1] : [0, plot.yMax / 2, plot.yMax]
  const label = (v: number) => (mode === 'share' ? `${(100 * v).toFixed(0)}%` : format(v))

  // width-governed like every other chart in the dossier register: the viewBox
  // sets the proportions, the container sets the size. Stretching to a fixed
  // pixel height instead would shear the axis labels.
  return (
    <svg viewBox={`0 0 ${W} ${height}`} className="block w-full">
      {plot.bands.map((b) => (
        <path key={b.key} d={b.path} fill={b.ink} opacity="0.9" />
      ))}
      {/* the rules sit ON TOP of the bands — a gridline hidden under the ink
          it is there to measure is decoration */}
      {ticks.map((v) => (
        <g key={v}>
          <line
            x1={box.padL}
            x2={W - box.padR}
            y1={plot.sy(v)}
            y2={plot.sy(v)}
            stroke="var(--color-dossier-paper)"
            strokeWidth="0.5"
            opacity="0.45"
          />
          <text
            x={box.padL - 3}
            y={plot.sy(v) + 3}
            textAnchor="end"
            fontSize="7.5"
            fontFamily="var(--font-mono)"
            fill="var(--color-dossier-ink)"
            opacity="0.6"
          >
            {label(v)}
          </text>
        </g>
      ))}
      {markTick !== undefined && (
        <line
          x1={plot.sx(markTick)}
          x2={plot.sx(markTick)}
          y1={box.padT}
          y2={height - box.padB}
          stroke="var(--color-dossier-brass)"
          strokeWidth="1"
          strokeDasharray="2 2"
        />
      )}
      <line
        x1={box.padL}
        x2={W - box.padR}
        y1={height - box.padB}
        y2={height - box.padB}
        stroke="var(--color-dossier-ink)"
        strokeWidth="0.7"
        opacity="0.35"
      />
      <text x={box.padL} y={height - 3.5} fontSize="7.5" fontFamily="var(--font-mono)" fill="var(--color-dossier-ink)" opacity="0.55">
        {yearOf(plot.x0)}
      </text>
      <text
        x={W - box.padR}
        y={height - 3.5}
        textAnchor="end"
        fontSize="7.5"
        fontFamily="var(--font-mono)"
        fill="var(--color-dossier-ink)"
        opacity="0.55"
      >
        {yearOf(plot.x1)}
      </text>
    </svg>
  )
}
