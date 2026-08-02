/**
 * The single shared contract between UI and sim worker (§1.1). Payloads are
 * typed exclusively with PublishedState, action types, and save files — the
 * true state never crosses this boundary.
 */

import type { Action, SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'

export type ClientMessage =
  | { type: 'new'; seed: string }
  | { type: 'load'; save: SaveFile }
  | { type: 'advance'; actions: Action[] }
  | { type: 'previewCost'; actions: Action[] }
  | { type: 'requestSave' }

export type WorkerMessage =
  | { type: 'published'; published: PublishedState; save: SaveFile }
  | { type: 'preview'; cost: number; costs: Record<string, number>; affordable: boolean; error?: string }
  | { type: 'rejected'; message: string; published: PublishedState }
  | { type: 'error'; message: string }
