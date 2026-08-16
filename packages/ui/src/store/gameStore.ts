import { create } from 'zustand'
import type { Action, CountryDocument, CountryScenarioId, GameRules, SaveFile } from '@terrarium/engine'
import { parseCountryDocument, STANDARD_RULES } from '@terrarium/engine'
import type { IndicatorId, PublishedState } from '@terrarium/observation'
import { INDICATOR_IDS } from '@terrarium/observation'
import type { ClientMessage, DevNode, WorkerMessage } from '../worker/protocol'
import type { TrialProgress, TrialReport } from '../worker/trial'
import SimWorker from '../worker/sim.worker?worker'
import { dbGet, dbPut } from './db'
import { BOARD_SLOTS, DEFAULT_PINS, resolveBoard, toggleBoardPin } from '../wallPlan'
import { draftKey } from '../countryDraft'
import { looksLikeSave } from '../saveFile'
import type { DevScenario } from '../devScenario'

const AUTOSAVE_KEY = 'autosave'
/** The drafts shelf. Countries a player has written live beside the game, not
 * inside a save — a save already embeds the vector it needs, and a shelf is a
 * property of this browser rather than of any run. */
const DRAFTS_KEY = 'drafts'
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
    return pins.length ? resolveBoard(pins.slice(-BOARD_SLOTS), INDICATOR_IDS) : [...DEFAULT_PINS]
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
  stagedCosts: Record<string, number>
  stagedAffordable: boolean
  previewError: string | null
  rejection: string | null
  /** a save that could not be reopened, in words for the player. Set instead of
   * a published state, so the boot sequence has something to fall through to. */
  loadError: string | null
  advancing: boolean
  /** instruments the player has put on the board, oldest pin first */
  pinned: IndicatorId[]
  /** dev only: the last true-state snapshot the worker was asked for */
  devTruth: { tick: number; tree: DevNode[] } | null

  /** countries this browser has written, newest first */
  drafts: CountryDocument[]
  /** the feasibility study: at most one runs at a time, and it belongs to a
   * draft rather than to a game, so it lives beside the shelf */
  study: {
    running: boolean
    progress: TrialProgress | null
    report: TrialReport | null
    error: string | null
    /** which draft the report describes, so a stale report is never shown
     * against a country that has been edited since */
    forDraft: string | null
  }

  newGame(country: CountryScenarioId, seed?: string, rules?: GameRules): void
  /** start a country a player wrote */
  newDraftedGame(document: CountryDocument, seed?: string, rules?: GameRules): void
  loadSave(save: SaveFile): void
  loadAutosave(): Promise<boolean>
  loadDrafts(): Promise<void>
  saveDraft(document: CountryDocument): Promise<void>
  deleteDraft(key: string): Promise<void>
  runStudy(document: CountryDocument): void
  clearStudy(): void
  stage(key: string, action: Action | null): void
  clearStaged(): void
  advance(): void
  togglePin(id: IndicatorId): void
  /** dev only: build a country from overrides and run it to a year */
  runScenario(scenario: DevScenario): void
  /** dev only: ask the worker what's actually true right now */
  inspectTruth(): void
}

/** one staged change per dial, one staged program per capacity target, one
 * reform per institution, and exactly one campaign */
function actionKey(a: Action): string {
  switch (a.kind) {
    case 'setDial':
      return `dial:${a.path}`
    case 'setSpendingRule':
      return `dial:spending.${a.programme}`
    case 'investCapacity':
      return `cap:${a.target}`
    case 'reform':
      return `reform:${a.institution}`
    case 'campaign':
      return 'campaign'
  }
}

