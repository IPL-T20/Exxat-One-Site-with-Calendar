import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { buildCalendarDataBundle } from "../../lib/mock/calendar-data-bundle"
import { siteKpis } from "../../lib/slot-requests-calendar/build-tree"
import {
  computeApprovalWorkflowKpis,
  computeOperationsWorkflowKpis,
} from "../../lib/slot-requests-calendar/calendar-workflow-kpis"
import type {
  ApprovalWorkflowKpis,
  OperationsWorkflowKpis,
} from "../../lib/slot-requests-calendar/calendar-workflow-kpis"
import { buildGrid, defaultViewportScrollLeft, useTimelineMetrics, xOfLiveMoment } from "../../lib/slot-requests-calendar/calendar-timeline"
import {
  formatPeriodNavLabel,
  isViewingCurrentPeriod,
  periodNavUnit,
  shiftPeriodAnchor,
} from "../../lib/slot-requests-calendar/calendar-period-nav"
import {
  anchorFromViewportCenter,
  currentPeriodPixelRange,
  focusPeriodPixelRange,
  type FocusPeriodRange,
} from "../../lib/slot-requests-calendar/calendar-period-focus"
import { getZonedCalendarDate } from "../../lib/slot-requests-calendar/calendar-date"
import { visiblePlacements } from "../../lib/slot-requests-calendar/calendar-mode"
import { rowMatchesScope, scopeSignature } from "../../lib/slot-requests-calendar/scope-data"
import { scheduleRowMatchesScope } from "../../lib/schedules/schedule-scope-data"
import {
  buildCalendarViewGroups,
  defaultGroupByMode,
  expandableGroupIds,
  resolveGroupByOptions,
  type CalendarGroupByMode,
  type CalendarGroupByOption,
  type CalendarViewGroup,
} from "../../lib/slot-requests-calendar/calendar-grouping"
import { SIDEBAR_W } from "../../lib/slot-requests-calendar/constants"
import type {
  AvailabilityRecord,
  CalendarLayers,
  CalendarMode,
  CalendarScope,
  CalendarZoom,
  ConflictRecord,
  LocationCapacityRecord,
  LocationNode,
  Placement,
  PlacementRecord,
  ScheduleRecord,
  SlotRequestRow,
  UtilizationSnapshot,
} from "../../lib/slot-requests-calendar/types"
import { emptyScope } from "../../lib/slot-requests-calendar/types"
import type { DecisionSnapshot } from "../../lib/slot-requests-calendar/decision-engine"
import {
  getCompetitionGroup,
  getDisciplineDecision,
  getRequestDecision,
} from "../../lib/slot-requests-calendar/decision-engine"

