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
  StatuteId,
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
  | 'fxIntervention'
  | `subsidies.${SectorId}`

export type Action =
  | { kind: 'setDial'; path: DialPath; value: number } // Layer 1
  /** Replace a recurring appropriation rule. `value` is money/quarter for
   * fixed/indexed rules and a 0..1 share for GDP rules. */
  | { kind: 'setSpendingRule'; programme: SpendingProgramId; mode: SpendingRuleMode; value: number }
  | { kind: 'investCapacity'; target: CapacityId; amount: Money } // Layer 2
  // Institutional reforms: generational, ratcheting, contested — and cheap only when
  // a crisis has prised the reform window open
  | { kind: 'reform'; institution: InstitutionId; direction: 1 | -1 }
  /** Write a rule rather than set a number (ADR-0027). `level` indexes
   * `STATUTE_LEVELS[statute]`; 0 repeals. Unlike a dial this arrives over two
   * years, and unlike a dial it costs more to undo than it did to pass. */
  | { kind: 'enact'; statute: StatuteId; level: number }
  // how you fight the election now approaching
  | { kind: 'campaign'; platform: PlatformId; bloc?: BlocId }

export interface TurnActions {
  tick: Qtr
  actions: Action[]
}

export type ActionLog = TurnActions[]
