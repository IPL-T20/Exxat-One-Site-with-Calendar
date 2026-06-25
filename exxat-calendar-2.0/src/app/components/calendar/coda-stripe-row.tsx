import { useMemo, useRef } from "react"
import type { ApprovalObjectCluster } from "../../lib/slot-requests-calendar/approval-object-cluster"
import { mergeOverlapClusters } from "../../lib/slot-requests-calendar/approval-timeline-density"
import type { CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { FocusPeriodRange } from "../../lib/slot-requests-calendar/calendar-period-focus"
import type { CalendarZoom } from "../../lib/slot-requests-calendar/types"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import {
  clusterStripeLayouts,
  computeStripeOverlapGroups,
  type ClusterStripeLayout,
} from "./coda-stripe-overlap-groups"
import { CodaStyleAvailabilityStripe, CODA_STRIPE_H } from "./coda-style-availability-stripe"
import { layoutIntraDayStripes } from "../../lib/slot-requests-calendar/shift-intraday-layout"
import { cn } from "../ui/utils"

type StripeRowLayout = ClusterStripeLayout & { top?: number }

type VisibleStripe = {
  cluster: ApprovalObjectCluster
  layout: StripeRowLayout
  overlapSize: number
}

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
  hoveredClusterId = null,
  keyboardRowId,
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
  onHover: (cluster: ApprovalObjectCluster, el: HTMLElement, overlapGroupSize?: number) => void
  onLeave: () => void
  schedulesContext?: boolean
  focusPeriodClip?: FocusPeriodRange | null
  useFocusShiftLayout?: boolean
  hoveredClusterId?: string | null
  keyboardRowId?: string
}) {
  const rowRef = useRef<HTMLDivElement>(null)

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
  }, [clusters, zoom, ppd, monthPxW, focusPeriodClip, useFocusShiftLayout])

  const layoutByClusterId = useMemo(() => {
    const map = new Map<string, StripeRowLayout>()
    layouts.forEach((layout) => map.set(layout.clusterId, layout))
    return map
  }, [layouts])

  const { groupByCluster, groups } = useMemo(() => {
    if (useFocusShiftLayout) {
      return { groupByCluster: new Map<string, string>(), groups: new Map<string, string[]>() }
    }
    return computeStripeOverlapGroups(layouts)
  }, [layouts, useFocusShiftLayout])

  const clusterById = useMemo(() => {
    const map = new Map<string, ApprovalObjectCluster>()
    clusters.forEach((cluster) => map.set(cluster.id, cluster))
    return map
  }, [clusters])

  /** One visible stripe per overlap pile — no fan-out on hover. */
  const visibleStripes = useMemo((): VisibleStripe[] => {
    const renderedGroups = new Set<string>()
    const entries: VisibleStripe[] = []

    for (const cluster of clusters) {
      const layout = layoutByClusterId.get(cluster.id)
      if (!layout) continue

      const groupId = groupByCluster.get(cluster.id)
      const overlapSize = groupId ? (groups.get(groupId)?.length ?? 0) : 0

      if (overlapSize <= 1) {
        entries.push({ cluster, layout, overlapSize: 0 })
        continue
      }

      if (!groupId || renderedGroups.has(groupId)) continue
      renderedGroups.add(groupId)

      const members = (groups.get(groupId) ?? [])
        .map((id) => clusterById.get(id))
        .filter((member): member is ApprovalObjectCluster => Boolean(member))
      const merged = mergeOverlapClusters(members)

      entries.push({
        cluster: merged ?? cluster,
        layout,
        overlapSize,
      })
    }

    return entries
  }, [clusters, layoutByClusterId, groupByCluster, groups, clusterById])

  const rowHasHover =
    hoveredClusterId != null && clusters.some((cluster) => cluster.id === hoveredClusterId)

  return (
    <div
      ref={rowRef}
      className={cn(
        "absolute inset-0",
        useFocusShiftLayout ? "overflow-hidden" : "overflow-visible",
      )}
    >
      {visibleStripes.map(({ cluster, layout, overlapSize }) => {
        const scenario = scenarioForCluster?.(cluster)
        const selected = cluster.placements.some(
          (p) => (p.slotRequestId ?? p.id) === approvalDetailRequestId,
        )
        const isHovered = hoveredClusterId === cluster.id

        return (
          <CodaStyleAvailabilityStripe
            key={cluster.id}
            cluster={cluster}
            layout={layout}
            zoom={zoom}
            ppd={ppd}
            monthPxW={monthPxW}
            scrollRef={scrollRef}
            scenario={scenario}
            selected={selected}
            isHovered={isHovered}
            isFaded={rowHasHover && !isHovered}
            schedulesContext={schedulesContext}
            focusPeriodClip={focusPeriodClip}
            sidebarContext={sidebarContext}
            overlapGroupSize={overlapSize}
            onOpenDetail={onOpenDetail}
            onOpenSingle={onOpenSingle}
            onHover={(c, el) => onHover(c, el, overlapSize > 1 ? overlapSize : undefined)}
            onLeave={onLeave}
            keyboardRowId={keyboardRowId}
          />
        )
      })}
    </div>
  )
}
