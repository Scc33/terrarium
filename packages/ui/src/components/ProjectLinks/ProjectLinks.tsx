/** Stable routes back to the public project. Kept in one component because the
 * posting room and the records office both expose them: the first is the front
 * door, while the second remains reachable once a run has started. */

export const REPOSITORY_URL = 'https://github.com/Scc33/terrarium'
export const NEW_ISSUE_URL = `${REPOSITORY_URL}/issues/new`

const surfaces = {
  felt: 'border-dossier-paper/30 text-dossier-paper/75 hover:border-dossier-brass hover:bg-dossier-paper/5 hover:text-dossier-brass',
  paper: 'border-dossier-ink/25 text-dossier-ink/70 hover:border-dossier-ink hover:bg-dossier-ink hover:text-dossier-paper',
} as const

export function ProjectLinks({
  surface = 'felt',
  className = '',
}: {
  surface?: keyof typeof surfaces
  className?: string
}) {
  const linkClass = `inline-flex min-h-7 items-center border px-2 py-1 font-mono text-[9px] font-medium tracking-[0.14em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dossier-brass ${surfaces[surface]}`

  return (
    <nav aria-label="Terrarium project links" className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <a
        href={REPOSITORY_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View Terrarium source code on GitHub (opens in a new tab)"
        className={linkClass}
      >
        SOURCE CODE <span className="ml-1" aria-hidden="true">↗</span>
      </a>
      <a
        href={NEW_ISSUE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Report an issue on GitHub (opens in a new tab)"
        className={linkClass}
      >
        REPORT AN ISSUE <span className="ml-1" aria-hidden="true">↗</span>
      </a>
    </nav>
  )
}
