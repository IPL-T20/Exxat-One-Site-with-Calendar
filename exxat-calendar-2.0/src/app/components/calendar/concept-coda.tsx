/** Approval mode — Coda-style object timeline (request cards, not resource Gantt). */
import { useState } from "react"
import { visiblePlacements } from "../../lib/slot-requests-calendar/calendar-mode"
import { attachClusterDecisionMeta } from "../../lib/slot-requests-calendar/cluster-decision-meta"
import {
  clusterApprovalObjects,
  rowMaxCardHeight,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import {
  APPROVAL_OBJECT_ROW_H,
  CALENDAR_ROW_BORDER,
  HEADER_DAY_H,
  LOCATION_ROW_H,
  SIDEBAR_W,
} from "../../lib/slot-requests-calendar/constants"
import type { CalendarModel } from "./useCalendarModel"
import { useMedStarReal } from "../../lib/medstar-real/medstar-real-context"
import { ApprovalHoverCard, type ApprovalHoverTarget } from "./approval-hover-card"
import { USABILITY_FIXTURE_IDS } from "../../lib/mock/usability-prototype-rows"
import { ApprovalObjectCard } from "./approval-object-card"
import { CODA_STRIPE_H } from "./coda-style-availability-stripe"
import { CodaStripeRow } from "./coda-stripe-row"
import { CodaStripeRowWallHints } from "./coda-stripe-row-wall-hints"
import {
  clusterSchedulesIndividually,
  isScheduleFocusShiftLayout,
} from "../../lib/schedules/schedule-focus-view"
import { layoutIntraDayStripes } from "../../lib/slot-requests-calendar/shift-intraday-layout"
import {
  AvailabilityHoverPreview,
  type AvailabilityHoverTarget,
} from "./availability-hover-preview"
import {
  CalendarSidebarCollapsedHint,
  CalendarSidebarFlatRow,
  CalendarSidebarLeafRow,
  CalendarSidebarNavHeader,
  CalendarSidebarParentRow,
} from "./calendar-sidebar"
import { DateHeader, LiveMomentGridOverlay, TimelineMonthColumnLayer } from "./calendar-shared"
import { MedStarClusterHover } from "./medstar-real/MedStarClusterHover"
import { useMedStarDataOptional } from "../../lib/medstar-data/medstar-data-context"
import { useWorkflowPrototype } from "./usability-prototype/workflow-prototype-context"
import { cn } from "../ui/utils"

const PARENT_ROW_H = LOCATION_ROW_H

function buildStripeClusters(
  requests: ReturnType<typeof visiblePlacements>,
  zoom: CalendarModel["zoom"],
  ppd: number,
  monthPxW: number,
  schedulesContext: boolean,
  useFocusShiftLayout: boolean,
) {
  if (schedulesContext && useFocusShiftLayout) {
    return clusterSchedulesIndividually(requests)
  }
  return clusterApprovalObjects(requests, zoom, ppd, monthPxW)
}

function codaStripeRowHeight(
  requests: ReturnType<typeof visiblePlacements>,
  useFocusShiftLayout: boolean,
  focusPeriodClip: CalendarModel["focusPeriodClip"],
  zoom: CalendarModel["zoom"],
  ppd: number,
  monthPxW: number,
  schedulesContext: boolean,
): number {
  if (useFocusShiftLayout && focusPeriodClip) {
    const clusters = buildStripeClusters(
      requests,
      zoom,
      ppd,
      monthPxW,
      schedulesContext,
      true,
    )
    const { rowContentH } = layoutIntraDayStripes(
      clusters,
      focusPeriodClip,
      CODA_STRIPE_H,
      zoom,
      ppd,
    )
    return Math.max(APPROVAL_OBJECT_ROW_H, rowContentH || CODA_STRIPE_H + 12)
  }
  return Math.max(APPROVAL_OBJECT_ROW_H, CODA_STRIPE_H + 12)
}

function openTimelineRequest(model: CalendarModel, requestId: string) {
  if (model.schedulesContext) {
    model.setSelectedId(requestId)
    return
  }
  model.openApprovalDetail(requestId)
}

function openTimelineCluster(
  model: CalendarModel,
  requestIds: string[],
  scenarioId: string | undefined,
  setApprovalCluster: CalendarModel["setApprovalCluster"],
) {
  if (model.schedulesContext) {
    const first = requestIds[0]
    if (first) model.setSelectedId(first)
    return
  }
  setApprovalCluster({ requestIds, scenarioId })
}

function openTimelineAvailability(
  model: CalendarModel,
  requestIds: string[],
  scenarioId: string | undefined,
  setAvailabilityDetail: CalendarModel["setAvailabilityDetail"],
) {
  if (model.schedulesContext) {
    const first = requestIds[0]
    if (first) model.setSelectedId(first)
    return
  }
  setAvailabilityDetail({ requestIds, scenarioId })
}

export function ConceptCodaTimeline({
  model,
  debugMedStar = false,
}: {
  model: CalendarModel
  debugMedStar?: boolean
}) {
  const {
    calendarViewGroups,
    groupBy,
    expanded,
    toggleLocation,
    mode,
    layers,
    zoom,
    ppd,
    monthPxW,
    timelineW,
    todayX,
    todayMarkerX,
    liveNow,
    calendarToday,
    grid,
    scrollRef,
    sideShadow,
    currentPeriodHighlight,
    navigatorPeriodHighlight,
    focusPeriodClip,
    isViewingToday,
    periodAnchor,
    approvalDetailRequestId,
    setApprovalCluster,
    setAvailabilityDetail,
  } = model

  const [hover, setHover] = useState<ApprovalHoverTarget | null>(null)
  const [codaHover, setCodaHover] = useState<AvailabilityHoverTarget | null>(null)
  const proto = useWorkflowPrototype()
  const medstar = useMedStarReal()
  const medstarData = useMedStarDataOptional()
  const useCodaStripes = Boolean(
    model.schedulesContext || (medstarData?.isMedStarLoaded && !debugMedStar),
  )
  const useFocusShiftLayout = isScheduleFocusShiftLayout(
    zoom,
    layers.focusPeriod,
    focusPeriodClip,
    Boolean(model.schedulesContext),
  )
  const emptyRowMessage = model.schedulesContext
    ? "No schedules in this period"
    : "No requests in this period"

  const isUsabilityCluster = (requestIds: string[]) =>
    !medstarData?.isMedStarLoaded &&
    proto.enabled &&
    requestIds.some((id) => Object.values(USABILITY_FIXTURE_IDS).includes(id as typeof USABILITY_FIXTURE_IDS.hopkins))

  return (
    <div ref={scrollRef} className="calendar-scroll-surface flex-1 min-h-0 overflow-auto">
      <div
        className="calendar-grid-frame relative border-x border-border"
        style={{ minWidth: SIDEBAR_W + timelineW }}
        role="grid"
        aria-label={model.schedulesContext ? "Schedules calendar timeline" : "Slot requests calendar timeline"}
      >
        <TimelineMonthColumnLayer
          bands={grid.tintBands}
          dividerCols={grid.dividerCols}
          sidebarW={SIDEBAR_W}
          timelineW={timelineW}
          top={0}
          headerH={HEADER_DAY_H}
          todayX={todayX}
          zoom={zoom}
          currentPeriod={currentPeriodHighlight}
          navigatorPeriod={navigatorPeriodHighlight}
          focusPeriodMode={layers.focusPeriod}
        />

        <DateHeader
          grid={grid}
          timelineW={timelineW}
          todayX={todayX}
          todayMarkerX={todayMarkerX}
          liveNow={liveNow}
          calendarToday={calendarToday}
          sidebarW={SIDEBAR_W}
          headerH={HEADER_DAY_H}
          sideShadow={sideShadow}
          zoom={zoom}
          ppd={ppd}
          monthPxW={monthPxW}
          currentPeriod={currentPeriodHighlight}
          navigatorPeriod={navigatorPeriodHighlight}
          periodAnchor={periodAnchor}
          isViewingToday={isViewingToday}
          sidebarSlot={<CalendarSidebarNavHeader model={model} />}
        />

        <div className="relative z-[2]">
        {(() => {
          return calendarViewGroups.map((group) => {
          const isOpen = group.flat || expanded.has(group.id)
          const visibleRows = isOpen
            ? group.rows.filter((row) => {
                const requests = visiblePlacements(row.placements, mode, layers)
                if (requests.length > 0) return true
                return layers.showEmptyDisciplines
              })
            : []

          if (group.flat) {
            const row = group.rows[0]
            if (!row) return null
            const requests = visiblePlacements(row.placements, mode, layers)
            const isEmpty = requests.length === 0
            const rowH = isEmpty
              ? APPROVAL_OBJECT_ROW_H
              : useCodaStripes
                ? codaStripeRowHeight(
                    requests,
                    useFocusShiftLayout,
                    focusPeriodClip,
                    zoom,
                    ppd,
                    monthPxW,
                    Boolean(model.schedulesContext),
                  )
                : Math.max(
                    APPROVAL_OBJECT_ROW_H,
                    rowMaxCardHeight(
                      attachClusterDecisionMeta(
                        clusterApprovalObjects(requests, zoom, ppd, monthPxW),
                        (id) => model.getRequestDecision(id),
                      ),
                      zoom,
                      ppd,
                      monthPxW,
                    ),
                  )

            return (
              <div key={group.id} className="group/calrow flex" style={{ height: rowH }} role="row">
                <CalendarSidebarFlatRow
                  group={group}
                  row={row}
                  rowH={rowH}
                  sidebarW={SIDEBAR_W}
                  sideShadow={sideShadow}
                  getDecision={model.getDisciplineDecision}
                />
                <TimelineRowCanvas
                  requests={requests}
                  rowH={rowH}
                  timelineW={timelineW}
                  useCodaStripes={useCodaStripes}
                  schedulesContext={model.schedulesContext}
                  focusPeriodClip={focusPeriodClip}
                  useFocusShiftLayout={useFocusShiftLayout}
                  sidebarContext={{
                    rowLabel: row.label,
                    parentLabel: group.label,
                    groupBy,
                  }}
                  model={model}
                  debugMedStar={debugMedStar}
                  medstar={medstar}
                  medstarData={medstarData}
                  isUsabilityCluster={isUsabilityCluster}
                  proto={proto}
                  zoom={zoom}
                  ppd={ppd}
                  monthPxW={monthPxW}
                  scrollRef={scrollRef}
                  approvalDetailRequestId={approvalDetailRequestId}
                  setAvailabilityDetail={setAvailabilityDetail}
                  setApprovalCluster={setApprovalCluster}
                  setCodaHover={setCodaHover}
                  setHover={setHover}
                />
              </div>
            )
          }

          return (
            <div key={group.id}>
              <div className="group/calloc flex" style={{ height: PARENT_ROW_H }} role="row">
                <CalendarSidebarParentRow
                  group={group}
                  isOpen={isOpen}
                  onToggle={() => toggleLocation(group.id)}
                  sidebarW={SIDEBAR_W}
                  sideShadow={sideShadow}
                />
                <div
                  className="relative flex-shrink-0 pointer-events-none bg-transparent"
                  style={{ width: timelineW, height: PARENT_ROW_H }}
                >
                  <div className="absolute inset-0">
                    {!isOpen && group.placementCount > 0 ? (
                      <CalendarSidebarCollapsedHint group={group} />
                    ) : null}
                  </div>
                  <div className={cn("pointer-events-none absolute inset-x-0 bottom-0", CALENDAR_ROW_BORDER)} aria-hidden />
                </div>
              </div>

              {visibleRows.map((row) => {
                const requests = visiblePlacements(row.placements, mode, layers)
                const isEmpty = requests.length === 0
                const rowH = isEmpty
                  ? APPROVAL_OBJECT_ROW_H
                  : useCodaStripes
                    ? codaStripeRowHeight(
                        requests,
                        useFocusShiftLayout,
                        focusPeriodClip,
                        zoom,
                        ppd,
                        monthPxW,
                        Boolean(model.schedulesContext),
                      )
                    : Math.max(
                        APPROVAL_OBJECT_ROW_H,
                        rowMaxCardHeight(
                          attachClusterDecisionMeta(
                            clusterApprovalObjects(requests, zoom, ppd, monthPxW),
                            (id) => model.getRequestDecision(id),
                          ),
                          zoom,
                          ppd,
                          monthPxW,
                        ) + 8,
                      )

                return (
                  <div key={row.id} className="group/calrow flex" style={{ height: rowH }} role="row">
                    <CalendarSidebarLeafRow
                      row={row}
                      rowH={rowH}
                      sidebarW={SIDEBAR_W}
                      sideShadow={sideShadow}
                      getDecision={model.getDisciplineDecision}
                    />
                    <TimelineRowCanvas
                      requests={requests}
                      rowH={rowH}
                      timelineW={timelineW}
                      useCodaStripes={useCodaStripes}
                      schedulesContext={model.schedulesContext}
                      focusPeriodClip={focusPeriodClip}
                      useFocusShiftLayout={useFocusShiftLayout}
                      sidebarContext={{
                        rowLabel: row.label,
                        parentLabel: group.label,
                        groupBy,
                      }}
                      model={model}
                      debugMedStar={debugMedStar}
                      medstar={medstar}
                      medstarData={medstarData}
                      isUsabilityCluster={isUsabilityCluster}
                      proto={proto}
                      zoom={zoom}
                      ppd={ppd}
                      monthPxW={monthPxW}
                      scrollRef={scrollRef}
                      approvalDetailRequestId={approvalDetailRequestId}
                      setAvailabilityDetail={setAvailabilityDetail}
                      setApprovalCluster={setApprovalCluster}
                      setCodaHover={setCodaHover}
                      setHover={setHover}
                      emptyMessage={emptyRowMessage}
                      isEmpty={isEmpty}
                    />
                  </div>
                )
              })}
            </div>
          )
        })
        })()}
        </div>

        <LiveMomentGridOverlay
          x={todayMarkerX}
          sidebarW={SIDEBAR_W}
          timelineW={timelineW}
          headerH={HEADER_DAY_H}
          isViewingToday={isViewingToday}
        />
      </div>

      {useCodaStripes ? (
        <AvailabilityHoverPreview target={codaHover} schedulesContext={model.schedulesContext} />
      ) : debugMedStar && hover?.kind === "cluster" ? (
        <MedStarClusterHover rect={hover.rect} />
      ) : (
        <ApprovalHoverCard target={hover} model={model} />
      )}
    </div>
  )
}

function TimelineRowCanvas({
  requests,
  rowH,
  timelineW,
  useCodaStripes,
  schedulesContext = false,
  focusPeriodClip = null,
  useFocusShiftLayout = false,
  sidebarContext,
  model,
  debugMedStar,
  medstar,
  medstarData,
  isUsabilityCluster,
  proto,
  zoom,
  ppd,
  monthPxW,
  scrollRef,
  approvalDetailRequestId,
  setAvailabilityDetail,
  setApprovalCluster,
  setCodaHover,
  setHover,
  emptyMessage,
  isEmpty,
}: {
  requests: ReturnType<typeof visiblePlacements>
  rowH: number
  timelineW: number
  useCodaStripes: boolean
  schedulesContext?: boolean
  focusPeriodClip?: CalendarModel["focusPeriodClip"]
  useFocusShiftLayout?: boolean
  isLastInGroup?: boolean
  sidebarContext: {
    rowLabel?: string
    parentLabel?: string
    groupBy: CalendarModel["groupBy"]
  }
  model: CalendarModel
  debugMedStar: boolean
  medstar: ReturnType<typeof useMedStarReal>
  medstarData: ReturnType<typeof useMedStarDataOptional>
  isUsabilityCluster: (ids: string[]) => boolean
  proto: ReturnType<typeof useWorkflowPrototype>
  zoom: CalendarModel["zoom"]
  ppd: number
  monthPxW: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  approvalDetailRequestId: string | null
  setAvailabilityDetail: CalendarModel["setAvailabilityDetail"]
  setApprovalCluster: CalendarModel["setApprovalCluster"]
  setCodaHover: (target: AvailabilityHoverTarget | null) => void
  setHover: (target: ApprovalHoverTarget | null) => void
  emptyMessage?: string
  isEmpty?: boolean
}) {
  const clusters = attachClusterDecisionMeta(
    buildStripeClusters(
      requests,
      zoom,
      ppd,
      monthPxW,
      schedulesContext,
      useFocusShiftLayout,
    ),
    (id) => model.getRequestDecision(id),
  )

  return (
    <div
      className={cn(
        "relative flex-shrink-0 bg-transparent",
        useCodaStripes && !useFocusShiftLayout && "overflow-visible",
        useCodaStripes && useFocusShiftLayout && "overflow-hidden isolate",
      )}
      style={{ width: timelineW, height: rowH }}
      role="gridcell"
      aria-label={sidebarContext.rowLabel ?? "Timeline row"}
    >
      <div className="absolute inset-0">
      {isEmpty ? (
        <div
          className="absolute inset-x-3 inset-y-2 z-[1] flex items-center justify-center rounded-md border border-dashed border-border/70 bg-muted/25"
          aria-live="polite"
        >
          <span className="text-[11px] font-medium text-muted-foreground">
            {emptyMessage ?? (schedulesContext ? "No schedules in this period" : "No requests in this period")}
          </span>
        </div>
      ) : (
        <>
          {useCodaStripes ? (
            <CodaStripeRow
              clusters={clusters}
              rowH={rowH}
              timelineW={timelineW}
              zoom={zoom}
              ppd={ppd}
              monthPxW={monthPxW}
              scrollRef={scrollRef}
              schedulesContext={schedulesContext}
              focusPeriodClip={focusPeriodClip}
              useFocusShiftLayout={useFocusShiftLayout}
              sidebarContext={sidebarContext}
              approvalDetailRequestId={approvalDetailRequestId}
              scenarioForCluster={(cluster) => {
                const clusterIds = cluster.placements.map((p) => p.slotRequestId ?? p.id)
                return medstarData?.findScenarioForCluster(clusterIds)
              }}
              onOpenDetail={(ids, scenarioId) =>
                openTimelineAvailability(model, ids, scenarioId, setAvailabilityDetail)
              }
              onOpenSingle={(id) => openTimelineRequest(model, id)}
              onHover={(c, el) => {
                const clusterIds = c.placements.map((p) => p.slotRequestId ?? p.id)
                setCodaHover({
                  cluster: c,
                  rect: el.getBoundingClientRect(),
                  scenario: medstarData?.findScenarioForCluster(clusterIds),
                  sidebarContext,
                  schedulesContext,
                })
              }}
              onLeave={() => setCodaHover(null)}
            />
          ) : null}
          {!useCodaStripes
            ? clusters.map((cluster) => {
          const clusterIds = cluster.placements.map((p) => p.slotRequestId ?? p.id)

          const usabilitySurface = isUsabilityCluster(clusterIds) ? proto.surfaceSnapshot : null
          const productMedstarSurface =
            medstarData?.isMedStarLoaded && cluster.stats.requestCount > 1
              ? medstarData.getClusterSurface(clusterIds)
              : null
          const showMedstarSurface = debugMedStar && cluster.stats.requestCount > 1

          return (
            <ApprovalObjectCard
              key={cluster.id}
              cluster={cluster}
              zoom={zoom}
              ppd={ppd}
              monthPxW={monthPxW}
              focusPeriodClip={focusPeriodClip}
              selectedRequestId={approvalDetailRequestId}
              surfaceOverride={usabilitySurface}
              medstarSurface={
                showMedstarSurface ? medstar.clusterSurface : productMedstarSurface
              }
              clusterPulse={Boolean(
                (usabilitySurface && proto.clusterPulse) ||
                  (showMedstarSurface && medstar.clusterPulse),
              )}
              onOpenSingle={(id) => openTimelineRequest(model, id)}
              onOpenCluster={(ids, scenarioId) =>
                openTimelineCluster(model, ids, scenarioId, setApprovalCluster)
              }
              onHover={(c, el) => {
                const rect = el.getBoundingClientRect()
                const isSingle = c.stats.requestCount === 1 && c.level !== "aggregate"
                setHover(
                  isSingle
                    ? { kind: "single", placement: c.placements[0], rect }
                    : { kind: "cluster", cluster: c, rect },
                )
              }}
              onLeave={() => setHover(null)}
            />
          )
        })
            : null}
          {useCodaStripes && !useFocusShiftLayout ? (
            <CodaStripeRowWallHints
              clusters={clusters}
              zoom={zoom}
              ppd={ppd}
              monthPxW={monthPxW}
              scrollRef={scrollRef}
              schedulesContext={schedulesContext}
              sidebarContext={sidebarContext}
              scenarioForCluster={(cluster) => {
                const clusterIds = cluster.placements.map((p) => p.slotRequestId ?? p.id)
                return medstarData?.findScenarioForCluster(clusterIds)
              }}
            />
          ) : null}
        </>
      )}
      </div>
      <div className={cn("pointer-events-none absolute inset-x-0 bottom-0", CALENDAR_ROW_BORDER)} aria-hidden />
    </div>
  )
}
