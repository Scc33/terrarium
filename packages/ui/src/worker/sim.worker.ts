/**
 * The engine host. Owns trueState; emits PublishedState only — the fog is
 * architecturally mandatory, not a UI courtesy (§6.1 of the design doc).
 */

import {
  applyActions,
  countryFromDocument,
  createSave,
  createCountryParams,
  gameRules,
  init,
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
import { runTrial } from './trial'
import type { ClientMessage, DevNode, WorkerMessage } from './protocol'

let state: TrueState | null = null
let params: CountryParams | null = null
let seed = ''
let actionLog: ActionLog = []
let rules: GameRules = STANDARD_RULES

const post = (m: WorkerMessage) => postMessage(m)

function publish(): void {
  if (!state || !params) return
  post({
    type: 'published',
    published: observe(state),
    save: createSave(params, seed, actionLog, state.meta.tick, rules),
  })
}

function startNew(newSeed: string, country: CountryScenarioId, newRules: GameRules): void {
  seed = newSeed
  rules = newRules
  params = createCountryParams(country, seed)
  state = init(params, seed, rules)
  actionLog = []
  publish()
}

/** Start a country a player wrote. Identical to `startNew` in every respect
 * except where the vector came from — same init, same pipeline, same RNG — so
 * the save it produces is an ordinary save and replays anywhere. */
function startDrafted(newSeed: string, document: CountryDocument, newRules: GameRules): void {
  seed = newSeed
  rules = newRules
  params = countryFromDocument(document)
  state = init(params, seed, rules)
  actionLog = []
  publish()
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

function load(save: {
  params: CountryParams
  seed: string
  actionLog: ActionLog
  tick: number
  rules?: GameRules
  mode?: GameMode
}): void {
  seed = save.seed
  rules = gameRules(save.rules ?? save.mode ?? 'standard')
  params = save.params
  actionLog = save.actionLog
  state = init(params, seed, rules)
  const byTick = new Map(actionLog.map((t) => [t.tick, t.actions]))
  while (state.meta.tick < save.tick) {
    const acts = byTick.get(state.meta.tick)
    if (acts) {
      // lenient: a save from an older engine may stage actions the new
      // balance can no longer afford — skip them rather than brick the load
      try {
        state = applyActions(state, acts)
      } catch (e) {
        if (!(e instanceof IllegalActionError)) throw e
      }
    }
    state = step(state)
  }
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
        startNew(msg.seed, msg.country, msg.rules)
        break
      case 'newDrafted':
        startDrafted(msg.seed, msg.document, msg.rules)
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
