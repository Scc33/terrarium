/**
 * The cabinet's chrome — whether the drawer is open, whether the desktop rail
 * is collapsed, which drawer is showing, and where keyboard focus goes when any
 * of that changes. None of it belongs to a run: the collapse is a preference of
 * this BROWSER, kept beside the wall pins in localStorage.
 *
 * The focus handoff is the load-bearing part. Collapsing the cabinet unmounts
 * the button that was pressed, so without it a keyboard user is returned to
 * <body> and has to tab in from the top of the document again. Nothing in the
 * visual suite catches that — tab through the cabinet by hand.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useFocusTrap } from '../components/ui'
import type { CabinetGroup } from '../cabinetNavigation'
import { cabinetStartsCollapsed, rememberCabinetCollapsed } from '../layoutPreferences'

export function useCabinetChrome() {
  const [cabinetOpen, setCabinetOpen] = useState(false)
  /** A browser view preference, not a rule of the run. Below `xl` the cabinet
   * remains a drawer regardless; this only gives the desktop wall its width. */
  const [cabinetCollapsed, setCabinetCollapsed] = useState(cabinetStartsCollapsed)
  const [cabinetGroup, setCabinetGroup] = useState<CabinetGroup>('TAXATION')
  const [cabinetFocusRequest, setCabinetFocusRequest] = useState(0)
  const cabinetDrawerRef = useRef<HTMLDivElement>(null)
  const cabinetReturnFocusRef = useRef<HTMLElement>(null)
  const cabinetExpandRef = useRef<HTMLButtonElement>(null)
  const focusCollapsedCabinet = useRef(false)
  const closeCabinet = useCallback(() => setCabinetOpen(false), [])
  const setCabinetCollapsedPreference = useCallback((collapsed: boolean) => {
    setCabinetCollapsed(collapsed)
    rememberCabinetCollapsed(collapsed)
  }, [])
  const collapseCabinet = useCallback(() => {
    // The pressed button is about to leave the tree. Hand focus to the narrow
    // replacement rail so keyboard users do not fall back to <body>.
    focusCollapsedCabinet.current = true
    setCabinetCollapsedPreference(true)
  }, [setCabinetCollapsedPreference])

  useFocusTrap({
    active: cabinetOpen,
    containerRef: cabinetDrawerRef,
    initialFocusSelector: '[role="tab"][aria-selected="true"]',
    onEscape: closeCabinet,
    restoreFocusRef: cabinetReturnFocusRef,
  })

  useEffect(() => {
    if (!cabinetCollapsed || !focusCollapsedCabinet.current) return
    focusCollapsedCabinet.current = false
    cabinetExpandRef.current?.focus()
  }, [cabinetCollapsed])

  const openCabinet = useCallback((group?: CabinetGroup) => {
    if (group) setCabinetGroup(group)
    if (window.matchMedia('(min-width: 1280px)').matches) {
      // A route to a cabinet control is also an explicit request to see it.
      // The focusRequest lands on the chosen tab after the rail remounts.
      setCabinetCollapsedPreference(false)
    } else {
      cabinetReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      setCabinetOpen(true)
    }
    setCabinetFocusRequest((request) => request + 1)
  }, [setCabinetCollapsedPreference])

  return {
    cabinetOpen,
    cabinetCollapsed,
    cabinetGroup,
    setCabinetGroup,
    cabinetFocusRequest,
    cabinetDrawerRef,
    cabinetExpandRef,
    closeCabinet,
    collapseCabinet,
    openCabinet,
    setCabinetCollapsedPreference,
  }
}
