import { useEffect, type RefObject } from 'react'

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function focusableWithin(container: HTMLElement): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(FOCUSABLE)]
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true')
}

/** Keep keyboard focus inside a temporary surface and restore the invoking
 * control when it closes. Modal overlays and the responsive cabinet share
 * this contract so new paperwork cannot strand focus behind itself. */
export function useFocusTrap({
  active,
  containerRef,
  initialFocusSelector,
  onEscape,
  restoreFocusRef,
}: {
  active: boolean
  containerRef: RefObject<HTMLElement | null>
  initialFocusSelector?: string
  onEscape: () => void
  restoreFocusRef?: RefObject<HTMLElement | null>
}) {
  useEffect(() => {
    if (!active) return
    const container = containerRef.current
    if (!container) return
    const prior = restoreFocusRef?.current
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    const frame = requestAnimationFrame(() => {
      const preferred = initialFocusSelector
        ? container.querySelector<HTMLElement>(initialFocusSelector)
        : null
      const target = preferred ?? focusableWithin(container)[0]
      target?.focus()
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onEscape()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = focusableWithin(container)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      container.removeEventListener('keydown', onKeyDown)
      if (prior?.isConnected) prior.focus()
    }
  }, [active, containerRef, initialFocusSelector, onEscape, restoreFocusRef])
}
