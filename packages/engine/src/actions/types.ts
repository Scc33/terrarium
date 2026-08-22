import type {
  BlocId,
  CapacityId,
  InstitutionId,
  Money,
  PlatformId,
  Qtr,
  SectorId,
  SpendingProgramId,
  SpendingRuleMode,
} from '../state/schema'

export type DialPath =
  | 'taxRates.income'
  | 'taxRates.corporate'
  | 'taxRates.tariff'
  | 'taxRates.fuel'
  | 'spending.transfers'
  | 'spending.procurement'
  | 'spending.investment'
  | 'spending.research'
  | 'immigrationLimit'
  | 'policyRate'
  | 'assetPurchaseRate'
  | 'capitalRequirement'
  | `subsidies.${SectorId}`

export type Action =
  | { kind: 'setDial'; path: DialPath; value: number } // Layer 1
  /** Replace a recurring appropriation rule. `value` is money/quarter for
   * fixed/indexed rules and a 0..1 share for GDP rules. */
  | { kind: 'setSpendingRule'; programme: SpendingProgramId; mode: SpendingRuleMode; value: number }
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
