import type { ReactNode } from 'react'

export function OverlayLayout({
  summary,
  toolbar,
  children,
  note,
  footer,
}: {
  summary?: ReactNode
  toolbar?: ReactNode
  children: ReactNode
  note?: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      {summary && <section aria-label="Summary" className="border-b border-dossier-ink/20 pb-3">{summary}</section>}
      {toolbar && <section aria-label="View controls" className="flex flex-wrap items-center justify-between gap-2">{toolbar}</section>}
      <section aria-label="Charts and records" className="min-w-0">{children}</section>
      {note && <aside aria-label="Reading note" className="border-l-2 border-dossier-brass bg-dossier-brass/8 px-3 py-2 font-dossier text-[12px] leading-relaxed text-dossier-ink/72">{note}</aside>}
      {footer && <footer className="border-t border-dossier-ink/15 pt-2 text-center font-mono text-[9px] tracking-[0.18em] text-dossier-ink/55">{footer}</footer>}
    </div>
  )
}
