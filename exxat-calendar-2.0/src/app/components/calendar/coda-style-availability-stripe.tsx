import { useCallback, useEffect, useState } from "react"
import {
  cardRect,
  requestIdFromPlacement,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import { buildAvailabilityStripeCopy } from "../../lib/slot-requests-calendar/availability-stripe-copy"
import { buildScheduleStripeCopy } from "../../lib/schedules/schedule-stripe-copy"
import {
  scheduleClusterStripeSurface,
  scheduleStripeSurface,
} from "../../lib/schedules/schedule-stripe-style"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import { GoldPartnerStar, GOLD_PARTNER_FILTER_LABEL_CLASS, GOLD_PARTNER_FILTER_STAR_SIZE, GOLD_PARTNER_INLINE_GAP } from "./gold-partner-star"

import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { clipStripeToFocusPeriod } from "../../lib/slot-requests-calendar/calendar-period-focus"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import { SIDEBAR_W } from "../../lib/slot-requests-calendar/constants"
import type { ClusterStripeLayout, ExpandedStripePlacement } from "./coda-stripe-overlap-groups"
import { cn } from "../ui/utils"
import {
  CODA_STRIPE_MIN_CONTENT_W,
  CODA_STRIPE_EXPLODE_MS,
  CODA_STRIPE_EXPLODE_STAGGER_MS,
} from "./coda-stripe-overlap-groups"

const EXPLODE_EASE = "cubic-bezier(0.22, 1.15, 0.36, 1)"

const CARD_MIN_W = 48
const STRIPE_H = 36

function expandedStripeShadow(stackIndex: number, hovered: boolean): string {
  const lift = hovered ? 6 : 0
  const layer = 14 + stackIndex * 5 + lift
  const alpha = 0.14 + stackIndex * 0.04 + (hovered ? 0.06 : 0)
  const ambient = `0 ${6 + stackIndex * 3 + lift}px ${layer}px -4px color-mix(in oklch, var(--foreground) ${Math.round(alpha * 100)}%, transparent)`
  const contact = `0 1px 2px color-mix(in oklch, var(--foreground) 10%, transparent)`
  return `${ambient}, ${contact}`
}

function stripeTint(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0
  const hues = [145, 210, 250, 35, 280]
  const hue = hues[Math.abs(hash) % hues.length]
  return `color-mix(in oklch, oklch(0.72 0.12 ${hue}) 18%, var(--card))`
}

function resolveLayout(
  cluster: ApprovalObjectCluster,
  zoom: CalendarZoom,
  ppd: number,
  monthPxW: number,
  layout?: Pick<ClusterStripeLayout, "left" | "cardW"> & { top?: number } | null,
  focusClip?: FocusPeriodRange | null,
): { left: number; cardW: number } | null {
  if (layout) {
    if (!focusClip || layout.top !== undefined) return layout
    const clipped = clipStripeToFocusPeriod(layout.left, layout.cardW, focusClip, CARD_MIN_W)
    return clipped ? { left: clipped.left, cardW: clipped.width } : null
  }

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
  return { left, cardW }
}

export function CodaStyleAvailabilityStripe({
  cluster,
  layout,
  expandedPlacement,
  layer = "base",
  subdued = false,
  explodeOpen = true,
  zoom,
  ppd,
  monthPxW,
  scrollRef,
  scenario,
  selected,
  sidebarContext,
  onOpenDetail,
  onOpenSingle,
  onHover,
  onLeave,
  onOverlapGroupEnter,
  schedulesContext = false,
  focusPeriodClip = null,
}: {
  cluster: ApprovalObjectCluster
  layout?: Pick<ClusterStripeLayout, "left" | "cardW"> & { top?: number } | null
  expandedPlacement?: ExpandedStripePlacement | null
  layer?: "base" | "expanded"
  subdued?: boolean
  explodeOpen?: boolean
  zoom: CalendarZoom
  ppd: number
  monthPxW: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  scenario?: MedStarScenario
  selected: boolean
  sidebarContext?: {
    rowLabel?: string
    parentLabel?: string
    groupBy?: CalendarGroupByMode
  }
  onOpenDetail: (requestIds: string[], scenarioId?: string) => void
  onOpenSingle: (requestId: string) => void
  onHover: (cluster: ApprovalObjectCluster, el: HTMLElement) => void
  onLeave: () => void
  onOverlapGroupEnter?: () => void
  schedulesContext?: boolean
  focusPeriodClip?: FocusPeriodRange | null
}) {
  const resolvedLayout = resolveLayout(
    cluster,
    zoom,
    ppd,
    monthPxW,
    layout,
    focusPeriodClip,
  )
  if (!resolvedLayout) return null

  const { left, cardW } = resolvedLayout
  const isExpandedLayer = layer === "expanded"
  const stackIndex = expandedPlacement?.stackIndex
  const displayW = isExpandedLayer
    ? (expandedPlacement?.width ?? Math.max(cardW, CODA_STRIPE_MIN_CONTENT_W))
    : cardW
  const displayLeft = isExpandedLayer ? (expandedPlacement?.left ?? left) : left
  const stackTop = isExpandedLayer ? expandedPlacement?.top : layout?.top
  const isVerticallyPositioned = stackTop !== undefined
  const isMulti = cluster.stats.requestCount > 1 || cluster.level === "aggregate"
  const placement = cluster.placements[0]
  const copy = schedulesContext
    ? buildScheduleStripeCopy(cluster, { sidebarContext })
    : buildAvailabilityStripeCopy(cluster, { scenario, sidebarContext })
  const scheduleSurface = schedulesContext
    ? isMulti
      ? scheduleClusterStripeSurface(cluster.placements)
      : scheduleStripeSurface(placement)
    : null
  const requestIds = cluster.placements.map(requestIdFromPlacement)
  const scenarioId = scenario?.id
  const stripeSeed = copy.header ?? cluster.id
  const onTrackConfirmed =
    schedulesContext &&
    placement.status === "Approved" &&
    placement.partnerCategory !== "Not Compliant"

  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportW, setViewportW] = useState(0)
  const [stackHovered, setStackHovered] = useState(false)
  const [exploded, setExploded] = useState(false)

  useEffect(() => {
    if (!isExpandedLayer) {
      setExploded(false)
      return
    }
    if (!explodeOpen) {
      setExploded(false)
      return
    }
    setExploded(false)
    let outer = 0
    let inner = 0
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setExploded(true))
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [isExpandedLayer, explodeOpen, cluster.id, expandedPlacement?.left, expandedPlacement?.top])

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
  }, [scrollRef, syncScroll, displayLeft, displayW])

  const stripeRight = displayLeft + displayW
  const visibleLeft = scrollLeft
  const visibleRight = scrollLeft + viewportW
  const overlapsVisible = displayLeft < visibleRight && stripeRight > visibleLeft
  const isClippedLeft = !isExpandedLayer && overlapsVisible && displayLeft < visibleLeft
  const isClippedRight = !isExpandedLayer && overlapsVisible && stripeRight > visibleRight

  const labelPin = Math.max(
    0,
    Math.min(scrollLeft - displayLeft + 6, displayW - (copy.hasGoldPartner ? 140 : 120)),
  )

  const handleClick = () => {
    if (isMulti) {
      onOpenDetail(requestIds, scenarioId)
      return
    }
    onOpenSingle(requestIdFromPlacement(placement))
  }

  const isStacked = isExpandedLayer && stackTop !== undefined

  const zIndex =
    isExpandedLayer && stackIndex !== undefined
      ? 101 + stackIndex + (stackHovered ? 20 : 0)
      : selected
        ? 4
        : 2

  const compactStripe = displayW < 88
  const microStripe = schedulesContext && displayW < 52
  const displayPrimary =
    microStripe && copy.stripePrimary
      ? copy.stripePrimary.split(/[·,]/)[0]?.trim().slice(0, 14) || copy.stripePrimary
      : copy.stripePrimary

  const showSecondary =
    Boolean(copy.stripeSecondary) &&
    !compactStripe &&
    (isExpandedLayer || displayW >= 72)

  const targetTop = stackTop ?? 0
  const originLeft = expandedPlacement?.originLeft ?? displayLeft
  const originTop = expandedPlacement?.originTop ?? targetTop
  const explodeOffsetX = originLeft - displayLeft
  const explodeOffsetY = originTop - targetTop
  const stackCount = expandedPlacement?.stackCount ?? 1
  const explodeDelay = explodeOpen
    ? (expandedPlacement?.explodeDelayMs ?? (stackIndex ?? 0) * CODA_STRIPE_EXPLODE_STAGGER_MS)
    : (stackCount - 1 - (stackIndex ?? 0)) * Math.min(CODA_STRIPE_EXPLODE_STAGGER_MS, 24)
  const tiltDeg = expandedPlacement?.tiltDeg ?? 0
  const explodeActive = isExpandedLayer && exploded

  return (
    <button
      type="button"
      className={`absolute flex text-left overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-md ${
        isVerticallyPositioned ? "" : "top-1/2 -translate-y-1/2"
      } ${
        subdued
          ? "pointer-events-none opacity-30 transition-opacity duration-200"
          : isExpandedLayer
            ? "cursor-pointer active:scale-[0.99]"
            : selected
              ? "ring-2 ring-ring z-[4] transition-[box-shadow,opacity,transform] hover:shadow-md"
              : "z-[2] hover:z-[5] transition-[box-shadow,opacity,transform] hover:shadow-md"
      }`}
      style={{
        left: displayLeft,
        width: displayW,
        height: STRIPE_H,
        top: stackTop,
        zIndex,
        backgroundColor: scheduleSurface?.backgroundColor ?? stripeTint(stripeSeed),
        color: scheduleSurface?.color,
        border: scheduleSurface?.border
          ?? (isExpandedLayer
            ? "1px solid color-mix(in oklch, var(--border) 92%, transparent)"
            : "1px solid color-mix(in oklch, var(--border) 80%, transparent)"),
        borderStyle: scheduleSurface?.borderStyle ?? "solid",
        boxShadow:
          isExpandedLayer && stackIndex !== undefined
            ? expandedStripeShadow(stackIndex, stackHovered || explodeActive)
            : selected
              ? undefined
              : "0 1px 2px color-mix(in oklch, var(--foreground) 6%, transparent)",
        transform: isExpandedLayer
          ? explodeActive
            ? `translate(0px, 0px) rotate(${tiltDeg}deg) scale(${stackHovered ? 1.03 : 1})`
            : `translate(${explodeOffsetX}px, ${explodeOffsetY}px) rotate(0deg) scale(0.86)`
          : undefined,
        opacity: isExpandedLayer
          ? explodeActive
            ? 1
            : 0.5
          : subdued
            ? undefined
            : scheduleSurface?.opacity ?? 1,
        transition: isExpandedLayer
          ? `transform ${CODA_STRIPE_EXPLODE_MS}ms ${EXPLODE_EASE} ${explodeDelay}ms, opacity ${CODA_STRIPE_EXPLODE_MS * 0.9}ms ease-out ${explodeDelay}ms, box-shadow ${CODA_STRIPE_EXPLODE_MS}ms ease-out ${explodeDelay}ms`
          : undefined,
        willChange: isExpandedLayer && !explodeActive ? "transform, opacity" : undefined,
      }}
      aria-label={copy.ariaLabel}
      onClick={handleClick}
      onMouseEnter={(e) => {
        if (onOverlapGroupEnter) {
          onOverlapGroupEnter()
          return
        }
        if (isExpandedLayer) {
          setStackHovered(true)
          return
        }
        onHover(cluster, e.currentTarget)
      }}
      onMouseLeave={
        isExpandedLayer
          ? () => setStackHovered(false)
          : onLeave
      }
      onFocus={(e) => {
        if (!isExpandedLayer) onHover(cluster, e.currentTarget)
      }}
      onBlur={layer === "base" ? onLeave : undefined}
    >
      <div
        className={`relative flex min-w-0 flex-col justify-center gap-0.5 h-full ${microStripe ? "px-1" : "px-2"} ${GOLD_PARTNER_FILTER_LABEL_CLASS}`}
        style={{
          transform: isClippedLeft || isClippedRight ? `translateX(${labelPin}px)` : undefined,
          ["--gold-inline" as string]: copy.hasGoldPartner ? "calc(1em + 0.35em)" : "0px",
        }}
      >
        {copy.stripePrimary || copy.hasGoldPartner ? (
          <div className={`flex min-w-0 items-center ${GOLD_PARTNER_INLINE_GAP}`}>
            {copy.hasGoldPartner && !microStripe ? (
              <GoldPartnerStar
                size={GOLD_PARTNER_FILTER_STAR_SIZE}
                className="pointer-events-none shrink-0 self-center"
              />
            ) : null}
            {displayPrimary ? (
              <span className="min-w-0 truncate text-[11px] font-semibold leading-tight pointer-events-none">
                {displayPrimary}
              </span>
            ) : null}
          </div>
        ) : null}
        {showSecondary ? (
          <span
            className={cn(
              "truncate text-[9px] font-medium tabular-nums pointer-events-none",
              onTrackConfirmed ? "opacity-80" : "text-muted-foreground",
            )}
            style={{ paddingLeft: "var(--gold-inline)" }}
          >
            {copy.stripeSecondary}
          </span>
        ) : null}
      </div>
    </button>
  )
}

export { STRIPE_H as CODA_STRIPE_H }
export {
  CODA_STRIPE_MIN_CONTENT_W,
  CODA_STRIPE_STACK_PEEK_X,
  CODA_STRIPE_STACK_GAP_Y,
  CODA_STRIPE_STACK_EDGE_PAD,
  CODA_STRIPE_EXPLODE_MS,
  CODA_STRIPE_EXPLODE_STAGGER_MS,
} from "./coda-stripe-overlap-groups"