export interface CalendarModel {
  allRows: SlotRequestRow[]
  /** Filtered slot-request rows for the active scope. */
  rows: SlotRequestRow[]
  locations: LocationNode[]
  /** Phase 2A — adaptive sidebar/timeline grouping. */
  groupBy: CalendarGroupByMode
  setGroupBy: (mode: CalendarGroupByMode) => void
  groupByOptions: CalendarGroupByOption[]
  calendarViewGroups: CalendarViewGroup[]
  availabilities: AvailabilityRecord[]
  capacityRecords: LocationCapacityRecord[]
  placementRecords: PlacementRecord[]
  scheduleRecords: ScheduleRecord[]
  utilizationSnapshots: UtilizationSnapshot[]
  /** Operations-mode primary timeline bars keyed by discipline node id. */
  scheduleBarsByDiscipline: Map<string, Placement[]>
  conflicts: ConflictRecord[]
  kpis: ReturnType<typeof siteKpis>
  approvalKpis: ApprovalWorkflowKpis
  operationsKpis: OperationsWorkflowKpis
  scope: CalendarScope
  setScope: (scope: CalendarScope) => void
  zoom: CalendarZoom
  setZoom: (z: CalendarZoom) => void
  mode: CalendarMode
  setMode: (m: CalendarMode) => void
  expanded: Set<string>
  toggleLocation: (id: string) => void
  toggleAll: () => void
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  selectedPlacement: Placement | null
  hover: { placement: Placement; rect: DOMRect } | null
  setHover: (h: { placement: Placement; rect: DOMRect } | null) => void
  layers: CalendarLayers
  setLayers: React.Dispatch<React.SetStateAction<CalendarLayers>>
  scrollRef: React.RefObject<HTMLDivElement | null>
  timelineWidth: number
  ppd: number
  monthPxW: number
  timelineW: number
  todayX: number
  /** Live “now” position on the timeline (day view: time-of-day within today's column). */
  todayMarkerX: number
  /** Live clock for day-view hour rail (updates every minute). */
  liveNow: Date
  calendarToday: Date
  grid: ReturnType<typeof buildGrid>
  scrollToToday: () => void
  scrollPeriod: (direction: -1 | 1) => void
  /** Toolbar period navigator — label + unit for the active zoom. */
  periodLabel: string
  periodNavUnit: string
  /** Toolbar / viewport period anchor. */
  periodAnchor: Date
  /** True when the visible period includes calendar today. */
  isViewingToday: boolean
  /** Pixel span of the current day/week/month/year column for the active zoom. */
  currentPeriodHighlight: FocusPeriodRange
  /** Pixel span of the toolbar navigator period (centered / focused period). */
  navigatorPeriodHighlight: FocusPeriodRange
  /** When focus period is on, stripes clip to this span; otherwise null. */
  focusPeriodClip: FocusPeriodRange | null
  sideShadow: string
  /** Approval — ordered request ids visible on the object timeline. */
  approvalVisibleRequestIds: string[]
  /** Approval — centered detail modal request id. */
  approvalDetailRequestId: string | null
  /** Approval — navigation set for prev/next (full view or cluster subset). */
  approvalNavigationIds: string[]
  approvalCluster: ApprovalClusterState | null
  setApprovalCluster: (cluster: ApprovalClusterState | null) => void
  /** Phase 2A — availability detail entry before compare/decide. */
  availabilityDetail: ApprovalClusterState | null
  setAvailabilityDetail: (detail: ApprovalClusterState | null) => void
  /** Detail opened from cluster compare step — enables Back to cluster. */
  approvalDetailFromCluster: boolean
  /** Restored when returning from detail to cluster triage. */
  approvalClusterScrollTop: number
  setApprovalClusterScrollTop: (top: number) => void
  openApprovalDetail: (
    requestId: string,
    navigationIds?: string[],
    options?: { fromCluster?: boolean },
  ) => void
  backFromApprovalDetail: () => void
  exitApprovalWorkflow: () => void
  approvalDetailPrev: () => void
  approvalDetailNext: () => void
  /** Footprint-aware decision engine output (P0). */
  decisionSnapshot: DecisionSnapshot
  getRequestDecision: (requestId: string) => ReturnType<typeof getRequestDecision>
  getDisciplineDecision: (disciplineId: string) => ReturnType<typeof getDisciplineDecision>
  getCompetitionGroup: (groupId: string) => ReturnType<typeof getCompetitionGroup>
  /** Schedules hub — same timeline as slot requests, schedule detail on bar click. */
  schedulesContext: boolean
}

export interface ApprovalClusterState {
  requestIds: string[]
  scenarioId?: string
}

export interface UseCalendarModelOptions {
  /** KPI source — defaults to display rows. Use full dataset for approval KPIs. */
  kpiRows?: SlotRequestRow[]
  /** Reference date for expiring-this-week KPI (MedStar product path). */
  kpiReferenceDate?: Date
  /** Pre-built bundle (e.g. Mapple schedules calendar). Skips buildCalendarDataBundle. */
  dataBundle?: ReturnType<typeof buildCalendarDataBundle>
  /** Rebuild bundle from scope-filtered rows (schedules calendar). */
  buildBundle?: (rows: SlotRequestRow[]) => ReturnType<typeof buildCalendarDataBundle>
  /** Lock workflow to operations — schedules calendar lens. */
  operationsOnly?: boolean
  /** Confirmed schedules — reuse approval timeline chrome with schedule detail on select. */
  schedulesContext?: boolean
}

