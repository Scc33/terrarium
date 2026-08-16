/**
 * One tooltip for the whole game.
 *
 * Native `title` bubbles are slow, unstyled and unavailable to most touch and
 * keyboard users. This trigger opens on pointer hover, keyboard focus or tap,
 * escapes every clipped wall tile through a portal, and flips at the viewport
 * edge. Keep the copy short: a tooltip should answer “what is this?”, not
 * become a second rulebook.
 */

import {
  cloneElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type AriaAttributes,
  type DOMAttributes,
  type ReactElement,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { placeTooltip, type TooltipSide } from './placement'

export type { TooltipSide } from './placement'

/**
 * Typed against `Element`, not `HTMLElement`, so a chart mark can be a trigger.
 *
 * `HTMLAttributes` and `SVGAttributes` share exactly this base, and half the
 * things in this game that need explaining are SVG — donut wedges, stacked
 * bands, a needle. Narrowing to HTML would leave those on the native `<title>`
 * bubble, which is the thing this component exists to replace.
 */
interface TooltipTriggerProps extends AriaAttributes, DOMAttributes<Element> {
  'aria-describedby'?: string
  'data-tooltip-trigger'?: string
}

type TriggerHandler<K extends keyof DOMAttributes<Element>> = NonNullable<DOMAttributes<Element>[K]>

function TooltipTrigger({
  children,
  describedBy,
  onPointerEnter,
  onPointerLeave,
  onPointerDown,
  onFocus,
  onBlur,
  onClick,
}: {
  children: ReactElement<TooltipTriggerProps>
  describedBy?: string
  onPointerEnter: TriggerHandler<'onPointerEnter'>
  onPointerLeave: TriggerHandler<'onPointerLeave'>
  onPointerDown: TriggerHandler<'onPointerDown'>
  onFocus: TriggerHandler<'onFocus'>
  onBlur: TriggerHandler<'onBlur'>
  onClick: TriggerHandler<'onClick'>
}) {
  return cloneElement(children, {
    'aria-describedby': describedBy,
    'data-tooltip-trigger': '',
    onPointerEnter: (event) => {
      children.props.onPointerEnter?.(event)
      onPointerEnter(event)
    },
    onPointerLeave: (event) => {
      children.props.onPointerLeave?.(event)
      onPointerLeave(event)
    },
    onPointerDown: (event) => {
      children.props.onPointerDown?.(event)
      onPointerDown(event)
    },
    onFocus: (event) => {
      children.props.onFocus?.(event)
      onFocus(event)
    },
    onBlur: (event) => {
      children.props.onBlur?.(event)
      onBlur(event)
    },
    onClick: (event) => {
      children.props.onClick?.(event)
      onClick(event)
    },
  })
}

export interface TooltipProps {
  content: ReactNode
  children: ReactElement<TooltipTriggerProps>
  side?: TooltipSide
  delay?: number
  /** Use for an explicit help cue, never for a control whose click has its own
   * job. Pointer-click focus should not leave a bubble covering the result. */
  openOnClick?: boolean
}

const OPEN_EVENT = 'terrarium:tooltip-open'

export function Tooltip({ content, children, side = 'auto', delay = 260, openOnClick = false }: TooltipProps) {
  const tooltipId = useId()
  const triggerRef = useRef<Element | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reasonsRef = useRef(new Set<'pointer' | 'focus' | 'tap'>())
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<ReturnType<typeof placeTooltip> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const close = useCallback(() => {
    clearTimer()
    reasonsRef.current.clear()
    setOpen(false)
    setPosition(null)
  }, [clearTimer])

  const openNow = useCallback(() => {
    clearTimer()
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: tooltipId }))
    setOpen(true)
  }, [clearTimer, tooltipId])

  const release = useCallback((reason: 'pointer' | 'focus') => {
    clearTimer()
    reasonsRef.current.delete(reason)
    if (reasonsRef.current.size === 0) {
      setOpen(false)
      setPosition(null)
    }
  }, [clearTimer])

  useEffect(() => {
    const onOtherOpen = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== tooltipId) close()
    }
    window.addEventListener(OPEN_EVENT, onOtherOpen)
    return () => {
      clearTimer()
      window.removeEventListener(OPEN_EVENT, onOtherOpen)
    }
  }, [clearTimer, close, tooltipId])

  useEffect(() => {
    if (!open) return
    const onDismiss = (event: PointerEvent) => {
      if (!triggerRef.current?.contains(event.target as Node)) close()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    document.addEventListener('pointerdown', onDismiss, true)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDismiss, true)
      window.removeEventListener('keydown', onKey)
    }
  }, [close, open])

  useLayoutEffect(() => {
    if (!open) return
    const update = () => {
      const trigger = triggerRef.current
      const tooltip = tooltipRef.current
      if (!trigger || !tooltip) return
      setPosition(placeTooltip(
        trigger.getBoundingClientRect(),
        tooltip.getBoundingClientRect(),
        side,
        { width: window.innerWidth, height: window.innerHeight },
      ))
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, side])

  const describedBy = [children.props['aria-describedby'], open ? tooltipId : null].filter(Boolean).join(' ') || undefined

  return (
    <>
      <TooltipTrigger
        describedBy={describedBy}
        onPointerEnter={(event) => {
      triggerRef.current = event.currentTarget
      if (event.defaultPrevented || event.pointerType === 'touch') return
      reasonsRef.current.add('pointer')
      clearTimer()
      timerRef.current = setTimeout(openNow, delay)
        }}
        onPointerLeave={(event) => {
      if (event.pointerType !== 'touch') release('pointer')
        }}
        onPointerDown={(event) => {
      triggerRef.current = event.currentTarget
      if (event.defaultPrevented) return
      // Browsers focus buttons as part of a pointer click. That focus is not a
      // keyboard request for help and must not leave a tooltip over the action
      // the player just took. A real Tab focus still opens immediately.
      if (event.pointerType !== 'touch') {
        close()
        return
      }
      if (reasonsRef.current.has('tap')) close()
      else {
        reasonsRef.current.clear()
        reasonsRef.current.add('tap')
        openNow()
      }
        }}
        onFocus={(event) => {
      triggerRef.current = event.currentTarget
      // `focus-visible` follows the browser's input-modality heuristic. It
      // includes Tab focus, but excludes mouse focus and focus transferred by
      // a panel-opening click, even when the newly focused element is wrapped
      // by a different Tooltip instance.
      if (event.defaultPrevented || !event.currentTarget.matches(':focus-visible')) return
      reasonsRef.current.add('focus')
      openNow()
        }}
        onBlur={() => {
      release('focus')
        }}
        onClick={(event) => {
      triggerRef.current = event.currentTarget
      if (!openOnClick || event.defaultPrevented) return
      reasonsRef.current.clear()
      reasonsRef.current.add('tap')
      openNow()
        }}
      >
        {children}
      </TooltipTrigger>
      {typeof document !== 'undefined' && open && createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          data-side={position?.side}
          className="pointer-events-none fixed z-[120] max-w-[280px] border border-dossier-brass bg-[#18261f] px-3 py-2 font-dossier text-[12px] leading-snug text-dossier-paper shadow-[5px_6px_0_rgba(0,0,0,0.3)]"
          style={{
            left: position?.x ?? 0,
            top: position?.y ?? 0,
            visibility: position ? 'visible' : 'hidden',
          }}
        >
          {content}
          {position && (
            <span
              aria-hidden="true"
              className={`absolute h-2 w-2 rotate-45 border-dossier-brass bg-[#18261f] ${
                position.side === 'top'
                  ? '-bottom-[5px] border-b border-r'
                  : '-top-[5px] border-l border-t'
              }`}
              style={{ left: position.arrowX - 4 }}
            />
          )}
        </div>,
        document.body,
      )}
    </>
  )
}

/** A compact, discoverable text trigger for terms that are not controls. */
export function TooltipLabel({
  label,
  content,
  className = '',
  children,
}: {
  label: string
  content: ReactNode
  className?: string
  children?: ReactNode
}) {
  return (
    <Tooltip content={content} openOnClick>
      <button
        type="button"
        aria-label={`Explain ${label}`}
        className={`min-w-0 cursor-help border-b border-dotted border-current/45 text-left ${className}`}
      >
        {children ?? label}
      </button>
    </Tooltip>
  )
}
