/**
 * THE POLICY RECORD — what you set, over the whole century.
 *
 * The wall publishes what happened TO the economy. Nothing published what you
 * did to it: the control rail only ever showed the rate now, so "what was the
 * policy rate twenty quarters ago" was a question the game could not answer
 * about the one subject it has no fog over (issue #54). Everything here is
 * exact for that reason — these are the government's own minutes, not a
 * survey of them, so there is no error band and no revision stamp anywhere.
 *
 * The overlay is deliberately two registers of the same fact side by side,
 * because they answer different questions:
 *   • the CHARTS are what was in force — including the quarters an indexed
 *     appropriation moved on its own, which is a thing that happened to the
 *     budget whether or not anyone chose it;
 *   • the MINUTE BOOK is what was decided, and it must not report drift as a
 *     decision. `policyRecord.ts` carries that rule and its test.
 *
 * The scrubber ties them together: park it on a year and the readout says
 * what every dial was set to, with the minute book beneath showing the orders
 * that got them there.
 */

import { useState } from 'react'
import type { PolicyPoint, PublishedState } from '@terrarium/observation'
import {
  ChartFrame,
  EmptyState,
  Modal,
  OverlayLayout,
  SegmentedControl,
  StackedAreaChart,
  TimeSeriesChart,
} from '../components/ui'
import { SHARE_INKS, type Share, type StackRow } from '../shares'
import {
  POLICY_LINES,
  POLICY_LINES_BY_GROUP,
  RULE_MODE_LABEL,
  formatPolicyValue,
  formatRuleValue,
  policyAt,
  policyChanges,
  type PolicyChange,
  type PolicyLine,
} from '../policyRecord'

const yearOf = (q: number) => 1946 + Math.floor(q / 4)
const qtrLabel = (q: number) => `${yearOf(q)} Q${(q % 4) + 1}`

const CHART_W = 560
const TAX_INK = SHARE_INKS

/** The appropriation band and the subsidy band share one slot: they are the
 * same kind of figure (money voted, stacked) and the overlay has room for one
 * of them at a time. */
type Band = 'appropriations' | 'subsidies'

function sharesFor(lines: readonly PolicyLine[], at: PolicyPoint | null): Share[] {
  return lines.map((line, i) => ({
    key: line.key,
    label: line.label,
    value: at ? line.read(at) : 0,
    ink: SHARE_INKS[i % SHARE_INKS.length],
    note: line.note,
  }))
}

function stackRows(record: readonly PolicyPoint[], lines: readonly PolicyLine[]): StackRow[] {
  return record.map((point) => ({
    tick: point.tick,
    values: Object.fromEntries(lines.map((line) => [line.key, line.read(point)])),
  }))
}

// ---- the readout: every dial, as it stood in the scrubbed quarter ----

