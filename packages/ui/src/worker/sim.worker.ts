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
  type ActionLog,
  type CountryParams,
  type TrueState,
} from '@terrarium/engine'
import { observe, snapshotOf, type TrueSnapshot } from '@terrarium/observation'
import type { ClientMessage, WorkerMessage } from './protocol'

let state: TrueState | null = null
let params: CountryParams | null = null
let seed = ''
let history: TrueSnapshot[] = []
let actionLog: ActionLog = []

const post = (m: WorkerMessage) => postMessage(m)

function publish(): void {
  if (!state || !params) return
  post({
    type: 'published',
    published: observe(state, history, seed),
    save: createSave(params, seed, actionLog, state.meta.tick),
  })
}

function startNew(newSeed: string): void {
  seed = newSeed
  params = generateParams(seed)
  state = init(params, seed)
  history = []
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
  history = []
  const byTick = new Map(actionLog.map((t) => [t.tick, t.actions]))
  const end = save.tick
  while (state.meta.tick < end) {
    const acts = byTick.get(state.meta.tick)
    if (acts) state = applyActions(state, acts)
    const prev = state
    state = step(state)
    history.push(snapshotOf(prev, state))
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
      post({ type: 'rejected', message: e.message, published: observe(state, history, seed) })
      return
    }
    throw e
  }
  const prev = state
  state = step(state)
  history.push(snapshotOf(prev, state))
  publish()
}

function previewCost(actions: Parameters<typeof applyActions>[1]): void {
  if (!state) return
  const before = state.politics.politicalCapital
  try {
    const after = applyActions(state, actions).politics.politicalCapital
    post({ type: 'preview', cost: before - after, affordable: true })
  } catch (e) {
    if (e instanceof IllegalActionError) {
      post({ type: 'preview', cost: Infinity, affordable: false, error: e.message })
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
        if (state && params) post({ type: 'published', published: observe(state, history, seed), save: createSave(params, seed, actionLog, state.meta.tick) })
        break
    }
  } catch (e) {
    post({ type: 'error', message: e instanceof Error ? e.message : String(e) })
  }
}
