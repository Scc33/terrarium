/**
 * Who a drafted programme change reaches, read off the ministry's own rules.
 * Unfogged on purpose (see `../../incidence`): the schedule of claims is a thing
 * the government wrote, so it owes no survey to know it. The money only — a
 * preview of how households would FEEL about it would be a preview of the
 * player's own scoring function.
 */

import { TooltipLabel } from '../../components/ui'
import { COHORT_NAMES, COHORT_NOTES } from '../../components/labels'
import type { Incidence } from '../../incidence'

export function IncidenceNote({ incidence }: { incidence: Incidence }) {
  const { booked, delivered, deliveryRate, rows } = incidence
  const cutting = booked < 0
  const signed = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`
  return (
    <div className="mt-1.5 border-t border-dossier-paper/10 pt-1.5">
      <div className="flex items-baseline justify-between font-mono text-[8px] tracking-[0.12em] text-dossier-paper/45">
        <span>{cutting ? 'WHO LOSES IT' : 'WHO IT REACHES'}</span>
        <TooltipLabel
          label="Delivered spending"
          content="The share that reaches households after losses in the civil service. The treasury pays the full amount either way."
          className="text-dossier-paper/45"
        >
          {(deliveryRate * 100).toFixed(0)}% DELIVERED
        </TooltipLabel>
      </div>
      <ul className="mt-1 flex flex-col gap-0.5">
        {rows.map((row) => (
          <li key={row.cohort} className="flex items-baseline justify-between gap-2 font-mono text-[9px] text-dossier-paper/70">
            <TooltipLabel
              label={COHORT_NAMES[row.cohort]}
              content={COHORT_NOTES[row.cohort]}
              className="truncate text-dossier-paper/70"
            />
            <span className="shrink-0 tabular-nums text-dossier-paper/85">{signed(row.delivered)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-1 font-mono text-[8px] leading-snug text-dossier-paper/40">
        BOOKS {signed(booked)} · HOUSEHOLDS {signed(delivered)}
      </div>
    </div>
  )
}
