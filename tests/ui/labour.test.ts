import { describe, expect, it } from 'vitest'
import {
  LABOUR_CLASS_IDS,
  type LabourClassId,
  type PublishedState,
} from '@terrarium/observation'
import { LABOUR_SURVEY_FUNDED_AT } from '@terrarium/engine'
import {
  LABOUR_CLASS_FACE,
  labourAvailability,
  labourTraces,
  latestLabourIndicator,
  readLabour,
} from '../../packages/ui/src/labour'

type Print = PublishedState['labour'][number]

const vec = (values: readonly number[]): Record<LabourClassId, number> =>
  LABOUR_CLASS_IDS.reduce<Record<LabourClassId, number>>(
    (out, id, index) => ({ ...out, [id]: values[index] }),
    {} as Record<LabourClassId, number>,
  )

const print = (forQtr: number, revision = 0): Print => ({
  forQtr,
  publishedAt: forQtr + revision + 1,
  revision,
  errorBand: { jobless: 0.03, underemployed: 0.04 },
  jobless: vec([0.1 + revision / 100, 0.2, 0.3]),
  underemployed: vec([0, 0.04, 0.08]),
})

function pubWith(
  labour: Print[],
  statistical = 1,
  fullInstrumentation = false,
): PublishedState {
  return {
    tick: 24,
    labour,
    capacity: { statistical },
    rules: { fullInstrumentation },
    indicators: {
      unemployment: { id: 'unemployment', label: 'Unemployment', unit: '%', points: [{ forQtr: 20, publishedAt: 21, revision: 0, value: 12, errorBand: 1 }] },
      labour_underuse: { id: 'labour_underuse', label: 'Labour underuse', unit: '%', points: [{ forQtr: 20, publishedAt: 21, revision: 0, value: 16, errorBand: 1 }] },
    },
  } as unknown as PublishedState
}

describe('reading the occupational labour survey', () => {
  it('names all three labour-force classes once', () => {
    expect(Object.keys(LABOUR_CLASS_FACE).sort()).toEqual([...LABOUR_CLASS_IDS].sort())
    expect(readLabour(pubWith([print(4)]))!.rows.map((row) => row.key)).toEqual([
      ...LABOUR_CLASS_IDS,
    ])
  })

  it('uses the latest revision of each quarter in the current table and history', () => {
    const pub = pubWith([print(4), print(8), print(8, 2)])
    const release = readLabour(pub)!
    expect(release.forQtr).toBe(8)
    expect(release.revision).toBe(2)
    expect(release.rows[0].jobless).toBeCloseTo(12)
    const trace = labourTraces(pub, 'jobless').find((row) => row.key === 'rural_workers')!
    expect(trace.points.map((point) => point.tick)).toEqual([4, 8])
    expect(trace.points.at(-1)!.value).toBeCloseTo(12)
  })

  it('returns null, never zero, while the survey has no return', () => {
    expect(readLabour(pubWith([]))).toBeNull()
    expect(labourTraces(pubWith([]), 'underemployed').every((trace) => trace.points.length === 0)).toBe(true)
  })

  it('distinguishes unfunded from commissioned and awaiting', () => {
    expect(labourAvailability(pubWith([], LABOUR_SURVEY_FUNDED_AT - 0.01))).toBe('unfunded')
    expect(labourAvailability(pubWith([], LABOUR_SURVEY_FUNDED_AT))).toBe('awaiting')
    expect(labourAvailability(pubWith([], 0, true))).toBe('awaiting')
    expect(labourAvailability(pubWith([print(4)], 0))).toBe('reporting')
  })

  it('reads the two independently published headlines', () => {
    const pub = pubWith([print(4)])
    expect(latestLabourIndicator(pub, 'unemployment')).toBe(12)
    expect(latestLabourIndicator(pub, 'labour_underuse')).toBe(16)
    expect(latestLabourIndicator({ ...pub, indicators: {} }, 'labour_underuse')).toBeNull()
  })
})