function Readout({
  at,
  changedHere,
}: {
  at: PolicyPoint
  changedHere: ReadonlySet<string>
}) {
  return (
    <div className="flex flex-col">
      {POLICY_LINES.map((line, i) => {
        // the readout reads back in cabinet order, so a group heading is
        // simply the first line that belongs to it
        const heading = POLICY_LINES[i - 1]?.group === line.group ? null : line.group
        const rule = line.key.startsWith('spending.')
          ? at.rules[line.key.slice('spending.'.length) as keyof PolicyPoint['rules']]
          : null
        return (
          <div key={line.key}>
            {heading && (
              <div className="mt-1.5 border-b border-dossier-ink/15 pb-0.5 font-mono text-[8px] font-semibold tracking-[0.22em] text-dossier-ink/50 first:mt-0">
                {heading}
              </div>
            )}
            <div
              className="flex items-baseline justify-between gap-2 py-[2px] font-mono text-[10px] tabular-nums"
              title={line.note}
            >
              <span className="flex min-w-0 items-baseline gap-1 truncate text-dossier-ink/70">
                {changedHere.has(line.key) && (
                  <span className="text-dossier-brass" aria-label="set this quarter" title="The cabinet moved this dial in this very quarter.">▸</span>
                )}
                <span className="truncate text-[9px] tracking-[0.08em]">{line.label}</span>
              </span>
              <span className="flex shrink-0 items-baseline gap-1.5">
                {rule && rule.mode !== 'fixed' && (
                  <span
                    className="text-[8px] tracking-[0.1em] text-dossier-ink/45"
                    title={`This appropriation is not a fixed cheque: it is ${formatRuleValue(rule.mode, rule.value)}, re-resolved every quarter.`}
                  >
                    {RULE_MODE_LABEL[rule.mode]}
                  </span>
                )}
                <span className="font-semibold text-dossier-ink">
                  {formatPolicyValue(line.unit, line.read(at))}
                </span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---- the minute book: the orders themselves, newest first ----

function MinuteBook({
  changes,
  selectedTick,
  onSelect,
}: {
  changes: readonly PolicyChange[]
  selectedTick: number
  onSelect: (tick: number) => void
}) {
  if (changes.length === 0) {
    return (
      <div className="border border-dossier-ink/20 px-3 py-4 text-center font-dossier text-[11px] italic leading-snug text-dossier-ink/60">
        Nothing has been decided yet. The dials still stand where 1946 left them.
      </div>
    )
  }
  // a literal cap, not a computed one: the list scrolls inside its own box so
  // a century of orders can never push the overlay past the viewport, and the
  // number is chosen to sit just under the charts' column beside it
  return (
    <ul className="flex max-h-[352px] flex-col overflow-y-auto border border-dossier-ink/20">
      {changes.map((change, i) => (
        <li key={`${change.tick}-${change.key}-${i}`}>
          <button
            type="button"
            onClick={() => onSelect(change.tick)}
            aria-current={change.tick === selectedTick}
            className={`flex w-full items-baseline justify-between gap-2 border-b border-dossier-ink/10 px-2 py-1 text-left font-mono text-[9px] tabular-nums hover:bg-dossier-brass/15 focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-dossier-brass ${
              change.tick === selectedTick ? 'bg-dossier-brass/20' : ''
            }`}
            title={
              change.from === null
                ? `${change.label} opened at ${formatPolicyValue(change.unit, change.to)} in the 1946 settlement.`
                : `${change.label} moved from ${formatPolicyValue(change.unit, change.from)} to ${formatPolicyValue(change.unit, change.to)}. Click to scrub the record to this quarter.`
            }
          >
            <span className="w-[52px] shrink-0 text-dossier-ink/55">{qtrLabel(change.tick)}</span>
            <span className="min-w-0 flex-1 truncate text-[8px] tracking-[0.08em] text-dossier-ink/75">
              {change.label}
              {change.rule && change.rule.mode !== 'fixed' && (
                <span className="ml-1 text-dossier-ink/45">{RULE_MODE_LABEL[change.rule.mode]}</span>
              )}
            </span>
            <span className="shrink-0 font-semibold text-dossier-ink">
              {change.from === null
                ? formatPolicyValue(change.unit, change.to)
                : `${formatPolicyValue(change.unit, change.from)} → ${formatPolicyValue(change.unit, change.to)}`}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

export function PolicyOverlay({ pub, onClose }: { pub: PublishedState; onClose: () => void }) {
  const record = pub.policy
  const [band, setBand] = useState<Band>('appropriations')
  const [mode, setMode] = useState<'money' | 'share'>('money')
  const [sel, setSel] = useState(record.length - 1)

  const idx = Math.min(Math.max(sel, 0), Math.max(record.length - 1, 0))
  const at = record[idx] ?? policyAt(record, pub.tick)
  const changes = policyChanges(record)
  const newestFirst = [...changes].reverse()
  const xMin = record[0]?.tick ?? 0
  const xMax = record[record.length - 1]?.tick ?? pub.tick
  const markTick = at?.tick ?? pub.tick
  const changedHere = new Set(changes.filter((c) => c.tick === markTick).map((c) => c.key))
  const scrubRule = { axis: 'x' as const, at: markTick, color: 'var(--color-dossier-brass)', opacity: 0.8 }

  const taxLines = POLICY_LINES_BY_GROUP.TAXATION
  const bandLines = band === 'appropriations' ? POLICY_LINES_BY_GROUP.SPENDING : POLICY_LINES_BY_GROUP.SUBSIDIES
  const bandKeys = sharesFor(bandLines, at)
  const bandRows = stackRows(record, bandLines)
  // a subsidy that was never paid stacks to nothing, and the stacked chart's
  // own empty message would blame the length of the record for it
  const bandEverPaid = bandRows.some((row) => Object.values(row.values).some((v) => v > 1e-9))

  const hasHistory = record.length >= 2
  const latest = record[record.length - 1]

  const taxSummary = latest
    ? `Tax rates set by the cabinet from ${yearOf(xMin)} to ${yearOf(xMax)}. Currently income ${(100 * latest.taxRates.income).toFixed(1)}%, corporate ${(100 * latest.taxRates.corporate).toFixed(1)}%, tariff ${(100 * latest.taxRates.tariff).toFixed(1)}%, fuel excise ${(100 * latest.taxRates.fuel).toFixed(1)}%.`
    : 'No policy record yet.'
  const rateSummary = latest
    ? `The policy rate set by the cabinet from ${yearOf(xMin)} to ${yearOf(xMax)}. Currently ${(100 * latest.policyRate).toFixed(2)}% annualized.`
    : 'No policy record yet.'
  const bandSummary = `${band === 'appropriations' ? 'Appropriations' : 'Subsidies'} voted per quarter from ${yearOf(xMin)} to ${yearOf(xMax)}, stacked ${mode === 'share' ? 'as shares of their own total' : 'as money'}.`

  return (
    // `full`, not `wide`: three registers have to sit side by side without the
    // minute book falling below the fold, and the charts are width-governed by
    // their viewBox — widening their column would grow them vertically too, so
    // the extra width all goes to the readout and the record beside it.
    <Modal title="THE POLICY RECORD — WHAT YOU SET, QUARTER BY QUARTER" onClose={onClose} size="full">
      <OverlayLayout
        summary={(
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
              {record.length} QUARTER{record.length === 1 ? '' : 'S'} ON THE RECORD ·{' '}
              {changes.length} ORDER{changes.length === 1 ? '' : 'S'} ENTERED
            </span>
            <span className="font-mono text-[10px] tracking-[0.15em] text-dossier-ink/60">
              SHOWING {qtrLabel(markTick)}
            </span>
          </div>
        )}
        toolbar={(
          <>
            <SegmentedControl
              label="Voted money"
              value={band}
              onChange={setBand}
              options={[
                { value: 'appropriations', label: 'APPROPRIATIONS', title: 'The four recurring programmes, as resolved each quarter.' },
                { value: 'subsidies', label: 'SUBSIDIES', title: 'Money paid to firms, by sector.' },
              ]}
            />
            <SegmentedControl
              label="Chart mode"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'money', label: 'LEVELS', title: 'Money per quarter — how much was voted.' },
                { value: 'share', label: 'SHARES', title: 'Each quarter normalised to its own total — how the priorities shifted.' },
              ]}
            />
          </>
        )}
        note={(
          <>
            These are your own minutes, so they are exact and never revised — unlike every
            instrument on the wall. The charts show what was <em>in force</em>; the minute book
            beside them shows what was <em>decided</em>. They differ on purpose: an indexed or
            GDP-share appropriation moves itself every quarter, and drift is not an order.
          </>
        )}
        footer="EXACT CABINET MINUTES · QUARTERLY · NEVER REVISED"
      >
        {hasHistory && at ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px_276px]">
            {/* left: what was in force, across the century */}
            <div className="flex min-w-0 flex-col gap-2">
              <ChartFrame
                title="TAX RATES"
                detail="PER CENT · EXACT"
                summary={taxSummary}
                legend={taxLines.map((line, i) => ({ label: line.label, color: TAX_INK[i % TAX_INK.length] }))}
              >
                <TimeSeriesChart
                  width={CHART_W}
                  height={90}
                  traces={taxLines.map((line, i) => ({
                    key: line.key,
                    points: record.map((p) => ({ tick: p.tick, value: line.read(p) })),
                    color: TAX_INK[i % TAX_INK.length],
                    lead: i === 0,
                  }))}
                  // a rate is read against zero, and against the ceiling a
                  // cabinet could plausibly reach for — a flat 15% line filling
                  // the box says nothing about how big 15% is
                  include={[0, 40]}
                  xDomain={{ x0: xMin, x1: xMax }}
                  rules={[scrubRule]}
                  formatTick={(t) => String(yearOf(t))}
                  format={(v) => `${v.toFixed(0)}%`}
                  formatReading={(v) => `${v.toFixed(1)}%`}
                  summary={taxSummary}
                  hover
                />
              </ChartFrame>

              <ChartFrame
                title="THE POLICY RATE"
                detail="PER CENT / YEAR · EXACT"
                value={`${(100 * latest.policyRate).toFixed(2)}%`}
                summary={rateSummary}
              >
                <TimeSeriesChart
                  width={CHART_W}
                  height={54}
                  traces={[{
                    key: 'policyRate',
                    points: record.map((p) => ({ tick: p.tick, value: 100 * p.policyRate })),
                    fillTo: 0,
                    lead: true,
                  }]}
                  include={[0]}
                  xDomain={{ x0: xMin, x1: xMax }}
                  rules={[scrubRule]}
                  formatTick={(t) => String(yearOf(t))}
                  format={(v) => `${v.toFixed(0)}%`}
                  formatReading={(v) => `${v.toFixed(2)}%`}
                  summary={rateSummary}
                  hover
                />
              </ChartFrame>

              <ChartFrame
                title={band === 'appropriations' ? 'APPROPRIATIONS VOTED' : 'SUBSIDIES PAID'}
                detail={`MONEY / QUARTER · ${mode === 'share' ? 'AS SHARES' : 'AS LEVELS'} · EXACT`}
                summary={bandSummary}
                legend={bandKeys.map((k) => ({ label: k.label, color: k.ink }))}
              >
                {bandEverPaid ? (
                  <StackedAreaChart
                    rows={bandRows}
                    keys={bandKeys}
                    mode={mode}
                    markTick={markTick}
                    height={93}
                    format={(v) => v.toFixed(1)}
                  />
                ) : (
                  <EmptyState title="NOTHING WAS EVER PAID" compact>
                    No sector has been subsidised in this run. The dials are on the cabinet’s
                    subsidies desk.
                  </EmptyState>
                )}
              </ChartFrame>
            </div>

            {/* right: what it was on one day, and the orders that got it there */}
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9px] font-medium tracking-[0.22em] text-dossier-ink/60">
                  THE DIALS AS THEY STOOD
                </span>
                <span className="font-mono text-sm font-semibold tabular-nums text-dossier-ink">
                  {qtrLabel(at.tick)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={record.length - 1}
                value={idx}
                onChange={(e) => setSel(Number(e.target.value))}
                className="w-full accent-dossier-brass"
                aria-label="Scrub the policy record"
                title="Scrub the century — the charts mark the quarter you land on."
              />
              <Readout at={at} changedHere={changedHere} />
            </div>

            {/* third: the orders themselves */}
            <div className="flex min-w-0 flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[9px] font-medium tracking-[0.22em] text-dossier-ink/60">
                  THE MINUTE BOOK
                </span>
                <span className="font-mono text-[8px] tracking-[0.12em] text-dossier-ink/45">NEWEST FIRST</span>
              </div>
              <MinuteBook
                changes={newestFirst}
                selectedTick={markTick}
                onSelect={(tick) => {
                  const i = record.findIndex((p) => p.tick === tick)
                  if (i >= 0) setSel(i)
                }}
              />
            </div>
          </div>
        ) : (
          <EmptyState title="THE RECORD IS ONE QUARTER OLD">
            You have not governed long enough to have a record. Set a dial, advance a quarter,
            and the minutes start here.
          </EmptyState>
        )}
      </OverlayLayout>
    </Modal>
  )
}
