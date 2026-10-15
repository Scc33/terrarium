/** Paired, legal maturity strategies under a hike and a cut. pnpm yield-curve
 * Every arm shares country, seed and starting orders. Safeties ensure the
 * intended orders execute; they do not make this an ordinary-play baseline. */
import { applyActions, COUNTRY_CATALOG, createCountryParams, init, step, validate } from '../packages/engine/src/index'

const arg = process.argv.indexOf('--runs')
const runs = arg < 0 ? 20 : Number(process.argv[arg + 1])
if (!Number.isInteger(runs) || runs < 1) throw new Error('--runs must be a positive integer')
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length
const round = (value: number) => Number(value.toFixed(4))
for (const country of COUNTRY_CATALOG) {
  for (const shock of ['hike', 'cut'] as const) {
    for (const [maturity, name] of [[0, 'short'], [0.5, 'balanced'], [1, 'long']] as const) {
      const interest: number[] = [], rollover: number[] = [], nextYear: number[] = [], debts: number[] = []
      for (let i = 0; i < runs; i++) {
        const seed = `yield-curve-${country.id}-${i}`
        let state = init(createCountryParams(country.id, seed), seed,
          { unlimitedCapital: true, protectedTenure: true, fullInstrumentation: true })
        const openingOutput = state.flows.nominalGdp
        state = applyActions(state, [
          { kind: 'setDial', path: 'debtMaturity', value: maturity },
          { kind: 'setDial', path: 'policyRate', value: shock === 'hike' ? 0.02 : 0.08 },
          { kind: 'setDial', path: 'spending.procurement', value: openingOutput * 0.12 },
        ])
        let coupons = 0, refinanced = 0
        for (let q = 0; q < 64; q++) {
          if (q === 16) state = applyActions(state, [{ kind: 'setDial', path: 'policyRate', value: shock === 'hike' ? 0.08 : 0.02 }])
          state = step(state)
          validate(state)
          coupons += state.flows.debtInterest
          refinanced += state.flows.bondsRefinanced
        }
        interest.push(coupons / openingOutput)
        rollover.push(refinanced / openingOutput)
        nextYear.push(state.gov.bonds.filter(lot => lot.maturesAt < state.meta.tick + 4)
          .reduce((sum, lot) => sum + lot.principal, 0) / openingOutput)
        debts.push(state.gov.debt / openingOutput)
      }
      console.log(JSON.stringify({ country: country.id, shock, maturity: name, runs,
        // Opening quarterly GDP units keep changing nominal growth from
        // changing the denominator of the outcome being compared.
        interest: round(mean(interest)), refinanced: round(mean(rollover)),
        dueNextYear: round(mean(nextYear)), finalDebt: round(mean(debts)) }))
    }
  }
}
