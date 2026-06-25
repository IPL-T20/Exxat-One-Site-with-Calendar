import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, RefObject } from "react"
import { createPortal } from "react-dom"
import {
  computeCalendarHoverPlacement,
  computeCalendarHoverPlacementInScrollRoot,
  type CalendarHoverPlacement,
} from "../../lib/slot-requests-calendar/calendar-hover-placement"
import { CALENDAR_HOVER_LAYER_Z } from "../../lib/slot-requests-calendar/constants"
import { useLiveAnchorRect } from "../../lib/slot-requests-calendar/use-live-anchor-rect"
import { cn } from "../ui/utils"

export function useCalendarHoverPlacement(
  anchorEl: HTMLElement | undefined,
  fallbackRect: DOMRect,
  scrollRootRef: RefObject<HTMLElement | null> | undefined,
  cardW: number,
  cardH: number,
): CalendarHoverPlacement {
  const liveAnchor = useLiveAnchorRect(anchorEl) ?? fallbackRect
  const scrollRoot = scrollRootRef?.current

  return scrollRoot
    ? computeCalendarHoverPlacementInScrollRoot(liveAnchor, scrollRoot, cardW, cardH)
    : computeCalendarHoverPlacement(liveAnchor, cardW, cardH)
}

export function CalendarHoverPortal({
  anchorEl,
  fallbackRect,
  scrollRootRef,
  cardW,
  estimatedCardH = 280,
  className,
  children,
}: {
  anchorEl?: HTMLElement
  fallbackRect: DOMRect
  scrollRootRef?: RefObject<HTMLElement | null>
  cardW: number
  estimatedCardH?: number
  className: string
  children: ReactNode
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [measuredH, setMeasuredH] = useState(estimatedCardH)

  useLayoutEffect(() => {
    const el = cardRef.current
    if (!el) return

    const measure = () => {
      const next = Math.ceil(el.getBoundingClientRect().height)
      if (next > 0) setMeasuredH(next)
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [children, estimatedCardH])

  const cardH = Math.max(measuredH, estimatedCardH)
  const placement = useCalendarHoverPlacement(
    anchorEl,
    fallbackRect,
    scrollRootRef,
    cardW,
    cardH,
  )
  const scrollRoot = scrollRootRef?.current

  const style: CSSProperties = {
    left: placement.left,
    top: placement.top,
    zIndex: CALENDAR_HOVER_LAYER_Z,
    width: cardW,
    transform: placement.transform,
  }

  const portalTarget = scrollRoot ?? document.body
  const positionClass = scrollRoot ? "absolute" : "fixed"

  return createPortal(
    <div
      ref={cardRef}
      className={cn(positionClass, "pointer-events-none", className)}
      style={style}
      role="tooltip"
    >
      {children}
    </div>,
    portalTarget,
  )
}
