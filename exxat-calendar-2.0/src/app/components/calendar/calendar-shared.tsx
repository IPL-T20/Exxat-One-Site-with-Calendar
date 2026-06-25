import { createPortal } from "react-dom"
import { type ComponentPropsWithoutRef, type ReactNode } from "react"
import { cn } from "../ui/utils"
import {
  isDayViewEdgeBufferDay,
  isMonthViewEdgeBufferDay,
  isWeekViewEdgeBufferDay,
  isWeekViewEdgeBufferWeekCol,
  isYearViewEdgeBufferColumn,
  weekStartForDate,
  weekViewportDayDates,
  xOfDate,
  widthOfRange,
} from "../../lib/slot-requests-calendar/calendar-timeline"
import type {
  TimelineMonthBand,
  TimelineTintBand,
  TimelineTopCol,
  TimelineWeekCol,
} from "../../lib/slot-requests-calendar/calendar-timeline"
import {
  HEALTH_COLOR,
  STATUS_BAR_STYLE,
  STATUS_LABEL,
  CALENDAR_ROW_SEPARATOR,
  CALENDAR_SECTION_SEPARATOR,
  CALENDAR_HEADER_SEPARATOR,
  CALENDAR_COLUMN_SEPARATOR,
  CALENDAR_LOCATION_ROW_COLUMN_SEPARATOR,
  CALENDAR_H_SEPARATOR,
  CALENDAR_CHROME_BAND_SURFACE,
  CALENDAR_TODAY_COLUMN_BG,
  CALENDAR_FOCUS_PERIOD_DIM_BG,
  CALENDAR_TODAY_SURFACE,
  CALENDAR_LIVE_DOT,
  CALENDAR_LIVE_DOT_SIZE_PX,
  CALENDAR_LIVE_MOMENT_LINE,
  CALENDAR_LIVE_MOMENT_ROW_Z,
  CALENDAR_STICKY_HEADER_Z,
  CALENDAR_HOVER_LAYER_Z,
  CALENDAR_LIVE_MOMENT_LAYER_Z,
  CALENDAR_LIVE_MOMENT_Z,
  CALENDAR_HEADER_LABEL,
  CALENDAR_HEADER_LABEL_ACTIVE,
  CALENDAR_HEADER_DAY_NUM,
  CALENDAR_HEADER_DAY_NUM_ACTIVE,
  CALENDAR_HEADER_WEEKDAY,
  DAY_HEADER_HOUR_RAIL_H,
  DAY_HEADER_HOUR_MARKERS,
} from "../../lib/slot-requests-calendar/constants"
import {
  columnOverlapsFocus,
  clipStripeToFocusPeriod,
  type FocusPeriodRange,
} from "../../lib/slot-requests-calendar/calendar-period-focus"
import { addCalendarDays } from "../../lib/slot-requests-calendar/calendar-date"
import {
  formatDayViewColumn,
  formatMonthViewEdgeBufferColumn,
  formatWeekViewEdgeBufferDayColumn,
  formatWeekViewEdgeBufferWeekColumn,
  formatYearViewMonthColumn,
  formatWeekRangeLabel,
  HEADER_CELL_HOVER,
  timelineHeaderLayout,
  tintColumnBackground,
} from "../../lib/slot-requests-calendar/calendar-timeline-chrome"
import type {
  CalendarMode,
  CalendarZoom,
  ConflictInterval,
  Placement,
  PlacementEmphasis,
} from "../../lib/slot-requests-calendar/types"
import { isScheduleBar, placementEmphasis } from "../../lib/slot-requests-calendar/calendar-mode"

/** One grid row — single horizontal separator at the bottom, above sticky sidebar fill. */
export function CalendarGridRow({
  className,
  style,
  children,
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("relative flex", className)} style={style} {...props}>
      {children}
      <CalendarHorizontalSeparator layer="row" />
    </div>
  )
}

/** @deprecated Rail is drawn by `.calendar-sidebar-sticky::after` in globals.css. */
export function CalendarSidebarSeparator() {
  return null
}

type CalendarSeparatorLayer = "section" | "header" | "row"

const SEPARATOR_LAYER: Record<CalendarSeparatorLayer, string> = {
  section: CALENDAR_SECTION_SEPARATOR,
  header: CALENDAR_HEADER_SEPARATOR,
  row: CALENDAR_ROW_SEPARATOR,
}

