import type { HTMLAttributes, ReactNode } from 'react'

export type PanelTone = 'paper' | 'felt' | 'terminal' | 'map' | 'wire'

const tones: Record<PanelTone, string> = {
  paper: 'border-dossier-ink/25 bg-dossier-paper text-dossier-ink',
  felt: 'border-dossier-brass/35 bg-dossier-felt text-dossier-paper',
  terminal: 'border-terminal-grid bg-terminal-bg text-terminal-primary',
  map: 'border-map-line/40 bg-map-field text-map-line',
  wire: 'border-wire-ink/30 bg-wire-paper text-wire-ink',
}

export interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  tone?: PanelTone
  title?: ReactNode
  actions?: ReactNode
  children: ReactNode
  as?: 'section' | 'div' | 'article'
  bodyClassName?: string
}

export function Panel({
  tone = 'paper',
  title,
  actions,
  children,
  as: Root = 'section',
  className = '',
  bodyClassName = '',
  ...props
}: PanelProps) {
  return (
    <Root className={`border ${tones[tone]} ${className}`} {...props}>
      {(title || actions) && (
        <div className="flex min-h-8 items-center justify-between gap-3 border-b border-current/15 px-3 py-1.5">
          <div className="min-w-0 truncate font-mono text-[9px] font-medium tracking-[0.22em] opacity-75">
            {title}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </Root>
  )
}
