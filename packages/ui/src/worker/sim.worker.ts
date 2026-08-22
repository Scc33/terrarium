/**
 * The engine host. Owns trueState; emits PublishedState only — the fog is
 * architecturally mandatory, not a UI courtesy (§6.1 of the design doc).
 */

import {
  applyActions,
  appointmentTick,
  countryFromDocument,
  createSave,
  createCountryParams,
  gameRules,
  init,
  runInterregnum,
  STANDARD_RULES,
  step,
  END_OF_HISTORY_TICK,
  IllegalActionError,
  InvalidCountryError,
  politicalCostOfAction,
  type ActionLog,
  type CountryDocument,
  type CountryParams,
  type CountryScenarioId,
  type GameMode,
  type GameRules,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import { applyScenario, tickForYear, type DevScenario } from '../devScenario'
import { replayWindow, unreadableSaveMessage } from '../saveFile'
import { runTrial } from './trial'
import type { ClientMessage, DevNode, WorkerMessage } from './protocol'

let state: TrueState | null = null
let params: CountryParams | null = null
let seed = ''
let actionLog: ActionLog = []
let rules: GameRules = STANDARD_RULES
/** the quarter the player took office — part of the save, so it has to live
 * beside the other three replay inputs rather than be read back off the state */
let appointedAt = 0

const post = (m: WorkerMessage) => postMessage(m)

function publish(): void {
  if (!state || !params) return
  post({
    type: 'published',
    published: observe(state),
    save: createSave(params, seed, actionLog, state.meta.tick, rules, appointedAt),
  })
}

/** Open a posting. On a 1946 appointment `runInterregnum` returns `init` and an
 * empty log; on a later one it hands back the country a caretaker administration
 * governed up to that quarter, and the orders that got it there — which go into
 * the save's action log like any others, so the run replays without needing
 * this file's policy again (ADR-0021). */
function openPosting(
  newSeed: string,
  vector: CountryParams,
  newRules: GameRules,
  takeOfficeAt: number,
): void {
  seed = newSeed
  rules = newRules
  params = vector
  appointedAt = appointmentTick(takeOfficeAt)
  const opened = runInterregnum(params, seed, rules, appointedAt)
  state = opened.state
  actionLog = opened.actionLog
  publish()
}

function startNew(
  newSeed: string,
  country: CountryScenarioId,
  newRules: GameRules,
  takeOfficeAt: number,
): void {
  openPosting(newSeed, createCountryParams(country, newSeed), newRules, takeOfficeAt)
}

/** Start a country a player wrote. Identical to `startNew` in every respect
 * except where the vector came from — same init, same pipeline, same RNG — so
 * the save it produces is an ordinary save and replays anywhere. */
function startDrafted(
  newSeed: string,
  document: CountryDocument,
  newRules: GameRules,
  takeOfficeAt: number,
): void {
  openPosting(newSeed, countryFromDocument(document), newRules, takeOfficeAt)
}

/** Study a candidate country. Errors here are the document's, not the game's,
 * so they come back on their own channel and leave any run in progress alone. */
function trial(document: CountryDocument, baseSeed: string): void {
  let candidate: CountryParams
  try {
    candidate = countryFromDocument(document)
  } catch (e) {
    if (e instanceof InvalidCountryError) {
      post({ type: 'trialFailed', message: e.message })
      return
    }
    throw e
  }
  const report = runTrial(candidate, {
    baseSeed,
    onProgress: (progress) => post({ type: 'trialProgress', progress }),
  })
  post({ type: 'trialReport', report })
}

/**
 * Replay a save to the quarter it had reached.
 *
 * Nothing is committed to the worker's own state until the whole replay
 * succeeds. A half-applied load used to leave `params` and `seed` pointing at
 * the new save while `state` still held the old run (or null, at boot) — and
 * `publish()` would then file that mismatch straight back to the autosave.
 */
function load(save: {
  params: CountryParams
  seed: string
  actionLog: ActionLog
  tick: number
  rules?: GameRules
  mode?: GameMode
  appointedAt?: number
}): void {
  // a save written before the rule set names only its tenure rule
  const saveRules = gameRules(save.rules ?? save.mode ?? 'standard')
  // …and one from before the appointment year began in 1946, like all of them.
  // `replayWindow` also says whether the two replay inputs can both be true —
  // a save that stopped before its own government took office cannot.
  const { until, appointedAt: saveAppointedAt, conflict } = replayWindow(save)
  let next: TrueState
  try {
    if (conflict) throw new Error(conflict)
    next = init(save.params, save.seed, saveRules, saveAppointedAt)
    const byTick = new Map(save.actionLog.map((t) => [t.tick, t.actions]))
    while (next.meta.tick < until) {
      const acts = byTick.get(next.meta.tick)
      if (acts) {
        // lenient: a save from an older engine may stage actions the new
        // balance can no longer afford — skip them rather than brick the load
        try {
          next = applyActions(next, acts)
        } catch (e) {
          if (!(e instanceof IllegalActionError)) throw e
        }
      }
      next = step(next)
    }
  } catch (e) {
    // A file this build cannot read is not a broken game. Refuse it by name and
    // leave whatever was running alone — see `saveFile.ts` for why no repair is
    // attempted here.
    post({ type: 'loadFailed', message: unreadableSaveMessage(save, e instanceof Error ? e.message : String(e)) })
    return
  }
  seed = save.seed
  rules = saveRules
  appointedAt = saveAppointedAt
  params = save.params
  actionLog = save.actionLog
  state = next
  publish()
}

function advance(actions: Parameters<typeof applyActions>[1]): void {
  if (!state) return
  try {
    if (actions.length > 0) {
      state = applyActions(state, actions)
      actionLog = [...actionLog, { tick: state.meta.tick, actions }]
    }
  } catch (e) {
    if (e instanceof IllegalActionError) {
      post({ type: 'rejected', message: e.message, published: observe(state) })
      return
    }
    throw e
  }
  state = step(state)
  publish()
}

function previewKey(action: Parameters<typeof applyActions>[1][number]): string {
  switch (action.kind) {
    case 'setDial':
      return `dial:${action.path}`
    case 'setSpendingRule':
      return `dial:spending.${action.programme}`
    case 'investCapacity':
      return `cap:${action.target}`
    case 'reform':
      return `reform:${action.institution}`
    case 'campaign':
      return 'campaign'
  }
}

function previewCost(actions: Parameters<typeof applyActions>[1]): void {
  if (!state) return
  const available = state.politics.politicalCapital
  try {
    const costs = Object.fromEntries(actions.map((action) => [previewKey(action), politicalCostOfAction(state!, action)]))
    const cost = Object.values(costs).reduce((sum, value) => sum + value, 0)
    // Legality and affordability are separate. Validate against an unlimited
    // cabinet so an unaffordable proposal still gets an honest finite quote.
    applyActions({ ...state, politics: { ...state.politics, politicalCapital: Number.POSITIVE_INFINITY } }, actions)
    // …which is also what a sandbox cabinet is. The quote is still real — the
    // room's objection is the information — but nothing is ever unaffordable.
    const affordable = rules.unlimitedCapital || cost <= available
    post({
      type: 'preview',
      cost,
      costs,
      affordable,
      error: affordable ? undefined : `Need ${cost.toFixed(1)} PC; ${available.toFixed(1)} available.`,
    })
  } catch (e) {
    if (e instanceof IllegalActionError) {
      post({ type: 'preview', cost: Infinity, costs: {}, affordable: false, error: e.message })
    } else {
      throw e
    }
  }
}

// ---------------------------------------------------------------------------
// dev tooling. Guarded by `__DEV_TOOLS__`, which Vite substitutes with a
// literal `false` in a production build, so the bundler drops both handlers and
// everything they reach — the true-state serializer is not shipped to players.
// ---------------------------------------------------------------------------

/** display rounding: keep integers exact, cut float noise to something readable */
function readable(n: number): number {
  if (!Number.isFinite(n)) return n
  return Number.isInteger(n) ? n : Number(n.toPrecision(6))
}

/**
 * Reflect true state into anonymous label/value pairs (see `DevNode`). Generic
 * on purpose: it names no field, so it needs no maintenance when the schema
 * grows, and a new field on TrueState shows up in the inspector for free.
 */
function toTree(value: unknown, key: string): DevNode {
  if (value === null || value === undefined) return { key, value: null }
  if (typeof value === 'number') return { key, value: readable(value) }
  if (typeof value === 'string' || typeof value === 'boolean') return { key, value }
  if (Array.isArray(value)) {
    return {
      key,
      // arrays of identified things (sectors, cohorts) read far better under
      // their own id than under an index
      children: value.map((v, i) => {
        const id = v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : String(i)
        return toTree(v, id)
      }),
    }
  }
  if (typeof value === 'object') {
    return { key, children: Object.entries(value).map(([k, v]) => toTree(v, k)) }
  }
  return { key, value: String(value) }
}

function devInspect(): void {
  if (!state) return
  post({ type: 'dev:truth', tick: state.meta.tick, tree: toTree(state, 'state').children ?? [] })
}

/** Single entry point for every `dev:*` message, so one guard covers them all
 * and a production build drops this function and everything it reaches. */
function handleDev(msg: ClientMessage): void {
  if (msg.type === 'dev:scenario') devScenario(msg.scenario)
  else if (msg.type === 'dev:inspect') devInspect()
}

/**
 * Build a country from scenario overrides and run it forward. This is a normal
 * game in every respect — same init, same pipeline, same RNG — so the resulting
 * save is a real save and the run is reproducible from the scenario alone.
 */
function devScenario(sc: DevScenario): void {
  seed = sc.seed
  rules = STANDARD_RULES
  // a scenario is still a 1946 posting run forward with nobody governing — the
  // console's whole point is that you specify the country and let it live, and
  // the posting room's caretaker would put its own decisions in the way
  appointedAt = 0
  params = applyScenario(createCountryParams(sc.country ?? 'procedural', sc.seed), sc)
  state = init(params, seed, rules)
  actionLog = []
  const target = tickForYear(sc.year, END_OF_HISTORY_TICK)
  while (state.meta.tick < target) state = step(state)
  publish()
}

onmessage = (ev: MessageEvent<ClientMessage>) => {
  const msg = ev.data
  try {
    // Vite substitutes a literal `false` here in production, so this branch —
    // and `handleDev`, `devScenario`, `devInspect`, `toTree` with it — is dead
    // code the bundler removes. Verified by `tests/ui/dev-build-strip.test.ts`.
    if (__DEV_TOOLS__ && msg.type.startsWith('dev:')) {
      handleDev(msg)
      return
    }
    switch (msg.type) {
      case 'new':
        startNew(msg.seed, msg.country, msg.rules, msg.appointedAt)
        break
      case 'newDrafted':
        startDrafted(msg.seed, msg.document, msg.rules, msg.appointedAt)
        break
      case 'trial':
        trial(msg.document, msg.baseSeed)
        break
      case 'load':
        load(msg.save)
        break
      case 'advance':
        advance(msg.actions)
        break
      case 'previewCost':
        previewCost(msg.actions)
        break
      case 'requestSave':
        publish()
        break
    }
  } catch (e) {
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) })
  }
}
