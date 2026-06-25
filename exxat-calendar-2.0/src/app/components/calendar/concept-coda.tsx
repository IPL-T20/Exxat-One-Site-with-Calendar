/** Approval mode — Coda-style object timeline (request cards, not resource Gantt). */
import { useCallback, useMemo, useRef, useState } from "react"
import { visiblePlacements } from "../../lib/slot-requests-calendar/calendar-mode"
import {
  computeScheduleRowKpis,
} from "../../lib/schedules/schedules-row-kpis"
import { useSchedulesCalendarKeyboard } from "../../lib/schedules/use-schedules-calendar-keyboard"
import {
  SCHEDULES_ALL_VIEW_VIRTUALIZE_THRESHOLD,
  type SchedulesFlatRowPlan,
} from "../../lib/schedules/schedules-flat-view-virtualizer"
import { useSchedulesFlatViewVirtualizer } from "../../lib/schedules/use-schedules-flat-view-virtualizer"
import type { CalendarViewGroup } from "../../lib/slot-requests-calendar/calendar-grouping"
import { attachClusterDecisionMeta } from "../../lib/slot-requests-calendar/cluster-decision-meta"
import {
  clusterApprovalObjects,
  rowMaxCardHeight,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import {
  APPROVAL_OBJECT_ROW_H,
  CALENDAR_GROUP_BAND_SURFACE,
  CALENDAR_LIVE_MOMENT_GRID_Z,
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
  CalendarSidebarSchedulesDeptRow,
} from "./calendar-sidebar"
import { CalendarGridRow, DateHeader, GridColumnDividers, LiveMomentBodyLine, TimelineMonthColumnLayer } from "./calendar-shared"
import { FocusPeriodSnapshotWidget } from "./focus-period-snapshot-widget"
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
  const stripeH = CODA_STRIPE_H
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
      stripeH,
      zoom,
      ppd,
    )
    return Math.max(APPROVAL_OBJECT_ROW_H, rowContentH || stripeH + 12)
  }
  return Math.max(APPROVAL_OBJECT_ROW_H, stripeH + 12)
}

function flatGroupRowHeight(
  requests: ReturnType<typeof visiblePlacements>,
  ctx: {
    useCodaStripes: boolean
    useFocusShiftLayout: boolean
    focusPeriodClip: CalendarModel["focusPeriodClip"]
    zoom: CalendarModel["zoom"]
    ppd: number
    monthPxW: number
    schedulesContext: boolean
    getRequestDecision: (id: string) => ReturnType<CalendarModel["getRequestDecision"]>
  },
): number {
  const isEmpty = requests.length === 0
  if (isEmpty) return APPROVAL_OBJECT_ROW_H
  if (ctx.useCodaStripes) {
    return codaStripeRowHeight(
      requests,
      ctx.useFocusShiftLayout,
      ctx.focusPeriodClip,
      ctx.zoom,
      ctx.ppd,
      ctx.monthPxW,
      ctx.schedulesContext,
    )
  }
  return Math.max(
    APPROVAL_OBJECT_ROW_H,
    rowMaxCardHeight(
      attachClusterDecisionMeta(
        clusterApprovalObjects(requests, ctx.zoom, ctx.ppd, ctx.monthPxW),
        (id) => ctx.getRequestDecision(id),
      ),
      ctx.zoom,
      ctx.ppd,
      ctx.monthPxW,
    ),
  )
}

