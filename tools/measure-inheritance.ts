/**
 * What a later posting actually hands the player (ADR-0021):
 *
 *   pnpm inheritance -- --runs 24
 *
 * The posting room offers a year, not a country — the country is whatever the
 * caretaker's interregnum produced by then, and that is a measured fact rather
 * than an authored one. This is how the table in `docs/country-scenarios.md`
 * is produced, and how a retune of `CARETAKER_*` is checked: it prints, per
 * curated opening and per offered appointment, the state of the country on the
 * day the player walks in.
 *
 * `reporting` is the column that decides whether an appointment is playable at
 * all. A passive interregnum arrives at the 1946 statistical office and puts 3
 * of 29 instruments on the wall, which is not a later game.
 */

import {
  APPOINTMENTS,
  CURATED_COUNTRY_IDS,
  createCountryParams,
  runInterregnum,
  SECTOR_IDS,
  totalLaborForce,
  type TrueState,
} from '../packages/engine/src/index'
import { INDICATOR_IDS, observe } from '../packages/observation/src/index'

function arg(name: string, fallback: string): string {
  const prefix = `--${name}=`
  const inline = process.argv.find((value) => value.startsWith(prefix))
  if (inline) return inline.slice(prefix.length)
  const index = process.argv.indexOf(`--${name}`)
  return index >= 0 ? (process.argv[index + 1] ?? fallback) : fallback
}

const RUNS = Number(arg('runs', '24'))
if (!Number.isInteger(RUNS) || RUNS <= 0) throw new Error('--runs must be a positive integer')

const median = (values: number[]): number =>
  values.slice().sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? NaN

const realGdp = (s: TrueState): number => s.sectors.reduce((sum, x) => sum + x.output, 0)
const population = (s: TrueState): number => s.demography.pyramid.reduce((a, b) => a + b, 0)

interface Reading {
  gdpFactor: number
  popFactor: number
  statistical: number
  reporting: number
  unemployment: number
  debtToGdp: number
  unrest: number
  gdpPerHead: number
}

function read(opening: TrueState, arrival: TrueState): Reading {
  return {
    gdpFactor: realGdp(arrival) / Math.max(realGdp(opening), 1e-9),
    popFactor: population(arrival) / Math.max(population(opening), 1e-9),
    statistical: arrival.gov.capacity.statistical,
    reporting: Object.keys(observe(arrival).indicators).length,
    unemployment: arrival.flows.unemployment,
    debtToGdp: arrival.gov.debt / Math.max(4 * arrival.flows.nominalGdp, 1e-9),
    unrest: arrival.institutions.unrest,
    // per head, because half of what the interregnum does to a poor country is
    // demographic: Costona's output triples while its population does too
    gdpPerHead:
      realGdp(arrival) / Math.max(population(arrival), 1e-9) /
      (realGdp(opening) / Math.max(population(opening), 1e-9)),
  }
}

const started = performance.now()
console.log(
  `the inheritance: ${RUNS} seeds x ${CURATED_COUNTRY_IDS.length} countries x ${APPOINTMENTS.length} appointments`,
)
console.log(`instruments in the catalogue: ${INDICATOR_IDS.length}; labour force is live (${SECTOR_IDS.length} sectors)`)

for (const appointment of APPOINTMENTS) {
  console.log(`\n${appointment.year} · ${appointment.name} (quarter ${appointment.tick})`)
  console.log(
    [
      'country'.padEnd(10),
      'GDPx'.padStart(6),
      'GDP/headx'.padStart(10),
      'popx'.padStart(6),
      'stat'.padStart(5),
      'reporting'.padStart(10),
      'unemp'.padStart(6),
      'debt/GDP'.padStart(9),
      'unrest'.padStart(7),
      'labour'.padStart(8),
    ].join(' '),
  )
  for (const country of CURATED_COUNTRY_IDS) {
    const readings: Reading[] = []
    let labour = 0
    for (let index = 0; index < RUNS; index++) {
      const seed = `inheritance-${index}`
      const params = createCountryParams(country, seed)
      const opening = runInterregnum(params, seed, 'standard', 0).state
      const arrival = runInterregnum(params, seed, 'standard', appointment.tick).state
      readings.push(read(opening, arrival))
      labour += totalLaborForce(arrival)
    }
    const col = (pick: (r: Reading) => number) => median(readings.map(pick))
    console.log(
      [
        country.padEnd(10),
        col((r) => r.gdpFactor).toFixed(2).padStart(6),
        col((r) => r.gdpPerHead).toFixed(2).padStart(10),
        col((r) => r.popFactor).toFixed(2).padStart(6),
        col((r) => r.statistical).toFixed(2).padStart(5),
        `${col((r) => r.reporting).toFixed(0)}/${INDICATOR_IDS.length}`.padStart(10),
        `${(100 * col((r) => r.unemployment)).toFixed(1)}%`.padStart(6),
        `${(100 * col((r) => r.debtToGdp)).toFixed(0)}%`.padStart(9),
        col((r) => r.unrest).toFixed(2).padStart(7),
        (labour / RUNS).toFixed(1).padStart(8),
      ].join(' '),
    )
  }
}
console.log(`\nwall time: ${((performance.now() - started) / 1000).toFixed(1)}s`)
