/** Offices with the shared (published state, close) contract. */
import { LedgerOverlay } from '../panels/LedgerOverlay'
import { PolicyOverlay } from '../panels/PolicyOverlay'
import { AccountsOverlay } from '../panels/AccountsOverlay'
import { IndustryOverlay } from '../panels/IndustryOverlay'
import { WealthOverlay } from '../panels/WealthOverlay'
import { HouseholdOverlay } from '../panels/HouseholdOverlay'
import { LabourOverlay } from '../panels/LabourOverlay'
import { WireOverlay } from '../panels/WireOverlay'
import { StudyOverlay } from '../panels/StudyOverlay'
import { CensusOverlay } from '../panels/CensusOverlay'
import { FinanceOverlay } from '../panels/FinanceOverlay'
import { ElectionOverlay } from '../panels/ElectionOverlay'
import { ElectionResultOverlay } from '../panels/ElectionResultOverlay'

export const PAPERWORK = {
  ledger: LedgerOverlay, policy: PolicyOverlay, accounts: AccountsOverlay, industry: IndustryOverlay,
  households: HouseholdOverlay, wealth: WealthOverlay, wire: WireOverlay, study: StudyOverlay, census: CensusOverlay,
  labour: LabourOverlay, finance: FinanceOverlay, election: ElectionOverlay, count: ElectionResultOverlay,
} as const
