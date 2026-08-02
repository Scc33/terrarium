/**
 * A share of a whole, in ink on paper: a donut and the table that reads it.
 *
 * Exact data only — this is for the books a government keeps on itself, so
 * there is no error band, no revision stamp, no phosphor. Anything fogged
 * belongs on a gauge with its uncertainty showing.
 *
 * The geometry is `../shares`; this file is a painter. Reusable by design:
 * pass it any keyed values that sum to something meaningful (the budget's two
 * sides today, output by sector next).
 */

import type { ReactNode } from 'react'
import { donutSlices, type Share } from '../../../shares'

export interface DonutChartProps {
  shares: readonly Share[]
  /** how a value prints in the legend — the caller owns the unit */
  format: (value: number) => string
  size?: number
  /** an extra right-hand legend cell, per category */
  extra?: (share: Share) => ReactNode
  /** what to say when nothing sums to a positive total */
  emptyNote?: string
}

export function DonutChart({ shares, format, size = 112, extra, emptyNote = 'NOTHING BOOKED' }: DonutChartProps) {
  const r = size / 2 - 1
  const slices = donutSlices(shares, { cx: size / 2, cy: size / 2, r, ri: r * 0.52 })
  const total = slices.reduce((s, x) => s + x.value, 0)
  const shareOf = new Map(slices.map((s) => [s.key, s.share]))

  return (
    <div className="flex min-w-0 items-center gap-3">
      {slices.length > 0 ? (
        <svg
          viewBox={`0 0 ${size} ${size}`}
          preserveAspectRatio="xMidYMid meet"
          className="block shrink-0"
          style={{ width: size, height: size }}
        >
          {slices.map((s) => (
            <path key={s.key} d={s.path} fill={s.ink} fillRule="evenodd" stroke="var(--color-dossier-paper)" strokeWidth="0.8">
              <title>{`${s.label}: ${format(s.value)} (${(100 * s.share).toFixed(1)}%)`}</title>
            </path>
          ))}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-dossier-ink)" strokeWidth="0.6" opacity="0.35" />
          <text
            x={size / 2}
            y={size / 2 + 3.5}
            textAnchor="middle"
            fontSize="10.5"
            fontFamily="var(--font-mono)"
            fill="var(--color-dossier-ink)"
            className="tabular-nums"
          >
            {format(total)}
          </text>
        </svg>
      ) : (
        <div
          className="flex shrink-0 items-center justify-center border border-dashed border-dossier-ink/30 text-center font-mono text-[9px] leading-tight tracking-[0.15em] text-dossier-ink/50"
          style={{ width: size, height: size }}
        >
          {emptyNote}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        {shares.map((s) => (
          <div key={s.key} className="flex items-baseline gap-1.5 font-mono text-[10px] leading-none" title={s.note}>
            <span className="h-2 w-2 shrink-0 self-center" style={{ background: s.ink }} />
            <span className="min-w-0 flex-1 truncate text-dossier-ink/85">{s.label}</span>
            <span className="shrink-0 tabular-nums text-dossier-ink">{format(s.value)}</span>
            <span className="w-8 shrink-0 text-right tabular-nums text-dossier-ink/55">
              {total > 0 ? `${(100 * (shareOf.get(s.key) ?? 0)).toFixed(0)}%` : '—'}
            </span>
            {extra && <span className="w-10 shrink-0 text-right tabular-nums text-dossier-ink/55">{extra(s)}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
