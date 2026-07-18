/** Ministry paperwork on top of the war room: a modal in the dossier
 * register. ESC or the scrim closes it. */

import { useEffect, type ReactNode } from 'react'

export function Overlay({
  title,
  onClose,
  children,
  wide,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-dossier-ink/70 p-6"
      onClick={onClose}
    >
      <div
        className={`flex max-h-full ${wide ? 'w-[860px]' : 'w-[560px]'} max-w-full flex-col border-2 border-dossier-brass bg-dossier-paper`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-dossier-ink/20 px-4 py-2">
          <span className="font-mono text-[10px] font-medium tracking-[0.25em] text-dossier-ink">
            {title}
          </span>
          <button
            onClick={onClose}
            title="Close (Esc)"
            className="font-mono text-[10px] tracking-[0.2em] text-dossier-ink/60 hover:text-dossier-warn"
          >
            CLOSE ✕
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  )
}
