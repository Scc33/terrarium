/**
 * The war room, on one screen: header letterhead, the instrument wall with
 * the corridor docked, the control rail, and the wire along the bottom.
 * No page scroll — the game is played, not read.
 */

import { useEffect } from 'react'
import { useGame } from './store/gameStore'
import { HeaderBar } from './panels/HeaderBar'
import { Instruments } from './panels/Instruments'
import { ControlRail } from './panels/ControlRail'
import { NewsWire } from './panels/NewsWire'

export default function App() {
  const { published, newGame, loadAutosave } = useGame()

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
      <HeaderBar pub={published} />
      <div className="grid min-h-0 min-w-0 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px] lg:overflow-hidden">
        <main className="min-h-0 min-w-0 lg:overflow-hidden">
          <Instruments pub={published} />
        </main>
        <ControlRail pub={published} />
      </div>
      <NewsWire pub={published} />
    </div>
  )
}
