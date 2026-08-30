import { describe, expect, it } from 'vitest'
import {
  accessForInstrument,
  countInstrumentStatuses,
  instrumentStatusSummary,
  nextInstrumentUnlock,
} from '../../packages/ui/src/maturity'

describe('instrument access', () => {
  it('separates an unfunded survey from a funded survey awaiting returns', () => {
    expect(accessForInstrument('unemployment', 0.2, false)).toMatchObject({
      availability: 'unfunded',
      maturity: 'unmeasured',
      fundedAt: 0.35,
      remaining: 0.15,
    })
    expect(accessForInstrument('inflation', 0.2, false)).toMatchObject({
      availability: 'awaiting',
      maturity: 'unmeasured',
      fundedAt: 0.08,
      remaining: 0,
    })
  })

  it('graduates a reporting instrument without changing its access threshold', () => {
    expect(accessForInstrument('inflation', 0.49, true)).toMatchObject({
      availability: 'reporting',
      maturity: 'dossier',
      fundedAt: 0.08,
    })
    expect(accessForInstrument('inflation', 0.5, true)).toMatchObject({
      availability: 'reporting',
      maturity: 'terminal',
      fundedAt: 0.08,
    })
  })

  it('a fitted survey is awaiting returns, never unfitted', () => {
    // the `fullInstrumentation` rule. For the first two quarters of such a run
    // nothing has returned yet, and the wall must not spend them telling the
    // player to fund instruments the ministry has already given them
    expect(accessForInstrument('gini', 0.05, false, true)).toMatchObject({
      availability: 'awaiting',
      maturity: 'unmeasured',
      fundedAt: 0.55,
    })
    // capacity still decides how the instrument is DRAWN — the rule hands over
    // the survey, not the electronics
    expect(accessForInstrument('gini', 0.05, true, true).maturity).toBe('dossier')
    expect(accessForInstrument('gini', 0.6, true, true).maturity).toBe('terminal')
  })

  it('groups the next survey threshold into one cabinet milestone', () => {
    expect(nextInstrumentUnlock(0.18)).toEqual({
      fundedAt: 0.2,
      indicators: ['price_food', 'price_fuel'],
    })
    // the expenditure accounts are one publication, so the rail promises all
    // three of them — plus the labour-force and education returns they share a rung with
    expect(nextInstrumentUnlock(0.32)).toEqual({
      fundedAt: 0.35,
      indicators: [
        'consumption_share',
        'investment_share',
        'export_share',
        'unemployment',
        'labor_force_participation',
        'human_capital',
        'human_development',
      ],
    })
    expect(nextInstrumentUnlock(0.55)).toBeNull()
  })

  it('summarizes access in player-facing states instead of confusing maturity with live data', () => {
    const counts = countInstrumentStatuses([
      accessForInstrument('inflation', 0.18, true),
      accessForInstrument('price_food', 0.2, false),
      accessForInstrument('unemployment', 0.18, false),
    ])
    expect(counts).toEqual({ reporting: 1, awaiting: 1, unfunded: 1 })
    expect(instrumentStatusSummary(counts)).toBe('1 REPORTING · 1 PENDING · 1 UNFITTED')
  })
})
