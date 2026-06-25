import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import { Button } from "../ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../ui/hover-card"
import {
  requestIdFromPlacement,
  isGoldPartner,
  type ApprovalObjectCluster,
} from "../../lib/slot-requests-calendar/approval-object-cluster"
import { buildAvailabilityStripeCopy } from "../../lib/slot-requests-calendar/availability-stripe-copy"
import {
  assignCompetitionLanes,
  buildAvailabilityDetailRequests,
  competitionRowLaneCount,
  detailTimelineRange,
  groupRequestsByShift,
  type AvailabilityCompetitionEntry,
  type AvailabilityShiftGroup,
} from "../../lib/slot-requests-calendar/availability-detail-rows"
import type { CalendarModel } from "./useCalendarModel"
import type { MedStarScenario } from "../../lib/medstar-data/types"
import { useMedStarDataOptional } from "../../lib/medstar-data/medstar-data-context"
import { GoldPartnerLeading, GoldPartnerStar } from "./gold-partner-star"
import { COORDINATOR_TERMS } from "../../lib/slot-requests-calendar/coordinator-copy"
import { cn } from "../ui/utils"
import { DETAIL_MODAL_SHELL } from "./detail-modal-shell"

const SHIFT_RAIL_W = 152
const LANE_H = 32
const ROW_PAD = 10
const TIMELINE_MIN_W = 960
const HEADER_H = 28
const CHIP_MAX_W = 236

function entryIsGoldPartner(
  entry: AvailabilityCompetitionEntry,
  goldByRequestId: Map<string, boolean>,
): boolean {
  if (entry.requestIds.some((id) => goldByRequestId.get(id))) return true
  return isGoldPartner({ school: entry.school })
}

function CompetitionEntryHoverCard({
  entry,
  isGold,
  children,
}: {
  entry: AvailabilityCompetitionEntry
  isGold: boolean
  children: ReactNode
}) {
  return (
    <HoverCard openDelay={280} closeDelay={120}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="center"
        sideOffset={8}
        className="w-[min(288px,calc(100vw-2rem))] p-0 overflow-hidden shadow-lg"
      >
        <div className="px-3 py-2.5 border-b border-border bg-muted/25">
          {isGold ? (
            <GoldPartnerLeading size="sm" className="text-sm font-semibold leading-snug text-foreground">
              <span>{entry.school}</span>
            </GoldPartnerLeading>
          ) : (
            <p className="text-sm font-semibold leading-snug text-foreground">{entry.school}</p>
          )}
        </div>
        <div className="px-3 py-2.5 space-y-2 text-xs">
          {entry.dateLabel ? (
            <p className="text-muted-foreground tabular-nums">{entry.dateLabel}</p>
          ) : null}
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            {entry.slotsRequested > 0 ? (
              <>
                <dt className="text-muted-foreground">Slots requested</dt>
                <dd className="font-medium tabular-nums text-foreground">{entry.slotsRequested}</dd>
              </>
            ) : null}
            {entry.slotsApproved != null && entry.slotsApproved > 0 ? (
              <>
                <dt className="text-muted-foreground">Slots approved</dt>
                <dd className="font-medium tabular-nums text-foreground">{entry.slotsApproved}</dd>
              </>
            ) : null}
            {entry.requestCount > 1 ? (
              <>
                <dt className="text-muted-foreground">Grouped</dt>
                <dd className="text-foreground">{entry.requestCount} requests</dd>
              </>
            ) : null}
            {isGold ? (
              <>
                <dt className="text-muted-foreground">Partner</dt>
                <dd className="text-foreground">Gold partner</dd>
              </>
            ) : null}
          </dl>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function competitionChipAriaLabel(entry: AvailabilityCompetitionEntry): string {
  if (entry.slotsRequested > 0) {
    return `Review ${entry.slotsRequested} ${entry.school}`
  }
  return `Review ${entry.school}`
}

function TimelineChipFace({
  entry,
  isGold,
  maxWidth,
}: {
  entry: AvailabilityCompetitionEntry
  isGold: boolean
  maxWidth?: number | string
}) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-2.5 shadow-sm",
        "bg-card text-foreground transition-[border-color,box-shadow]",
        "group-hover/timeline:border-primary/35 group-hover/timeline:shadow-md",
        isGold ? "border-amber-300/55" : "border-border/80",
      )}
      style={maxWidth != null ? { maxWidth } : undefined}
    >
      {entry.slotsRequested > 0 ? (
        <span
          className="flex size-[18px] shrink-0 items-center justify-center rounded-full bg-primary text-[9px] font-semibold tabular-nums leading-none text-primary-foreground"
          aria-hidden
        >
          {entry.slotsRequested}
        </span>
      ) : null}
      <span className="inline-flex min-w-0 items-center gap-1">
        {isGold ? <GoldPartnerStar size="xs" /> : null}
        <span className="min-w-0 truncate text-[11px] font-medium leading-tight">
          {entry.school}
        </span>
      </span>
    </span>
  )
}