export const useGame = create<GameState>((set, get) => {
  const worker = new SimWorker()

  // the corridor trail is no longer assembled here. Both coordinates are live
  // engine state from M6, and the traced path rides along in PublishedState
  // (built from the statistics office's own worksheets), so it survives a
  // save/reload instead of restarting empty the way a store-local trail did.

  worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
    const msg = ev.data
    switch (msg.type) {
      case 'published': {
        set({ published: msg.published, save: msg.save, advancing: false, rejection: null })
        void dbPut(AUTOSAVE_KEY, msg.save)
        break
      }
      case 'preview':
        set({
          stagedCost: msg.cost,
          stagedCosts: msg.costs,
          stagedAffordable: msg.affordable,
          previewError: msg.error ?? null,
        })
        break
      case 'rejected':
        set({
          published: msg.published,
          rejection: msg.message,
          advancing: false,
          staged: new Map(),
          stagedCost: null,
          stagedCosts: {},
          previewError: null,
        })
        break
      case 'error':
        console.error('sim worker error:', msg.message)
        set({ rejection: msg.message, advancing: false })
        break
      // both surfaces, because a refused save arrives in two situations: at
      // boot, where `loadError` sends the player to the posting room, and
      // mid-run from the records office, where the rail already shows
      // `rejection` and the run in progress is untouched.
      case 'loadFailed':
        set({ loadError: msg.message, rejection: msg.message, advancing: false })
        break
      case 'trialProgress':
        set((s) => ({ study: { ...s.study, progress: msg.progress } }))
        break
      case 'trialReport':
        set((s) => ({ study: { ...s.study, running: false, progress: null, report: msg.report } }))
        break
      case 'trialFailed':
        set((s) => ({ study: { ...s.study, running: false, progress: null, error: msg.message } }))
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
      set({ stagedCost: null, stagedCosts: {}, stagedAffordable: true, previewError: null })
    } else {
      send({ type: 'previewCost', actions })
    }
  }

  return {
    published: null,
    save: null,
    staged: new Map(),
    stagedCost: null,
    stagedCosts: {},
    stagedAffordable: true,
    previewError: null,
    rejection: null,
    loadError: null,
    advancing: false,
    pinned: loadPins(),
    devTruth: null,
    drafts: [],
    study: { running: false, progress: null, report: null, error: null, forDraft: null },

    /** Pin an instrument to the board, or take it off. The board holds
     * BOARD_SLOTS, so pinning a fifth evicts the oldest pin — the board is a
     * choice about what you are watching this decade, and choices cost. */
    togglePin(id) {
      const cur = get().pinned
      const next = toggleBoardPin(cur, id, INDICATOR_IDS)
      savePins(next)
      set({ pinned: next })
    },

    newGame(country, seed, rules = STANDARD_RULES) {
      // seed entropy comes from the browser, not the sim — the sim itself
      // never touches a clock or unseeded randomness
      const s = seed ?? `game-${crypto.randomUUID().slice(0, 8)}`
      set({ staged: new Map(), stagedCost: null, stagedCosts: {}, previewError: null, rejection: null, loadError: null })
      send({ type: 'new', seed: s, country, rules })
    },

    newDraftedGame(document, seed, rules = STANDARD_RULES) {
      const s = seed ?? `game-${crypto.randomUUID().slice(0, 8)}`
      set({ staged: new Map(), stagedCost: null, stagedCosts: {}, previewError: null, rejection: null, loadError: null })
      send({ type: 'newDrafted', seed: s, document, rules })
    },

    /** A file from the records office, or the autosave. Anything that isn't
     * shaped like a save is refused here rather than sent — the worker would
     * throw on `save.actionLog.map` before it ever reached the engine, and that
     * throw carries no sentence a player could act on. */
    loadSave(save) {
      set({ staged: new Map(), stagedCost: null, stagedCosts: {}, previewError: null, rejection: null, loadError: null })
      if (!looksLikeSave(save)) {
        const message = 'That file is not a Terrarium save.'
        set({ loadError: message, rejection: message })
        return
      }
      send({ type: 'load', save })
    },

    /** Reopen the run this browser was in the middle of. A save it can no
     * longer read must not be able to hold the boot screen: `loadError` is what
     * the game falls through on, and it is set by the worker's refusal. */
    async loadAutosave() {
      const save = await dbGet<unknown>(AUTOSAVE_KEY)
      if (save === undefined || save === null) return false
      if (!looksLikeSave(save)) {
        // not a save at all — a key collision, or a record half written when a
        // tab was closed. There is no run here to explain to anybody.
        return false
      }
      get().loadSave(save)
      return true
    },

    /** Read the shelf. Every document is re-parsed rather than trusted: it was
     * written by an older build, or hand-edited in devtools, and a shelf that
     * bricks the posting room is worse than one that quietly drops a file. */
    async loadDrafts() {
      const stored = await dbGet<unknown[]>(DRAFTS_KEY)
      if (!Array.isArray(stored)) return
      const drafts: CountryDocument[] = []
      for (const entry of stored) {
        try {
          drafts.push(parseCountryDocument(entry))
        } catch {
          /* a draft this build can no longer open is dropped, not fatal */
        }
      }
      set({ drafts })
    },

    async saveDraft(document) {
      const key = draftKey(document)
      // filing under a name that is already on the shelf replaces it, and moves
      // it to the front — that is what a filing cabinet does
      const drafts = [document, ...get().drafts.filter((d) => draftKey(d) !== key)]
      set({ drafts })
      await dbPut(DRAFTS_KEY, drafts)
    },

    async deleteDraft(key) {
      const drafts = get().drafts.filter((d) => draftKey(d) !== key)
      set({ drafts })
      await dbPut(DRAFTS_KEY, drafts)
    },

    runStudy(document) {
      if (get().study.running) return
      set({
        study: {
          running: true,
          progress: null,
          report: null,
          error: null,
          forDraft: draftKey(document),
        },
      })
      // the study is reproducible from the draft alone: studying the same
      // country twice gives the same numbers, so iterating on it means something
      send({ type: 'trial', document, baseSeed: draftKey(document) })
    },

    clearStudy() {
      set({ study: { running: false, progress: null, report: null, error: null, forDraft: null } })
    },

    stage(key, action) {
      const staged = new Map(get().staged)
      if (action === null) staged.delete(key)
      else staged.set(key, action)
      set({
        staged,
        stagedCost: null,
        stagedCosts: {},
        stagedAffordable: staged.size === 0,
        previewError: null,
      })
      refreshPreview()
    },

    clearStaged() {
      set({ staged: new Map(), stagedCost: null, stagedCosts: {}, stagedAffordable: true, previewError: null })
    },

    advance() {
      const actions = [...get().staged.values()]
      set({ advancing: true, staged: new Map(), stagedCost: null, stagedCosts: {}, previewError: null })
      send({ type: 'advance', actions })
    },

    // both guarded so a production build drops the bodies — the dev channel
    // should not merely be unreachable in production, it should not exist
    runScenario(scenario) {
      if (__DEV_TOOLS__) {
        set({
          staged: new Map(),
          stagedCost: null,
          stagedCosts: {},
          previewError: null,
          rejection: null,
          // the corridor trail is no longer store-local: both coordinates are
          // live engine state and the traced path rides in PublishedState, so
          // a scenario load gets the right trail for free
          devTruth: null,
        })
        send({ type: 'dev:scenario', scenario })
      }
    },

    inspectTruth() {
      if (__DEV_TOOLS__) send({ type: 'dev:inspect' })
    },
  }
})

export { actionKey }
