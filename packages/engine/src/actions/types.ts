import type { CapacityId, Money, Qtr, SectorId } from '../state/schema'

export type DialPath =
  | 'taxRates.income'
  | 'taxRates.corporate'
  | 'taxRates.tariff'
  | 'taxRates.fuel'
  | 'spending.transfers'
  | 'spending.procurement'
  | 'spending.investment'
  | 'policyRate'
  | `subsidies.${SectorId}`

export type Action =
  | { kind: 'setDial'; path: DialPath; value: number } // Layer 1
  | { kind: 'investCapacity'; target: CapacityId; amount: Money } // Layer 2

export interface TurnActions {
  tick: Qtr
  actions: Action[]
}

export type ActionLog = TurnActions[]
