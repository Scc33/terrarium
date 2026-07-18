import { create } from 'zustand'
import type { Action, SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import type { ClientMessage, WorkerMessage } from '../worker/protocol'
import SimWorker from '../worker/sim.worker?worker'
import { dbGet, dbPut } from './db'

const AUTOSAVE_KEY = 'autosave'

interface GameState {
  published: PublishedState | null
  save: SaveFile | null
  /** dial changes staged for this quarter, keyed by a stable action key */
  staged: Map<string, Action>
  stagedCost: number | null
  stagedAffordable: boolean
  rejection: string | null
  advancing: boolean

  newGame(seed?: string): void
  loadSave(save: SaveFile): void
  loadAutosave(): Promise<boolean>
  stage(key: string, action: Action | null): void
  clearStaged(): void
  advance(): void
}

/** one staged change per dial, one staged program per capacity target */
function actionKey(a: Action): string {
  return a.kind === 'setDial' ? `dial:${a.path}` : `cap:${a.target}`
}

export const useGame = create<GameState>((set, get) => {
  const worker = new SimWorker()

  worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
    const msg = ev.data
    switch (msg.type) {
      case 'published':
        set({ published: msg.published, save: msg.save, advancing: false, rejection: null })
        void dbPut(AUTOSAVE_KEY, msg.save)
        break
      case 'preview':
        set({ stagedCost: msg.affordable ? msg.cost : null, stagedAffordable: msg.affordable })
        break
      case 'rejected':
        set({ published: msg.published, rejection: msg.message, advancing: false, staged: new Map(), stagedCost: null })
        break
      case 'error':
        console.error('sim worker error:', msg.message)
        set({ rejection: msg.message, advancing: false })
        break
    }
  }

  const send = (m: ClientMessage) => worker.postMessage(m)

  const refreshPreview = () => {
    const actions = [...get().staged.values()]
    if (actions.length === 0) {
      set({ stagedCost: null, stagedAffordable: true })
    } else {
      send({ type: 'previewCost', actions })
    }
  }

  return {
    published: null,
    save: null,
    staged: new Map(),
    stagedCost: null,
    stagedAffordable: true,
    rejection: null,
    advancing: false,

    newGame(seed) {
      const s = seed ?? `game-${Date.now().toString(36)}`
      set({ staged: new Map(), stagedCost: null, rejection: null })
      send({ type: 'new', seed: s })
    },

    loadSave(save) {
      set({ staged: new Map(), stagedCost: null, rejection: null })
      send({ type: 'load', save })
    },

    async loadAutosave() {
      const save = await dbGet<SaveFile>(AUTOSAVE_KEY)
      if (!save) return false
      get().loadSave(save)
      return true
    },

    stage(key, action) {
      const staged = new Map(get().staged)
      if (action === null) staged.delete(key)
      else staged.set(key, action)
      set({ staged })
      refreshPreview()
    },

    clearStaged() {
      set({ staged: new Map(), stagedCost: null, stagedAffordable: true })
    },

    advance() {
      const actions = [...get().staged.values()]
      set({ advancing: true, staged: new Map(), stagedCost: null })
      send({ type: 'advance', actions })
    },
  }
})

export { actionKey }
