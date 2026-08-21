export type TooltipSide = 'auto' | 'top' | 'bottom'

interface TooltipPosition {
  x: number
  y: number
  arrowX: number
  side: Exclude<TooltipSide, 'auto'>
}

interface TooltipViewport {
  width: number
  height: number
  margin?: number
  gap?: number
}

const clamp = (value: number, lo: number, hi: number) => Math.min(Math.max(value, lo), hi)

/** Pure collision math, kept outside React so placement is easy to test. */
export function placeTooltip(
  trigger: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width'>,
  tooltip: { width: number; height: number },
  preferred: TooltipSide,
  viewport: TooltipViewport,
): TooltipPosition {
  const margin = viewport.margin ?? 10
  const gap = viewport.gap ?? 9
  const roomAbove = trigger.top - margin
  const roomBelow = viewport.height - trigger.bottom - margin
  const side = preferred === 'auto'
    ? roomAbove >= tooltip.height + gap || roomAbove >= roomBelow ? 'top' : 'bottom'
    : preferred === 'top' && roomAbove < tooltip.height + gap && roomBelow > roomAbove
      ? 'bottom'
      : preferred === 'bottom' && roomBelow < tooltip.height + gap && roomAbove > roomBelow
        ? 'top'
        : preferred
  const triggerCenter = trigger.left + trigger.width / 2
  const maxX = Math.max(margin, viewport.width - tooltip.width - margin)
  const x = clamp(triggerCenter - tooltip.width / 2, margin, maxX)
  const rawY = side === 'top' ? trigger.top - tooltip.height - gap : trigger.bottom + gap
  const maxY = Math.max(margin, viewport.height - tooltip.height - margin)
  const y = clamp(rawY, margin, maxY)
  const arrowX = clamp(triggerCenter - x, 12, Math.max(12, tooltip.width - 12))
  return { x, y, arrowX, side }
}
