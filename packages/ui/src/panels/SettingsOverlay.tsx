/** Records office: saves in, saves out, and the drastic drawer. */

import { useRef } from 'react'
import type { SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { Overlay } from '../components/Overlay'
import { useGame } from '../store/gameStore'

export function SettingsOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const { save, loadSave, newGame } = useGame()
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

  const btn =
    'w-full border border-dossier-ink/30 px-3 py-2 text-left font-mono text-[11px] tracking-[0.15em] text-dossier-ink hover:border-dossier-ink hover:bg-dossier-ink hover:text-dossier-paper'

  return (
    <Overlay title="RECORDS OFFICE" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <button className={btn} onClick={exportSave} title="Download this game as a JSON file — it is just the seed and your decisions, and replays exactly.">
          EXPORT SAVE — seed + decision log, a few KB, perfectly replayable
        </button>
        <button className={btn} onClick={() => fileInput.current?.click()} title="Load a previously exported save file.">
          IMPORT SAVE — resume a filed game
        </button>
        <button
          className={btn}
          onClick={() => {
            newGame()
            onClose()
          }}
          title="Abandon this country and draw a fresh one. The current game is overwritten on the next autosave."
        >
          NEW COUNTRY — abandon {pub.country} and draw another
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f)
              void f.text().then((text) => {
                loadSave(JSON.parse(text) as SaveFile)
                onClose()
              })
            e.target.value = ''
          }}
        />
        <div className="mt-2 font-dossier text-[11px] italic leading-relaxed text-dossier-ink/60">
          Autosave runs every quarter. A save file is a bug report: if something looks wrong,
          export and send it with a note about which quarter to look at.
        </div>
      </div>
    </Overlay>
  )
}
