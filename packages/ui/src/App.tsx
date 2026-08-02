/**
 * The war room, on one screen: header letterhead, the instrument wall with
 * the ledger and corridor docked, the control rail, and the wire along the
 * bottom. Overlays are ministry paperwork on top — the ledger's full books,
 * the wire's spike, the study, the records office.
 */

import { useEffect, useRef, useState } from 'react'
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

type OverlayKind = 'ledger' | 'wire' | 'study' | 'settings' | 'verdict' | 'census' | 'finance' | null

export default function App() {
  const { published, newGame, loadAutosave } = useGame()
  const [overlay, setOverlay] = useState<OverlayKind>(null)
  const hadCard = useRef(false)

  useEffect(() => {
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

  if (!published) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-dossier-felt">
        <div className="font-mono text-[10px] tracking-[0.4em] text-dossier-brass">MINISTRY OF NATIONAL ECONOMY</div>
        <div className="font-dossier text-3xl font-semibold text-dossier-paper">Terrarium</div>
        <div className="font-mono text-[10px] tracking-[0.2em] text-dossier-paper/50">DRAWING THE FIRST SURVEY…</div>
      </div>
    )
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr_auto] bg-dossier-felt">
      <HeaderBar
        pub={published}
        onStudy={() => setOverlay('study')}
        onSettings={() => setOverlay('settings')}
        onCensus={() => setOverlay('census')}
        onFinance={() => setOverlay('finance')}
        onVerdict={published.reportCard ? () => setOverlay('verdict') : undefined}
      />
      <div className="grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
        <main className="min-h-0 min-w-0 lg:overflow-hidden">
          <Instruments pub={published} onLedger={() => setOverlay('ledger')} />
        </main>
        <ControlRail pub={published} />
      </div>
      <NewsWire pub={published} onOpen={() => setOverlay('wire')} />

      {overlay === 'ledger' && <LedgerOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'wire' && <WireOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'study' && <StudyOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'settings' && <SettingsOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'census' && <CensusOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'finance' && <FinanceOverlay pub={published} onClose={() => setOverlay(null)} />}
      {overlay === 'verdict' && published.reportCard && (
        <ReportCardOverlay pub={published} card={published.reportCard} onClose={() => setOverlay(null)} />
      )}
    </div>
  )
}