/** Single owned horizontal rule — splits around the sidebar rail so the vertical never doubles. */
export function CalendarHorizontalSeparator({
  layer = "row",
  edge = "bottom",
  className,
}: {
  layer?: CalendarSeparatorLayer
  edge?: "bottom" | "top"
  className?: string
}) {
  const layerClass = SEPARATOR_LAYER[layer]
  const edgeClass = edge === "top" ? "bottom-auto top-0" : "bottom-0"

  return (
    <>
      {/* Sidebar segment — stops 1px before the vertical rail */}
      <div
        className={cn(layerClass, edgeClass, className)}
        style={{ left: 0, right: "calc(100% - var(--calendar-sidebar-w, 280px) + 1px)" }}
        aria-hidden
      />
      {/* Timeline segment — starts after the rail pixel */}
      <div
        className={cn(layerClass, edgeClass, className)}
        style={{ left: "var(--calendar-sidebar-w, 280px)" }}
        aria-hidden
      />
    </>
  )
}

/** @deprecated Use {@link CalendarHorizontalSeparator} layer="section". */
export function CalendarSectionSeparator(props: { edge?: "bottom" | "top" }) {
  return <CalendarHorizontalSeparator layer="section" edge={props.edge ?? "bottom"} />
}

function columnIsCurrentPeriod(
  colX: number,
  colW: number,
  currentPeriod: FocusPeriodRange | null | undefined,
) {
  if (!currentPeriod) return false
  return columnOverlapsFocus(colX, colW, currentPeriod)
}

