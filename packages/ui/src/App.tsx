/**
 * The war room, on one screen: header letterhead, the instrument wall with
 * the ledger and corridor docked, the control rail, and the wire along the
 * bottom. Overlays are ministry paperwork on top — the ledger's full books,
 * the wire's spike, the study, the records office.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useGame } from './store/gameStore'
import { HeaderBar } from './panels/HeaderBar'
import { Instruments } from './panels/Instruments'
import { ControlRail } from './panels/ControlRail'
import { NewsWire } from './panels/NewsWire'
import { LedgerOverlay } from './panels/LedgerOverlay'
import { WireOverlay } from './panels/WireOverlay'
import { StudyOverlay } from './panels/StudyOverlay'
import { SettingsOverlay } from './panels/SettingsOverlay'
import { ReportCardOverlay } from './panels/ReportCardOverlay'
import { CensusOverlay } from './panels/CensusOverlay'
import { FinanceOverlay } from './panels/FinanceOverlay'
import { ElectionOverlay } from './panels/ElectionOverlay'
import { ElectionResultOverlay } from './panels/ElectionResultOverlay'
import { Button, useFocusTrap } from './components/ui'
import type { CabinetGroup } from './cabinetNavigation'

type OverlayKind =
  | 'ledger'
  | 'wire'
  | 'study'
  | 'settings'
  | 'verdict'
  | 'census'
  | 'finance'
  | 'election'
  | 'count'
  | null

export default function App() {
  const { published, newGame, loadAutosave } = useGame()
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  const [cabinetOpen, setCabinetOpen] = useState(false)
  const [cabinetGroup, setCabinetGroup] = useState<CabinetGroup>('TAXATION')
  const [cabinetFocusRequest, setCabinetFocusRequest] = useState(0)
  const cabinetDrawerRef = useRef<HTMLDivElement>(null)
  const cabinetReturnFocusRef = useRef<HTMLElement>(null)
  const hadCard = useRef(false)
  const lastCampaignSeen = useRef<number | null>(null)
  const lastCountSeen = useRef<number | null>(null)
  const closeCabinet = useCallback(() => setCabinetOpen(false), [])

  useFocusTrap({
    active: cabinetOpen,
    containerRef: cabinetDrawerRef,
    initialFocusSelector: '[role="tab"][aria-selected="true"]',
    onEscape: closeCabinet,
    restoreFocusRef: cabinetReturnFocusRef,
  })

  useEffect(() => {
    const visualSeed = import.meta.env.DEV ? new URLSearchParams(window.location.search).get('seed') : null
    if (visualSeed) {
      newGame(visualSeed)
      return
    }
    void loadAutosave().then((found) => {
      if (!found) newGame()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // a century is four hundred quarters; making the player travel to a button
  // four hundred times is a tax on the only verb the game has. Space advances,
  // Escape closes whatever paperwork is on the desk.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
      if (e.key === 'Escape') {
        setOverlay(null)
        return
      }
      if (e.code === 'Space' && !e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault()
        const s = useGame.getState()
        if (overlay === null && !s.advancing && s.published?.inPower) s.advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [overlay])

  // the verdict presents itself exactly once, when the run ends
  useEffect(() => {
    const has = published?.reportCard !== undefined
    if (has && !hadCard.current) setOverlay('verdict')
    hadCard.current = has
  }, [published])

  // §3.1 the election is a scene, so it comes to the player rather than
  // waiting to be found: the campaign opens itself the quarter it becomes
  // available, and the count presents itself once when the votes are in.
  // Each fires once per election — reopening on every advance would make the
  // campaign a nag rather than a moment.
  useEffect(() => {
    if (!published) return
    // keyed on the quarter the vote HAPPENS, not on the countdown, so the
    // campaign opens once per election rather than once per advance
    const c = published.campaign
    const voteAt = c ? published.tick + c.quartersToElection : null
    if (voteAt !== null && lastCampaignSeen.current !== voteAt) {
      lastCampaignSeen.current = voteAt
      setOverlay('election')
      return
    }
    // the verdict outranks the count when a lost election ends the run
    const r = published.lastElection
    if (r && lastCountSeen.current !== r.tick && published.reportCard === undefined) {
      lastCountSeen.current = r.tick
      setOverlay('count')
    }
  }, [published])

  if (!published) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-dossier-felt">
        <div className="font-mono text-[10px] tracking-[0.4em] text-dossier-brass">MINISTRY OF NATIONAL ECONOMY</div>
        <div className="font-dossier text-3xl font-semibold text-dossier-paper">Terrarium</div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-dossier-paper/50">DRAWING THE FIRST SURVEY…</div>
      </div>
    )
  }

  const openCabinet = (group?: CabinetGroup) => {
    if (group) setCabinetGroup(group)
    if (!window.matchMedia('(min-width: 1280px)').matches) {
      cabinetReturnFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      setCabinetOpen(true)
    }
    setCabinetFocusRequest((request) => request + 1)
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] bg-[#22382d]">
      <HeaderBar
        pub={published}
        onStudy={() => setOverlay('study')}
        onSettings={() => setOverlay('settings')}
        onCensus={() => setOverlay('census')}
        onFinance={() => setOverlay('finance')}
        onVerdict={published.reportCard ? () => setOverlay('verdict') : undefined}
      />
      <div className="relative grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_384px] xl:overflow-hidden">
        <main className="min-h-[700px] min-w-0 xl:min-h-0 xl:overflow-hidden">
          <Instruments pub={published} onLedger={() => setOverlay('ledger')} onOpenCapacity={() => openCabinet('STATE CAPACITY')} />
        </main>
        {cabinetOpen && (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-[#090b09]/70 xl:hidden"
            aria-label="Close cabinet"
            onClick={closeCabinet}
          />
        )}
        <div
          ref={cabinetDrawerRef}
          role={cabinetOpen ? 'dialog' : undefined}
          aria-modal={cabinetOpen ? 'true' : undefined}
          aria-label={cabinetOpen ? 'Cabinet drawer' : undefined}
          className={`${cabinetOpen ? 'fixed' : 'hidden'} inset-y-0 right-0 z-40 h-full min-h-0 w-full max-w-[430px] overflow-hidden shadow-[-12px_0_30px_rgba(0,0,0,0.35)] xl:static xl:z-auto xl:block xl:max-w-none xl:shadow-none`}
        >
          <ControlRail
            pub={published}
            openGroup={cabinetGroup}
            onOpenGroupChange={setCabinetGroup}
            focusRequest={cabinetFocusRequest}
            onClose={cabinetOpen ? closeCabinet : undefined}
          />
        </div>
        <Button
          variant="primary"
          className="fixed bottom-10 right-3 z-20 gap-2 shadow-[4px_5px_0_rgba(0,0,0,0.28)] xl:hidden"
          onClick={() => openCabinet()}
          aria-expanded={cabinetOpen}
          aria-controls="cabinet-controls"
        >
          OPEN CABINET <span className="border-l border-dossier-ink/25 pl-2">{published.politicalCapital.toFixed(0)} PC</span>
        </Button>
      </div>
      <NewsWire pub={published} onOpen={() => setOverlay('wire')} />

      {overlay === 'ledger' && <LedgerOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'wire' && <WireOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'study' && <StudyOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'settings' && <SettingsOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'census' && <CensusOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'finance' && <FinanceOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'election' && <ElectionOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'count' && <ElectionResultOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'verdict' && published.reportCard && (
        <ReportCardOverlay pub={published} card={published.reportCard} onClose={() => setOverlay(null)} />
      )}
    </div>
  )
}
