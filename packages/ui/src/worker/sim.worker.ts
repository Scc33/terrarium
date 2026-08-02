/**
 * The engine host. Owns trueState; emits PublishedState only — the fog is
 * architecturally mandatory, not a UI courtesy (§6.1 of the design doc).
 */

import {
  applyActions,
  createSave,
  generateParams,
  init,
  step,
  IllegalActionError,
  politicalCostOfAction,
  type ActionLog,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'
import { observe } from '@terrarium/observation'
import type { ClientMessage, WorkerMessage } from './protocol'

let state: TrueState | null = null
let params: CountryParams | null = null
let seed = ''
let actionLog: ActionLog = []

const post = (m: WorkerMessage) => postMessage(m)

function publish(): void {
  if (!state || !params) return
  post({
    type: 'published',
    published: observe(state),
    save: createSave(params, seed, actionLog, state.meta.tick),
  })
}

function startNew(newSeed: string): void {
  seed = newSeed
  params = generateParams(seed)
  state = init(params, seed)
  actionLog = []
  publish()
}

function load(save: {
  params: CountryParams
  seed: string
  actionLog: ActionLog
  tick: number
}): void {
  seed = save.seed
  params = save.params
  actionLog = save.actionLog
  state = init(params, seed)
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
  return action.kind === 'setDial' ? `dial:${action.path}` : `cap:${action.target}`
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
    const affordable = cost <= available
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

onmessage = (ev: MessageEvent<ClientMessage>) => {
  const msg = ev.data
  try {
    switch (msg.type) {
      case 'new':
        startNew(msg.seed)
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
