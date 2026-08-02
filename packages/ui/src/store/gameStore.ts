import { create } from 'zustand'
import type { Action, SaveFile } from '@terrarium/engine'
import type { IndicatorId, PublishedState } from '@terrarium/observation'
import { INDICATOR_IDS } from '@terrarium/observation'
import type { ClientMessage, DevNode, WorkerMessage } from '../worker/protocol'
import SimWorker from '../worker/sim.worker?worker'
import { dbGet, dbPut } from './db'
import { BOARD_SLOTS, DEFAULT_PINS } from '../wallPlan'
import type { DevScenario } from '../devScenario'

const AUTOSAVE_KEY = 'autosave'
/** which dials are on the board is a view preference, not part of the run —
 * it belongs to the player and their screen, not to the save file, so it
 * lives beside the game rather than inside it */
const PINS_KEY = 'terrarium:pinned'

function loadPins(): IndicatorId[] {
  try {
    const raw = localStorage.getItem(PINS_KEY)
    if (!raw) return [...DEFAULT_PINS]
    const valid = new Set<string>(INDICATOR_IDS)
    // an old preference naming an indicator this build no longer has must
    // degrade to the defaults, never to a short board
    const pins = (JSON.parse(raw) as unknown[]).filter((id): id is IndicatorId => typeof id === 'string' && valid.has(id))
    return pins.length ? pins.slice(-BOARD_SLOTS) : [...DEFAULT_PINS]
  } catch {
    return [...DEFAULT_PINS]
  }
}

function savePins(pins: IndicatorId[]): void {
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify(pins))
  } catch {
    /* private browsing, quota — the board still works, it just won't persist */
  }
}

interface GameState {
  published: PublishedState | null
  save: SaveFile | null
  /** dial changes staged for this quarter, keyed by a stable action key */
  staged: Map<string, Action>
  stagedCost: number | null
  stagedAffordable: boolean
  rejection: string | null
  advancing: boolean
  /** traced positions on the Narrow Corridor (published data only) */
  corridorTrail: Array<{ x: number; y: number }>
  /** instruments the player has put on the board, oldest pin first */
  pinned: IndicatorId[]
  /** dev only: the last true-state snapshot the worker was asked for */
  devTruth: { tick: number; tree: DevNode[] } | null

  newGame(seed?: string): void
  loadSave(save: SaveFile): void
  loadAutosave(): Promise<boolean>
  stage(key: string, action: Action | null): void
  clearStaged(): void
  advance(): void
  togglePin(id: IndicatorId): void
  /** dev only: build a country from overrides and run it to a year */
  runScenario(scenario: DevScenario): void
  /** dev only: ask the worker what's actually true right now */
  inspectTruth(): void
}

/** one staged change per dial, one staged program per capacity target */
function actionKey(a: Action): string {
  return a.kind === 'setDial' ? `dial:${a.path}` : `cap:${a.target}`
}

export const useGame = create<GameState>((set, get) => {
  const worker = new SimWorker()

  // corridor coordinates from published/setup data only: the government
  // knows its own capacity stocks; societal power comes from the country's
  // enfranchisement setup (static until Layer 3 makes it move)
  const corridorPoint = (published: PublishedState, save: SaveFile) => {
    const caps = Object.values(published.capacity)
    const x = caps.reduce((a, b) => a + b, 0) / caps.length
    let people = 0
    let weight = 0
    for (const [cid, size] of Object.entries(save.params.cohortSizes)) {
      people += size
      weight += size * (save.params.enfranchisement[cid as keyof typeof save.params.enfranchisement] ?? 0)
    }
    return { x, y: people > 0 ? weight / people : 0.5 }
  }

  worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
    const msg = ev.data
    switch (msg.type) {
      case 'published': {
        const point = corridorPoint(msg.published, msg.save)
        const prevTrail = get().published && get().published!.tick < msg.published.tick ? get().corridorTrail : []
        set({
          published: msg.published,
          save: msg.save,
          advancing: false,
          rejection: null,
          corridorTrail: [...prevTrail, point].slice(-120),
        })
        void dbPut(AUTOSAVE_KEY, msg.save)
        break
      }
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
      default:
        if (__DEV_TOOLS__ && msg.type === 'dev:truth') {
          set({ devTruth: { tick: msg.tick, tree: msg.tree } })
        }
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
    corridorTrail: [],
    pinned: loadPins(),
    devTruth: null,

    /** Pin an instrument to the board, or take it off. The board holds
     * BOARD_SLOTS, so pinning a fifth evicts the oldest pin — the board is a
     * choice about what you are watching this decade, and choices cost. */
    togglePin(id) {
      const cur = get().pinned
      const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id].slice(-BOARD_SLOTS)
      savePins(next)
      set({ pinned: next })
    },

    newGame(seed) {
      // seed entropy comes from the browser, not the sim — the sim itself
      // never touches a clock or unseeded randomness
      const s = seed ?? `game-${crypto.randomUUID().slice(0, 8)}`
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

    // both guarded so a production build drops the bodies — the dev channel
    // should not merely be unreachable in production, it should not exist
    runScenario(scenario) {
      if (__DEV_TOOLS__) {
        set({ staged: new Map(), stagedCost: null, rejection: null, corridorTrail: [], devTruth: null })
        send({ type: 'dev:scenario', scenario })
      }
    },

    inspectTruth() {
      if (__DEV_TOOLS__) send({ type: 'dev:inspect' })
    },
  }
})

export { actionKey }
