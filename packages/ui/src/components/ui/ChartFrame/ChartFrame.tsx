import type { ReactNode } from 'react'

export interface ChartLegendItem {
  label: string
  color: string
  dashed?: boolean
}

export interface ChartFrameProps {
  title: string
  detail?: string
  value?: ReactNode
  legend?: readonly ChartLegendItem[]
  summary: string
  tone?: 'paper' | 'map'
  children: ReactNode
  className?: string
  bodyClassName?: string
}

/** Shared anatomy for every analytical figure: title and unit, current value,
 * legend, plot region, and a textual reading for assistive technology. */
export function ChartFrame({
  title,
  detail,
  value,
  legend = [],
  summary,
  tone = 'paper',
  children,
  className = '',
  bodyClassName = '',
}: ChartFrameProps) {
  const skin = tone === 'map'
    ? 'border-map-line/45 bg-map-field text-map-line'
    : 'border-dossier-ink/25 bg-dossier-paper text-dossier-ink'

  return (
    <figure className={`min-w-0 border ${skin} ${className}`}>
      <figcaption className="flex min-h-9 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-current/15 px-3 py-1.5">
        <div className="min-w-0">
          <div className="truncate font-mono text-[9px] font-semibold tracking-[0.2em]">{title}</div>
          {detail && <div className="mt-0.5 font-mono text-[8px] tracking-[0.1em] opacity-55">{detail}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {legend.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1" aria-label="Chart legend">
              {legend.map((item) => (
                <span key={item.label} className="flex items-center gap-1 font-mono text-[8px] tracking-[0.08em] opacity-75">
                  <span
                    className={`block w-3 border-t-2 ${item.dashed ? 'border-dashed' : ''}`}
                    style={{ borderColor: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
              ))}
            </div>
          )}
          {value && <div className="font-mono text-[11px] font-semibold tabular-nums">{value}</div>}
        </div>
      </figcaption>
      <div className={bodyClassName} role="img" aria-label={summary}>{children}</div>
      <p className="sr-only">{summary}</p>
    </figure>
  )
}
