import type { ReactNode } from 'react'

export function SectionHeading({ children, aside, inverted = false }: { children: ReactNode; aside?: ReactNode; inverted?: boolean }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <h2 className={`shrink-0 font-mono text-[9px] font-semibold tracking-[0.24em] ${inverted ? 'text-dossier-brass' : 'text-dossier-ink/65'}`}>
        {children}
      </h2>
      <span className={`h-px flex-1 ${inverted ? 'bg-dossier-brass/25' : 'bg-dossier-ink/15'}`} aria-hidden="true" />
      {aside && <span className={`shrink-0 font-mono text-[9px] ${inverted ? 'text-dossier-paper/50' : 'text-dossier-ink/50'}`}>{aside}</span>}
    </div>
  )
}
