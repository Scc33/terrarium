/** Records office: saves in, saves out, and the drastic drawer. */

import { useRef } from 'react'
import type { SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { Button, Modal } from '../components/ui'
import { useGame } from '../store/gameStore'

export function SettingsOverlay({
  pub,
  onClose,
  onNewCountry,
}: {
  pub: PublishedState
  onClose: () => void
  onNewCountry: () => void
}) {
  const { save, loadSave } = useGame()
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

  return (
    <Modal title="RECORDS OFFICE" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <Button fullWidth className="justify-start text-left" onClick={exportSave} title="Download this game as a JSON file — it is just the seed and your decisions, and replays exactly.">
          EXPORT SAVE — seed + decision log, a few KB, perfectly replayable
        </Button>
        <Button fullWidth className="justify-start text-left" onClick={() => fileInput.current?.click()} title="Load a previously exported save file.">
          IMPORT SAVE — resume a filed game
        </Button>
        <Button
          fullWidth
          variant="danger"
          className="justify-start text-left"
          onClick={onNewCountry}
          title="Choose another posting. This run remains intact until a new country is confirmed."
        >
          NEW COUNTRY — choose another posting
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f)
              void f
                .text()
                .then((text) => loadSave(JSON.parse(text) as SaveFile))
                // a file that isn't JSON at all throws before `loadSave` can
                // refuse it by name, so it says so the same way `loadSave`
                // does — the rail shows `rejection`, and the run is untouched
                .catch(() => useGame.setState({ rejection: 'That file is not a Terrarium save.' }))
                .finally(() => onClose())
            e.target.value = ''
          }}
        />
        <div className="mt-2 font-dossier text-[11px] italic leading-relaxed text-dossier-ink/60">
          Autosave runs every quarter. A save file is a bug report: if something looks wrong,
          export and send it with a note about which quarter to look at.
        </div>
      </div>
    </Modal>
  )
}
