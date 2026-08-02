import type { ReactNode } from 'react'

export function EmptyState({ title, requirement, children, compact = false }: { title: string; requirement?: string; children?: ReactNode; compact?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center border border-dossier-ink/20 bg-[linear-gradient(145deg,#c7a873,var(--color-dossier-brass))] px-5 text-center ${compact ? 'min-h-24 py-4' : 'min-h-36 py-7'}`}>
      <div className="font-mono text-[10px] font-semibold tracking-[0.2em] text-dossier-ink">{title}</div>
      {requirement && <div className="mt-1 font-mono text-[9px] tracking-[0.15em] text-dossier-ink/65">REQUIRES: {requirement}</div>}
      {children && <div className="mt-2 max-w-sm font-dossier text-[11px] italic leading-snug text-dossier-ink/65">{children}</div>}
    </div>
  )
}
