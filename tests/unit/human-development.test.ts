import { describe, expect, it } from 'vitest'
import {
  HUMAN_DEVELOPMENT_INCOME_MAX,
  HUMAN_DEVELOPMENT_INCOME_MIN,
  HUMAN_DEVELOPMENT_LIFE_MAX,
  HUMAN_DEVELOPMENT_LIFE_MIN,
  INDICATOR_FUNDED_AT,
  humanDevelopmentDimensions,
  humanDevelopmentIndex,
  type IndicatorId,
  type StatPrint,
} from '@terrarium/engine'
import { humanDevelopmentPrintsDue } from '../../packages/engine/src/pipeline/statistics'

describe('the Terrarium Human Development Index', () => {
  it('takes the geometric mean of three normalized dimensions', () => {
    const dimensions = humanDevelopmentDimensions({
      lifeExpectancy: (HUMAN_DEVELOPMENT_LIFE_MIN + HUMAN_DEVELOPMENT_LIFE_MAX) / 2,
      workforceSkills: 50,
      realGdpPerCapita: Math.sqrt(
        HUMAN_DEVELOPMENT_INCOME_MIN * HUMAN_DEVELOPMENT_INCOME_MAX,
      ),
    })

    expect(dimensions).toEqual({ health: 0.5, skills: 0.5, income: 0.5 })
    expect(humanDevelopmentIndex(dimensions)).toBeCloseTo(0.5, 12)
  })

  it('clamps every dimension to its fixed goalposts', () => {
    expect(
      humanDevelopmentDimensions({
        lifeExpectancy: 0,
        workforceSkills: -10,
        realGdpPerCapita: 0,
      }),
    ).toEqual({ health: 0, skills: 0, income: 0 })
    expect(
      humanDevelopmentDimensions({
        lifeExpectancy: 120,
        workforceSkills: 150,
        realGdpPerCapita: 10_000,
      }),
    ).toEqual({ health: 1, skills: 1, income: 1 })
  })

  it('normalizes income logarithmically between fixed engine-unit goalposts', () => {
    const dimension = (realGdpPerCapita: number) =>
      humanDevelopmentDimensions({
        lifeExpectancy: HUMAN_DEVELOPMENT_LIFE_MAX,
        workforceSkills: 100,
        realGdpPerCapita,
      }).income

    expect(dimension(HUMAN_DEVELOPMENT_INCOME_MIN)).toBe(0)
    expect(dimension(HUMAN_DEVELOPMENT_INCOME_MAX)).toBe(1)
    expect(
      dimension(Math.sqrt(HUMAN_DEVELOPMENT_INCOME_MIN * HUMAN_DEVELOPMENT_INCOME_MAX)),
    ).toBeCloseTo(0.5, 12)
  })
})

const print = (
  value: number,
  overrides: Partial<StatPrint> = {},
): StatPrint => ({
  forQtr: 8,
  publishedAt: 10,
  value,
  revision: 0,
  errorBand: 0,
  ...overrides,
})

const alignedSeries = (
  overrides: Partial<Record<IndicatorId, StatPrint[]>> = {},
): Partial<Record<IndicatorId, StatPrint[]>> => ({
  life_expectancy: [print(52.5)],
  human_capital: [print(50)],
  gdp_per_capita: [print(Math.sqrt(500))],
  ...overrides,
})

const officeRecord = (
  statCapacity = INDICATOR_FUNDED_AT.human_development,
  quarters = 9,
) => Array.from({ length: quarters }, () => ({ statCapacity }))

describe('human-development publication', () => {
  it('publishes nothing until all three component releases align', () => {
    expect(
      humanDevelopmentPrintsDue(
        alignedSeries({ gdp_per_capita: [] }),
        officeRecord(),
        10,
        false,
      ),
    ).toEqual([])
    expect(
      humanDevelopmentPrintsDue(
        alignedSeries({ gdp_per_capita: [print(Math.sqrt(500), { forQtr: 7 })] }),
        officeRecord(),
        10,
        false,
      ),
    ).toEqual([])
  })

  it('is exactly constructed from published inputs, with no extra noise or hidden-state input', () => {
    const [release] = humanDevelopmentPrintsDue(alignedSeries(), officeRecord(), 10, false)

    expect(release).toMatchObject({
      forQtr: 8,
      publishedAt: 10,
      revision: 0,
      value: 0.5,
      errorBand: 0,
      components: { health: 0.5, skills: 0.5, income: 0.5 },
    })
  })

  it('reissues the composite when the aligned component revision arrives', () => {
    const first = alignedSeries()
    const firstRelease = humanDevelopmentPrintsDue(first, officeRecord(), 10, false)[0]
    const revision = {
      life_expectancy: [...first.life_expectancy!, print(59, { publishedAt: 12, revision: 1 })],
      human_capital: [...first.human_capital!, print(60, { publishedAt: 12, revision: 1 })],
      gdp_per_capita: [...first.gdp_per_capita!, print(40, { publishedAt: 12, revision: 1 })],
      human_development: [firstRelease],
    }

    const [revised] = humanDevelopmentPrintsDue(revision, officeRecord(), 12, false)
    expect(revised.revision).toBe(1)
    expect(revised.forQtr).toBe(firstRelease.forQtr)
    expect(revised.value).not.toBe(firstRelease.value)
  })

  it('derives its uncertainty from the component bands', () => {
    const [release] = humanDevelopmentPrintsDue(
      alignedSeries({
        life_expectancy: [print(52.5, { errorBand: 2 })],
        human_capital: [print(50, { errorBand: 3 })],
        gdp_per_capita: [print(Math.sqrt(500), { errorBand: 2 })],
      }),
      officeRecord(),
      10,
      false,
    )

    expect(release.errorBand).toBeGreaterThan(0)
    expect(release.errorBand).toBeLessThan(0.1)
  })

  it('enforces its declared funding gate, which full instrumentation alone can lift', () => {
    const belowGate = INDICATOR_FUNDED_AT.human_development - 0.01

    expect(
      humanDevelopmentPrintsDue(alignedSeries(), officeRecord(belowGate), 10, false),
    ).toEqual([])
    expect(
      humanDevelopmentPrintsDue(alignedSeries(), officeRecord(belowGate), 10, true),
    ).toHaveLength(1)
    expect(
      humanDevelopmentPrintsDue(alignedSeries(), officeRecord(), 10, false),
    ).toHaveLength(1)
  })

  it('indexes the release-date bucket without rescanning the century archive', () => {
    const currentQtr = 1000
    const publishedAt = currentQtr + 2
    let indexedReads = 0
    const withArchive = (value: number): StatPrint[] => {
      const points = Array.from({ length: currentQtr }, (_, forQtr) =>
        print(value, { forQtr, publishedAt: forQtr + 2 }),
      )
      points.push(print(value, { forQtr: currentQtr, publishedAt }))
      return new Proxy(points, {
        get(target, property, receiver) {
          if (typeof property === 'string' && /^\d+$/.test(property)) indexedReads++
          return Reflect.get(target, property, receiver)
        },
      })
    }

    const releases = humanDevelopmentPrintsDue(
      {
        life_expectancy: withArchive(52.5),
        human_capital: withArchive(50),
        gdp_per_capita: withArchive(Math.sqrt(500)),
      },
      officeRecord(INDICATOR_FUNDED_AT.human_development, currentQtr + 1),
      publishedAt,
      false,
    )

    expect(releases).toHaveLength(1)
    // A full scan reads more than 3,000 entries here. Binary lookup plus the
    // one-release buckets remains logarithmic as the archive grows.
    expect(indexedReads).toBeLessThan(200)
  })
})
