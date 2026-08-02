import { useId, useRef, type ReactNode } from 'react'
import { Button } from '../Button/Button'
import { useFocusTrap } from '../useFocusTrap'

export type ModalSize = 'standard' | 'wide' | 'full'

const widths: Record<ModalSize, string> = {
  standard: 'w-[600px]',
  wide: 'w-[920px]',
  full: 'w-[1200px]',
}

export function Modal({ title, onClose, children, size = 'standard' }: { title: string; onClose: () => void; children: ReactNode; size?: ModalSize }) {
  const titleId = useId()
  const dialogRef = useRef<HTMLElement>(null)
  useFocusTrap({ active: true, containerRef: dialogRef, initialFocusSelector: '[aria-label="Close dialog"]', onEscape: onClose })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090b09]/78 p-3 backdrop-blur-[1px] sm:p-6" onMouseDown={onClose}>
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative flex max-h-full max-w-full flex-col border border-dossier-brass bg-dossier-paper shadow-[10px_12px_0_rgba(0,0,0,0.3)] ${widths[size]}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="h-1 shrink-0 bg-dossier-brass" aria-hidden="true" />
        <header className="flex min-h-11 items-center justify-between gap-4 border-b border-dossier-ink/20 px-4 py-2">
          <h1 id={titleId} className="font-mono text-[10px] font-semibold tracking-[0.24em] text-dossier-ink">{title}</h1>
          <Button onClick={onClose} variant="quiet" size="compact" title="Close (Esc)" aria-label="Close dialog">CLOSE <span aria-hidden="true">×</span></Button>
        </header>
        <div className="min-h-0 overflow-y-auto p-4 sm:p-5">{children}</div>
      </section>
    </div>
  )
}