export function useCalendarModel(
  rows: SlotRequestRow[],
  options?: UseCalendarModelOptions,
): CalendarModel {
  const kpiSource = options?.kpiRows ?? rows
  const [zoom, setZoomState] = useState<CalendarZoom>("month")
  const [mode, setModeState] = useState<CalendarMode>(
    options?.operationsOnly ? "operations" : "approval",
  )
  const setMode = useCallback(
    (m: CalendarMode) => {
      if (!options?.operationsOnly) setModeState(m)
    },
    [options?.operationsOnly],
  )
  const [scope, setScope] = useState<CalendarScope>(() => emptyScope())
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [groupBy, setGroupByState] = useState<CalendarGroupByMode>("location")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [approvalDetailRequestId, setApprovalDetailRequestId] = useState<string | null>(null)
  const [approvalNavigationIds, setApprovalNavigationIds] = useState<string[]>([])
  const [approvalCluster, setApprovalClusterState] = useState<ApprovalClusterState | null>(null)
  const [availabilityDetail, setAvailabilityDetail] = useState<ApprovalClusterState | null>(null)
  const [approvalDetailFromCluster, setApprovalDetailFromCluster] = useState(false)
  const [approvalClusterScrollTop, setApprovalClusterScrollTop] = useState(0)
  const [hover, setHover] = useState<{ placement: Placement; rect: DOMRect } | null>(null)
  const [layers, setLayers] = useState<CalendarLayers>({
    capacity: true,
    conflicts: true,
    declined: false,
    showEmptyDisciplines: false,
    goldPartnersOnly: false,
    focusPeriod: false,
  })
  const [timelineWidth, setTimelineWidth] = useState(900)
  const [periodAnchor, setPeriodAnchor] = useState<Date>(() => getZonedCalendarDate())

  const scrollRef = useRef<HTMLDivElement>(null)
  const pendingScrollBehavior = useRef<ScrollBehavior>("auto")
  const isProgrammaticScroll = useRef(false)
  const skipNextScrollSync = useRef(false)
  const scrollSyncRaf = useRef<number | null>(null)

  const setZoom = useCallback((z: CalendarZoom) => {
    pendingScrollBehavior.current = "auto"
    setZoomState(z)
  }, [])

  const matchesScope = useCallback(
    (row: SlotRequestRow) =>
      options?.schedulesContext
        ? scheduleRowMatchesScope(row, scope)
        : rowMatchesScope(row, scope),
    [options?.schedulesContext, scope],
  )

  const filteredRows = useMemo(
    () => rows.filter(matchesScope),
    [rows, matchesScope],
  )

  const kpiFilteredRows = useMemo(
    () => kpiSource.filter(matchesScope),
    [kpiSource, matchesScope],
  )

  const bundle = useMemo(
    () =>
      options?.buildBundle?.(filteredRows) ??
      options?.dataBundle ??
      buildCalendarDataBundle(filteredRows),
    [options?.buildBundle, options?.dataBundle, filteredRows],
  )

  const {
    locations,
    conflictRecords: conflicts,
    availabilities,
    capacityRecords,
    placementRecords,
    scheduleRecords,
    utilizationSnapshots,
    scheduleBarsByDiscipline,
    decisionSnapshot,
  } = bundle

  const groupByOptions = useMemo(() => resolveGroupByOptions(locations), [locations])

  const calendarViewGroups = useMemo(
    () => buildCalendarViewGroups(locations, groupBy),
    [locations, groupBy],
  )

  const setGroupBy = useCallback(
    (mode: CalendarGroupByMode) => {
      const option = groupByOptions.find((o) => o.mode === mode)
      if (option?.enabled && option.status === "available") setGroupByState(mode)
    },
    [groupByOptions],
  )

  useEffect(() => {
    setGroupByState((current) => {
      const currentOption = groupByOptions.find((o) => o.mode === current)
      if (currentOption?.enabled && currentOption.status === "available") return current
      const fallback =
        groupByOptions.find((o) => o.status === "available" && o.enabled)?.mode ??
        defaultGroupByMode(locations)
      return fallback
    })
  }, [locations.length, groupByOptions, locations])

  const kpis = useMemo(() => siteKpis(locations), [locations])
  const approvalKpis = useMemo(
    () =>
      computeApprovalWorkflowKpis(kpiFilteredRows, {
        referenceDate: options?.kpiReferenceDate,
      }),
    [kpiFilteredRows, options?.kpiReferenceDate],
  )
  const operationsKpis = useMemo(
    () => computeOperationsWorkflowKpis(filteredRows, kpis, conflicts),
    [filteredRows, kpis, conflicts],
  )

  const approvalVisibleRequestIds = useMemo(() => {
    const ids: string[] = []
    for (const group of calendarViewGroups) {
      for (const row of group.rows) {
        for (const p of visiblePlacements(row.placements, "approval", layers)) {
          const id = p.slotRequestId ?? p.id
          if (!ids.includes(id)) ids.push(id)
        }
      }
    }
    return ids
  }, [calendarViewGroups, layers])

  const setApprovalCluster = useCallback((cluster: ApprovalClusterState | null) => {
    setApprovalClusterState(cluster)
    if (cluster) setApprovalClusterScrollTop(0)
  }, [])

  const exitApprovalWorkflow = useCallback(() => {
    setApprovalDetailRequestId(null)
    setApprovalNavigationIds([])
    setApprovalClusterState(null)
    setAvailabilityDetail(null)
    setApprovalDetailFromCluster(false)
    setApprovalClusterScrollTop(0)
  }, [])

  const openApprovalDetail = useCallback(
    (
      requestId: string,
      navigationIds?: string[],
      options?: { fromCluster?: boolean },
    ) => {
      setApprovalDetailRequestId(requestId)
      setApprovalNavigationIds(navigationIds ?? approvalVisibleRequestIds)
      setApprovalDetailFromCluster(Boolean(options?.fromCluster))
    },
    [approvalVisibleRequestIds],
  )

  const backFromApprovalDetail = useCallback(() => {
    setApprovalDetailRequestId(null)
    setApprovalNavigationIds([])
  }, [])

  const approvalDetailPrev = useCallback(() => {
    setApprovalDetailRequestId((current) => {
      if (!current) return null
      const idx = approvalNavigationIds.indexOf(current)
      if (idx <= 0) return current
      return approvalNavigationIds[idx - 1] ?? current
    })
  }, [approvalNavigationIds])

  const approvalDetailNext = useCallback(() => {
    setApprovalDetailRequestId((current) => {
      if (!current) return null
      const idx = approvalNavigationIds.indexOf(current)
      if (idx < 0 || idx >= approvalNavigationIds.length - 1) return current
      return approvalNavigationIds[idx + 1] ?? current
    })
  }, [approvalNavigationIds])

  const scopeKey = scopeSignature(scope)

  useEffect(() => {
    if (calendarViewGroups.length === 0) {
      setExpanded(new Set())
      return
    }
    setExpanded(
      new Set(
        calendarViewGroups
          .filter((g) => !g.flat && (g.pendingCount > 0 || g.reviewCount > 0))
          .slice(0, 8)
          .map((g) => g.id),
      ),
    )
  }, [scopeKey, mode, groupBy, calendarViewGroups.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      setTimelineWidth(Math.max(240, entry.contentRect.width - SIDEBAR_W))
    })
    obs.observe(el)
    setTimelineWidth(Math.max(240, el.clientWidth - SIDEBAR_W))
    return () => obs.disconnect()
  }, [])

  const { ppd, monthPxW, timelineW, todayX, calendarToday } = useTimelineMetrics(
    timelineWidth,
    zoom,
    periodAnchor,
  )
  const grid = useMemo(() => buildGrid(zoom, ppd, monthPxW), [zoom, ppd, monthPxW])

  const periodLabel = useMemo(
    () => formatPeriodNavLabel(zoom, periodAnchor),
    [zoom, periodAnchor],
  )
  const periodNavUnitLabel = useMemo(() => periodNavUnit(zoom), [zoom])
  const isViewingToday = useMemo(
    () => isViewingCurrentPeriod(zoom, periodAnchor, calendarToday),
    [zoom, periodAnchor, calendarToday],
  )
  const currentPeriodHighlight = useMemo(
    () => currentPeriodPixelRange(calendarToday, zoom, ppd, monthPxW),
    [calendarToday, zoom, ppd, monthPxW],
  )
  const navigatorPeriodHighlight = useMemo(
    () => focusPeriodPixelRange(periodAnchor, zoom, ppd, monthPxW),
    [periodAnchor, zoom, ppd, monthPxW],
  )
  const focusPeriodClip = useMemo(
    () => (layers.focusPeriod ? navigatorPeriodHighlight : null),
    [layers.focusPeriod, navigatorPeriodHighlight],
  )

  const [liveNow, setLiveNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setLiveNow(new Date())
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])

  const todayMarkerX = useMemo(
    () => xOfLiveMoment(liveNow, zoom, ppd, monthPxW),
    [liveNow, zoom, ppd, monthPxW],
  )

  const scrollToAnchor = useCallback(
    (anchor: Date, behavior: ScrollBehavior = "auto") => {
      const el = scrollRef.current
      if (!el) return
      const viewportW = Math.max(240, el.clientWidth - SIDEBAR_W)
      isProgrammaticScroll.current = true
      el.scrollTo({
        left: defaultViewportScrollLeft(
          zoom,
          viewportW,
          todayX,
          ppd,
          monthPxW,
          anchor,
        ),
        behavior,
      })
      if (behavior === "auto") {
        isProgrammaticScroll.current = false
      } else {
        window.setTimeout(() => {
          isProgrammaticScroll.current = false
        }, 400)
      }
    },
    [zoom, todayX, ppd, monthPxW],
  )

  const scrollToToday = useCallback(() => {
    pendingScrollBehavior.current = "smooth"
    setPeriodAnchor(calendarToday)
  }, [calendarToday])

  const scrollPeriod = useCallback(
    (direction: -1 | 1) => {
      pendingScrollBehavior.current = "smooth"
      setPeriodAnchor((prev) => shiftPeriodAnchor(prev, zoom, direction))
    },
    [zoom],
  )

  useEffect(() => {
    setPeriodAnchor(calendarToday)
    pendingScrollBehavior.current = "auto"
  }, [zoom, calendarToday])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onScroll = () => {
      if (isProgrammaticScroll.current) return
      pendingScrollBehavior.current = "auto"

      if (scrollSyncRaf.current != null) return
      scrollSyncRaf.current = requestAnimationFrame(() => {
        scrollSyncRaf.current = null
        if (isProgrammaticScroll.current) return
        if (skipNextScrollSync.current) {
          skipNextScrollSync.current = false
          return
        }
        const scrollEl = scrollRef.current
        if (!scrollEl) return
        const next = anchorFromViewportCenter(
          scrollEl.scrollLeft,
          scrollEl.clientWidth,
          zoom,
          ppd,
          monthPxW,
        )
        setPeriodAnchor((prev) => {
          if (formatPeriodNavLabel(zoom, prev) === formatPeriodNavLabel(zoom, next)) {
            return prev
          }
          return next
        })
      })
    }
    el.addEventListener("scroll", onScroll, { passive: true })
    return () => {
      el.removeEventListener("scroll", onScroll)
      if (scrollSyncRaf.current != null) {
        cancelAnimationFrame(scrollSyncRaf.current)
        scrollSyncRaf.current = null
      }
    }
  }, [zoom, ppd, monthPxW])

  useEffect(() => {
    const behavior = pendingScrollBehavior.current
    pendingScrollBehavior.current = "auto"
    skipNextScrollSync.current = true
    // Defer one frame so ppd / layout settle after zoom switches.
    const frame = requestAnimationFrame(() => {
      scrollToAnchor(periodAnchor, behavior)
    })
    return () => cancelAnimationFrame(frame)
  }, [periodAnchor, zoom, timelineWidth, ppd, monthPxW, scrollToAnchor])

  useEffect(() => {
    if (mode === "operations") {
      exitApprovalWorkflow()
    } else {
      setSelectedId(null)
      setHover(null)
    }
  }, [mode, exitApprovalWorkflow])

  const toggleLocation = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandableIds = useMemo(
    () => expandableGroupIds(calendarViewGroups),
    [calendarViewGroups],
  )

  const toggleAll = () => {
    if (expanded.size === expandableIds.length) setExpanded(new Set())
    else setExpanded(new Set(expandableIds))
  }

  const selectedPlacement = useMemo(() => {
    if (!selectedId) return null
    for (const bars of scheduleBarsByDiscipline.values()) {
      const scheduleBar = bars.find((x) => x.id === selectedId)
      if (scheduleBar) return scheduleBar
    }
    for (const loc of locations) {
      for (const disc of loc.disciplines) {
        const p = disc.placements.find((x) => x.id === selectedId)
        if (p) return p
      }
    }
    return null
  }, [locations, scheduleBarsByDiscipline, selectedId])

  const sideShadow =
    "2px 0 8px -2px color-mix(in oklch, var(--foreground) 8%, transparent)"

  return {
    allRows: rows,
    rows: filteredRows,
    locations,
    groupBy,
    setGroupBy,
    groupByOptions,
    calendarViewGroups,
    availabilities,
    capacityRecords,
    placementRecords,
    scheduleRecords,
    utilizationSnapshots,
    scheduleBarsByDiscipline,
    conflicts,
    kpis,
    approvalKpis,
    operationsKpis,
    scope,
    setScope,
    zoom,
    setZoom,
    mode,
    setMode,
    expanded,
    toggleLocation,
    toggleAll,
    selectedId,
    setSelectedId,
    selectedPlacement,
    hover,
    setHover,
    layers,
    setLayers,
    scrollRef,
    timelineWidth,
    ppd,
    monthPxW,
    timelineW,
    todayX,
    todayMarkerX,
    liveNow,
    calendarToday,
    grid,
    scrollToToday,
    scrollPeriod,
    periodLabel,
    periodNavUnit: periodNavUnitLabel,
    periodAnchor,
    isViewingToday,
    currentPeriodHighlight,
    navigatorPeriodHighlight,
    focusPeriodClip,
    sideShadow,
    approvalVisibleRequestIds,
    approvalDetailRequestId,
    approvalNavigationIds,
    approvalCluster,
    setApprovalCluster,
    availabilityDetail,
    setAvailabilityDetail,
    approvalDetailFromCluster,
    approvalClusterScrollTop,
    setApprovalClusterScrollTop,
    openApprovalDetail,
    backFromApprovalDetail,
    exitApprovalWorkflow,
    approvalDetailPrev,
    approvalDetailNext,
    decisionSnapshot,
    getRequestDecision: (id) => getRequestDecision(decisionSnapshot, id),
    getDisciplineDecision: (id) => getDisciplineDecision(decisionSnapshot, id),
    getCompetitionGroup: (id) => getCompetitionGroup(decisionSnapshot, id),
    schedulesContext: Boolean(options?.schedulesContext),
  }
}
