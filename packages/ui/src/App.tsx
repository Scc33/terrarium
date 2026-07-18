import { useEffect } from 'react'
import { useGame } from './store/gameStore'
import { Masthead } from './panels/Masthead'
import { Instruments } from './panels/Instruments'
import { Treasury } from './panels/Treasury'
import { PolicyDrawer } from './panels/PolicyDrawer'
import { Capacity } from './panels/Capacity'
import { News } from './panels/News'
import { TurnBar } from './panels/TurnBar'

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
      <div style={{ textAlign: 'center', paddingTop: 120 }}>
        <div className="eyebrow">Ministry of National Economy</div>
        <div style={{ fontFamily: 'var(--script)', fontSize: 56, marginTop: 18 }}>Terrarium</div>
        <div className="fine" style={{ marginTop: 12 }}>drawing the first survey…</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', paddingBottom: 60 }}>
      <Masthead pub={published} />
      <div className="flourish" style={{ margin: '4px 0 10px' }}>
        <span className="dot" style={{ background: 'var(--alarm)' }} />
        <span className="dot" style={{ background: 'var(--steel)' }} />
        <span className="dot" style={{ background: 'var(--alarm)' }} />
      </div>
      <Instruments pub={published} />
      <Treasury pub={published} />
      <PolicyDrawer pub={published} />
      <Capacity pub={published} />
      <News pub={published} />
      <TurnBar pub={published} />
      <footer
        style={{
          background: 'var(--ink)',
          color: 'var(--paper)',
          textAlign: 'center',
          padding: '22px 20px',
          marginTop: 30,
        }}
      >
        <span className="label-caps" style={{ opacity: 0.6 }}>
          Terrarium · the numbers are late, noisy, and will be revised
        </span>
      </footer>
    </div>
  )
}
