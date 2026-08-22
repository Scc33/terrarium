import { describe, expect, it } from 'vitest'
import { BLOC_IDS, INDICATOR_IDS, INSTITUTION_IDS, PLATFORM_IDS } from '@terrarium/observation'
import { COHORT_IDS } from '@terrarium/engine'
import {
  BLOC_NOTES,
  COHORT_NOTES,
  complementReading,
  INSTITUTION_NAMES,
  NAMES,
  PLATFORM_NOTES,
} from '../../packages/ui/src/components/labels'

describe('indicator labels', () => {
  it('keeps every rack mnemonic within its physical ten-character budget', () => {
    for (const id of INDICATOR_IDS) expect(NAMES[id].short.length, id).toBeLessThanOrEqual(10)
  })

  it('derives complementary account shares from the same reading', () => {
    expect(complementReading('household_saving_rate', 12.5)).toBe('SPEND 87.5')
    expect(complementReading('household_saving_rate', 8.25, 2)).toBe('SPEND 91.75')
    expect(complementReading('gdp_per_capita', 12.5)).toBeNull()
    // the expenditure shares are FOUR sides of one identity, not two, so none
    // of them has a single complement to print beside the needle
    expect(complementReading('investment_share', 22)).toBeNull()
  })
})

/**
 * Issue #29 asked for tooltips that explain *everything*, and the compiler only
 * gets us most of the way: these tables are total Records, so a new indicator
 * or cohort cannot compile without an entry — but `note: ''` compiles fine, and
 * an empty bubble is worse than no trigger at all, because the player pays a
 * hover to learn nothing. So the floor is asserted here rather than trusted.
 *
 * The length bound is deliberately loose. It is there to catch a placeholder
 * ('TODO', 'Inflation'), not to police prose — the Tooltip's own rule is that
 * copy stays short, and that judgement belongs to the author, not to a test.
 */
describe('every explainable thing carries an explanation', () => {
  const explains = (what: string, id: string, note: string | undefined) => {
    expect(note, `${what} ${id}`).toBeTruthy()
    expect(note!.trim().length, `${what} ${id} is too short to be an explanation`).toBeGreaterThan(24)
    expect(note!.trim(), `${what} ${id} should read as a sentence`).toMatch(/[.!?]$/)
  }

  it('explains every published indicator in plain language', () => {
    for (const id of INDICATOR_IDS) explains('indicator', id, NAMES[id].note)
  })

  it('explains every cohort the incidence rows can name', () => {
    for (const id of COHORT_IDS) explains('cohort', id, COHORT_NOTES[id])
  })

  it('explains every bloc in the whip count', () => {
    for (const id of BLOC_IDS) explains('bloc', id, BLOC_NOTES[id])
  })

  it('explains every institution the cabinet can reform', () => {
    for (const id of INSTITUTION_IDS) explains('institution', id, INSTITUTION_NAMES[id].note)
  })

  it('explains what every campaign platform cost, for the count', () => {
    for (const id of PLATFORM_IDS) explains('platform', id, PLATFORM_NOTES[id])
  })
})
