/** Records office: saves in, saves out, the methodology, and the drastic drawer. */

import { useRef } from 'react'
import type { SaveFile } from '@terrarium/engine'
import { createHistoricalDataExport, type PublishedState } from '@terrarium/observation'
import { Button, Modal } from '../components/ui'
import { ProjectLinks } from '../components/ProjectLinks/ProjectLinks'
import { useGame } from '../store/gameStore'

export function SettingsOverlay({
  pub,
  onClose,
  onNewCountry,
  onMethodology,
}: {
  pub: PublishedState
  onClose: () => void
  onNewCountry: () => void
  /** #32: the methodology is a thing a player goes looking for in settings,
   * so it is reachable from here — it lives in the handbook rather than being
   * written a second time, because two accounts of how a print is made would
   * eventually disagree about the one that matters. */
  onMethodology: () => void
}) {
  const { save, loadSave } = useGame()
  const fileInput = useRef<HTMLInputElement>(null)

  const downloadJson = (value: unknown, filename: string) => {
    const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportSave = () => {
    if (!save) return
    downloadJson(save, `terrarium-${pub.country.toLowerCase()}-q${pub.tick}.json`)
  }

  const exportData = () => {
    if (!save) return
    const record = createHistoricalDataExport(pub, save)
    downloadJson(record, `terrarium-${pub.country.toLowerCase()}-q${pub.tick}-data.json`)
  }

  return (
    <Modal title="RECORDS OFFICE" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <Button fullWidth className="justify-start text-left" onClick={exportSave} title="Download this game as a JSON file — it is just the seed and your decisions, and replays exactly.">
          EXPORT SAVE — seed + decision log, a few KB, perfectly replayable
        </Button>
        <Button
          fullWidth
          className="justify-start text-left"
          onClick={exportData}
          title="Download every figure published to this government, including revisions, industry and household surveys, quarterly books, census, policy, events, and the current public record."
        >
          EXPORT DATA — complete published history for outside analysis
        </Button>
        <Button fullWidth className="justify-start text-left" onClick={() => fileInput.current?.click()} title="Load a previously exported save file.">
          IMPORT SAVE — resume a filed game
        </Button>
        <Button
          fullWidth
          className="justify-start text-left"
          onClick={onMethodology}
          title="How a published figure is made: the lag, the error band, the revision schedule, and what funding the statistical office actually buys."
        >
          METHODOLOGY — how the published figures are made
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
        <div className="mt-2 border-t border-dossier-ink/15 pt-3">
          <p className="font-dossier text-[11px] italic leading-relaxed text-dossier-ink/60">
            Autosave runs every quarter. A save file is a bug report: if something looks wrong,
            export it and attach it with a note about which quarter to inspect. The data file is
            a versioned JSON record of what this government could know — never the hidden state.
          </p>
          <ProjectLinks surface="paper" className="mt-2" />
        </div>
      </div>
    </Modal>
  )
}