function CompetitionChip({
  entry,
  lane,
  rangeStart,
  rangeEnd,
  isGold,
  onSelect,
}: {
  entry: AvailabilityCompetitionEntry
  lane: number
  rangeStart: Date | null
  rangeEnd: Date | null
  isGold: boolean
  onSelect: () => void
}) {
  const laneTop = ROW_PAD + lane * LANE_H
  const ariaLabel = competitionChipAriaLabel(entry)

  if (!entry.start || !entry.end || !rangeStart || !rangeEnd) {
    return (
      <CompetitionEntryHoverCard entry={entry} isGold={isGold}>
        <button
          type="button"
          className="absolute left-3 right-3 flex items-center justify-center rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          style={{ top: laneTop, height: LANE_H }}
          aria-label={ariaLabel}
          onClick={onSelect}
        >
          <TimelineChipFace entry={entry} isGold={isGold} />
        </button>
      </CompetitionEntryHoverCard>
    )
  }

  const { leftPx, widthPx } = positionOnTimelinePx(
    entry.start,
    entry.end,
    rangeStart,
    rangeEnd,
    TIMELINE_MIN_W,
  )
  const barWidth = Math.max(widthPx, 88)
  const chipMaxW = Math.min(CHIP_MAX_W, Math.max(96, barWidth - 16))

  return (
    <CompetitionEntryHoverCard entry={entry} isGold={isGold}>
      <button
        type="button"
        className="group/timeline absolute text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-sm"
        style={{
          left: leftPx,
          width: barWidth,
          top: laneTop,
          height: LANE_H,
        }}
        aria-label={ariaLabel}
        onClick={onSelect}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-border transition-colors group-hover/timeline:bg-muted-foreground/55"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute left-0 top-1/2 size-2 -translate-y-1/2 rounded-full bg-muted-foreground/40 ring-2 ring-card transition-colors group-hover/timeline:bg-muted-foreground/60"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute right-0 top-1/2 size-2 -translate-y-1/2 rounded-full bg-muted-foreground/40 ring-2 ring-card transition-colors group-hover/timeline:bg-muted-foreground/60"
          aria-hidden
        />
        <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <TimelineChipFace entry={entry} isGold={isGold} maxWidth={chipMaxW} />
        </span>
      </button>
    </CompetitionEntryHoverCard>
  )
}

function positionOnTimelinePx(
  start: Date,
  end: Date,
  rangeStart: Date,
  rangeEnd: Date,
  timelineWidth: number,
): { leftPx: number; widthPx: number } {
  const total = rangeEnd.getTime() - rangeStart.getTime()
  if (total <= 0) return { leftPx: 0, widthPx: timelineWidth }
  const leftPx = ((start.getTime() - rangeStart.getTime()) / total) * timelineWidth
  const widthPx = Math.max(48, ((end.getTime() - start.getTime()) / total) * timelineWidth)
  return {
    leftPx: Math.max(0, Math.min(timelineWidth - 48, leftPx)),
    widthPx: Math.min(timelineWidth - leftPx, widthPx),
  }
}

