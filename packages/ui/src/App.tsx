/**
 * The war room, on one screen: header letterhead, the instrument wall with
 * the ledger and corridor docked, the control rail, and the wire along the
 * bottom. Overlays are ministry paperwork on top — the ledger's full books,
 * the wire's spike, the study, the records office.
 */

import { useEffect, useState } from 'react'
import { useGame } from './store/gameStore'
import { HeaderBar } from './panels/HeaderBar'
import { Instruments } from './panels/Instruments'
import { ControlRail } from './panels/ControlRail'
import { NewsWire } from './panels/NewsWire'
import { LedgerOverlay } from './panels/LedgerPanel'
import { WireOverlay } from './panels/WireOverlay'
import { StudyOverlay } from './panels/StudyOverlay'
import { SettingsOverlay } from './panels/SettingsOverlay'

type OverlayKind = 'ledger' | 'wire' | 'study' | 'settings' | null

export default function App() {
  const { published, newGame, loadAutosave } = useGame()
  const [overlay, setOverlay] = useState<OverlayKind>(null)

  useEffect(() => {
    void loadAutosave().then((found) => {
      if (!found) newGame()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <HeaderBar pub={published} onStudy={() => setOverlay('study')} onSettings={() => setOverlay('settings')} />
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
    </div>
  )
}
