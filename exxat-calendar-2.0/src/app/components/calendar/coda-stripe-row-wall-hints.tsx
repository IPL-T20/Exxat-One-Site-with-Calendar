import { useCallback, useEffect, useMemo, useState } from "react"
import {
  cardRect,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import { buildAvailabilityStripeCopy } from "../../lib/slot-requests-calendar/availability-stripe-copy"
import { buildScheduleStripeCopy } from "../../lib/schedules/schedule-stripe-copy"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import { SIDEBAR_W } from "../../lib/slot-requests-calendar/constants"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { clipStripeToFocusPeriod } from "../../lib/slot-requests-calendar/calendar-period-focus"

const CARD_MIN_W = 48
export const WALL_HINT_W = 24
const WALL_SCROLL_PAD = 4

export function getClusterStripeLayout(
  cluster: ApprovalObjectCluster,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
  focusClip?: FocusPeriodRange | null,
): { left: number; cardW: number; stripeRight: number } | null {
  const isMulti = cluster.stats.requestCount > 1 || cluster.level === "aggregate"
  const placement = cluster.placements[0]
  const layoutSource = isMulti
    ? { start: cluster.start, end: cluster.end }
    : { start: placement.start!, end: placement.end! }

  const rect = cardRect(
    { ...placement, start: layoutSource.start, end: layoutSource.end },
    zoom,
    ppd,
    monthPxW,
  )
  if (!rect) return null

  let left = rect.left
  let cardW = Math.max(CARD_MIN_W, rect.width)
  if (focusClip) {
    const clipped = clipStripeToFocusPeriod(left, cardW, focusClip, CARD_MIN_W)
    if (!clipped) return null
    left = clipped.left
    cardW = clipped.width
  }
  return { left, cardW, stripeRight: left + cardW }
}

function scrollTimelineToStripe(
  scrollRef: React.RefObject<HTMLDivElement | null>,
  stripeLeft: number,
  stripeRight: number,
  viewportW: number,
  side: "left" | "right",
) {
  const el = scrollRef.current
  if (!el || viewportW <= 0) return

  const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)
  const stripeW = stripeRight - stripeLeft
  let target: number

  if (side === "right") {
    target = stripeLeft - WALL_SCROLL_PAD
  } else if (stripeW > viewportW) {
    target = stripeLeft - WALL_SCROLL_PAD
  } else {
    target = stripeRight - viewportW + WALL_SCROLL_PAD
  }

  el.scrollTo({
    left: Math.max(0, Math.min(target, maxScroll)),
    behavior: "smooth",
  })
}

type StripeLayout = {
  cluster: ApprovalObjectCluster
  left: number
  cardW: number
  stripeRight: number
}

function stripeOverlapsVisible(
  left: number,
  right: number,
  visibleLeft: number,
  visibleRight: number,
): boolean {
  return left < visibleRight && right > visibleLeft
}

function hintOverlapsVisibleStripe(
  hintLeft: number,
  hintRight: number,
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): boolean {
  return stripes.some(({ left, stripeRight }) => {
    if (!stripeOverlapsVisible(left, stripeRight, visibleLeft, visibleRight)) return false
    return left < hintRight && stripeRight > hintLeft
  })
}

function StripeWallHint({
  side,
  ariaLabel,
  title,
  onClick,
}: {
  side: "left" | "right"
  ariaLabel: string
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={`absolute top-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-sm border border-border/90 bg-background/95 shadow-[0_1px_3px_rgba(15,23,42,0.12)] backdrop-blur-[1px] transition-[background-color,box-shadow] hover:border-border hover:bg-background hover:shadow-[0_2px_6px_rgba(15,23,42,0.14)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 pointer-events-auto flex ${
        side === "left" ? "left-0" : "right-0"
      }`}
      style={{
        width: WALL_HINT_W,
        height: WALL_HINT_W,
      }}
      aria-label={ariaLabel}
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <span className="pointer-events-none text-xs font-bold leading-none text-foreground/70">
        {side === "left" ? "‹" : "›"}
      </span>
    </button>
  )
}

