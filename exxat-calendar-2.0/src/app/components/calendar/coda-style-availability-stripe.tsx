import { useCallback, useEffect, useState } from "react"
import {
  buildCardDisplay,
  cardRect,
  requestIdFromPlacement,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import { buildScheduleStripeCopy } from "../../lib/schedules/schedule-stripe-copy"
import {
  scheduleClusterPatternLabel,
  scheduleClusterStripeSignal,
  scheduleStripePatternLabel,
  scheduleStripeSignal,
} from "../../lib/schedules/schedule-stripe-signal"
import {
  scheduleClusterStripeSurface,
  scheduleStripeSurface,
} from "../../lib/schedules/schedule-stripe-style"
import { FontAwesomeIcon } from "../font-awesome-icon"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import {
  GoldPartnerStar,
  GOLD_PARTNER_FILTER_LABEL_CLASS,
  GOLD_PARTNER_FILTER_STAR_SIZE,
  GOLD_PARTNER_INLINE_GAP,
} from "./gold-partner-star"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { clipStripeToFocusPeriod } from "../../lib/slot-requests-calendar/calendar-period-focus"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { ClusterStripeLayout } from "./coda-stripe-overlap-groups"
import { SIDEBAR_W } from "../../lib/slot-requests-calendar/constants"
import { stripeLabelPinOffset } from "../../lib/slot-requests-calendar/stripe-label-pin"
import {
  resolveScheduleBarRhythm,
  resolveScheduleStripeHeight,
  scheduleBarShowsDateRange,
  scheduleBarShowsRhythmInfographic,
  scheduleRhythmAriaSummary,
} from "../../lib/schedules/schedule-bar-rhythm"
import { ScheduleHorizontalBarContent } from "./schedule-bar-infographics"
import { cn } from "../ui/utils"

const CARD_MIN_W = 48
const STRIPE_H = 36

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
  overlapGroupSize = 0,
  isHovered = false,
  isFaded = false,
  schedulesContext = false,
  focusPeriodClip = null,
  keyboardRowId,
}: {
  cluster: ApprovalObjectCluster
  layout?: Pick<ClusterStripeLayout, "left" | "cardW"> & { top?: number } | null
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
  overlapGroupSize?: number
  isHovered?: boolean
  isFaded?: boolean
  schedulesContext?: boolean
  focusPeriodClip?: FocusPeriodRange | null
  /** Schedules keyboard grid — row id for arrow-key stripe navigation. */
  keyboardRowId?: string
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
  const stackTop = layout?.top
  const isVerticallyPositioned = stackTop !== undefined
  const isMulti = cluster.stats.requestCount > 1 || cluster.level === "aggregate"
  const placement = cluster.placements[0]
  const compactStripe = cardW < 88
  const microStripe = schedulesContext && cardW < 52
  const narrowStripe = schedulesContext && cardW < 72
  const compactRhythm = cardW < 140

  const scheduleCopy = schedulesContext
    ? buildScheduleStripeCopy(cluster, { sidebarContext })
    : null
  const cardDisplay = schedulesContext ? null : buildCardDisplay(cluster, zoom, cardW)

  const scheduleSurface = schedulesContext
    ? isMulti
      ? scheduleClusterStripeSurface(cluster.placements)
      : scheduleStripeSurface(placement)
    : null

  const scheduleSignal = schedulesContext
    ? isMulti
      ? scheduleClusterStripeSignal(cluster.placements)
      : scheduleStripeSignal(placement)
    : null

  const schedulePatternLabel = schedulesContext
    ? isMulti
      ? scheduleClusterPatternLabel(cluster.placements)
      : scheduleStripePatternLabel(placement)
    : null

  const scheduleRhythm =
    schedulesContext && !isMulti ? resolveScheduleBarRhythm(placement) : null
  const rhythmAria = scheduleRhythmAriaSummary(scheduleRhythm)
  const showRhythmInfographic = scheduleBarShowsRhythmInfographic(
    zoom,
    scheduleRhythm,
    cardW,
    isMulti,
  )
  const stripeHeight = resolveScheduleStripeHeight(schedulesContext, zoom, scheduleRhythm, isMulti)
  const horizontalScheduleBar = schedulesContext
  const showDateRange =
    horizontalScheduleBar &&
    Boolean(scheduleCopy?.compactDateRange) &&
    scheduleBarShowsDateRange(cardW, showRhythmInfographic, microStripe)

  const requestIds = cluster.placements.map(requestIdFromPlacement)
  const scenarioId = scenario?.id
  const stripeSeed = scheduleCopy?.header ?? cluster.id
  const onTrackConfirmed =
    schedulesContext &&
    placement.status === "Approved" &&
    placement.partnerCategory === "Compliant"

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
  }, [scrollRef, syncScroll, left, cardW])

  const handleClick = () => {
    if (isMulti || overlapGroupSize > 1) {
      onOpenDetail(requestIds, scenarioId)
      return
    }
    onOpenSingle(requestIdFromPlacement(placement))
  }

  const stripePrimary = schedulesContext
    ? scheduleCopy?.stripePrimary
    : cardDisplay?.lines[0]?.text
  const stripeSecondary = schedulesContext
    ? scheduleCopy?.stripeSecondary
    : cardDisplay?.lines[1]?.text
  const hasGoldPartner = schedulesContext
    ? Boolean(scheduleCopy?.hasGoldPartner)
    : (cardDisplay?.goldStarCount ?? 0) > 0

  const labelReservePx = hasGoldPartner ? 140 : 120
  const labelPin = stripeLabelPinOffset(left, cardW, scrollLeft, viewportW, labelReservePx)

  const displayPrimary = horizontalScheduleBar
    ? stripePrimary
    : microStripe && stripePrimary && !scheduleSignal
      ? stripePrimary.split(/[·,]/)[0]?.trim().slice(0, 14) || stripePrimary
      : stripePrimary

  const schedulesStatusLine = scheduleSignal?.shortLabel ?? stripeSecondary
  const showSecondary =
    !horizontalScheduleBar &&
    (schedulesContext
      ? Boolean(schedulesStatusLine) && !narrowStripe
      : Boolean(stripeSecondary) && !compactStripe && cardW >= 72)
  const showMicroStatus =
    schedulesContext && microStripe && Boolean(scheduleSignal) && !horizontalScheduleBar

  const barSignalIconClass =
    scheduleSurface?.color === "#fff" || scheduleSurface?.color === "#ffffff"
      ? "text-white/95"
      : scheduleSignal?.iconClass

  const ariaLabel =
    cardDisplay?.ariaLabel ??
    (scheduleCopy
      ? [
          scheduleCopy.ariaLabel,
          scheduleSignal?.shortLabel,
          rhythmAria,
          schedulePatternLabel,
        ]
          .filter(Boolean)
          .join(". ")
      : null) ??
    [displayPrimary, stripeSecondary, "Click to view"].filter(Boolean).join(". ")

  return (
    <button
      type="button"
      className={cn(
        "absolute flex text-left overflow-hidden rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 motion-safe:transition-[box-shadow,opacity,border-color,filter] motion-safe:duration-150",
        isVerticallyPositioned ? "" : "top-1/2 -translate-y-1/2",
        isHovered
          ? "z-[20]"
          : isFaded
            ? "z-[1] opacity-[0.45] saturate-[0.82]"
            : selected
              ? "ring-2 ring-ring z-[4] hover:shadow-md"
              : "z-[2] hover:z-[5] hover:shadow-md",
      )}
      style={{
        left,
        width: cardW,
        height: stripeHeight,
        top: stackTop,
        backgroundColor: scheduleSurface?.backgroundColor ?? stripeTint(stripeSeed),
        color: scheduleSurface?.color,
        border: isHovered
          ? "1px solid color-mix(in oklch, var(--primary) 42%, var(--border))"
          : scheduleSurface?.border ??
            "1px solid color-mix(in oklch, var(--border) 80%, transparent)",
        borderStyle: scheduleSurface?.borderStyle ?? "solid",
        boxShadow: isHovered
          ? "inset 0 0 0 1px color-mix(in oklch, var(--primary) 28%, transparent), 0 6px 18px -6px color-mix(in oklch, var(--foreground) 20%, transparent)"
          : selected
            ? undefined
            : "0 1px 2px color-mix(in oklch, var(--foreground) 6%, transparent)",
        opacity: scheduleSurface?.opacity ?? 1,
        filter: isHovered ? "brightness(1.03)" : undefined,
      }}
      aria-label={ariaLabel}
      data-schedules-kbd-target={schedulesContext && keyboardRowId ? "stripe" : undefined}
      data-schedules-kbd-row={schedulesContext ? keyboardRowId : undefined}
      onClick={handleClick}
      onMouseEnter={(e) => onHover(cluster, e.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(cluster, e.currentTarget)}
      onBlur={onLeave}
    >
      {isHovered ? (
        <span
          className="pointer-events-none absolute inset-0 rounded-[inherit] bg-primary/[0.07]"
          aria-hidden
        />
      ) : null}
      <div
        className={cn(
          "relative z-[1] flex min-w-0 h-full w-full items-center",
          microStripe ? "px-1" : "px-2",
          GOLD_PARTNER_FILTER_LABEL_CLASS,
        )}
        style={{
          transform: labelPin > 0 ? `translateX(${labelPin}px)` : undefined,
          ["--gold-inline" as string]: hasGoldPartner ? "calc(1em + 0.35em)" : "0px",
        }}
      >
        {horizontalScheduleBar ? (
          <ScheduleHorizontalBarContent
            signalIcon={scheduleSignal?.icon}
            signalIconClass={barSignalIconClass}
            name={displayPrimary}
            rhythm={scheduleRhythm}
            showRhythm={showRhythmInfographic}
            dateRange={scheduleCopy?.compactDateRange}
            showDateRange={showDateRange}
            compact={compactRhythm}
            micro={microStripe}
          />
        ) : (
          <>
        {displayPrimary || hasGoldPartner || showMicroStatus ? (
          <div className={cn("flex min-w-0 items-center", GOLD_PARTNER_INLINE_GAP)}>
            {scheduleSignal ? (
              <FontAwesomeIcon
                name={scheduleSignal.icon}
                className={cn(
                  "pointer-events-none shrink-0 self-center",
                  microStripe ? "size-3" : "size-3.5",
                  scheduleSignal.iconClass,
                )}
                aria-hidden
              />
            ) : null}
            {hasGoldPartner && !microStripe ? (
              <GoldPartnerStar
                size={GOLD_PARTNER_FILTER_STAR_SIZE}
                className="pointer-events-none shrink-0 self-center"
              />
            ) : null}
            {displayPrimary && !showMicroStatus ? (
              <span className="min-w-0 truncate text-[11px] font-semibold leading-tight pointer-events-none">
                {displayPrimary}
              </span>
            ) : null}
            {showMicroStatus ? (
              <span className="min-w-0 truncate text-[9px] font-semibold leading-tight pointer-events-none">
                {scheduleSignal!.shortLabel}
              </span>
            ) : null}
          </div>
        ) : null}
        {showSecondary ? (
          <span
            className={cn(
              "truncate text-[9px] font-medium tabular-nums pointer-events-none",
              schedulesContext && scheduleSignal
                ? scheduleSignal.secondaryClass
                : onTrackConfirmed
                  ? "text-emerald-950 opacity-90 dark:text-emerald-50"
                  : "text-muted-foreground",
            )}
            style={{ paddingLeft: scheduleSignal ? "calc(1em + 0.25em)" : "var(--gold-inline)" }}
          >
            {schedulesContext ? schedulesStatusLine : stripeSecondary}
          </span>
        ) : null}
          </>
        )}
      </div>
    </button>
  )
}

export { STRIPE_H as CODA_STRIPE_H }
export { SCHEDULE_COMPACT_STRIPE_H } from "../../lib/schedules/schedule-bar-rhythm"
