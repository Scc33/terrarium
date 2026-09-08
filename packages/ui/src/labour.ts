/** The occupational labour survey, arranged for the labour office. */

import { LABOUR_SURVEY_FUNDED_AT } from '@terrarium/engine'
import {
  LABOUR_CLASS_IDS,
  type IndicatorId,
  type LabourClassId,
  type LabourMarketTableId,
  type PublishedState,
} from '@terrarium/observation'
import type { PlotPoint } from './plot'
import { SHARE_INKS } from './shares'

export const LABOUR_CLASS_FACE: Record<
  LabourClassId,
  { label: string; short: string; ink: string; note: string }
> = {
  rural_workers: {
    label: 'Rural workers',
    short: 'RURAL',
    ink: SHARE_INKS[0],
    note: 'Farm and village labour, including people recruited into rural posts from other trades.',
  },
  urban_workers: {
    label: 'Urban workers',
    short: 'URBAN',
    ink: SHARE_INKS[1],
    note: 'Wage workers in factories, energy, transport and the urban part of services.',
  },
  professionals: {
    label: 'Professionals',
    short: 'PROFESSIONAL',
    ink: SHARE_INKS[2],
    note: 'The trained workforce sought by professional posts, whether or not that is the work they found.',
  },
}

export type LabourAvailability = 'unfunded' | 'awaiting' | 'reporting'

export function labourAvailability(pub: PublishedState): LabourAvailability {
  if (pub.labour.length > 0) return 'reporting'
  return pub.rules.fullInstrumentation || pub.capacity.statistical >= LABOUR_SURVEY_FUNDED_AT
    ? 'awaiting'
    : 'unfunded'
}

/** Latest revision for every measured quarter, oldest first. */
function settled(points: PublishedState['labour']): PublishedState['labour'] {
  const best = new Map<number, PublishedState['labour'][number]>()
  for (const point of points) {
    const current = best.get(point.forQtr)
    if (!current || point.revision > current.revision) best.set(point.forQtr, point)
  }
  return [...best.values()].sort((a, b) => a.forQtr - b.forQtr)
}

export interface LabourClassReading {
  key: LabourClassId
  label: string
  short: string
  ink: string
  note: string
  /** percentage of this class's own labour force */
  jobless: number
  /** percentage of this class's own labour force */
  underemployed: number
}

export interface LabourRelease {
  forQtr: number
  lag: number
  revision: number
  errorBand: Record<LabourMarketTableId, number>
  rows: LabourClassReading[]
}

export function readLabour(pub: PublishedState): LabourRelease | null {
  const latest = settled(pub.labour).at(-1)
  if (!latest) return null
  return {
    forQtr: latest.forQtr,
    lag: pub.tick - latest.forQtr,
    revision: latest.revision,
    errorBand: latest.errorBand,
    rows: LABOUR_CLASS_IDS.map((key) => ({
      key,
      ...LABOUR_CLASS_FACE[key],
      jobless: 100 * latest.jobless[key],
      underemployed: 100 * latest.underemployed[key],
    })),
  }
}

export interface LabourTrace {
  key: LabourClassId
  label: string
  ink: string
  points: PlotPoint[]
}

export function labourTraces(
  pub: PublishedState,
  table: LabourMarketTableId,
): LabourTrace[] {
  const history = settled(pub.labour)
  return LABOUR_CLASS_IDS.map((key) => ({
    key,
    label: LABOUR_CLASS_FACE[key].short,
    ink: LABOUR_CLASS_FACE[key].ink,
    points: history.map((point) => ({ tick: point.forQtr, value: 100 * point[table][key] })),
  }))
}

/** Latest settled headline print, or null while its instrument is absent. */
export function latestLabourIndicator(
  pub: PublishedState,
  id: Extract<IndicatorId, 'unemployment' | 'labour_underuse'>,
): number | null {
  const points = pub.indicators[id]?.points
  if (!points || points.length === 0) return null
  const best = new Map<number, (typeof points)[number]>()
  for (const point of points) {
    const current = best.get(point.forQtr)
    if (!current || point.revision > current.revision) best.set(point.forQtr, point)
  }
  return [...best.values()].sort((a, b) => a.forQtr - b.forQtr).at(-1)?.value ?? null
}
