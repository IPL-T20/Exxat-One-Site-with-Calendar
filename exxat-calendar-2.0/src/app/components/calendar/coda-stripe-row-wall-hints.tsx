import { useCallback, useEffect, useMemo, useState } from "react"
import {
  cardRect,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import { computeClusterStats } from "../../lib/slot-requests-calendar/approval-timeline-density"
import { buildAvailabilityStripeCopy } from "../../lib/slot-requests-calendar/availability-stripe-copy"
import { buildScheduleStripeCopy } from "../../lib/schedules/schedule-stripe-copy"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import { SIDEBAR_W } from "../../lib/slot-requests-calendar/constants"
import type { CalendarZoom, Placement } from "../../lib/slot-requests-calendar/types"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { clipStripeToFocusPeriod } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { CalendarChevron } from "./calendar-chevron"
import { cn } from "../ui/utils"

const CARD_MIN_W = 48
export const WALL_HINT_W = 32
const WALL_SCROLL_PAD = 8
const REVEAL_PAD = 6

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

type StripeLayout = {
  cluster: ApprovalObjectCluster
  left: number
  cardW: number
  stripeRight: number
}

export function hasVisibleStripeInViewport(
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): boolean {
  return stripes.some(({ left, stripeRight }) => left < visibleRight && stripeRight > visibleLeft)
}

/** True when a sticky edge hint would sit on top of a visible bar. */
export function edgeWallHintOverlapsBar(
  side: "left" | "right",
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): boolean {
  const hintLeft = side === "left" ? visibleLeft : visibleRight - WALL_HINT_W
  const hintRight = hintLeft + WALL_HINT_W

  return stripes.some(({ left, stripeRight }) => {
    if (left >= visibleRight || stripeRight <= visibleLeft) return false
    return left < hintRight && stripeRight > hintLeft
  })
}

export function canShowEdgeWallHint(
  side: "left" | "right",
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): boolean {
  if (!hasVisibleStripeInViewport(stripes, visibleLeft, visibleRight)) return true
  return !edgeWallHintOverlapsBar(side, stripes, visibleLeft, visibleRight)
}

export function hasMoreStripesRight(
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): boolean {
  return stripes.some(
    (s) =>
      s.left >= visibleRight - REVEAL_PAD ||
      (s.left < visibleRight && s.stripeRight > visibleRight + REVEAL_PAD),
  )
}

export function hasMoreStripesLeft(
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): boolean {
  return stripes.some(
    (s) =>
      s.stripeRight <= visibleLeft + REVEAL_PAD ||
      (s.left < visibleLeft - REVEAL_PAD && s.stripeRight > visibleLeft),
  )
}

/** Next slot-request bar to reveal when jumping right. */
export function nextStripeRight(
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): StripeLayout | null {
  const sorted = [...stripes].sort((a, b) => a.left - b.left)

  const offScreenStart = sorted.find((s) => s.left >= visibleRight - REVEAL_PAD)
  if (offScreenStart) return offScreenStart

  return (
    sorted.find(
      (s) =>
        s.stripeRight > visibleRight + REVEAL_PAD &&
        s.left < visibleRight &&
        s.stripeRight > visibleLeft,
    ) ?? null
  )
}

/** Next slot-request bar to reveal when jumping left. */
export function nextStripeLeft(
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): StripeLayout | null {
  const sorted = [...stripes].sort((a, b) => b.stripeRight - a.stripeRight)

  const offScreenEnd = sorted.find((s) => s.stripeRight <= visibleLeft + REVEAL_PAD)
  if (offScreenEnd) return offScreenEnd

  return (
    sorted.find(
      (s) =>
        s.left < visibleLeft - REVEAL_PAD &&
        s.stripeRight > visibleLeft &&
        s.left < visibleRight,
    ) ?? null
  )
}

function nearestStripeBeyondRight(
  stripes: StripeLayout[],
  visibleRight: number,
): StripeLayout | null {
  const candidates = stripes.filter((s) => s.left >= visibleRight - REVEAL_PAD)
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => a.left - b.left)[0] ?? null
}

function nearestStripeBeyondLeft(
  stripes: StripeLayout[],
  visibleLeft: number,
): StripeLayout | null {
  const candidates = stripes.filter((s) => s.stripeRight <= visibleLeft + REVEAL_PAD)
  if (candidates.length === 0) return null
  return [...candidates].sort((a, b) => b.stripeRight - a.stripeRight)[0] ?? null
}

export function resolveWallHintTarget(
  side: "left" | "right",
  stripes: StripeLayout[],
  visibleLeft: number,
  visibleRight: number,
): StripeLayout | null {
  if (side === "right") {
    return (
      nextStripeRight(stripes, visibleLeft, visibleRight) ??
      nearestStripeBeyondRight(stripes, visibleRight)
    )
  }
  return (
    nextStripeLeft(stripes, visibleLeft, visibleRight) ??
    nearestStripeBeyondLeft(stripes, visibleLeft)
  )
}