export function CodaStripeRowWallHints({
  clusters,
  zoom,
  ppd,
  monthPxW,
  scrollRef,
  scenarioForCluster,
  sidebarContext,
  schedulesContext = false,
}: {
  clusters: ApprovalObjectCluster[]
  zoom: CalendarZoom
  ppd: number
  monthPxW: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  scenarioForCluster?: (cluster: ApprovalObjectCluster) => MedStarScenario | undefined
  sidebarContext?: {
    rowLabel?: string
    parentLabel?: string
    groupBy?: CalendarGroupByMode
  }
  schedulesContext?: boolean
}) {
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportW, setViewportW] = useState(0)

  const syncScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollLeft(el.scrollLeft)
    setViewportW(Math.max(0, el.clientWidth - SIDEBAR_W))
  }, [scrollRef])

  useEffect(() => {
    syncScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", syncScroll, { passive: true })
    const ro = new ResizeObserver(syncScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", syncScroll)
      ro.disconnect()
    }
  }, [scrollRef, syncScroll, clusters])

  const stripes = useMemo(() => {
    return clusters
      .map((cluster) => {
        const layout = getClusterStripeLayout(cluster, zoom, ppd, monthPxW)
        if (!layout) return null
        return { cluster, ...layout }
      })
      .filter((s): s is StripeLayout => s !== null)
  }, [clusters, zoom, ppd, monthPxW])

  if (stripes.length === 0 || viewportW <= 0) return null

  const visibleLeft = scrollLeft
  const visibleRight = scrollLeft + viewportW
  const rightHintLeft = scrollLeft + viewportW - WALL_HINT_W
  const leftHintRight = scrollLeft + WALL_HINT_W

  const offScreenRight = stripes
    .filter(({ left }) => left >= visibleRight)
    .sort((a, b) => a.left - b.left)
  const offScreenLeft = stripes
    .filter(({ stripeRight }) => stripeRight <= visibleLeft)
    .sort((a, b) => b.stripeRight - a.stripeRight)

  const rightTarget = offScreenRight[0] ?? null
  const leftTarget = offScreenLeft[0] ?? null

  const showRightHint =
    rightTarget !== null &&
    !hintOverlapsVisibleStripe(
      rightHintLeft,
      scrollLeft + viewportW,
      stripes,
      visibleLeft,
      visibleRight,
    )

  const showLeftHint =
    leftTarget !== null &&
    !hintOverlapsVisibleStripe(
      scrollLeft,
      leftHintRight,
      stripes,
      visibleLeft,
      visibleRight,
    )

  const labelFor = (cluster: ApprovalObjectCluster) => {
    const scenario = scenarioForCluster?.(cluster)
    const copy = schedulesContext
      ? buildScheduleStripeCopy(cluster, { sidebarContext })
      : buildAvailabilityStripeCopy(cluster, { scenario, sidebarContext })
    return copy.stripePrimary ?? (schedulesContext ? "schedules" : "slot requests")
  }

  const entityNoun = schedulesContext ? "schedules" : "requests"

  return (
    <div
      className="pointer-events-none absolute inset-y-0 z-[7]"
      style={{ left: scrollLeft, width: viewportW }}
      aria-hidden={!showLeftHint && !showRightHint}
    >
      {showLeftHint && leftTarget ? (
        <StripeWallHint
          side="left"
          ariaLabel={`Scroll to ${labelFor(leftTarget.cluster)}`}
          title={`More ${entityNoun} to the left — ${labelFor(leftTarget.cluster)}`}
          onClick={() =>
            scrollTimelineToStripe(
              scrollRef,
              leftTarget.left,
              leftTarget.stripeRight,
              viewportW,
              "left",
            )
          }
        />
      ) : null}
      {showRightHint && rightTarget ? (
        <StripeWallHint
          side="right"
          ariaLabel={`Scroll to ${labelFor(rightTarget.cluster)}`}
          title={`More ${entityNoun} to the right — ${labelFor(rightTarget.cluster)}`}
          onClick={() =>
            scrollTimelineToStripe(
              scrollRef,
              rightTarget.left,
              rightTarget.stripeRight,
              viewportW,
              "right",
            )
          }
        />
      ) : null}
    </div>
  )
}
