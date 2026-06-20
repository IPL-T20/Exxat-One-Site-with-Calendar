import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { ApprovalObjectCluster } from "../../lib/slot-requests-calendar/approval-object-cluster"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import { SIDEBAR_W } from "../../lib/slot-requests-calendar/constants"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import {
  clusterStripeLayouts,
  computeExpandedStackPlacements,
  computeStripeOverlapGroups,
  CODA_STRIPE_EXPLODE_MS,
  CODA_STRIPE_EXPLODE_STAGGER_MS,
  type ClusterStripeLayout,
} from "./coda-stripe-overlap-groups"
import { CodaStyleAvailabilityStripe, CODA_STRIPE_H } from "./coda-style-availability-stripe"
import { layoutIntraDayStripes } from "../../lib/slot-requests-calendar/shift-intraday-layout"
import { cn } from "../ui/utils"

type StripeRowLayout = ClusterStripeLayout & { top?: number }

export function CodaStripeRow({
  clusters,
  rowH,
  timelineW,
  zoom,
  ppd,
  monthPxW,
  scrollRef,
  scenarioForCluster,
  sidebarContext,
  approvalDetailRequestId,
  onOpenDetail,
  onOpenSingle,
  onHover,
  onLeave,
  schedulesContext = false,
  focusPeriodClip = null,
  useFocusShiftLayout = false,
}: {
  clusters: ApprovalObjectCluster[]
  rowH: number
  timelineW: number
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
  approvalDetailRequestId: string | null
  onOpenDetail: (requestIds: string[], scenarioId?: string) => void
  onOpenSingle: (requestId: string) => void
  onHover: (cluster: ApprovalObjectCluster, el: HTMLElement) => void
  onLeave: () => void
  schedulesContext?: boolean
  focusPeriodClip?: FocusPeriodRange | null
  useFocusShiftLayout?: boolean
}) {
  const rowRef = useRef<HTMLDivElement>(null)
  const [activeOverlapGroupId, setActiveOverlapGroupId] = useState<string | null>(null)
  const [stackPhase, setStackPhase] = useState<"open" | "closing" | null>(null)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [viewportW, setViewportW] = useState(0)
  const [rowScreenTop, setRowScreenTop] = useState<number | undefined>(undefined)
  const [rowScreenBottom, setRowScreenBottom] = useState<number | undefined>(undefined)

  const syncScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setScrollLeft(el.scrollLeft)
    setViewportW(Math.max(0, el.clientWidth - SIDEBAR_W))
    const rowEl = rowRef.current
    if (rowEl) {
      const rect = rowEl.getBoundingClientRect()
      setRowScreenTop(rect.top)
      setRowScreenBottom(rect.bottom)
    }
  }, [scrollRef])

  useEffect(() => {
    syncScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", syncScroll, { passive: true })
    const ro = new ResizeObserver(syncScroll)
    ro.observe(el)
    if (rowRef.current) ro.observe(rowRef.current)
    return () => {
      el.removeEventListener("scroll", syncScroll)
      ro.disconnect()
    }
  }, [scrollRef, syncScroll])

  useEffect(() => {
    if (!activeOverlapGroupId) return
    syncScroll()
  }, [activeOverlapGroupId, syncScroll])

  const layouts = useMemo((): StripeRowLayout[] => {
    if (useFocusShiftLayout && focusPeriodClip) {
      const { layouts: intra } = layoutIntraDayStripes(
        clusters,
        focusPeriodClip,
        CODA_STRIPE_H,
        zoom,
        ppd,
      )
      return intra.map((item) => ({
        clusterId: item.clusterId,
        cluster: item.cluster,
        left: item.left,
        cardW: item.cardW,
        stripeRight: item.stripeRight,
        top: item.top,
      }))
    }
    return clusterStripeLayouts(clusters, zoom, ppd, monthPxW, focusPeriodClip)
  }, [
    clusters,
    zoom,
    ppd,
    monthPxW,
    focusPeriodClip,
    useFocusShiftLayout,
  ])

  const layoutByClusterId = useMemo(() => {
    const map = new Map<string, (typeof layouts)[number]>()
    layouts.forEach((layout) => map.set(layout.clusterId, layout))
    return map
  }, [layouts])

  const { groupByCluster, groups } = useMemo(() => {
    if (useFocusShiftLayout) {
      return { groupByCluster: new Map<string, string>(), groups: new Map<string, string[]>() }
    }
    return computeStripeOverlapGroups(layouts)
  }, [layouts, useFocusShiftLayout])

  const expandedClusterIds = activeOverlapGroupId
    ? groups.get(activeOverlapGroupId) ?? []
    : []

  const expandedLayouts = expandedClusterIds
    .map((clusterId) => layoutByClusterId.get(clusterId))
    .filter((layout): layout is (typeof layouts)[number] => layout !== undefined)

  const expandedPlacements = useMemo(() => {
    if (expandedLayouts.length < 2) return new Map<string, ReturnType<typeof computeExpandedStackPlacements>[number]>()
    const placements = computeExpandedStackPlacements(
      expandedLayouts,
      rowH,
      CODA_STRIPE_H,
      viewportW > 0
        ? {
            scrollLeft,
            viewportWidth: viewportW,
            timelineWidth: timelineW,
            rowScreenTop,
            rowScreenBottom,
          }
        : undefined,
    )
    return new Map(placements.map((placement) => [placement.clusterId, placement]))
  }, [expandedLayouts, rowH, scrollLeft, viewportW, timelineW, rowScreenTop, rowScreenBottom])

  const clusterById = useMemo(() => {
    const map = new Map<string, ApprovalObjectCluster>()
    clusters.forEach((cluster) => map.set(cluster.id, cluster))
    return map
  }, [clusters])

  const stripeEntries = useMemo(() => {
    if (useFocusShiftLayout) {
      return layouts.map((layout) => ({
        cluster: layout.cluster,
        layout,
      }))
    }
    return clusters
      .map((cluster) => {
        const layout = layoutByClusterId.get(cluster.id)
        return layout ? { cluster, layout } : null
      })
      .filter((entry): entry is { cluster: ApprovalObjectCluster; layout: StripeRowLayout } =>
        entry !== null,
      )
  }, [useFocusShiftLayout, layouts, clusters, layoutByClusterId])

  const openOverlapGroup = (groupId: string) => {
    onLeave()
    syncScroll()
    setStackPhase("open")
    setActiveOverlapGroupId(groupId)
  }

  const beginCollapse = useCallback(() => {
    if (!activeOverlapGroupId || stackPhase === "closing") return
    setStackPhase("closing")
  }, [activeOverlapGroupId, stackPhase])

  useEffect(() => {
    if (stackPhase !== "closing" || expandedPlacements.size === 0) return
    const maxCloseDelay = Math.max(
      ...[...expandedPlacements.values()].map(
        (p) => (p.stackCount - 1 - p.stackIndex) * Math.min(CODA_STRIPE_EXPLODE_STAGGER_MS, 24),
      ),
      0,
    )
    const duration = CODA_STRIPE_EXPLODE_MS + maxCloseDelay + 50
    const timer = window.setTimeout(() => {
      setActiveOverlapGroupId(null)
      setStackPhase(null)
      onLeave()
    }, duration)
    return () => clearTimeout(timer)
  }, [stackPhase, expandedPlacements, onLeave])

  useEffect(() => {
    if (stackPhase !== "open" || expandedPlacements.size === 0) return

    const margin = 18
    const stripeH = CODA_STRIPE_H
    let outsideTimer: number | null = null

    const isInCluster = (clientX: number, clientY: number) => {
      const rowEl = rowRef.current
      if (!rowEl) return false
      const rowRect = rowEl.getBoundingClientRect()

      const first = expandedPlacements.values().next().value
      if (first) {
        const pileLeft = rowRect.left + first.originLeft
        const pileTop = rowRect.top + first.originTop
        if (
          clientX >= pileLeft - margin &&
          clientX <= pileLeft + margin &&
          clientY >= pileTop - margin &&
          clientY <= pileTop + stripeH + margin
        ) {
          return true
        }
      }

      for (const placement of expandedPlacements.values()) {
        const left = rowRect.left + placement.left
        const top = rowRect.top + placement.top
        if (
          clientX >= left - margin &&
          clientX <= left + placement.width + margin &&
          clientY >= top - margin &&
          clientY <= top + stripeH + margin
        ) {
          return true
        }
      }
      return false
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isInCluster(event.clientX, event.clientY)) {
        if (outsideTimer !== null) {
          clearTimeout(outsideTimer)
          outsideTimer = null
        }
        return
      }
      if (outsideTimer === null) {
        outsideTimer = window.setTimeout(() => {
          outsideTimer = null
          beginCollapse()
        }, 90)
      }
    }

    document.addEventListener("pointermove", handlePointerMove, { passive: true })
    return () => {
      document.removeEventListener("pointermove", handlePointerMove)
      if (outsideTimer !== null) clearTimeout(outsideTimer)
    }
  }, [stackPhase, expandedPlacements, beginCollapse])

  const renderStripe = (
    cluster: ApprovalObjectCluster,
    options: {
      layout: (typeof layouts)[number]
      layer: "base" | "expanded"
      expandedPlacement?: ReturnType<typeof computeExpandedStackPlacements>[number]
      subdued?: boolean
      explodeOpen?: boolean
      onOverlapGroupEnter?: () => void
    },
  ) => {
    const scenario = scenarioForCluster?.(cluster)
    const selected = cluster.placements.some(
      (p) => (p.slotRequestId ?? p.id) === approvalDetailRequestId,
    )

    return (
      <CodaStyleAvailabilityStripe
        key={options.layer === "expanded" ? `expanded-${cluster.id}` : cluster.id}
        cluster={cluster}
        layout={options.layout}
        expandedPlacement={options.expandedPlacement}
        layer={options.layer}
        subdued={options.subdued}
        explodeOpen={options.explodeOpen}
        zoom={zoom}
        ppd={ppd}
        monthPxW={monthPxW}
        scrollRef={scrollRef}
        scenario={scenario}
        selected={selected}
        schedulesContext={schedulesContext}
        focusPeriodClip={focusPeriodClip}
        sidebarContext={sidebarContext}
        onOpenDetail={onOpenDetail}
        onOpenSingle={onOpenSingle}
        onHover={onHover}
        onLeave={onLeave}
        onOverlapGroupEnter={options.onOverlapGroupEnter}
      />
    )
  }

  return (
    <div
      ref={rowRef}
      className={cn(
        "absolute inset-0",
        useFocusShiftLayout ? "overflow-hidden" : "overflow-visible",
      )}
    >
      {stripeEntries.map(({ cluster, layout }) => {
        const groupId = groupByCluster.get(cluster.id)
        const isInExpandedGroup =
          Boolean(activeOverlapGroupId) &&
          groupId === activeOverlapGroupId &&
          (groups.get(groupId!)?.length ?? 0) > 1

        return renderStripe(cluster, {
          layout,
          layer: "base",
          subdued: isInExpandedGroup,
          onOverlapGroupEnter:
            !useFocusShiftLayout &&
            groupId &&
            (groups.get(groupId)?.length ?? 0) > 1
              ? () => openOverlapGroup(groupId)
              : undefined,
        })
      })}

      {activeOverlapGroupId && expandedLayouts.length > 1 ? (
        <div className="absolute inset-0 z-[110] overflow-visible pointer-events-none">
          {expandedLayouts.map((layout) => {
            const cluster = clusterById.get(layout.clusterId)
            const placement = expandedPlacements.get(layout.clusterId)
            if (!cluster || !placement) return null
            return (
              <div key={`explode-wrap-${cluster.id}`} className="pointer-events-auto">
                {renderStripe(cluster, {
                  layout,
                  layer: "expanded",
                  expandedPlacement: placement,
                  explodeOpen: stackPhase !== "closing",
                })}
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
