import type { BlocId, CapacityId, InstitutionId, Money, PlatformId, Qtr, SectorId } from '../state/schema'

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
  // Layer 3 (§4.3): generational, ratcheting, contested — and cheap only when
  // a crisis has prised the reform window open
  | { kind: 'reform'; institution: InstitutionId; direction: 1 | -1 }
  // how you fight the election now approaching (§3.1)
  | { kind: 'campaign'; platform: PlatformId; bloc?: BlocId }

export interface TurnActions {
  tick: Qtr
  actions: Action[]
}

export type ActionLog = TurnActions[]