function ShiftRailCell({
  group,
  goldByRequestId,
}: {
  group: AvailabilityShiftGroup
  goldByRequestId: Map<string, boolean>
}) {
  const uniqueSchools = new Set(
    group.entries.map((e) => e.school.trim().toLowerCase()),
  ).size
  const goldCount = group.entries.filter((e) => entryIsGoldPartner(e, goldByRequestId)).length
  return (
    <div className="bg-card px-3 py-2.5 shadow-[inset_2px_0_0_0_hsl(var(--primary)/0.35)]">
      {group.shiftLabel ? (
        <div className="text-[11px] font-semibold text-foreground leading-snug line-clamp-2">
          {group.shiftLabel}
        </div>
      ) : null}
      {group.shiftTime ? (
        <div className="text-[10px] text-muted-foreground tabular-nums mt-0.5">{group.shiftTime}</div>
      ) : null}
      <div className="mt-2 pt-2 border-t border-border/60 space-y-1 text-[10px] leading-none tabular-nums">
        <div>
          <span className="font-semibold text-foreground">{uniqueSchools}</span>
          <span className="text-muted-foreground"> school{uniqueSchools === 1 ? "" : "s"}</span>
        </div>
        <div>
          <span className="font-semibold text-foreground">{group.requests.length}</span>
          <span className="text-muted-foreground"> request{group.requests.length === 1 ? "" : "s"}</span>
        </div>
        {goldCount > 0 ? (
          <div className="inline-flex items-center gap-1 text-muted-foreground pt-0.5">
            <GoldPartnerStar size="xs" />
            <span className="font-semibold text-foreground">{goldCount}</span>
            <span className="text-muted-foreground">gold</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function ShiftTimelineRow({
  group,
  rowH,
  rangeStart,
  rangeEnd,
  monthMarkers,
  goldByRequestId,
  onSelectEntry,
}: {
  group: AvailabilityShiftGroup
  rowH: number
  rangeStart: Date
  rangeEnd: Date
  monthMarkers: { label: string; leftPx: number }[]
  goldByRequestId: Map<string, boolean>
  onSelectEntry: (entry: AvailabilityCompetitionEntry) => void
}) {
  return (
    <div
      className="flex border-b border-border/80 last:border-b-0"
      style={{ minWidth: SHIFT_RAIL_W + TIMELINE_MIN_W, minHeight: rowH }}
    >
      <div
        className="sticky left-0 z-20 shrink-0 self-stretch border-r border-border/80 bg-muted/15 shadow-[1px_0_0_0_hsl(var(--border))]"
        style={{ width: SHIFT_RAIL_W, minHeight: rowH }}
      >
        <div
          className="sticky z-10 bg-background/95 backdrop-blur-sm"
          style={{ top: HEADER_H }}
        >
          <ShiftRailCell group={group} goldByRequestId={goldByRequestId} />
        </div>
      </div>
      <ShiftTimelineCanvas
        group={group}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        monthMarkers={monthMarkers}
        goldByRequestId={goldByRequestId}
        onSelectEntry={onSelectEntry}
      />
    </div>
  )
}

function ShiftTimelineCanvas({
  group,
  rangeStart,
  rangeEnd,
  monthMarkers,
  goldByRequestId,
  onSelectEntry,
}: {
  group: AvailabilityShiftGroup
  rangeStart: Date | null
  rangeEnd: Date | null
  monthMarkers: { label: string; leftPx: number }[]
  goldByRequestId: Map<string, boolean>
  onSelectEntry: (entry: AvailabilityCompetitionEntry) => void
}) {
  const lanes = assignCompetitionLanes(group.entries)
  const laneCount = competitionRowLaneCount(group.entries.length)
  const rowH = ROW_PAD * 2 + laneCount * LANE_H

  return (
    <div
      className="relative bg-card even:bg-muted/[0.03]"
      style={{ height: rowH, width: TIMELINE_MIN_W }}
    >
      {monthMarkers.map((m, i) => (
        <div
          key={`grid-${group.shiftKey}-${m.label}-${i}`}
          className="absolute top-0 bottom-0 w-px bg-border/50 pointer-events-none"
          style={{ left: m.leftPx }}
          aria-hidden
        />
      ))}
      {group.entries.map((entry) => (
        <CompetitionChip
          key={entry.id}
          entry={entry}
          lane={lanes.get(entry.id) ?? 0}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          isGold={entryIsGoldPartner(entry, goldByRequestId)}
          onSelect={() => onSelectEntry(entry)}
        />
      ))}
    </div>
  )
}

function useHorizontalOverflow(scrollRef: React.RefObject<HTMLDivElement | null>) {
  const [edges, setEdges] = useState({ left: false, right: false })

  const sync = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    })
  }, [scrollRef])

  useEffect(() => {
    sync()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", sync, { passive: true })
    const ro = new ResizeObserver(sync)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", sync)
      ro.disconnect()
    }
  }, [scrollRef, sync])

  return edges
}

