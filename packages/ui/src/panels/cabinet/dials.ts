/**
 * The slider's arithmetic — range, step, and how a reading is printed. This
 * is the half of a dial that belongs to the control rather than to the policy,
 * so it stays here; what the lever IS lives in `../../levers` beside the words
 * the handbook prints about it.
 */

import {
  ASSET_PURCHASE_RATE_MAX,
  CAPITAL_REQUIREMENT_MAX,
  CAPITAL_REQUIREMENT_MIN,
  FX_INTERVENTION_MAX,
  IMMIGRATION_LIMIT_MAX,
  SECTOR_IDS,
  type DialPath,
  type SectorId,
} from '@terrarium/engine'
import type { PublishedState } from '@terrarium/observation'
import { LEVER_COPY, LEVER_GROUPS } from '../../levers'
import type { CabinetGroup } from '../../cabinetNavigation'
import { money, pct, pct1, pctSigned } from './format'

export interface DialDef {
  path: DialPath
  label: string
  get(pub: PublishedState): number
  min: number
  max(pub: PublishedState): number
  step: number
  fmt(v: number): string
}

const spendMax = (pub: PublishedState) => Math.max(pub.treasury.revenue * 3, 10)

export interface DialGroup {
  group: Exclude<CabinetGroup, 'STATE CAPACITY'>
  tab: string
  brief: string
  question: string
  dials: DialDef[]
}

/** Total over `DialPath`, so a new dial cannot reach the rail without a range. */
type DialMechanics = Omit<DialDef, 'path' | 'label'>

const DIAL_MECHANICS: Record<DialPath, DialMechanics> = {
  'taxRates.income': { get: (p) => p.dials.taxRates.income, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
  'taxRates.corporate': { get: (p) => p.dials.taxRates.corporate, min: 0, max: () => 0.8, step: 0.01, fmt: pct },
  'taxRates.tariff': { get: (p) => p.dials.taxRates.tariff, min: 0, max: () => 1, step: 0.01, fmt: pct },
  'taxRates.fuel': { get: (p) => p.dials.taxRates.fuel, min: 0, max: () => 2, step: 0.05, fmt: pct },
  'spending.transfers': { get: (p) => p.dials.spending.transfers, min: 0, max: spendMax, step: 0.1, fmt: money },
  'spending.procurement': { get: (p) => p.dials.spending.procurement, min: 0, max: spendMax, step: 0.1, fmt: money },
  'spending.investment': { get: (p) => p.dials.spending.investment, min: 0, max: spendMax, step: 0.1, fmt: money },
  'spending.research': { get: (p) => p.dials.spending.research, min: 0, max: spendMax, step: 0.1, fmt: money },
  immigrationLimit: {
    get: (p) => p.dials.immigrationLimit,
    min: 0,
    max: () => IMMIGRATION_LIMIT_MAX,
    step: 0.001,
    fmt: pct1,
  },
  surplusPayout: {
    get: (p) => p.dials.surplusPayout,
    min: 0,
    max: () => 1,
    step: 0.05,
    fmt: pct,
  },
  policyRate: { get: (p) => p.dials.policyRate, min: 0, max: () => 0.3, step: 0.0025, fmt: pct1 },
  assetPurchaseRate: {
    get: (p) => p.dials.assetPurchaseRate,
    min: 0,
    max: () => ASSET_PURCHASE_RATE_MAX,
    step: 0.005,
    fmt: pct1,
  },
  capitalRequirement: {
    get: (p) => p.dials.capitalRequirement,
    min: CAPITAL_REQUIREMENT_MIN,
    max: () => CAPITAL_REQUIREMENT_MAX,
    step: 0.005,
    fmt: pct1,
  },
  fxIntervention: {
    get: (p) => p.dials.fxIntervention,
    min: -FX_INTERVENTION_MAX,
    max: () => FX_INTERVENTION_MAX,
    step: 0.005,
    fmt: pctSigned,
  },
  ...(Object.fromEntries(
    SECTOR_IDS.map((sid) => [
      `subsidies.${sid}`,
      {
        get: (p: PublishedState) => p.dials.subsidies[sid] ?? 0,
        min: 0,
        max: (p: PublishedState) => Math.max(p.treasury.revenue, 5),
        step: 0.1,
        fmt: money,
      },
    ]),
  ) as Record<`subsidies.${SectorId}`, DialMechanics>),
}

export const DIALS: DialGroup[] = LEVER_GROUPS.map((group) => ({
  group: group.group,
  tab: group.tab,
  brief: group.brief,
  question: group.question,
  dials: group.paths.map((path) => ({ ...DIAL_MECHANICS[path], path, label: LEVER_COPY[path].label })),
}))
