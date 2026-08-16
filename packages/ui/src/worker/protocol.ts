/**
 * The single shared contract between UI and sim worker (§1.1). Payloads are
 * typed exclusively with PublishedState, action types, and save files — the
 * true state never crosses this boundary.
 *
 * The `dev:*` messages are the one exception, and are shaped so that they
 * cannot become a hole in it — see `DevNode`.
 */

import type { Action, CountryDocument, CountryScenarioId, GameMode, SaveFile } from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import type { DevScenario } from '../devScenario'
import type { TrialProgress, TrialReport } from './trial'

export type ClientMessage =
  | { type: 'new'; seed: string; country: CountryScenarioId; mode: GameMode }
  /** start a country a player wrote. The document is materialized into params
   * here rather than in a component, so the UI never holds a playable vector
   * it could be tempted to run. */
  | { type: 'newDrafted'; seed: string; document: CountryDocument; mode: GameMode }
  | { type: 'load'; save: SaveFile }
  | { type: 'advance'; actions: Action[] }
  | { type: 'previewCost'; actions: Action[] }
  | { type: 'requestSave' }
  /** the feasibility study. Runs on the worker because it runs the engine, and
   * because two seconds of centuries must not touch the main thread. */
  | { type: 'trial'; document: CountryDocument; baseSeed: string }
  // ---------- dev only: handlers are stripped from production builds ----------
  | { type: 'dev:scenario'; scenario: DevScenario }
  | { type: 'dev:inspect' }

export type WorkerMessage =
  | { type: 'published'; published: PublishedState; save: SaveFile }
  | { type: 'preview'; cost: number; costs: Record<string, number>; affordable: boolean; error?: string }
  | { type: 'rejected'; message: string; published: PublishedState }
  | { type: 'error'; message: string }
  /** a save this build can no longer open. Separate from `error` because it is
   * RECOVERABLE: nothing is wrong with the game, only with that one file, so
   * the boot sequence falls through to the posting room instead of hanging on
   * a splash screen with the reason in the console. */
  | { type: 'loadFailed'; message: string }
  | { type: 'trialProgress'; progress: TrialProgress }
  | { type: 'trialReport'; report: TrialReport }
  /** a study that could not start — a document the engine refuses. Separate
   * from `error` because it belongs beside the draft, not over the game. */
  | { type: 'trialFailed'; message: string }
  // ---------- dev only: never posted from a production build ----------
  | { type: 'dev:truth'; tick: number; tree: DevNode[] }

/**
 * A node in the true-state inspector's tree.
 *
 * Deliberately **opaque**. The inspector exists to show what the fog is hiding,
 * so true state has to reach the UI — but if it arrived typed as `TrueState`,
 * the UI would gain the vocabulary to render true values *anywhere*, and
 * ADR-0004's guarantee would degrade from a fact into a convention.
 *
 * So truth crosses as anonymous label/scalar pairs. The panel renders a tree it
 * cannot name: no component can be written against `state.sectors[0].output`,
 * because that path doesn't exist on this side of the wire. The inspector gets
 * to be useful without the boundary getting weaker.
 */
export interface DevNode {
  key: string
  /** leaf value, already rounded for display; absent on branches */
  value?: number | string | boolean | null
  children?: DevNode[]
}
