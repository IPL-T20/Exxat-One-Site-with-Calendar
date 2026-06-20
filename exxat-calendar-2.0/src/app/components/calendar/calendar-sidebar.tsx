import {
  formatSidebarDisciplineCapacity,
} from "../../lib/slot-requests-calendar/capacity-coordinator-copy"
import { formatToReviewCount } from "../../lib/slot-requests-calendar/coordinator-copy"
import type { CalendarTimelineRow, CalendarViewGroup } from "../../lib/slot-requests-calendar/calendar-grouping"
import { type CalendarGroupByMode } from "../../lib/slot-requests-calendar/calendar-grouping"
import type { DisciplineRowDecisionSnapshot } from "../../lib/slot-requests-calendar/decision-engine/decision-types"
import { CALENDAR_ROW_BORDER, CALENDAR_SIDEBAR_BUTTON_HOVER, CALENDAR_SIDEBAR_EDGE, CALENDAR_SIDEBAR_GROUP_BAND, CALENDAR_SIDEBAR_INSET, CALENDAR_SIDEBAR_ROW_HOVER, CALENDAR_SIDEBAR_STICKY_Z, LOCATION_ROW_H } from "../../lib/slot-requests-calendar/constants"
import type { CalendarModel } from "./useCalendarModel"
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
    <p className="truncate text-[10px] font-normal leading-snug text-muted-foreground" title={line}>
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
  variant?: "group" | "detail"
}) {
  const isGroup = variant === "group"

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

  return (
    <span
      className={cn(
        "w-8 shrink-0 text-right tabular-nums",
        isGroup
          ? "text-[13px] font-semibold leading-snug text-foreground"
          : "text-[12px] font-semibold leading-snug text-foreground",
        className,
      )}
      aria-label={formatToReviewCount(count)}
    >
      {count}
    </span>
  )
}

/** Sticky sidebar cell — opaque fills mask scrolling grid lines. */
const SIDEBAR_CELL = cn(
  "sticky left-0 isolate shrink-0 bg-background",
  CALENDAR_SIDEBAR_EDGE,
)
const SIDEBAR_GROUP_HEADER = cn(
  "sticky left-0 isolate shrink-0",
  CALENDAR_SIDEBAR_GROUP_BAND,
  CALENDAR_SIDEBAR_EDGE,
)
const SIDEBAR_STICKY_STYLE = { zIndex: CALENDAR_SIDEBAR_STICKY_Z } as const

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0 text-muted-foreground" aria-hidden fill="none">
      {open ? (
        <path d="M3.5 6.5 8 11l4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function CalendarSidebarParentRow({
  group,
  isOpen,
  onToggle,
  sidebarW,
  sideShadow,
}: {
  group: CalendarViewGroup
  isOpen: boolean
  onToggle: () => void
  sidebarW: number
  sideShadow: string
}) {
  const toReview = group.pendingCount + group.reviewCount

  return (
    <button
      type="button"
      className={cn(
        SIDEBAR_GROUP_HEADER,
        CALENDAR_ROW_BORDER,
        CALENDAR_SIDEBAR_ROW_HOVER,
        "flex items-center gap-2 text-left",
        CALENDAR_SIDEBAR_INSET,
        CALENDAR_SIDEBAR_BUTTON_HOVER,
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, height: LOCATION_ROW_H, boxShadow: sideShadow }}
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-label={`${group.label}${toReview > 0 ? `, ${formatToReviewCount(toReview)}` : ""}`}
    >
      <ChevronIcon open={isOpen} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-semibold leading-snug text-foreground">{group.label}</div>
        {group.contextTag ? (
          <p className="mt-0.5 truncate text-[10px] leading-snug text-muted-foreground">{group.contextTag}</p>
        ) : null}
      </div>
      <ReviewCount count={toReview} variant="group" />
    </button>
  )
}

export function CalendarSidebarLeafRow({
  row,
  rowH,
  sidebarW,
  sideShadow,
  getDecision,
}: {
  row: CalendarTimelineRow
  rowH: number
  sidebarW: number
  sideShadow: string
  getDecision: (id: string) => DisciplineRowDecisionSnapshot | undefined
}) {
  const toReview = queueTotal(row)
  const decision = row.disciplineDecisionId ? getDecision(row.disciplineDecisionId) : undefined
  const capacityLine = formatSidebarDisciplineCapacity(decision, {
    capacity: row.capacity,
    approvedSlots: row.approvedSlots,
  })

  return (
    <div
      className={cn(
        SIDEBAR_CELL,
        CALENDAR_ROW_BORDER,
        CALENDAR_SIDEBAR_ROW_HOVER,
        "flex items-center gap-2 py-2 pl-9 pr-3",
        capacityLine && "py-2.5",
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, minHeight: rowH, height: rowH, boxShadow: sideShadow }}
    >
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="truncate text-[12px] font-medium leading-snug text-foreground">{row.label}</div>
        <DisciplineCapacityLine
          decision={decision}
          fallback={{ capacity: row.capacity, approvedSlots: row.approvedSlots }}
        />
      </div>
      <ReviewCount count={toReview} />
    </div>
  )
}

export function CalendarSidebarFlatRow({
  group,
  row,
  rowH,
  sidebarW,
  sideShadow,
  getDecision,
}: {
  group: CalendarViewGroup
  row: CalendarTimelineRow
  rowH: number
  sidebarW: number
  sideShadow: string
  getDecision: (id: string) => DisciplineRowDecisionSnapshot | undefined
}) {
  return (
    <div
      className={cn(
        SIDEBAR_GROUP_HEADER,
        CALENDAR_ROW_BORDER,
        CALENDAR_SIDEBAR_ROW_HOVER,
        "flex items-center gap-2 py-2.5",
        CALENDAR_SIDEBAR_INSET,
      )}
      style={{ ...SIDEBAR_STICKY_STYLE, width: sidebarW, minHeight: rowH, height: rowH, boxShadow: sideShadow }}
    >
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
  )
}

export function CalendarSidebarCollapsedHint({
  group,
}: {
  group: CalendarViewGroup
}) {
  const toReview = group.pendingCount + group.reviewCount
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center px-4">
      <span className="truncate rounded-md bg-background/80 px-2 py-0.5 text-[11px] text-muted-foreground shadow-sm ring-1 ring-border/60">
        {group.placementCount} request{group.placementCount === 1 ? "" : "s"}
        {toReview > 0 ? ` · ${formatToReviewCount(toReview)}` : ""}
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

  return (
    <Select
      value={model.groupBy}
      onValueChange={(value) => model.setGroupBy(value as CalendarGroupByMode)}
    >
      <SelectTrigger
        id="calendar-view-by"
        className={cn(
          "h-full w-full rounded-none border-none bg-background shadow-none",
          "hover:bg-muted active:bg-accent",
          "focus-visible:border-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/50",
          "data-[size=default]:h-full data-[size=sm]:h-full",
          "flex items-center gap-2 py-3 transition-colors duration-150",
          CALENDAR_SIDEBAR_INSET,
          "[&_[data-slot=select-value]]:hidden",
        )}
        aria-label={`View by ${activeLabel}, ${groupCount} groups`}
      >
        <span className="min-w-0 flex-1 text-left leading-none">
          <span className="block text-[10px] font-medium text-muted-foreground">View by</span>
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
