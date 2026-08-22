/**
 * The opening walkthrough (#33), as a card in the corner rather than a modal.
 *
 * A modal would be the easy build and the wrong one: every card here is about
 * a region of the war room, and a dialog in the middle of the screen hides the
 * thing it is describing. So the card is a small fixed panel that sits in a
 * corner, and the region it names is ringed by a rule in `index.css` keyed off
 * `data-tour-active` on `<body>` — declarative, spelled out per region, and
 * therefore safe from Tailwind's source-text scan, which would silently drop
 * a class name built from a variable. The body's attribute is deliberately
 * NOT called `data-tour`: sharing the name means `[data-tour="wall"]` matches
 * the body as well as the wall, and anything measuring the region gets the
 * whole document instead — which is exactly how the first version of this
 * measured its own card as covering the wall.
 *
 * The step list, the placement, and the "briefed" flag all live in
 * `../walkthrough`. This file only paints them.
 */

import { useEffect, useRef } from 'react'
import { Button } from '../components/ui'
import {
  WALKTHROUGH_STEPS,
  isLastStep,
  stepAt,
  type TourPlace,
} from '../walkthrough'

/**
 * Literal, never composed — see the module comment.
 *
 * `bottom-right` is where a card about the WALL goes, and it deliberately sits
 * over the cabinet rail: at desktop widths the wall fills everything the rail
 * does not, so there is no corner of the wall that is not the wall. Nudging
 * the card clear of the rail — which is what the first version did — put it
 * squarely on top of the instruments it was describing.
 */
const PLACES: Record<TourPlace, string> = {
  'top-left': 'left-3 top-16',
  'bottom-left': 'bottom-20 left-3',
  'bottom-right': 'bottom-20 right-3',
}

export function Walkthrough({
  index,
  onIndex,
  onClose,
  onHandbook,
}: {
  index: number
  onIndex: (next: number) => void
  /** finish or skip — both end the tour and mark this browser briefed */
  onClose: () => void
  /** the last card offers the manual, which is where the tour is going */
  onHandbook: () => void
}) {
  const step = stepAt(index)
  const advanceRef = useRef<HTMLButtonElement>(null)

  // the ring around the region this card is about. Written to <body> so the
  // rule can live in the stylesheet instead of in a per-render class name.
  useEffect(() => {
    if (step?.target) document.body.setAttribute('data-tour-active', step.target)
    else document.body.removeAttribute('data-tour-active')
    return () => document.body.removeAttribute('data-tour-active')
  }, [step?.target])

  useEffect(() => {
    advanceRef.current?.focus()
  }, [index])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [onClose])

  if (!step) return null
  const last = isLastStep(index)

  return (
    <aside
      role="dialog"
      aria-label="Introduction to the war room"
      className={`fixed z-50 w-[min(22rem,calc(100vw-1.5rem))] border border-dossier-brass bg-dossier-paper shadow-[8px_10px_0_rgba(0,0,0,0.32)] ${PLACES[step.place]}`}
    >
      <div className="h-1 bg-dossier-brass" aria-hidden="true" />
      <div className="flex items-baseline justify-between gap-2 border-b border-dossier-ink/15 px-3 py-1.5">
        <h2 className="font-mono text-[9px] font-semibold tracking-[0.2em] text-dossier-ink">{step.title}</h2>
        <span className="shrink-0 font-mono text-[8px] tabular-nums tracking-[0.16em] text-dossier-ink/45">
          {index + 1} / {WALKTHROUGH_STEPS.length}
        </span>
      </div>
      <div className="px-3 py-2">
        {step.body.map((paragraph) => (
          <p key={paragraph.slice(0, 40)} className="mb-2 font-dossier text-[12px] leading-relaxed text-dossier-ink/85">
            {paragraph}
          </p>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-dossier-ink/15 px-3 py-2">
        <Button variant="quiet" size="compact" onClick={onClose}>
          {last ? 'CLOSE' : 'SKIP'}
        </Button>
        <div className="flex gap-2">
          {index > 0 && (
            <Button variant="quiet" size="compact" onClick={() => onIndex(index - 1)}>
              BACK
            </Button>
          )}
          {last ? (
            <Button ref={advanceRef} variant="primary" size="compact" onClick={onHandbook}>
              OPEN THE HANDBOOK
            </Button>
          ) : (
            <Button ref={advanceRef} variant="primary" size="compact" onClick={() => onIndex(index + 1)}>
              NEXT
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