function openTimelineRequest(model: CalendarModel, requestId: string) {
  if (model.schedulesContext) {
    model.setScheduleDetailIds([requestId])
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
    if (requestIds.length > 0) model.setScheduleDetailIds(requestIds)
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
    if (requestIds.length > 0) model.setScheduleDetailIds(requestIds)
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
    expandedDepartments,
    toggleLocation,
    toggleDepartment,
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
    scrollTimelineTo,
    currentPeriodHighlight,
    navigatorPeriodHighlight,
    focusPeriodClip,
    isViewingToday,
    periodAnchor,
    focusPeriodSnapshot,
    approvalDetailRequestId,
    selectedId,
    setApprovalCluster,
    setAvailabilityDetail,
    scheduleById,
    scheduleReferenceDate,
  } = model

  const schedulesTreeView = Boolean(model.schedulesContext && groupBy === "location")

  const scheduleKpisFor = useMemo(
    () => (placements: ReturnType<typeof visiblePlacements>) =>
      computeScheduleRowKpis(
        placements,
        scheduleById,
        scheduleReferenceDate,
        periodAnchor,
        zoom,
      ),
    [scheduleById, scheduleReferenceDate, periodAnchor, zoom],
  )

  const stripeDetailRequestId = model.schedulesContext ? selectedId : approvalDetailRequestId

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

  const schedulesAllFlatView = Boolean(
    model.schedulesContext && (groupBy === "live" || groupBy === "all"),
  )

  const flatRowHeightCtx = useMemo(
    () => ({
      useCodaStripes,
      useFocusShiftLayout,
      focusPeriodClip,
      zoom,
      ppd,
      monthPxW,
      schedulesContext: Boolean(model.schedulesContext),
      getRequestDecision: model.getRequestDecision,
    }),
    [
      useCodaStripes,
      useFocusShiftLayout,
      focusPeriodClip,
      zoom,
      ppd,
      monthPxW,
      model.schedulesContext,
      model.getRequestDecision,
    ],
  )

  const flatRowPlan = useMemo((): SchedulesFlatRowPlan | null => {
    if (!schedulesAllFlatView) return null
    let offset = 0
    const entries: SchedulesFlatRowPlan["entries"] = []
    for (const group of calendarViewGroups) {
      if (!group.flat) continue
      const row = group.rows[0]
      if (!row) continue
      const requests = visiblePlacements(row.placements, mode, layers)
      const rowH = flatGroupRowHeight(requests, flatRowHeightCtx)
      entries.push({ group, rowH, offset })
      offset += rowH
    }
    return { entries, totalHeight: offset }
  }, [schedulesAllFlatView, calendarViewGroups, mode, layers, flatRowHeightCtx])

  const shouldVirtualizeFlatView =
    schedulesAllFlatView &&
    (flatRowPlan?.entries.length ?? 0) >= SCHEDULES_ALL_VIEW_VIRTUALIZE_THRESHOLD

  const flatVirtualWindow = useSchedulesFlatViewVirtualizer(
    scrollRef,
    shouldVirtualizeFlatView ? flatRowPlan : null,
    HEADER_DAY_H,
  )

  const isUsabilityCluster = (requestIds: string[]) =>
    !medstarData?.isMedStarLoaded &&
    proto.enabled &&
    requestIds.some((id) => Object.values(USABILITY_FIXTURE_IDS).includes(id as typeof USABILITY_FIXTURE_IDS.hopkins))

  const hoveredClusterId = codaHover?.cluster.id ?? null
  const gridRef = useRef<HTMLDivElement>(null)

  const handleSchedulesKeyboardEscape = useCallback(() => {
    setCodaHover(null)
    if (model.scheduleDetailIds.length > 0) {
      model.setScheduleDetailIds([])
    }
  }, [model])

  useSchedulesCalendarKeyboard({
    enabled: Boolean(model.schedulesContext),
    gridRef,
    onEscape: handleSchedulesKeyboardEscape,
  })

  const renderFlatGroupRow = (
    group: CalendarViewGroup,
    rowH: number,
    keyboardRowId: string | undefined,
  ) => {
    const row = group.rows[0]
    if (!row) return null
    const requests = visiblePlacements(row.placements, mode, layers)

    return (
      <CalendarGridRow key={group.id} className="group/calrow" style={{ height: rowH }} role="row">
        {model.schedulesContext ? (
          <CalendarSidebarLeafRow
            row={row}
            rowH={rowH}
            sidebarW={SIDEBAR_W}
            getDecision={model.getDisciplineDecision}
            schedulesSecondaryLine={row.subtitle}
            schedulesContextLine={group.contextTag}
            keyboardRowId={keyboardRowId}
          />
        ) : (
          <CalendarSidebarFlatRow
            group={group}
            row={row}
            rowH={rowH}
            sidebarW={SIDEBAR_W}
            getDecision={model.getDisciplineDecision}
          />
        )}
        <TimelineRowCanvas
          requests={requests}
          rowH={rowH}
          timelineW={timelineW}
          useCodaStripes={useCodaStripes}
          schedulesContext={model.schedulesContext}
          focusPeriodClip={focusPeriodClip}
          useFocusShiftLayout={useFocusShiftLayout}
          keyboardRowId={keyboardRowId}
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
          scrollTimelineTo={scrollTimelineTo}
          approvalDetailRequestId={stripeDetailRequestId}
          setAvailabilityDetail={setAvailabilityDetail}
          setApprovalCluster={setApprovalCluster}
          setCodaHover={setCodaHover}
          setHover={setHover}
          hoveredClusterId={hoveredClusterId}
        />
      </CalendarGridRow>
    )
  }

  return (
    <div ref={scrollRef} className="calendar-scroll-surface relative flex-1 min-h-0 overflow-auto">
      <div
        ref={gridRef}
        className="calendar-grid-frame relative"
        style={{
          minWidth: SIDEBAR_W + timelineW,
          ["--calendar-sidebar-w" as string]: `${SIDEBAR_W}px`,
        }}
        role="grid"
        tabIndex={model.schedulesContext ? 0 : undefined}
        aria-label={model.schedulesContext ? "Schedules calendar timeline" : "Slot requests calendar timeline"}
        aria-keyshortcuts={
          model.schedulesContext
            ? "ArrowUp ArrowDown ArrowLeft ArrowRight Home End Escape Enter"
            : undefined
        }
      >
        <TimelineMonthColumnLayer
          bands={grid.tintBands}
          dividerCols={grid.dividerCols}
          sidebarW={SIDEBAR_W}
          timelineW={timelineW}
          top={0}
          headerH={HEADER_DAY_H}
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
          zoom={zoom}
          ppd={ppd}
          monthPxW={monthPxW}
          currentPeriod={currentPeriodHighlight}
          navigatorPeriod={navigatorPeriodHighlight}
          periodAnchor={periodAnchor}
          isViewingToday={isViewingToday}
          sidebarSlot={<CalendarSidebarNavHeader model={model} />}
        />

        {todayMarkerX != null ? (
          <div
            className={cn("pointer-events-none absolute", CALENDAR_LIVE_MOMENT_GRID_Z)}
            style={{
              left: SIDEBAR_W,
              width: timelineW,
              top: HEADER_DAY_H,
              bottom: 0,
            }}
            aria-hidden
          >
            <LiveMomentBodyLine
              x={todayMarkerX}
              isViewingToday={isViewingToday}
              rowSegment
            />
          </div>
        ) : null}

        <div className="relative z-[2]">
        {(() => {
          let schedulesKeyboardRowSeq = 0
          const allocSchedulesKeyboardRowId = () =>
            model.schedulesContext ? `schedules-row-${schedulesKeyboardRowSeq++}` : undefined

          if (shouldVirtualizeFlatView && flatVirtualWindow && flatRowPlan) {
            const { start, end, paddingTop, paddingBottom, totalCount } = flatVirtualWindow
            const visibleEntries = flatRowPlan.entries.slice(start, end)
            return (
              <>
                {paddingTop > 0 ? <div style={{ height: paddingTop }} aria-hidden /> : null}
                {visibleEntries.map((entry, sliceIndex) =>
                  renderFlatGroupRow(
                    entry.group,
                    entry.rowH,
                    `schedules-row-${start + sliceIndex}`,
                  ),
                )}
                {paddingBottom > 0 ? <div style={{ height: paddingBottom }} aria-hidden /> : null}
                {totalCount > 0 && end > start ? (
                  <p className="sr-only" aria-live="polite" aria-atomic="true">
                    {`Showing schedules ${start + 1} to ${Math.min(end, totalCount)} of ${totalCount}`}
                  </p>
                ) : null}
              </>
            )
          }

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
            const rowH = flatGroupRowHeight(requests, flatRowHeightCtx)
            const flatKeyboardRowId = allocSchedulesKeyboardRowId()

            return renderFlatGroupRow(group, rowH, flatKeyboardRowId)
          }

          const locationKeyboardRowId = allocSchedulesKeyboardRowId()

          return (
            <div key={group.id}>
              <CalendarGridRow className="group/calloc" style={{ height: PARENT_ROW_H }} role="row">
                <CalendarSidebarParentRow
                  group={group}
                  isOpen={isOpen}
                  onToggle={() => toggleLocation(group.id)}
                  sidebarW={SIDEBAR_W}
                  keyboardRowId={locationKeyboardRowId}
                  schedulesKpis={
                    schedulesTreeView
                      ? scheduleKpisFor(
                          group.rows.flatMap((row) =>
                            visiblePlacements(row.placements, mode, layers),
                          ),
                        )
                      : undefined
                  }
                />
                <div
                  className={cn(
                    "relative flex-shrink-0 pointer-events-none overflow-hidden",
                    CALENDAR_GROUP_BAND_SURFACE,
                  )}
                  style={{ width: timelineW, height: PARENT_ROW_H }}
                >
                  <GridColumnDividers columns={grid.dividerCols} variant="hint" />
                  <div className="absolute inset-0">
                    {!isOpen && group.placementCount > 0 ? (
                      <CalendarSidebarCollapsedHint
                        group={group}
                        schedulesContext={model.schedulesContext}
                      />
                    ) : null}
                  </div>
                </div>
              </CalendarGridRow>

              {isOpen
                ? schedulesTreeView
                  ? visibleRows.map((deptRow) => {
                      const deptKey = `${group.id}::${deptRow.id}`
                      const deptOpen = expandedDepartments.has(deptKey)
                      const deptRequests = visiblePlacements(deptRow.placements, mode, layers)
                      const scheduleLeaves = deptRow.scheduleLeaves ?? []
                      const visibleLeaves = scheduleLeaves.filter((leaf) => {
                        const requests = visiblePlacements(leaf.placements, mode, layers)
                        return requests.length > 0 || layers.showEmptyDisciplines
                      })

                      if (visibleLeaves.length === 0 && deptRequests.length === 0 && !layers.showEmptyDisciplines) {
                        return null
                      }

                      const deptKpis = scheduleKpisFor(deptRequests)
                      const deptCollapsed = !deptOpen
                      const deptTimelineEmpty = deptRequests.length === 0
                      const deptStripeRowH =
                        deptCollapsed && !deptTimelineEmpty
                          ? useCodaStripes
                            ? codaStripeRowHeight(
                                deptRequests,
                                useFocusShiftLayout,
                                focusPeriodClip,
                                zoom,
                                ppd,
                                monthPxW,
                                Boolean(model.schedulesContext),
                              )
                            : APPROVAL_OBJECT_ROW_H
                          : PARENT_ROW_H

                      const deptKeyboardRowId = allocSchedulesKeyboardRowId()

                      return (
                        <div key={deptRow.id}>
                          <CalendarGridRow
                            className={deptCollapsed && !deptTimelineEmpty ? "group/calrow" : "group/calloc"}
                            style={{ height: deptStripeRowH }}
                            role="row"
                          >
                            <CalendarSidebarSchedulesDeptRow
                              row={deptRow}
                              kpis={deptKpis}
                              isOpen={deptOpen}
                              onToggle={() => toggleDepartment(deptKey)}
                              sidebarW={SIDEBAR_W}
                              keyboardRowId={deptKeyboardRowId}
                            />
                            {deptCollapsed && !deptTimelineEmpty ? (
                              <TimelineRowCanvas
                                requests={deptRequests}
                                rowH={deptStripeRowH}
                                timelineW={timelineW}
                                useCodaStripes={useCodaStripes}
                                schedulesContext={model.schedulesContext}
                                focusPeriodClip={focusPeriodClip}
                                useFocusShiftLayout={useFocusShiftLayout}
                                keyboardRowId={deptKeyboardRowId}
                                sidebarContext={{
                                  rowLabel: deptRow.label,
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
                                scrollTimelineTo={scrollTimelineTo}
                                approvalDetailRequestId={stripeDetailRequestId}
                                setAvailabilityDetail={setAvailabilityDetail}
                                setApprovalCluster={setApprovalCluster}
                                setCodaHover={setCodaHover}
                                setHover={setHover}
                                hoveredClusterId={hoveredClusterId}
                                emptyMessage={emptyRowMessage}
                                isEmpty={false}
                              />
                            ) : (
                              <div
                                className="relative flex-shrink-0 bg-transparent"
                                style={{ width: timelineW, height: PARENT_ROW_H }}
                                aria-hidden
                              />
                            )}
                          </CalendarGridRow>

                          {deptOpen
                            ? visibleLeaves.map((leafRow) => {
                                const requests = visiblePlacements(leafRow.placements, mode, layers)
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
                                    : APPROVAL_OBJECT_ROW_H

                                const leafKeyboardRowId = allocSchedulesKeyboardRowId()

                                return (
                                  <CalendarGridRow
                                    key={leafRow.id}
                                    className="group/calrow"
                                    style={{ height: rowH }}
                                    role="row"
                                  >
                                    <CalendarSidebarLeafRow
                                      row={leafRow}
                                      rowH={rowH}
                                      sidebarW={SIDEBAR_W}
                                      getDecision={model.getDisciplineDecision}
                                      schedulesSecondaryLine={leafRow.subtitle}
                                      keyboardRowId={leafKeyboardRowId}
                                    />
                                    <TimelineRowCanvas
                                      requests={requests}
                                      rowH={rowH}
                                      timelineW={timelineW}
                                      useCodaStripes={useCodaStripes}
                                      schedulesContext={model.schedulesContext}
                                      focusPeriodClip={focusPeriodClip}
                                      useFocusShiftLayout={useFocusShiftLayout}
                                      keyboardRowId={leafKeyboardRowId}
                                      sidebarContext={{
                                        rowLabel: leafRow.label,
                                        parentLabel: `${group.label} · ${deptRow.label}`,
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
                                      scrollTimelineTo={scrollTimelineTo}
                                      approvalDetailRequestId={stripeDetailRequestId}
                                      setAvailabilityDetail={setAvailabilityDetail}
                                      setApprovalCluster={setApprovalCluster}
                                      setCodaHover={setCodaHover}
                                      setHover={setHover}
                                      hoveredClusterId={hoveredClusterId}
                                      emptyMessage={emptyRowMessage}
                                      isEmpty={isEmpty}
                                    />
                                  </CalendarGridRow>
                                )
                              })
                            : null}
                        </div>
                      )
                    })
                  : visibleRows.map((row) => {
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
                  <CalendarGridRow key={row.id} className="group/calrow" style={{ height: rowH }} role="row">
                    <CalendarSidebarLeafRow
                      row={row}
                      rowH={rowH}
                      sidebarW={SIDEBAR_W}
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
                      scrollTimelineTo={scrollTimelineTo}
                      approvalDetailRequestId={stripeDetailRequestId}
                      setAvailabilityDetail={setAvailabilityDetail}
                      setApprovalCluster={setApprovalCluster}
                      setCodaHover={setCodaHover}
                      setHover={setHover}
                      hoveredClusterId={hoveredClusterId}
                      emptyMessage={emptyRowMessage}
                      isEmpty={isEmpty}
                    />
                  </CalendarGridRow>
                )
              })
                : null}
            </div>
          )
        })
        })()}
        </div>
      </div>

      {focusPeriodSnapshot ? (
        <div className="pointer-events-none absolute bottom-4 right-4 z-[30]">
          <FocusPeriodSnapshotWidget
            snapshot={focusPeriodSnapshot}
            schedulesContext={model.schedulesContext}
          />
        </div>
      ) : null}

      {codaHover ? (
        <AvailabilityHoverPreview
          target={codaHover}
          schedulesContext={model.schedulesContext}
          scrollRootRef={scrollRef}
        />
      ) : debugMedStar && hover?.kind === "cluster" ? (
        <MedStarClusterHover rect={hover.rect} />
      ) : (
        <ApprovalHoverCard target={hover} model={model} scrollRootRef={scrollRef} />
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
  scrollTimelineTo,
  approvalDetailRequestId,
  setAvailabilityDetail,
  setApprovalCluster,
  setCodaHover,
  setHover,
  hoveredClusterId = null,
  emptyMessage,
  isEmpty,
  keyboardRowId,
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
  scrollTimelineTo: (left: number, behavior?: ScrollBehavior) => void
  approvalDetailRequestId: string | null
  setAvailabilityDetail: CalendarModel["setAvailabilityDetail"]
  setApprovalCluster: CalendarModel["setApprovalCluster"]
  setCodaHover: (target: AvailabilityHoverTarget | null) => void
  setHover: (target: ApprovalHoverTarget | null) => void
  hoveredClusterId?: string | null
  emptyMessage?: string
  isEmpty?: boolean
  keyboardRowId?: string
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
              onHover={(c, el, overlapGroupSize) => {
                const clusterIds = c.placements.map((p) => p.slotRequestId ?? p.id)
                setCodaHover({
                  cluster: c,
                  rect: el.getBoundingClientRect(),
                  anchorEl: el,
                  scenario: medstarData?.findScenarioForCluster(clusterIds),
                  sidebarContext,
                  schedulesContext,
                  scheduleById: schedulesContext ? model.scheduleById : undefined,
                  scheduleReferenceDate: schedulesContext ? model.scheduleReferenceDate : undefined,
                  overlapGroupSize,
                })
              }}
              onLeave={() => setCodaHover(null)}
              hoveredClusterId={hoveredClusterId}
              keyboardRowId={keyboardRowId}
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
                    ? { kind: "single", placement: c.placements[0], rect, anchorEl: el }
                    : { kind: "cluster", cluster: c, rect, anchorEl: el },
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
              placements={requests}
              zoom={zoom}
              ppd={ppd}
              monthPxW={monthPxW}
              scrollRef={scrollRef}
              scrollTimelineTo={scrollTimelineTo}
              focusPeriodClip={focusPeriodClip}
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
    </div>
  )
}