function buildMonthMarkersPx(
  rangeStart: Date,
  rangeEnd: Date,
  timelineWidth: number,
): { label: string; leftPx: number }[] {
  const total = rangeEnd.getTime() - rangeStart.getTime()
  if (total <= 0) return []
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const markers: { label: string; leftPx: number }[] = []
  const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  while (cursor.getTime() <= rangeEnd.getTime()) {
    const leftPx = ((cursor.getTime() - rangeStart.getTime()) / total) * timelineWidth
    if (leftPx >= 0 && leftPx <= timelineWidth) {
      markers.push({ label: MONTHS[cursor.getMonth()], leftPx })
    }
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return markers
}

export function AvailabilityDetailModal({ model }: { model: CalendarModel }) {
  const medstarData = useMedStarDataOptional()
  const detail = model.availabilityDetail
  const timelineScrollRef = useRef<HTMLDivElement>(null)
  const overflow = useHorizontalOverflow(timelineScrollRef)

  const scenario: MedStarScenario | undefined = useMemo(() => {
    if (!detail || !medstarData?.store) return undefined
    if (detail.scenarioId) return medstarData.store.getScenarioById(detail.scenarioId)
    return medstarData.findScenarioForCluster(detail.requestIds)
  }, [detail, medstarData])

  const matchedPlacements = useMemo(() => {
    if (!detail) return []
    const ids = new Set(detail.requestIds)
    const matched: typeof model.locations[0]["disciplines"][0]["placements"] = []
    for (const loc of model.locations) {
      for (const disc of loc.disciplines) {
        for (const p of disc.placements) {
          if (ids.has(requestIdFromPlacement(p))) matched.push(p)
        }
      }
    }
    return matched
  }, [detail, model.locations])

  const goldByRequestId = useMemo(() => {
    const map = new Map<string, boolean>()
    for (const p of matchedPlacements) {
      map.set(requestIdFromPlacement(p), isGoldPartner(p))
    }
    return map
  }, [matchedPlacements])

  const clusterData = useMemo(() => {
    if (!detail) return null
    if (matchedPlacements.length === 0 && !scenario) return null

    const starts: number[] = []
    const ends: number[] = []
    for (const p of matchedPlacements) {
      if (p.start) starts.push(p.start.getTime())
      if (p.end) ends.push(p.end.getTime())
    }
    if (scenario?.earliestStart) starts.push(new Date(scenario.earliestStart).getTime())
    if (scenario?.latestEnd) ends.push(new Date(scenario.latestEnd).getTime())
    if (starts.length === 0 || ends.length === 0) return null

    return {
      cluster: {
        id: `detail-${detail.requestIds.join("-")}`,
        placements: matchedPlacements,
        start: new Date(Math.min(...starts)),
        end: new Date(Math.max(...ends)),
        level: "cluster" as const,
        stats: {
          requestCount: scenario?.recordCount ?? detail.requestIds.length,
          schoolCount:
            scenario?.schoolCount ?? new Set(matchedPlacements.map((p) => p.school)).size,
          schoolBreakdown: [],
          statusCounts: {
            "Request Pending": 0,
            Review: 0,
            Approved: 0,
            Declined: 0,
            Canceled: 0,
          },
        },
      } satisfies ApprovalObjectCluster,
    }
  }, [detail, matchedPlacements, scenario])

  const detailRequests = useMemo(() => {
    if (!detail) return []
    return buildAvailabilityDetailRequests({
      requestIds: detail.requestIds,
      placements: matchedPlacements,
      scenario,
      store: medstarData?.store ?? null,
    })
  }, [detail, matchedPlacements, scenario, medstarData?.store])

  const shiftGroups = useMemo(() => groupRequestsByShift(detailRequests), [detailRequests])

  const timelineRange = useMemo(
    () => detailTimelineRange(detailRequests, scenario),
    [detailRequests, scenario],
  )

  const monthMarkers = useMemo(
    () =>
      timelineRange
        ? buildMonthMarkersPx(timelineRange.start, timelineRange.end, TIMELINE_MIN_W)
        : [],
    [timelineRange],
  )

  const rowHeights = useMemo(
    () =>
      shiftGroups.map((group) => {
        const laneCount = competitionRowLaneCount(group.entries.length)
        return ROW_PAD * 2 + laneCount * LANE_H
      }),
    [shiftGroups],
  )

  if (!detail || !clusterData || detailRequests.length === 0) return null

  const copy = buildAvailabilityStripeCopy(clusterData.cluster, { scenario })
  const orderedIds = detailRequests.map((r) => r.id)

  const handleCompare = () => {
    model.setAvailabilityDetail(null)
    model.setApprovalCluster({
      requestIds: detail.requestIds,
      scenarioId: detail.scenarioId ?? scenario?.id,
    })
  }

  const handleSelectEntry = (entry: AvailabilityCompetitionEntry) => {
    model.setAvailabilityDetail(null)
    if (entry.requestCount === 1) {
      model.openApprovalDetail(entry.requestIds[0], orderedIds, { fromCluster: true })
      return
    }
    model.setApprovalCluster({
      requestIds: entry.requestIds,
      scenarioId: detail.scenarioId ?? scenario?.id,
    })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && model.setAvailabilityDetail(null)}>
      <DialogContent className={DETAIL_MODAL_SHELL}>
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border shrink-0 space-y-0">
          {copy.header ? (
            <DialogTitle className="text-xl font-semibold leading-tight">{copy.header}</DialogTitle>
          ) : (
            <DialogTitle className="sr-only">Availability detail</DialogTitle>
          )}
          <DialogDescription className="sr-only">
            Competition view with {copy.requestCount} requests across {shiftGroups.length} shift
            {shiftGroups.length === 1 ? "" : "s"}
          </DialogDescription>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {copy.dateRange ? (
              <span className="text-sm tabular-nums text-muted-foreground">{copy.dateRange}</span>
            ) : null}
            {copy.subheader ? (
              <span className="inline-flex text-[11px] font-medium tabular-nums px-2.5 py-0.5 rounded-full bg-muted border border-border">
                {copy.subheader}
              </span>
            ) : null}
            {copy.demandSignal ? (
              <span
                className={`text-[11px] font-medium ${
                  copy.demandSignal.includes("competing")
                    ? "text-violet-800 dark:text-violet-200"
                    : "text-orange-800 dark:text-orange-200"
                }`}
              >
                {copy.demandSignal}
              </span>
            ) : null}
          </div>
          <div className="mt-3 inline-flex flex-wrap rounded-lg border border-border/70 bg-muted/20 text-sm divide-x divide-border/70 overflow-hidden">
            {copy.awaitingDecisionCount != null ? (
              <div className="px-4 py-2 bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-muted-foreground">{COORDINATOR_TERMS.toReviewLabel} </span>
                <span className="font-semibold tabular-nums text-foreground">{copy.awaitingDecisionCount}</span>
              </div>
            ) : null}
            {copy.schoolCount > 1 ? (
              <div className="px-4 py-2">
                <span className="text-muted-foreground">{COORDINATOR_TERMS.schoolsCompetingLabel} </span>
                <span className="font-semibold tabular-nums text-foreground">{copy.schoolCount}</span>
              </div>
            ) : null}
            {copy.slotsRequested != null ? (
              <div className="px-4 py-2">
                <span className="text-muted-foreground">{COORDINATOR_TERMS.slotsRequested} </span>
                <span className="font-semibold tabular-nums text-foreground">{copy.slotsRequested}</span>
              </div>
            ) : null}
            {copy.requestCount > 0 ? (
              <div className="px-4 py-2">
                <span className="text-muted-foreground">Requests </span>
                <span className="font-semibold tabular-nums text-foreground">{copy.requestCount}</span>
              </div>
            ) : null}
          </div>
        </DialogHeader>

        <div className="relative flex-1 min-h-0">
          {overflow.left ? (
            <div
              className="absolute left-0 top-0 bottom-0 w-8 z-30 pointer-events-none bg-gradient-to-r from-background via-background/70 to-transparent flex items-center justify-start pl-1"
              style={{ marginLeft: SHIFT_RAIL_W }}
              aria-hidden
            >
              <span className="text-xs text-muted-foreground/80">‹</span>
            </div>
          ) : null}
          {overflow.right ? (
            <div
              className="absolute right-0 top-0 bottom-0 w-8 z-30 pointer-events-none bg-gradient-to-l from-background via-background/70 to-transparent flex items-center justify-end pr-1"
              aria-hidden
            >
              <span className="text-xs text-muted-foreground/80">›</span>
            </div>
          ) : null}

          <div ref={timelineScrollRef} className="h-full overflow-auto">
            {timelineRange ? (
              <div style={{ minWidth: SHIFT_RAIL_W + TIMELINE_MIN_W }}>
                <div
                  className="sticky top-0 z-30 flex border-b border-border/80 bg-muted/25"
                  style={{ minWidth: SHIFT_RAIL_W + TIMELINE_MIN_W, height: HEADER_H }}
                >
                  <div
                    className="sticky left-0 z-40 shrink-0 border-r border-border/80 bg-muted/25 shadow-[1px_0_0_0_hsl(var(--border))]"
                    style={{ width: SHIFT_RAIL_W, height: HEADER_H }}
                    aria-hidden
                  />
                  <div
                    className="relative shrink-0"
                    style={{ width: TIMELINE_MIN_W, height: HEADER_H }}
                  >
                    {monthMarkers.map((m, i) => (
                      <div
                        key={`header-${m.label}-${i}`}
                        className="absolute top-0 bottom-0 flex items-end pb-0.5"
                        style={{ left: m.leftPx }}
                      >
                        <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/90 pl-1">
                          {m.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {shiftGroups.map((group, i) => (
                  <ShiftTimelineRow
                    key={group.shiftKey}
                    group={group}
                    rowH={rowHeights[i] ?? LANE_H}
                    rangeStart={timelineRange.start}
                    rangeEnd={timelineRange.end}
                    monthMarkers={monthMarkers}
                    goldByRequestId={goldByRequestId}
                    onSelectEntry={handleSelectEntry}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {shiftGroups.flatMap((group) =>
                  group.entries.map((entry) => {
                    const isGold = entryIsGoldPartner(entry, goldByRequestId)
                    return (
                      <CompetitionEntryHoverCard key={entry.id} entry={entry} isGold={isGold}>
                        <button
                          type="button"
                          className="w-full text-left px-3 py-2 rounded-lg border border-border/80 hover:bg-muted/40 flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          aria-label={competitionChipAriaLabel(entry)}
                          onClick={() => handleSelectEntry(entry)}
                        >
                          <TimelineChipFace entry={entry} isGold={isGold} />
                        </button>
                      </CompetitionEntryHoverCard>
                    )
                  }),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 px-6 py-3.5 border-t border-border/80 flex items-center justify-between gap-4 bg-muted/20">
          <p className="text-sm text-muted-foreground">
            {copy.requestCount > 0 ? (
              <>
                {copy.requestCount} request{copy.requestCount === 1 ? "" : "s"}
                {shiftGroups.length > 0 ? (
                  <>
                    {" "}
                    across {shiftGroups.length} shift{shiftGroups.length === 1 ? "" : "s"}
                  </>
                ) : null}
                {copy.schoolCount > 0 ? (
                  <>
                    {" "}
                    · {copy.schoolCount} school{copy.schoolCount === 1 ? "" : "s"} competing
                  </>
                ) : null}
              </>
            ) : null}
          </p>
          <Button type="button" onClick={handleCompare}>
            Compare requests →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