export function CapacityBar({
  used,
  capacity,
  health,
  size = "sm",
}: {
  used: number
  capacity: number
  health: keyof typeof HEALTH_COLOR
  size?: "sm" | "lg"
}) {
  const pct = Math.min(100, Math.round((used / Math.max(1, capacity)) * 100))
  const w = size === "lg" ? 120 : 72
  const h = size === "lg" ? 8 : 6
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div
        className="rounded-full overflow-hidden bg-muted flex-shrink-0"
        style={{ width: w, height: h }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${used} of ${capacity} slots used`}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: HEALTH_COLOR[health] }}
        />
      </div>
      <span
        className={`text-muted-foreground whitespace-nowrap tabular-nums ${size === "lg" ? "text-xs font-semibold" : "text-[11px]"}`}
      >
        {used}/{capacity}
        {size === "lg" ? ` · ${pct}%` : ""}
      </span>
    </div>
  )
}

function emphasisStyle(
  emphasis: PlacementEmphasis,
  mode: CalendarMode,
  placement: Pick<Placement, "status" | "timelineKind">,
) {
  const base = STATUS_BAR_STYLE[placement.status]
  const schedule = isScheduleBar(placement, mode)
  if (emphasis === "primary") {
    return {
      ...base,
      opacity: 1,
      dashed: schedule ? false : base.dashed,
      height: schedule ? 24 : emphasis === "primary" && mode === "approval" ? 20 : 22,
    }
  }
  if (emphasis === "secondary") {
    return {
      ...base,
      opacity: 0.55,
      dashed: true,
      fill: "color-mix(in oklch, var(--muted-foreground) 12%, transparent)",
      border: "var(--border)",
      text: "var(--muted-foreground)",
    }
  }
  return { ...base, opacity: 0.35, dashed: true }
}

export function TimelineBar({
  placement,
  mode,
  zoom,
  ppd,
  monthPxW,
  selected,
  variant = "default",
  focusPeriodClip = null,
  onSelect,
  onHover,
  onLeave,
}: {
  placement: Placement
  mode: CalendarMode
  zoom: CalendarZoom
  ppd: number
  monthPxW: number
  selected: boolean
  variant?: "default" | "pill" | "flat"
  focusPeriodClip?: FocusPeriodRange | null
  onSelect: (id: string) => void
  onHover: (p: Placement, el: HTMLElement) => void
  onLeave: () => void
}) {
  if (!placement.start || !placement.end) return null

  const emphasis = placementEmphasis(placement.status, mode)
  let left = xOfDate(placement.start, zoom, ppd, monthPxW)
  let width = widthOfRange(placement.start, placement.end, zoom, ppd, monthPxW)
  if (focusPeriodClip) {
    const clipped = clipStripeToFocusPeriod(left, width, focusPeriodClip, 12)
    if (!clipped) return null
    left = clipped.left
    width = clipped.width
  }
  const style = emphasisStyle(emphasis, mode, placement)
  const showLabel = width > (variant === "pill" ? 56 : 40)
  const schedule = isScheduleBar(placement, mode)
  const radius = variant === "pill" ? 999 : variant === "flat" ? 2 : 4

  return (
    <button
      type="button"
      className="absolute top-1/2 -translate-y-1/2 text-left overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-shadow"
      style={{
        left,
        width,
        height: style.height ?? (placement.experienceType === "Group" ? 22 : 18),
        backgroundColor: style.fill,
        border: `1.5px ${style.dashed ? "dashed" : "solid"} ${style.border}`,
        opacity: style.opacity ?? 1,
        borderRadius: radius,
        boxShadow: selected
          ? "0 0 0 2px var(--ring)"
          : schedule
            ? "0 1px 2px color-mix(in oklch, var(--foreground) 12%, transparent)"
            : undefined,
        zIndex: selected ? 5 : emphasis === "primary" ? 3 : 2,
      }}
      aria-pressed={selected}
      aria-label={`${placement.schoolShort}, ${STATUS_LABEL[placement.status]}, ${placement.requestedSlots} slots, ${placement.requestedDuration}`}
      onClick={() => onSelect(placement.id)}
      onMouseEnter={(e) => onHover(placement, e.currentTarget)}
      onMouseLeave={onLeave}
      onFocus={(e) => onHover(placement, e.currentTarget)}
      onBlur={onLeave}
    >
      {showLabel && (
        <span
          className="flex items-center gap-1 px-1.5 text-[10px] font-medium truncate leading-[18px]"
          style={{ color: style.text }}
        >
          {variant === "pill" && schedule && (
            <span
              className="size-4 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-bold bg-white/30"
              aria-hidden
            >
              {placement.schoolShort.slice(0, 2).toUpperCase()}
            </span>
          )}
          <span className="truncate">
            {schedule ? placement.schoolShort : placement.schoolShort}
            {width > 80 ? ` · ${placement.requestedSlots}×` : ""}
          </span>
        </span>
      )}
    </button>
  )
}

export function ConflictShading({
  conflicts,
  disciplineId,
  zoom,
  ppd,
  monthPxW,
  variant = "subtle",
}: {
  conflicts: ConflictInterval[]
  disciplineId: string
  zoom: CalendarZoom
  ppd: number
  monthPxW: number
  variant?: "subtle" | "bold"
}) {
  const mine = conflicts.filter((c) => c.disciplineId === disciplineId)
  return (
    <>
      {mine.map((c) => (
        <div
          key={c.id}
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: xOfDate(c.start, zoom, ppd, monthPxW),
            width: widthOfRange(c.start, c.end, zoom, ppd, monthPxW),
            backgroundColor:
              c.kind === "forecast"
                ? variant === "bold"
                  ? "color-mix(in oklch, var(--chart-4) 28%, transparent)"
                  : "color-mix(in oklch, var(--chart-4) 18%, transparent)"
                : variant === "bold"
                  ? "color-mix(in oklch, var(--destructive) 28%, transparent)"
                  : "color-mix(in oklch, var(--destructive) 15%, transparent)",
            borderLeft:
              variant === "bold" ? "3px solid var(--destructive)" : "2px solid var(--destructive)",
            backgroundImage:
              variant === "bold"
                ? "repeating-linear-gradient(-45deg, transparent, transparent 4px, color-mix(in oklch, var(--destructive) 8%, transparent) 4px, color-mix(in oklch, var(--destructive) 8%, transparent) 8px)"
                : undefined,
            zIndex: 1,
          }}
          aria-hidden
        />
      ))}
    </>
  )
}

export function HoverCard({
  placement,
  mode,
  anchor,
}: {
  placement: Placement
  mode: CalendarMode
  anchor: DOMRect
}) {
  const schedule = isScheduleBar(placement, mode)
  return createPortal(
    <div
      className="fixed pointer-events-none rounded-lg border border-border bg-popover text-popover-foreground shadow-lg p-3 w-72"
      style={{
        left: Math.min(anchor.right + 12, window.innerWidth - 300),
        top: Math.max(12, anchor.top - 8),
        zIndex: CALENDAR_HOVER_LAYER_Z,
      }}
      role="tooltip"
    >
      <p className="text-xs font-semibold text-foreground truncate">{placement.school}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">
        {placement.locationName} · {placement.discipline}
      </p>
      <p className="text-[11px] text-muted-foreground mt-1">{placement.requestedDuration}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{placement.availabilityName}</p>
      <div className="flex items-center gap-2 mt-2 text-[11px] flex-wrap">
        <span
          className="inline-flex items-center rounded px-1.5 py-0.5 font-medium"
          style={{
            backgroundColor: STATUS_BAR_STYLE[placement.status].fill,
            border: `1px solid ${STATUS_BAR_STYLE[placement.status].border}`,
          }}
        >
          {schedule ? "Schedule" : STATUS_LABEL[placement.status]}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {placement.requestedSlots} slot{placement.requestedSlots === 1 ? "" : "s"}
        </span>
        <span className="text-muted-foreground">{placement.experienceType}</span>
      </div>
      {placement.requestedShifts && (
        <p className="text-[10px] text-muted-foreground mt-2">{placement.requestedShifts}</p>
      )}
      <p className="text-[10px] text-muted-foreground mt-2 font-mono tabular-nums">{placement.id}</p>
    </div>,
    document.body,
  )
}

/** Body hairline only — dot renders in {@link DateHeader}. */
export function LiveMomentBodyLine({
  x,
  headerH = 0,
  isViewingToday = true,
  className,
  rowSegment = false,
}: {
  x: number
  headerH?: number
  isViewingToday?: boolean
  className?: string
  /** Full row height segment (timeline rows) vs continuous layer (deprecated). */
  rowSegment?: boolean
}) {
  const lineTop = headerH + CALENDAR_LIVE_DOT_SIZE_PX / 2

  return (
    <div
      className={cn(
        CALENDAR_LIVE_MOMENT_LINE,
        isViewingToday ? CALENDAR_TODAY_SURFACE : "bg-border",
        className,
      )}
      style={{
        left: x,
        ...(rowSegment ? {} : { top: isViewingToday ? lineTop : headerH }),
      }}
      aria-hidden
    />
  )
}

/** @deprecated Prefer {@link LiveMomentBodyLine} + {@link LiveMomentHeaderDot}. */
export function LiveMomentChrome({
  x,
  headerH,
  isViewingToday = true,
}: {
  x: number
  headerH: number
  isViewingToday?: boolean
}) {
  return (
    <>
      <LiveMomentHeaderDot x={x} isViewingToday={isViewingToday} />
      <LiveMomentBodyLine x={x} headerH={headerH} isViewingToday={isViewingToday} />
    </>
  )
}

/**
 * @deprecated Body hairline now renders in {@link TimelineMonthColumnLayer}.
 * Kept for callers that still mount a standalone overlay.
 */
export function LiveMomentGridOverlay({
  x,
  sidebarW,
  timelineW,
  headerH,
  isViewingToday = true,
}: {
  x: number
  sidebarW: number
  timelineW: number
  headerH: number
  isViewingToday?: boolean
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ zIndex: CALENDAR_LIVE_MOMENT_LAYER_Z }}
      aria-hidden
    >
      <div
        className="absolute inset-y-0 overflow-hidden"
        style={{ left: sidebarW, width: timelineW }}
      >
        <LiveMomentBodyLine x={x} headerH={headerH} isViewingToday={isViewingToday} />
      </div>
    </div>
  )
}

/** @deprecated Use {@link LiveMomentGridOverlay} */
export const LiveMomentHeaderOverlay = LiveMomentGridOverlay

/** @deprecated Use {@link LiveMomentGridOverlay} */
export const LiveMomentBodyOverlay = LiveMomentGridOverlay

/** @deprecated Use {@link LiveMomentHeaderOverlay} + {@link LiveMomentBodyOverlay} */
export function LiveMomentHeaderDot({
  x,
  isViewingToday = true,
}: {
  x: number
  isViewingToday?: boolean
}) {
  if (!isViewingToday) return null

  return (
    <span
      className={cn(
        "pointer-events-none absolute bottom-0 z-[75] -translate-x-1/2 translate-y-1/2",
        CALENDAR_LIVE_DOT,
      )}
      style={{ left: x }}
      aria-hidden
    />
  )
}

/** Hairline only — toolbar has the Today action; header does not repeat it. */
export function TodayMarker({
  x,
  isViewingToday = true,
}: {
  x: number
  today?: Date
  showPill?: boolean
  isViewingToday?: boolean
}) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none",
        CALENDAR_LIVE_MOMENT_Z,
        isViewingToday ? CALENDAR_TODAY_SURFACE : "bg-border",
      )}
      style={{ left: x }}
      role="presentation"
      aria-hidden
    />
  )
}

/** Per-row body segment — render as last child of the row timeline cell. */
export function TodayLine({
  x,
  isViewingToday = true,
}: {
  x: number
  isViewingToday?: boolean
}) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-0 w-px -translate-x-1/2 pointer-events-none",
        CALENDAR_LIVE_MOMENT_Z,
        isViewingToday ? CALENDAR_TODAY_SURFACE : "bg-border",
      )}
      style={{ left: x }}
      aria-hidden
    />
  )
}

function CalendarColumnDividerEdge({
  clipBottom = false,
  variant = "default",
}: {
  clipBottom?: boolean
  variant?: "default" | "hint"
}) {
  return (
    <div
      className={cn(
        variant === "hint" ? CALENDAR_LOCATION_ROW_COLUMN_SEPARATOR : CALENDAR_COLUMN_SEPARATOR,
        clipBottom && "bottom-px",
      )}
      aria-hidden
    />
  )
}

/** Full-height vertical dividers — one hairline at each column's right edge. */
export function GridColumnDividers({
  columns,
  variant = "default",
}: {
  columns: { x: number; w: number }[]
  variant?: "default" | "hint"
}) {
  if (columns.length === 0) return null

  return (
    <>
      {columns.map((col, i) => (
        <div
          key={`col-div-${col.x}-${i}`}
          className="pointer-events-none absolute inset-y-0 z-[2]"
          style={{ left: col.x, width: col.w }}
          aria-hidden
        >
          <CalendarColumnDividerEdge variant={variant} />
        </div>
      ))}
    </>
  )
}

/** @deprecated Use {@link GridColumnDividers} */
export function GridLines({
  lines,
}: {
  lines: { x: number; major?: boolean; kind?: "year" | "month" | "week" | "day" }[]
}) {
  if (lines.length === 0) return null
  return (
    <>
      {lines.map((line, i) => (
        <div
          key={`col-div-${line.x}-${i}`}
          className={cn("pointer-events-none absolute inset-y-0 z-[1] calendar-v-separator")}
          style={{ left: line.x }}
          aria-hidden
        />
      ))}
    </>
  )
}

export function TimelineMonthColumns({
  bands,
  className,
}: {
  bands: TimelineTintBand[]
  /** @deprecated Header and body share the same fill; kept for call-site compatibility. */
  variant?: "header" | "body"
  todayX?: number
  activeMonthPredicate?: (band: TimelineMonthBand) => boolean
  className?: string
}) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      aria-hidden
    >
      {bands.map((band, i) => (
        <div
          key={`tint-col-${band.x}-${i}`}
          className="absolute inset-y-0"
          style={{
            left: band.x,
            width: band.w,
            backgroundColor: tintColumnBackground(band.stripeIndex),
          }}
        />
      ))}
    </div>
  )
}

/** @deprecated Use TimelineMonthColumns */
export function TimelineMonthBands({ bands }: { bands: TimelineTintBand[] }) {
  return <TimelineMonthColumns bands={bands} />
}

/** Single continuous tint layer — behind header labels + all body rows (zoom-aware zebra). */
export function TimelineMonthColumnLayer({
  bands,
  dividerCols,
  bodyLines,
  sidebarW,
  timelineW,
  top,
  headerH = 0,
  zoom,
  currentPeriod,
  navigatorPeriod,
  focusPeriodMode = false,
}: {
  bands: TimelineTintBand[]
  dividerCols?: { x: number; w: number }[]
  /** @deprecated Use dividerCols */
  bodyLines?: { x: number; major?: boolean; kind?: "year" | "month" | "week" | "day" }[]
  sidebarW: number
  timelineW: number
  top: number
  /** Clip body dividers below the sticky date header (header draws its own lines). */
  headerH?: number
  /** @deprecated Use todayMarkerX on timeline rows */
  todayX?: number
  /** Bust layer cache when the time scale changes. */
  zoom?: CalendarZoom
  /** Current day / week / month / year column — always anchored to calendar today. */
  currentPeriod?: FocusPeriodRange | null
  /** Toolbar navigator period — highlighted when focusPeriodMode is on. */
  navigatorPeriod?: FocusPeriodRange | null
  /** Clip + dim outside navigator period; stripes should use the same span. */
  focusPeriodMode?: boolean
}) {
  const showFocusBand =
    focusPeriodMode && navigatorPeriod != null && navigatorPeriod.w > 0

  return (
    <div
      key={zoom}
      className="pointer-events-none absolute z-[1]"
      style={{ left: sidebarW, width: timelineW, top, bottom: 0 }}
      aria-hidden
    >
      <TimelineMonthColumns bands={bands} />
      {showFocusBand ? (
        <>
          {navigatorPeriod!.x > 0 ? (
            <div
              className={cn("absolute bottom-0", CALENDAR_FOCUS_PERIOD_DIM_BG)}
              style={{ left: 0, width: navigatorPeriod!.x, top: headerH }}
            />
          ) : null}
          <div
            className={cn("absolute bottom-0", CALENDAR_TODAY_COLUMN_BG)}
            style={{
              left: navigatorPeriod!.x,
              width: navigatorPeriod!.w,
              top: headerH,
            }}
          />
          {navigatorPeriod!.x + navigatorPeriod!.w < timelineW ? (
            <div
              className={cn("absolute bottom-0", CALENDAR_FOCUS_PERIOD_DIM_BG)}
              style={{
                left: navigatorPeriod!.x + navigatorPeriod!.w,
                width: timelineW - navigatorPeriod!.x - navigatorPeriod!.w,
                top: headerH,
              }}
            />
          ) : null}
        </>
      ) : currentPeriod && currentPeriod.w > 0 ? (
        <div
          className={cn("absolute bottom-0", CALENDAR_TODAY_COLUMN_BG)}
          style={{ left: currentPeriod.x, width: currentPeriod.w, top: headerH }}
        />
      ) : null}
      {dividerCols && dividerCols.length > 0 ? (
        <div className="absolute inset-x-0 bottom-0 z-[3]" style={{ top: headerH }}>
          <GridColumnDividers columns={dividerCols} />
        </div>
      ) : bodyLines && bodyLines.length > 0 ? (
        <div className="absolute inset-x-0 bottom-0 z-[3]" style={{ top: headerH }}>
          <GridLines lines={bodyLines} />
        </div>
      ) : null}
    </div>
  )
}

/** @deprecated Use {@link TimelineMonthColumnLayer} with `currentPeriod`. */
export function TimelineFocusColumnLayer({
  focus,
  sidebarW,
  timelineW,
  top,
}: {
  focus: FocusPeriodRange | null | undefined
  sidebarW: number
  timelineW: number
  top: number
}) {
  if (!focus || focus.w <= 0) return null

  return (
    <TimelineMonthColumnLayer
      bands={[]}
      sidebarW={sidebarW}
      timelineW={timelineW}
      top={top}
      currentPeriod={focus}
    />
  )
}

function DayColumnHourRail() {
  return (
    <div
      className="relative w-full shrink-0 overflow-hidden bg-muted/15"
      style={{ height: DAY_HEADER_HOUR_RAIL_H }}
      aria-hidden
    >
      <CalendarSectionSeparator edge="top" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-muted/50 via-transparent to-muted/50"
        aria-hidden
      />
      {DAY_HEADER_HOUR_MARKERS.map((hour) => {
        const left = `${(hour / 24) * 100}%`
        return (
          <span
            key={hour}
            className="pointer-events-none absolute bottom-1 flex -translate-x-1/2 flex-col items-center gap-px"
            style={{ left }}
          >
            <span className="h-1.5 w-px bg-border" />
            <span className="text-[7px] font-medium leading-none tabular-nums text-muted-foreground/85">
              {hour}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function TimelineHeaderColumn({
  left,
  width,
  bottomRail,
  position = "absolute",
  className,
  children,
  ...headerProps
}: {
  left: number
  width: number
  bottomRail: "hour" | "none"
  position?: "absolute" | "relative"
  className?: string
  children: ReactNode
} & ComponentPropsWithoutRef<"div">) {
  return (
    <div
      role="columnheader"
      className={cn(
        position === "absolute" ? "absolute top-0" : "relative shrink-0",
        "flex h-full flex-col",
        HEADER_CELL_HOVER,
        className,
      )}
      style={{ left: position === "absolute" ? left : undefined, width }}
      {...headerProps}
    >
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-0.5">
        {children}
      </div>
      {bottomRail === "hour" ? <DayColumnHourRail /> : null}
      <CalendarColumnDividerEdge clipBottom />
    </div>
  )
}

export function DateHeader({
  grid,
  timelineW,
  todayX,
  todayMarkerX,
  calendarToday,
  liveNow,
  sidebarLabel,
  sidebarW,
  headerH,
  sidebarSlot,
  zoom,
  ppd = 0,
  monthPxW = 0,
  currentPeriod,
  navigatorPeriod,
  periodAnchor,
  isViewingToday = true,
  /** Offset when stacked below another sticky band (e.g. planner utilization row). */
  stickyTop = 0,
}: {
  grid: ReturnType<typeof import("../../lib/slot-requests-calendar/calendar-timeline").buildGrid>
  timelineW: number
  todayX: number
  todayMarkerX?: number
  calendarToday: Date
  liveNow?: Date
  sidebarLabel?: string
  sidebarW: number
  headerH: number
  sidebarSlot?: ReactNode
  zoom?: CalendarZoom
  ppd?: number
  monthPxW?: number
  currentPeriod?: FocusPeriodRange | null
  /** Toolbar navigator period — week view expands this column into day numbers. */
  navigatorPeriod?: FocusPeriodRange | null
  /** Period anchor — year view edge-buffer column labels. */
  periodAnchor?: Date
  isViewingToday?: boolean
  stickyTop?: number
}) {
  const layout = timelineHeaderLayout(zoom ?? "month")
  const effectiveHeaderH = headerH ?? layout.height
  const bottomRail = layout.hourRail ? "hour" : "none"

  return (
    <div
      className={cn(
        "sticky relative flex overflow-visible",
        CALENDAR_CHROME_BAND_SURFACE,
        stickyTop > 0 && "z-[40]",
      )}
      style={{ height: effectiveHeaderH, top: stickyTop, zIndex: stickyTop > 0 ? 40 : CALENDAR_STICKY_HEADER_Z }}
      role="row"
      aria-label="Timeline date header"
    >
      {sidebarSlot ? (
        <div
          className="calendar-sidebar-sticky calendar-sidebar-sticky--nav sticky left-0 z-[60] flex h-full shrink-0 flex-col"
          style={{ width: sidebarW, height: effectiveHeaderH }}
        >
          <div className="relative z-[1] flex h-full min-h-0 w-full flex-1">{sidebarSlot}</div>
        </div>
      ) : (
        <div
          className="calendar-sidebar-sticky calendar-sidebar-sticky--nav sticky left-0 z-[60] flex h-full shrink-0 items-end"
          style={{ width: sidebarW, height: effectiveHeaderH }}
        >
          <span className="relative z-[1] px-3 pb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground leading-none">
            {sidebarLabel}
          </span>
        </div>
      )}
      <div
        className={cn("relative z-50 shrink-0 overflow-hidden", CALENDAR_CHROME_BAND_SURFACE)}
        style={{ width: timelineW, height: effectiveHeaderH }}
        role="presentation"
      >
        {/* Day — one label per column */}
        {zoom === "day" ? (
          <div className="absolute inset-x-0 top-0 h-full">
            {grid.subCols.map((col: TimelineWeekCol, i: number) => {
              const nextX = grid.subCols[i + 1]?.x ?? timelineW
              const colW = col.w ?? Math.max(0, nextX - col.x)
              const isToday = columnIsCurrentPeriod(col.x, colW, currentPeriod)
              const isEdgeBuffer =
                periodAnchor != null &&
                isDayViewEdgeBufferDay(col.startDate, periodAnchor)
              const edgeLabel = isEdgeBuffer
                ? formatMonthViewEdgeBufferColumn(col.startDate)
                : null
              const dayLabel = formatDayViewColumn(col.startDate)
              return (
                <TimelineHeaderColumn
                  key={`day-${col.x}-${i}`}
                  left={col.x}
                  width={colW}
                  bottomRail={bottomRail}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={edgeLabel?.aria ?? dayLabel.aria}
                  title={edgeLabel?.hover ?? dayLabel.hover}
                >
                  {isEdgeBuffer && edgeLabel ? (
                    <>
                      <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                        {edgeLabel.sub}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none",
                          isToday ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                        )}
                      >
                        {edgeLabel.primary}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                        {dayLabel.weekday}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none",
                          isToday ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                        )}
                      >
                        {dayLabel.day}
                      </span>
                    </>
                  )}
                </TimelineHeaderColumn>
              )
            })}
          </div>
        ) : null}

        {/* Week — focused navigator week splits into day columns; others stay as ranges */}
        {zoom === "week" ? (
          <div className="absolute inset-x-0 top-0 h-full">
            {grid.subCols.map((col: TimelineWeekCol, i: number) => {
              const nextX = grid.subCols[i + 1]?.x ?? timelineW
              const colW = col.w ?? Math.max(0, nextX - col.x)
              const isNavigatorWeek =
                navigatorPeriod != null &&
                columnOverlapsFocus(col.x, colW, navigatorPeriod)
              const isCurrentWeek = columnIsCurrentPeriod(col.x, colW, currentPeriod)

              if (isNavigatorWeek && ppd > 0) {
                const viewportDays =
                  periodAnchor != null ? weekViewportDayDates(periodAnchor) : null
                const dayDates =
                  viewportDays ??
                  Array.from({ length: 7 }, (_, dayOffset) =>
                    addCalendarDays(col.startDate, dayOffset),
                  )
                const stripLeft = viewportDays ? col.x - ppd : col.x
                const stripWidth = dayDates.length * ppd

                return (
                  <div
                    key={`week-days-${col.x}-${i}`}
                    className="absolute top-0 flex h-full"
                    style={{ left: stripLeft, width: stripWidth }}
                  >
                    {dayDates.map((dayDate, dayOffset) => {
                      const dayX = stripLeft + dayOffset * ppd
                      const isToday = columnIsCurrentPeriod(dayX, ppd, currentPeriod)
                      const isEdgeBuffer =
                        periodAnchor != null &&
                        isWeekViewEdgeBufferDay(dayDate, periodAnchor)
                      const edgeLabel = isEdgeBuffer
                        ? formatWeekViewEdgeBufferDayColumn(
                            dayDate,
                            weekStartForDate(dayDate),
                          )
                        : null
                      const dayLabel = formatDayViewColumn(dayDate)
                      return (
                        <TimelineHeaderColumn
                          key={`${col.x}-${dayOffset}`}
                          left={0}
                          width={ppd}
                          bottomRail={bottomRail}
                          position="relative"
                          aria-current={isToday ? "date" : undefined}
                          aria-label={edgeLabel?.aria ?? dayLabel.aria}
                          title={edgeLabel?.hover ?? dayLabel.hover}
                        >
                          {isEdgeBuffer && edgeLabel ? (
                            <>
                              <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                                {edgeLabel.sub}
                              </span>
                              <span
                                className={cn(
                                  "pointer-events-none",
                                  isToday ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                                )}
                              >
                                {edgeLabel.primary}
                              </span>
                            </>
                          ) : (
                            <>
                              <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                                {dayLabel.weekday}
                              </span>
                              <span
                                className={cn(
                                  "pointer-events-none",
                                  isToday ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                                )}
                              >
                                {dayLabel.day}
                              </span>
                            </>
                          )}
                        </TimelineHeaderColumn>
                      )
                    })}
                    <CalendarColumnDividerEdge clipBottom />
                  </div>
                )
              }

              const rangeLabel = col.headerPrimary || formatWeekRangeLabel(col.startDate)
              const isEdgeBuffer =
                periodAnchor != null &&
                isWeekViewEdgeBufferWeekCol(col.startDate, periodAnchor)
              const edgeLabel = isEdgeBuffer
                ? formatWeekViewEdgeBufferWeekColumn(col.startDate)
                : null
              return (
                <TimelineHeaderColumn
                  key={`week-${col.x}-${i}`}
                  left={col.x}
                  width={colW}
                  bottomRail={bottomRail}
                  aria-current={isCurrentWeek ? "date" : undefined}
                  aria-label={edgeLabel?.aria ?? (col.headerAria || rangeLabel)}
                  title={edgeLabel?.hover ?? col.headerHover}
                >
                  {isEdgeBuffer && edgeLabel ? (
                    <>
                      <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                        {edgeLabel.sub}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none truncate px-1",
                          isCurrentWeek ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                        )}
                      >
                        {edgeLabel.primary}
                      </span>
                    </>
                  ) : (
                    <span
                      className={cn(
                        "pointer-events-none truncate px-1",
                        isCurrentWeek ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                      )}
                    >
                      {rangeLabel}
                    </span>
                  )}
                </TimelineHeaderColumn>
              )
            })}
          </div>
        ) : null}

        {/* Month — one label per day column */}
        {zoom === "month" ? (
          <div className="absolute inset-x-0 top-0 h-full">
            {grid.subCols.map((col: TimelineWeekCol, i: number) => {
              const nextX = grid.subCols[i + 1]?.x ?? timelineW
              const colW = col.w ?? Math.max(0, nextX - col.x)
              const isToday = columnIsCurrentPeriod(col.x, colW, currentPeriod)
              const isEdgeBuffer =
                periodAnchor != null &&
                isMonthViewEdgeBufferDay(col.startDate, periodAnchor)
              const edgeLabel = isEdgeBuffer
                ? formatMonthViewEdgeBufferColumn(col.startDate)
                : null
              const dayLabel = formatDayViewColumn(col.startDate)
              return (
                <TimelineHeaderColumn
                  key={`month-day-${col.x}-${i}`}
                  left={col.x}
                  width={colW}
                  bottomRail={bottomRail}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={edgeLabel?.aria ?? dayLabel.aria}
                  title={edgeLabel?.hover ?? dayLabel.hover}
                >
                  {isEdgeBuffer && edgeLabel ? (
                    <>
                      <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                        {edgeLabel.sub}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none",
                          isToday ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                        )}
                      >
                        {edgeLabel.primary}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                        {dayLabel.weekday}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none",
                          isToday ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                        )}
                      >
                        {dayLabel.day}
                      </span>
                    </>
                  )}
                </TimelineHeaderColumn>
              )
            })}
          </div>
        ) : null}

        {/* Year — one label per month column (former month view) */}
        {zoom === "year" ? (
          <div className="absolute inset-x-0 top-0 h-full">
            {grid.topCols.map((col: TimelineTopCol) => {
              const isEdgeBuffer =
                periodAnchor != null && isYearViewEdgeBufferColumn(col, periodAnchor)
              const isCurrentMonth = columnIsCurrentPeriod(col.x, col.w, currentPeriod)
              const monthLabel = formatYearViewMonthColumn(col.year, col.month)
              return (
                <TimelineHeaderColumn
                  key={`${col.year}-${col.month}-${col.x}`}
                  left={col.x}
                  width={col.w}
                  bottomRail={bottomRail}
                  aria-current={isCurrentMonth ? "date" : undefined}
                  aria-label={monthLabel.aria}
                  title={monthLabel.hover}
                >
                  {isEdgeBuffer ? (
                    <>
                      <span className={cn("pointer-events-none", CALENDAR_HEADER_WEEKDAY)}>
                        {monthLabel.year}
                      </span>
                      <span
                        className={cn(
                          "pointer-events-none",
                          isCurrentMonth ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                        )}
                      >
                        {monthLabel.month}
                      </span>
                    </>
                  ) : (
                    <span
                      className={cn(
                        "pointer-events-none truncate px-1",
                        isCurrentMonth ? CALENDAR_HEADER_DAY_NUM_ACTIVE : CALENDAR_HEADER_DAY_NUM,
                      )}
                    >
                      {monthLabel.month}
                    </span>
                  )}
                </TimelineHeaderColumn>
              )
            })}
          </div>
        ) : null}
      </div>

      {todayMarkerX != null ? (
        <div
          className="pointer-events-none absolute bottom-0 z-[75] overflow-visible"
          style={{ left: sidebarW, width: timelineW, height: 0 }}
        >
          <LiveMomentHeaderDot x={todayMarkerX} isViewingToday={isViewingToday} />
        </div>
      ) : null}
      <CalendarHorizontalSeparator layer="header" />
    </div>
  )
}