export function buildRowStripeLayouts(
  clusters: ApprovalObjectCluster[],
  placements: Placement[],
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
  focusClip?: FocusPeriodRange | null,
): StripeLayout[] {
  const fromClusters = clusters
    .map((cluster) => {
      const layout = getClusterStripeLayout(cluster, zoom, ppd, monthPxW, focusClip)
      if (!layout) return null
      return { cluster, ...layout }
    })
    .filter((s): s is StripeLayout => s !== null)

  if (fromClusters.length > 0) return fromClusters

  const clusterByPlacement = new Map<string, ApprovalObjectCluster>()
  for (const cluster of clusters) {
    for (const placement of cluster.placements) {
      clusterByPlacement.set(placement.slotRequestId ?? placement.id, cluster)
    }
  }

  return placements
    .map((placement) => {
      if (!placement.start || !placement.end) return null
      const rect = cardRect(placement, zoom, ppd, monthPxW)
      if (!rect) return null
      const cardW = Math.max(CARD_MIN_W, rect.width)
      const cluster =
        clusterByPlacement.get(placement.slotRequestId ?? placement.id) ??
        ({
          id: placement.slotRequestId ?? placement.id,
          placements: [placement],
          start: placement.start,
          end: placement.end,
          level: "individual",
          stats: computeClusterStats([placement]),
        } satisfies ApprovalObjectCluster)
      return {
        cluster,
        left: rect.left,
        cardW,
        stripeRight: rect.left + cardW,
      }
    })
    .filter((s): s is StripeLayout => s !== null)
}

export function jumpToStripe(
  scrollTimelineTo: (left: number, behavior?: ScrollBehavior) => void,
  stripe: StripeLayout,
  viewportW: number,
  side: "left" | "right",
) {
  if (viewportW <= 0) return

  const target =
    side === "right"
      ? stripe.left - WALL_SCROLL_PAD
      : stripe.stripeRight - viewportW + WALL_SCROLL_PAD

  scrollTimelineTo(target, "smooth")
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
      className={cn(
        "absolute top-1/2 flex size-8 -translate-y-1/2 cursor-pointer items-center justify-center",
        "bg-background/95 text-foreground outline-none pointer-events-auto",
        "shadow-sm transition-[color,background-color,box-shadow]",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        side === "left"
          ? "left-0 rounded-r-md border-y border-r border-border/80"
          : "right-0 rounded-l-md border-y border-l border-border/80",
      )}
      aria-label={ariaLabel}
      title={title}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <CalendarChevron use="nav" direction={side === "left" ? "left" : "right"} />
    </button>
  )
}

export function CodaStripeRowWallHints({
  clusters,
  placements,
  zoom,
  ppd,
  monthPxW,
  scrollRef,
  scrollTimelineTo,
  focusPeriodClip = null,
  scenarioForCluster,
  sidebarContext,
  schedulesContext = false,
}: {
  clusters: ApprovalObjectCluster[]
  placements: Placement[]
  zoom: CalendarZoom
  ppd: number
  monthPxW: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  scrollTimelineTo: (left: number, behavior?: ScrollBehavior) => void
  focusPeriodClip?: FocusPeriodRange | null
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
  }, [scrollRef, syncScroll, clusters, placements])

  const stripes = useMemo(
    () => buildRowStripeLayouts(clusters, placements, zoom, ppd, monthPxW, focusPeriodClip),
    [clusters, placements, zoom, ppd, monthPxW, focusPeriodClip],
  )

  if (stripes.length === 0 || viewportW <= 0) return null

  const visibleLeft = scrollLeft
  const visibleRight = scrollLeft + viewportW

  const leftTarget = resolveWallHintTarget("left", stripes, visibleLeft, visibleRight)
  const rightTarget = resolveWallHintTarget("right", stripes, visibleLeft, visibleRight)

  const viewportEmpty = !hasVisibleStripeInViewport(stripes, visibleLeft, visibleRight)
  const leftmost = stripes.reduce((min, s) => (s.left < min.left ? s : min), stripes[0]!)
  const rightmost = stripes.reduce((max, s) => (s.stripeRight > max.stripeRight ? s : max), stripes[0]!)

  const barsEntirelyLeft = rightmost.stripeRight <= visibleLeft + REVEAL_PAD
  const barsEntirelyRight = leftmost.left >= visibleRight - REVEAL_PAD

  const showRightHint =
    rightTarget !== null &&
    canShowEdgeWallHint("right", stripes, visibleLeft, visibleRight) &&
    (hasMoreStripesRight(stripes, visibleLeft, visibleRight) ||
      (viewportEmpty && barsEntirelyRight))
  const showLeftHint =
    leftTarget !== null &&
    canShowEdgeWallHint("left", stripes, visibleLeft, visibleRight) &&
    (hasMoreStripesLeft(stripes, visibleLeft, visibleRight) ||
      (viewportEmpty && barsEntirelyLeft))

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
      className="pointer-events-none absolute inset-y-0 z-[40]"
      style={{ left: scrollLeft, width: viewportW }}
      aria-hidden={!showLeftHint && !showRightHint}
    >
      {showLeftHint && leftTarget ? (
        <StripeWallHint
          side="left"
          ariaLabel={`Jump to previous ${entityNoun} — ${labelFor(leftTarget.cluster)}`}
          title={`Previous ${entityNoun} — ${labelFor(leftTarget.cluster)}`}
          onClick={() => jumpToStripe(scrollTimelineTo, leftTarget, viewportW, "left")}
        />
      ) : null}
      {showRightHint && rightTarget ? (
        <StripeWallHint
          side="right"
          ariaLabel={`Jump to next ${entityNoun} — ${labelFor(rightTarget.cluster)}`}
          title={`Next ${entityNoun} — ${labelFor(rightTarget.cluster)}`}
          onClick={() => jumpToStripe(scrollTimelineTo, rightTarget, viewportW, "right")}
        />
      ) : null}
    </div>
  )
}
