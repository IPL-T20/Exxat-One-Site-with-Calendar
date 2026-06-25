import {
  formatSidebarDisciplineCapacity,
} from "../../lib/slot-requests-calendar/capacity-coordinator-copy"
import { formatToReviewCount } from "../../lib/slot-requests-calendar/coordinator-copy"
import type { CalendarTimelineRow, CalendarViewGroup } from "../../lib/slot-requests-calendar/calendar-grouping"
import { type CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { DisciplineRowDecisionSnapshot } from "../../lib/slot-requests-calendar/decision-engine/decision-types"
import { CALENDAR_SIDEBAR_BUTTON_HOVER, CALENDAR_SIDEBAR_INSET, CALENDAR_SIDEBAR_ROW_HOVER, CALENDAR_SIDEBAR_STICKY_Z, LOCATION_ROW_H } from "../../lib/slot-requests-calendar/constants"
import {
  formatSchedulesSidebarKpiAria,
  type ScheduleRowKpis,
} from "../../lib/schedules/schedules-row-kpis"
import { SCHEDULES_SIDEBAR_LEVEL } from "../../lib/schedules/schedules-sidebar-level"
import { SchedulesSidebarKpiChips } from "./schedules-sidebar-kpi-chips"
import { ScheduleExperienceTypeIcon } from "./schedule-bar-infographics"
import type { CalendarModel } from "./useCalendarModel"
import { CalendarChevron } from "./calendar-chevron"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { cn } from "../ui/utils"

function queueTotal(row: Pick<CalendarTimelineRow, "pendingCount" | "reviewCount">) {
  return row.pendingCount + row.reviewCount
}

function DisciplineCapacityLine({
  decision,
  fallback,
}: {
  decision: DisciplineRowDecisionSnapshot | undefined
  fallback?: { capacity: number; approvedSlots: number }
}) {
  const line = formatSidebarDisciplineCapacity(decision, fallback)
  if (!line) return null

  return (
    <p className="mt-0.5 truncate text-[10px] font-normal leading-snug text-muted-foreground" title={line}>
      {line}
    </p>
  )
}

function ReviewCount({
  count,
  className,
  variant = "detail",
}: {
  count: number
  className?: string
  variant?: "detail" | "group" | "aggregate"
}) {
  const isGroup = variant === "group"
  const isAggregate = variant === "aggregate"

  if (count <= 0) {
    return (
      <span
        className={cn(
          "w-8 shrink-0 text-right tabular-nums text-muted-foreground/40",
          isGroup ? "text-[13px] font-semibold leading-snug" : "text-[12px] font-medium leading-snug",
          className,
        )}
        aria-hidden
      >
        ·
      </span>
    )
  }

  if (isAggregate) {
    return (
      <span
        className={cn(
          "inline-flex w-8 shrink-0 items-center justify-center rounded tabular-nums",
          "bg-amber-100 px-0.5 py-0.5 text-[12px] font-semibold leading-snug text-amber-950",
          "ring-1 ring-inset ring-amber-200/90 dark:bg-amber-950/45 dark:text-amber-100 dark:ring-amber-800/55",
          className,
        )}
        title="Total to review across departments"
        aria-label={`${formatToReviewCount(count)} total across departments`}
      >
        {count}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "w-8 shrink-0 self-center text-right tabular-nums leading-none",
        isGroup
          ? "text-[13px] font-semibold text-foreground"
          : "text-[12px] font-semibold text-foreground",
        className,
      )}
      aria-label={formatToReviewCount(count)}
    >
      {count}
    </span>
  )
}

/** Sticky sidebar cell — ::before mask in globals.css blocks scrolling grid lines. */
const SIDEBAR_CELL =
  "calendar-sidebar-sticky relative sticky left-0 shrink-0 overflow-hidden"
const SIDEBAR_GROUP_HEADER =
  "calendar-sidebar-sticky calendar-sidebar-sticky--group relative sticky left-0 shrink-0 overflow-hidden"
const SIDEBAR_SCHEDULES_LOCATION =
  "calendar-sidebar-sticky calendar-sidebar-sticky--group calendar-sidebar-sticky--location relative sticky left-0 shrink-0 overflow-hidden"
const SIDEBAR_SCHEDULES_DEPT =
  "calendar-sidebar-sticky calendar-sidebar-sticky--dept relative sticky left-0 shrink-0 overflow-hidden"
const SIDEBAR_SCHEDULES_LEAF =
  "calendar-sidebar-sticky calendar-sidebar-sticky--schedule relative sticky left-0 shrink-0 overflow-hidden"
const SIDEBAR_STICKY_STYLE = { zIndex: CALENDAR_SIDEBAR_STICKY_Z } as const
const SIDEBAR_STICKY_CONTENT = "relative z-[1] flex min-w-0 w-full"

