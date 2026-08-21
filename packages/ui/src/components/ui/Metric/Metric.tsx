import type { HTMLAttributes } from 'react'
import { TooltipLabel } from '../Tooltip/Tooltip'

export type MetricTone = 'default' | 'muted' | 'accent' | 'danger' | 'terminal'

const tones: Record<MetricTone, string> = {
  default: 'text-dossier-ink',
  muted: 'text-dossier-ink/60',
  accent: 'text-dossier-brass',
  danger: 'text-dossier-warn',
  terminal: 'text-terminal-primary',
}

export interface MetricProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string
  detail?: string
  tone?: MetricTone
  inverted?: boolean
  compact?: boolean
}

export function Metric({ label, value, detail, tone = 'default', inverted = false, compact = false, className = '', title, ...props }: MetricProps) {
  const valueTone = inverted && tone === 'default' ? 'text-dossier-paper' : tones[tone]
  const labelClass = `font-mono text-[9px] tracking-[0.16em] ${inverted ? 'text-dossier-paper/62' : 'text-dossier-ink/60'}`
  return (
    <div className={`min-w-0 ${compact ? 'flex shrink-0 items-baseline gap-1.5' : 'flex flex-col gap-0.5'} ${className}`} {...props}>
      {title
        ? <TooltipLabel label={label} content={title} className={labelClass}>{label}</TooltipLabel>
        : <span className={labelClass}>{label}</span>}
      <span className={`whitespace-nowrap font-mono font-semibold tabular-nums ${compact ? 'text-[12px]' : 'text-base'} ${valueTone}`}>{value}</span>
      {detail && <span className={`font-mono text-[8px] ${inverted ? 'text-dossier-paper/55' : 'text-dossier-ink/50'}`}>{detail}</span>}
    </div>
  )
}
