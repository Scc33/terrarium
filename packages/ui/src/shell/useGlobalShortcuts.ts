/**
 * The keys that work anywhere in the war room. A century is four hundred
 * quarters; making the player travel to a button four hundred times is a tax on
 * the only verb the game has. Space advances, Escape closes whatever paperwork
 * is on the desk, and backtick opens the maintenance hatch.
 *
 * The dev console's open/closed state lives here because backtick is the only
 * way in — the hatch IS a keyboard shortcut.
 */

import { useCallback, useEffect, useState } from 'react'
import { useGame } from '../store/gameStore'

export function useGlobalShortcuts({
  overlay,
  tourStep,
  onCloseOverlay,
}: {
  /** whatever paperwork is on the desk; `null` is a clear desk, which is the
   * only state in which Space belongs to the quarter */
  overlay: string | null
  tourStep: number | null
  onCloseOverlay: () => void
}) {
  const [devOpen, setDevOpen] = useState(false)
  const closeDevConsole = useCallback(() => setDevOpen(false), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      if (e.key === 'Escape') {
        onCloseOverlay()
        return
      }
      // backtick opens the maintenance hatch. Dev builds only — in production
      // `__DEV_TOOLS__` is a literal false and this branch is dropped.
      if (__DEV_TOOLS__ && e.key === '`') {
        e.preventDefault()
        setDevOpen((o) => !o)
        return
      }
      // the tour keeps its own focus on NEXT, so Space belongs to that button
      // rather than to the quarter. Returning BEFORE preventDefault is the
      // whole point: swallowing the key here left the tour advancing on Enter
      // only, with Space doing nothing at all.
      if (tourStep !== null) return
      if (e.code === 'Space' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const s = useGame.getState()
        if (overlay === null && !devOpen && !s.advancing && s.published?.inPower) s.advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay, devOpen, tourStep, onCloseOverlay])

  return { devOpen, closeDevConsole }
}
