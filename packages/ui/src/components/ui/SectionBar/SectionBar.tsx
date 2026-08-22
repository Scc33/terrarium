import type { ReactNode } from 'react'
import { TooltipLabel } from '../Tooltip/Tooltip'

export interface SectionBarProps {
  title: string
  detail?: ReactNode
  aside?: ReactNode
  inverted?: boolean
  hint?: ReactNode
}

/** A compact label rail for dense work surfaces such as boards and racks. */
export function SectionBar({ title, detail, aside, inverted = false, hint }: SectionBarProps) {
  return (
    <div
      className={`flex h-5 min-w-0 items-center gap-2 border-y px-2 font-mono ${
        inverted
          ? 'border-dossier-brass/25 bg-[#1d3027] text-dossier-paper'
          : 'border-dossier-ink/15 bg-dossier-paper text-dossier-ink'
      }`}
    >
      {hint ? (
        <TooltipLabel
          label={title}
          content={hint}
          className={`shrink-0 text-[8px] font-semibold tracking-[0.22em] ${inverted ? 'text-dossier-brass' : ''}`}
        >
          {title}
        </TooltipLabel>
      ) : (
        <span className={`shrink-0 text-[8px] font-semibold tracking-[0.22em] ${inverted ? 'text-dossier-brass' : ''}`}>
          {title}
        </span>
      )}
      {detail && <span className="min-w-0 flex-1 truncate text-[8px] tracking-[0.08em] opacity-50">{detail}</span>}
      {aside && <span className="shrink-0 text-[8px] tracking-[0.1em] opacity-65">{aside}</span>}
    </div>
  )
}
