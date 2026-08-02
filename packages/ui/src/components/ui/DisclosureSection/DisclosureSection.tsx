import type { ReactNode } from 'react'

export function DisclosureSection({
  title,
  aside,
  open,
  onToggle,
  children,
}: {
  title: string
  aside?: ReactNode
  open: boolean
  onToggle: () => void
  children: ReactNode
}) {
  return (
    <section className="border-b border-dossier-paper/10 pb-2 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center gap-2 py-1 text-left focus-visible:outline-2 focus-visible:outline-dossier-brass"
        aria-expanded={open}
        onClick={onToggle}
      >
        <span className="font-mono text-[9px] text-dossier-brass" aria-hidden="true">{open ? '▾' : '▸'}</span>
        <h2 className="font-mono text-[9px] font-semibold tracking-[0.24em] text-dossier-brass">{title}</h2>
        <span className="h-px flex-1 bg-dossier-brass/20" aria-hidden="true" />
        {aside && <span className="shrink-0 font-mono text-[8px] tracking-[0.1em] text-dossier-paper/48">{aside}</span>}
      </button>
      {open && <div className="pt-1">{children}</div>}
    </section>
  )
}
