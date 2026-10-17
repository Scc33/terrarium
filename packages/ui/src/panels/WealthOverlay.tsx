import { WEALTH_SURVEY_FUNDED_AT } from '@terrarium/engine'
import { HOUSEHOLD_WEALTH_COMPONENT_IDS, type PublishedState } from '@terrarium/observation'
import { ChartFrame, EmptyState, Metric, Modal, OverlayLayout, SegmentedControl, TimeSeriesChart } from '../components/ui'
import { qtrLabel } from '../components/series'
import { usePopulationBasis } from '../shell/usePopulationBasis'
import { householdWealthBand, wealthAvailability, wealthHistory, wealthChart, WEALTH_FACE } from '../wealth'

const number = (value: number) => value.toFixed(2)
const uncertainty = (value: number) => value > 0 && value < 0.005 ? '±<0.01' : `±${number(value)}`
const SERIES = [
  { key: 'household', label: 'HOUSEHOLD NET WORTH', ink: 'var(--color-dossier-felt)' },
  { key: 'public', label: 'PUBLIC NET WORTH', ink: 'var(--color-dossier-warn)' },
  { key: 'national', label: 'NATIONAL NET WORTH', ink: 'var(--color-dossier-ink)' },
] as const

export function WealthOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const [basis, setBasis] = usePopulationBasis()
  const history = wealthHistory(pub, basis)
  const latest = history.at(-1)
  if (!latest) return <Modal title="WEALTH — ASSETS AND THEIR CLAIMS" onClose={onClose} size="wide">
    <EmptyState title={wealthAvailability(pub) === 'unfunded' ? 'THE ASSET SURVEY IS NOT YET FUNDED' : 'THE ASSET RETURNS ARE STILL COMING IN'} requirement="ASSET AND LIABILITY SURVEY">
      {wealthAvailability(pub) === 'unfunded'
        ? `Raise statistical capacity to ${(WEALTH_SURVEY_FUNDED_AT * 100).toFixed(0)} to survey household assets and debts. Productive capital alone does not measure what households own.`
        : 'The survey is commissioned. Its first release follows the ordinary statistical publication lag.'}
    </EmptyState>
  </Modal>
  const units = basis === 'perPerson' ? 'CURRENT MONEY / PERSON' : 'CURRENT MONEY · TOTAL'
  const readings = { household: latest.household.netWorth, public: latest.publicNetWorth, national: latest.nationalNetWorth }
  const band = householdWealthBand(latest)
  const bands = { household: band, public: latest.publicErrorBand, national: latest.nationalErrorBand }
  return <Modal title="WEALTH — ASSETS AND THEIR CLAIMS" onClose={onClose} size="wide">
    <OverlayLayout summary={<div className="flex flex-wrap gap-x-8 gap-y-2">
      {SERIES.map(series => <Metric key={series.key} label={series.label} value={number(readings[series.key])} detail={`${units} · ${latest.errorBand > 0 ? uncertainty(bands[series.key]) : '±?'}`}
        title={series.key === 'household' ? 'Assets less business loans and household overdrafts. Includes directly owned businesses.' : series.key === 'public' ? 'Public capital and public financial assets less sovereign and monetary liabilities. A negative position is shown as debt, not clipped to zero.' : 'Households plus the consolidated public sector. Domestic deposits, loans, bonds and bank equity cancel against their counterparties.'} />)}
    </div>} toolbar={<SegmentedControl label="Wealth population basis" value={basis} onChange={setBasis}
      options={[{ value: 'total', label: 'TOTALS' }, { value: 'perPerson', label: 'PER PERSON' }]} />}
      footer={`ASSET SURVEY · ${qtrLabel(latest.forQtr)} · ${pub.tick - latest.forQtr}Q BEHIND TODAY · REVISION ${latest.revision}`}
      note={<>Current money: capital at today’s prices and valuation; bonds at quoted yields; deposits and loans at book value. Domestic claims cancel in national wealth. Housing, land and pensions have no stocks in this model.</>}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SERIES.map(series => <ChartFrame key={series.key} title={series.label} detail={units} summary={`${series.label}, ${number(readings[series.key])} at the latest survey.`}>
          <TimeSeriesChart width={300} height={130} traces={[{ key: series.key, points: wealthChart(history, series.key), color: series.ink, lead: true }]}
            ribbon={{ points: wealthChart(history, series.key).filter(point => point.band > 0), color: series.ink }}
            include={[0]} formatTick={qtrLabel} formatReading={number} hover summary={`${series.label} across the published history.`} />
        </ChartFrame>)}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full font-mono text-[11px] tabular-nums">
          <caption className="mb-2 text-left text-[9px] tracking-[0.15em]">THE HOUSEHOLD BALANCE SHEET · {units}</caption>
          <thead><tr className="border-b border-dossier-ink/25 text-left"><th className="py-0.5 font-medium">ASSET / LIABILITY</th><th className="text-right font-medium">SURVEYED AMOUNT</th><th className="pl-4 text-right font-medium">BAND</th></tr></thead>
          <tbody>{HOUSEHOLD_WEALTH_COMPONENT_IDS.map(id => <tr key={id} className="border-b border-dossier-ink/10">
            <th scope="row" className="py-0.5 text-left font-normal" title={WEALTH_FACE[id].note}>{WEALTH_FACE[id].liability ? '− ' : '+ '}{WEALTH_FACE[id].label}</th>
            <td className="text-right">{number(latest.household[id])}</td><td className="pl-4 text-right text-dossier-ink/60">{latest.errorBand > 0 ? uncertainty(latest.household[id] * latest.errorBand) : '±?'}</td>
          </tr>)}</tbody>
          <tfoot><tr><th scope="row" className="pt-1 text-left">NET WORTH</th><td className="pt-1 text-right">{number(latest.household.netWorth)}</td><td className="pl-4 pt-1 text-right">{latest.errorBand > 0 ? uncertainty(band) : '±?'}</td></tr></tfoot>
        </table>
      </div>
    </OverlayLayout>
  </Modal>
}