export function CalendarSidebarParentRow({
  group,
  isOpen,
  onToggle,
  sidebarW,
  schedulesKpis,
  keyboardRowId,
}: {
  group: CalendarViewGroup
  isOpen: boolean
  onToggle: () => void
  sidebarW: number
  schedulesKpis?: ScheduleRowKpis
  keyboardRowId?: string
}) {
  const toReview = schedulesKpis
    ? schedulesKpis.active
    : group.pendingCount + group.reviewCount

  return (
    <button
      type="button"
      className={cn(
        schedulesKpis ? SIDEBAR_SCHEDULES_LOCATION : SIDEBAR_GROUP_HEADER,
        CALENDAR_SIDEBAR_ROW_HOVER,
        CALENDAR_SIDEBAR_INSET,
        CALENDAR_SIDEBAR_BUTTON_HOVER,
        "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, height: LOCATION_ROW_H }}
      onClick={onToggle}
      data-schedules-kbd-target={keyboardRowId ? "nav" : undefined}
      data-schedules-kbd-row={keyboardRowId}
      aria-expanded={isOpen}
      aria-label={
        schedulesKpis
          ? `${group.label}, ${formatSchedulesSidebarKpiAria(schedulesKpis)}`
          : `${group.label}${
              toReview > 0 ? `, ${formatToReviewCount(toReview)} total across departments` : ""
            }`
      }
    >
      <div className={cn(SIDEBAR_STICKY_CONTENT, "h-full items-center gap-2")}>
        <CalendarChevron use="expand" open={isOpen} />
        {schedulesKpis ? (
          <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
            <div className={cn("truncate", SCHEDULES_SIDEBAR_LEVEL.location.title)}>
              {group.label}
            </div>
            <SchedulesSidebarKpiChips
              kpis={schedulesKpis}
              tone={SCHEDULES_SIDEBAR_LEVEL.location.kpiTone}
            />
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-snug text-foreground">{group.label}</div>
            {group.contextTag ? (
              <p className="mt-0.5 truncate text-[10px] leading-snug text-muted-foreground">{group.contextTag}</p>
            ) : null}
          </div>
        )}
        {!schedulesKpis ? <ReviewCount count={toReview} variant="aggregate" /> : null}
      </div>
    </button>
  )
}

export function CalendarSidebarSchedulesDeptRow({
  row,
  kpis,
  isOpen,
  onToggle,
  sidebarW,
  keyboardRowId,
}: {
  row: CalendarTimelineRow
  kpis: ScheduleRowKpis
  isOpen: boolean
  onToggle: () => void
  sidebarW: number
  keyboardRowId?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        SIDEBAR_SCHEDULES_DEPT,
        CALENDAR_SIDEBAR_ROW_HOVER,
        CALENDAR_SIDEBAR_BUTTON_HOVER,
        "text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, height: LOCATION_ROW_H }}
      onClick={onToggle}
      data-schedules-kbd-target={keyboardRowId ? "nav" : undefined}
      data-schedules-kbd-row={keyboardRowId}
      aria-expanded={isOpen}
      aria-label={`${row.label}, ${formatSchedulesSidebarKpiAria(kpis)}`}
    >
      <div className={cn(SIDEBAR_STICKY_CONTENT, "h-full items-center gap-2 pr-3 pl-5")}>
        <CalendarChevron use="expand" open={isOpen} />
        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
          <div className={cn("truncate", SCHEDULES_SIDEBAR_LEVEL.department.title)}>
            {row.label}
          </div>
          <SchedulesSidebarKpiChips
            kpis={kpis}
            tone={SCHEDULES_SIDEBAR_LEVEL.department.kpiTone}
          />
        </div>
      </div>
    </button>
  )
}

export function CalendarSidebarLeafRow({
  row,
  rowH,
  sidebarW,
  getDecision,
  schedulesSecondaryLine,
  schedulesContextLine,
  keyboardRowId,
}: {
  row: CalendarTimelineRow
  rowH: number
  sidebarW: number
  getDecision: (id: string) => DisciplineRowDecisionSnapshot | undefined
  /** Schedules-only — school · shift under the schedule name. */
  schedulesSecondaryLine?: string | null
  /** Schedules-only — Location › Department (All view). */
  schedulesContextLine?: string | null
  keyboardRowId?: string
}) {
  const toReview = queueTotal(row)
  const decision = row.disciplineDecisionId ? getDecision(row.disciplineDecisionId) : undefined
  const schedulesMode = schedulesSecondaryLine != null || schedulesContextLine != null
  const schedulePlacement = schedulesMode ? row.placements[0] : undefined

  return (
    <div
      className={cn(
        schedulesMode ? SIDEBAR_SCHEDULES_LEAF : SIDEBAR_CELL,
        CALENDAR_SIDEBAR_ROW_HOVER,
        keyboardRowId &&
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, minHeight: rowH, height: rowH }}
      tabIndex={keyboardRowId ? 0 : undefined}
      data-schedules-kbd-target={keyboardRowId ? "nav" : undefined}
      data-schedules-kbd-row={keyboardRowId}
    >
      <div
        className={cn(
          SIDEBAR_STICKY_CONTENT,
          "h-full items-center gap-2 py-2 pr-3",
          schedulesMode ? "pl-[2.125rem]" : "pl-9",
        )}
      >
        {schedulesMode ? (
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {schedulePlacement ? (
              <ScheduleExperienceTypeIcon type={schedulePlacement.experienceType} />
            ) : null}
            <div className="min-w-0 flex flex-col justify-center gap-0.5">
              <div className={cn("truncate", SCHEDULES_SIDEBAR_LEVEL.schedule.title)}>
                {row.label}
              </div>
              {schedulesSecondaryLine ? (
                <p className={cn("truncate", SCHEDULES_SIDEBAR_LEVEL.schedule.meta)}>
                  {schedulesSecondaryLine}
                </p>
              ) : null}
              {schedulesContextLine ? (
                <p className={cn("truncate", SCHEDULES_SIDEBAR_LEVEL.schedule.meta)}>
                  {schedulesContextLine}
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <div className="min-w-0 truncate text-[12px] font-medium leading-snug text-foreground">
                {row.label}
              </div>
              <DisciplineCapacityLine
                decision={decision}
                fallback={{ capacity: row.capacity, approvedSlots: row.approvedSlots }}
              />
            </div>
            <ReviewCount count={toReview} />
          </>
        )}
      </div>
    </div>
  )
}

export function CalendarSidebarFlatRow({
  group,
  row,
  rowH,
  sidebarW,
  getDecision,
}: {
  group: CalendarViewGroup
  row: CalendarTimelineRow
  rowH: number
  sidebarW: number
  getDecision: (id: string) => DisciplineRowDecisionSnapshot | undefined
}) {
  return (
    <div
      className={cn(
        SIDEBAR_GROUP_HEADER,
        CALENDAR_SIDEBAR_ROW_HOVER,
        CALENDAR_SIDEBAR_INSET,
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, minHeight: rowH, height: rowH }}
    >
      <div className={cn(SIDEBAR_STICKY_CONTENT, "items-center gap-2 py-2.5")}>
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="truncate text-[13px] font-semibold leading-snug text-foreground">{group.label}</div>
          {group.contextTag ? (
            <p className="truncate text-[10px] leading-snug text-muted-foreground">{group.contextTag}</p>
          ) : null}
          <DisciplineCapacityLine
            decision={row.disciplineDecisionId ? getDecision(row.disciplineDecisionId) : undefined}
            fallback={{ capacity: row.capacity, approvedSlots: row.approvedSlots }}
          />
        </div>
        <ReviewCount count={queueTotal(row)} variant="group" />
      </div>
    </div>
  )
}

export function CalendarSidebarCollapsedHint({
  group,
  schedulesContext = false,
}: {
  group: CalendarViewGroup
  schedulesContext?: boolean
}) {
  const toReview = group.pendingCount + group.reviewCount
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center px-4">
      <span className="truncate rounded-md bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/60">
        {group.placementCount} {schedulesContext ? "schedule" : "request"}
        {group.placementCount === 1 ? "" : "s"}
        {!schedulesContext && toReview > 0 ? ` · ${formatToReviewCount(toReview)}` : ""}
      </span>
    </div>
  )
}

export function CalendarSidebarNavHeader({ model }: { model: CalendarModel }) {
  const available = model.groupByOptions.filter((o) => o.status === "available")
  const active =
    model.groupByOptions.find((o) => o.mode === model.groupBy) ??
    available.find((o) => o.enabled)
  const groupCount = model.calendarViewGroups.length
  const activeLabel = active?.label ?? "Choose a view"
  const sortLabel = model.schedulesContext ? "Sort by" : "View by"

  return (
    <Select
      value={model.groupBy}
      onValueChange={(value) => model.setGroupBy(value as CalendarGroupByMode)}
    >
      <SelectTrigger
        id="calendar-view-by"
        className={cn(
          "h-full w-full rounded-none border-none bg-transparent shadow-none",
          "hover:bg-[color-mix(in_oklch,var(--accent)_40%,var(--calendar-chrome-band))] active:bg-[color-mix(in_oklch,var(--accent)_55%,var(--calendar-chrome-band))]",
          "focus-visible:border-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
          "data-[size=default]:h-full data-[size=sm]:h-full",
          "flex items-center gap-2 py-3 transition-colors duration-150",
          CALENDAR_SIDEBAR_INSET,
          "[&_[data-slot=select-value]]:hidden",
        )}
        aria-label={`${sortLabel} ${activeLabel}, ${groupCount} groups`}
      >
        <span className="min-w-0 flex-1 text-left leading-none">
          <span className="block text-[10px] font-medium text-muted-foreground">{sortLabel}</span>
          <span className="mt-1 block truncate text-sm font-semibold text-foreground">{activeLabel}</span>
        </span>
        <span
          className="mr-0.5 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground"
          title={`${groupCount} groups`}
        >
          {groupCount}
        </span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        align="start"
        sideOffset={4}
        className="w-[var(--radix-select-trigger-width)] min-w-[8rem]"
      >
        {available.map((opt) => (
          <SelectItem
            key={opt.mode}
            value={opt.mode}
            disabled={!opt.enabled}
            className="cursor-pointer"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
