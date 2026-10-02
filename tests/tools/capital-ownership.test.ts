import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createCountryParams, init, rngFor } from '../../packages/engine/src/index'
import { cohorts } from '../../packages/engine/src/pipeline/cohorts'
import { labor } from '../../packages/engine/src/pipeline/labor'
import { auditQuarter, createAudit, studyProvenance } from '../../tools/measure-capital-ownership'

describe('capital ownership study provenance', () => {
  it('distinguishes clean, unstaged, staged and untracked inputs at the same HEAD', () => {
    const repo = mkdtempSync(join(tmpdir(), 'capital-ownership-provenance-'))
    const git = (...args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8' })
    try {
      git('init', '--quiet')
      writeFileSync(join(repo, 'input.ts'), 'export const capital = 1\n')
      git('add', 'input.ts')
      git('-c', 'user.name=Terrarium test', '-c', 'user.email=test@example.invalid',
        '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture')
      const clean = studyProvenance(repo)
      expect(clean.dirty).toBe(false)
      expect(clean.runtime).toEqual({ node: process.version, platform: process.platform, arch: process.arch })
      writeFileSync(join(repo, 'input.ts'), 'export const capital = 2\n')
      expect(studyProvenance(repo)).toMatchObject({ commit: clean.commit, dirty: true })
      git('add', 'input.ts')
      expect(studyProvenance(repo)).toMatchObject({ commit: clean.commit, dirty: true })
      git('reset', '--quiet', '--hard', 'HEAD')
      writeFileSync(join(repo, 'new-input.ts'), 'export const capital = 3\n')
      expect(studyProvenance(repo)).toMatchObject({ commit: clean.commit, dirty: true })
    } finally {
      rmSync(repo, { recursive: true, force: true })
    }
  })
})

function flooredQuarter() {
  const seed = 'ownership-floor-regression'
  const initial = init(createCountryParams('meridia', seed), seed)
  const before = {
    ...initial,
    sectors: initial.sectors.map((s, index) => ({ ...s, capital: index === 0 ? 0.5 : 10 })),
    flows: { ...initial.flows, investmentReal: 0, foreignDirectInvestmentReal: 0,
      cohortSpend: { ...initial.flows.cohortSpend, business_owners: 1_000_000 } },
  }
  const accumulated = labor.run(before, rngFor(seed, labor.name, before.meta.tick))
  const after = cohorts.run(accumulated, rngFor(seed, cohorts.name, before.meta.tick))
  return { before, after }
}

describe('capital ownership reconciliation with binding floors', () => {
  it('accepts legitimate sector and household floor corrections', () => {
    const { before, after } = flooredQuarter()
    const audit = createAudit()
    expect(after.sectors[0].capital).toBe(1)
    expect(after.cohorts.find((c) => c.id === 'business_owners')!.savings).toBe(0)
    auditQuarter(before, after, audit)
    expect(audit.capitalFloorQuarters).toBe(1)
    expect(audit.savingsFloorQuarters).toBe(1)
    expect(audit.capitalFloorAddition).toBeCloseTo(0.5075)
    expect(audit.savingsFloorAddition).toBeGreaterThan(0)
    expect(audit.maxCapitalStockResidual).toBe(0)
    expect(audit.maxSavingsStockResidual).toBe(0)
  })

  it.each([-0.25, 0.25])('rejects a %f capital error concealed by another sector’s floor', (change) => {
    const { before, after } = flooredQuarter()
    const corrupted = { ...after,
      sectors: after.sectors.map((s, index) => ({ ...s, capital: s.capital + (index === 1 ? change : 0) })) }
    // Both signs passed the old aggregate-only check: the 0.5075 legitimate
    // correction leaves a nonnegative residual even after the injected loss.
    expect(() => auditQuarter(before, corrupted, createAudit())).toThrow(/capital accumulation \[manuf\]/)
  })

  it.each([-0.25, 0.25])('rejects a %f savings error concealed by another cohort’s floor', (change) => {
    const { before, after } = flooredQuarter()
    const corrupted = { ...after,
      cohorts: after.cohorts.map((c) => ({ ...c, savings: c.savings + (c.id === 'professionals' ? change : 0) })) }
    expect(() => auditQuarter(before, corrupted, createAudit()))
      .toThrow(/household savings accumulation \[professionals\]/)
  })

  it('rejects offsetting stock errors even when the aggregate is unchanged', () => {
    const { before, after } = flooredQuarter()
    const corrupted = { ...after,
      sectors: after.sectors.map((s, index) => ({ ...s,
        capital: s.capital + (index === 1 ? 0.25 : index === 2 ? -0.25 : 0) })) }
    expect(() => auditQuarter(before, corrupted, createAudit())).toThrow(/capital accumulation/)
  })
})
