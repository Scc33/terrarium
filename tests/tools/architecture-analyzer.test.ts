import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { analyzeRepo } from '../../packages/architecture-visualizer/scripts/analyze'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const snapshot = analyzeRepo(repoRoot)

describe('architecture analyzer', () => {
  it('reads the ordered tick from the pipeline source', () => {
    expect(snapshot.pipeline.map((step) => step.name)).toEqual([
      'shocks',
      'demography',
      'technology',
      'world',
      'finance',
      'foreignInvestment',
      'production',
      'environment',
      'trade',
      'fiscal',
      'monetary',
      'prices',
      'labor',
      'cohorts',
      'institutions',
      'statistics',
      'politics',
    ])
    expect(snapshot.pipeline.find((step) => step.name === 'statistics')).toMatchObject({
      order: 16,
      moduleId: 'packages/engine/src/pipeline/statistics.ts',
    })
  })

  it('derives state areas and source locations for every step', () => {
    for (const step of snapshot.pipeline) {
      expect(step.path).toMatch(/^packages\/engine\/src\/pipeline\/.*\.ts$/)
      expect(step.line).toBeGreaterThan(0)
      expect(step.stateAreas.length, step.name).toBeGreaterThan(0)
    }
    expect(snapshot.pipeline.find((step) => step.name === 'statistics')?.stateAreas).toEqual(
      expect.arrayContaining(['meta', 'stats']),
    )
  })

  it('resolves package boundaries from real imports', () => {
    expect(snapshot.packageEdges).toContainEqual(
      expect.objectContaining({ source: 'observation', target: 'engine' }),
    )
    expect(snapshot.packageEdges).toContainEqual(expect.objectContaining({ source: 'ui', target: 'engine' }))
    expect(snapshot.packageEdges).toContainEqual(
      expect.objectContaining({ source: 'ui', target: 'observation' }),
    )
  })

  it('keeps the visualizer itself out of the simulation inventory', () => {
    expect(snapshot.packages.some((pkg) => pkg.id === 'architecture-visualizer')).toBe(false)
    expect(snapshot.modules.some((module) => module.id.includes('architecture-visualizer'))).toBe(false)
  })
})
