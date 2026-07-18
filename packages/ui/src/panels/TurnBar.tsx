/** Advance the quarter; export and import saves (a save is seed + action log). */

import { useRef } from 'react'
import type { SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { useGame } from '../store/gameStore'

export function TurnBar({ pub }: { pub: PublishedState }) {
  const { advance, advancing, staged, clearStaged, rejection, save, loadSave, newGame } = useGame()
  const fileInput = useRef<HTMLInputElement>(null)

  const exportSave = () => {
    if (!save) return
    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `terrarium-${pub.country.toLowerCase()}-q${pub.tick}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSave = (file: File) => {
    void file.text().then((text) => {
      loadSave(JSON.parse(text) as SaveFile)
    })
  }

  return (
    <section className="panel" style={{ textAlign: 'center' }}>
      {rejection && (
        <div className="fine" style={{ color: 'var(--alarm)', opacity: 1, marginBottom: 12 }}>
          {rejection}
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, alignItems: 'center' }}>
        <button className="primary" onClick={advance} disabled={advancing}>
          {advancing ? 'The quarter turns…' : 'Advance the quarter'}
        </button>
        {staged.size > 0 && <button onClick={clearStaged}>Discard staged</button>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 16 }}>
        <button onClick={exportSave}>Export save</button>
        <button onClick={() => fileInput.current?.click()}>Import save</button>
        <button onClick={() => newGame()}>New country</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importSave(f)
            e.target.value = ''
          }}
        />
      </div>
      {!pub.inPower && (
        <div className="fine" style={{ marginTop: 14 }}>
          The government has fallen. The economy carries on without you — advance to watch, or
          start a new country.
        </div>
      )}
    </section>
  )
}
