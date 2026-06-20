import type { CalendarZoom, SlotStatus } from "./types"

export const MS_DAY = 86_400_000

export const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

/** Reference date for mock demo KPIs / queue age (dataset anchor — not the live marker). */
export const CALENDAR_TODAY = new Date(2026, 5, 5)

/** IANA timezone for the live today marker, header badge, and scroll-to-today. */
export const CALENDAR_TIMEZONE = "Asia/Kolkata"

export const TIMELINE_START = new Date(2024, 0, 1)
export const TIMELINE_END = new Date(2028, 0, 1)
export const TIMELINE_DAYS = Math.round(
  (Date.UTC(2028, 0, 1) - Date.UTC(2024, 0, 1)) / MS_DAY,
)

export const YEAR_FIRST = 2024
export const YEAR_COUNT = 5
export const YEAR_MONTHS = YEAR_COUNT * 12

export const PX_PER_DAY: Record<Exclude<CalendarZoom, "year">, number> = {
  day: 60,
  week: 12,
  month: 4,
}

/** Default visible span per zoom — timeline scales to fit the viewport. */
export const DAY_VIEWPORT_DAYS = 3
/** 1 day prior + 7-day week + 1 day after — week centered in viewport. */
export const WEEK_VIEWPORT_DAYS = 9
/** New year view — 12-month core window centered on the anchor month. */
export const YEAR_VIEWPORT_MONTHS = 12
/** One full month peek before/after the 12-month core (last month of prior year / first of next). */
export const YEAR_VIEWPORT_BUFFER_MONTHS = 1
/** New month view — one day peek before/after the anchor month (adjacent month dates). */
export const MONTH_VIEWPORT_BUFFER_DAYS = 1

export const SIDEBAR_W = 280
/** Horizontal inset for sidebar header/rows — toolbar view control uses the same. */
export const CALENDAR_SIDEBAR_INSET = "px-3"
/** Label stack height — day/week/month/year share the same total header height. */
export const HEADER_H = 48
/** Timeline header row — label stack + bottom rail (hour rail in day view, spacer elsewhere). */
export const HEADER_DAY_H = 64
export const DAY_HEADER_HOUR_RAIL_H = 16
/** Hour markers on the day-view rail (24h clock; column edges imply 0 / 24). */
export const DAY_HEADER_HOUR_MARKERS = [3, 6, 9, 12, 15, 18, 21] as const
/** @deprecated Multi-row header tiers removed — header is a single label row. */
export const HEADER_YEAR_ROW_H = 0
export const HEADER_MONTH_ROW_H = HEADER_H
export const HEADER_WEEK_ROW_H = HEADER_H
export const LOCATION_ROW_H = 52
/** Shared grid edges — sidebar and timeline use the same tokens. */
export const CALENDAR_SIDEBAR_EDGE = "border-r border-border"
/** Row separator — apply on inner content layers only (live-now line paints above). */
export const CALENDAR_ROW_BORDER = "border-b border-border"
export const CALENDAR_LIVE_MOMENT_LINE =
  "absolute bottom-0 w-px -translate-x-1/2 pointer-events-none"
/**
 * Vertical column dividers — 1px strip at the column's right edge.
 * Uses a child element (not border-*) so header + body share width without drift.
 */
export const CALENDAR_COLUMN_DIVIDER_EDGE =
  "pointer-events-none absolute inset-y-0 right-0 z-[2] w-px bg-border"
/** Synced hover across sidebar + timeline in a data row. */
export const CALENDAR_ROW_HOVER =
  "transition-colors duration-150 group-hover/calrow:bg-accent/50 group-hover/calloc:bg-accent/50"
export const CALENDAR_GROUP_BAND = "bg-accent/30"
/** Sticky sidebar fills — opaque so horizontal scroll does not bleed grid/today lines through. */
export const CALENDAR_SIDEBAR_GROUP_BAND =
  "bg-[color-mix(in_oklch,var(--accent)_30%,var(--background))]"
export const CALENDAR_SIDEBAR_ROW_HOVER =
  "transition-colors duration-150 group-hover/calrow:bg-[color-mix(in_oklch,var(--accent)_50%,var(--background))] group-hover/calloc:bg-[color-mix(in_oklch,var(--accent)_50%,var(--background))]"
export const CALENDAR_SIDEBAR_BUTTON_HOVER =
  "hover:bg-[color-mix(in_oklch,var(--accent)_60%,var(--background))] active:bg-[color-mix(in_oklch,var(--accent)_70%,var(--background))]"
/** Today — body hairline only; toolbar owns the “jump to today” action. */
export const CALENDAR_TODAY_SURFACE = "bg-chart-1"
export const CALENDAR_TODAY_ON_SURFACE = "text-white"
export const CALENDAR_TODAY_COLUMN_BG = "bg-chart-1/6"
/** Navigator focus period — body column wash when Focus period is on. */
export const CALENDAR_FOCUS_PERIOD_COLUMN_BG = "bg-brand/10"
export const CALENDAR_FOCUS_PERIOD_DIM_BG = "bg-muted/45"
/** Live-now dot — shared by timeline hairline and toolbar Today control. */
export const CALENDAR_LIVE_DOT_SIZE_PX = 6
export const CALENDAR_LIVE_DOT =
  "size-1.5 shrink-0 rounded-full bg-chart-1 shadow-[0_0_0_2px_color-mix(in_oklch,var(--background)_85%,transparent)]"
/** Toolbar period label — shadcn Button scale (14px / medium). */
export const CALENDAR_TOOLBAR_PERIOD_LABEL = "text-sm font-medium tabular-nums text-foreground"
/** Toolbar Today — user is already on the live/current period. */
export const CALENDAR_TOOLBAR_TODAY_CURRENT = "bg-muted/60 text-foreground"
/** Toolbar Today — off live view; orange tint invites jump to now. */
export const CALENDAR_TOOLBAR_TODAY_AWAY =
  "border-chart-1/25 bg-chart-1/6 text-foreground hover:bg-chart-1/10"
/**
 * Live-now body hairline — above column dividers, clipped to the timeline band.
 * Stays below sticky sidebar ({@link CALENDAR_SIDEBAR_STICKY_Z}) so scroll does not
 * paint the line over location labels.
 */
export const CALENDAR_LIVE_MOMENT_LAYER_Z = 8
export const CALENDAR_LIVE_MOMENT_Z = "z-[8]"
/** Sticky sidebar rows — opaque mask over horizontally scrolling grid lines. */
export const CALENDAR_SIDEBAR_STICKY_Z = 35
/** Sticky date header + hour rail — below hover cards, above timeline body. */
export const CALENDAR_STICKY_HEADER_Z = 510
/** Schedule / request hover preview — must paint above {@link CALENDAR_STICKY_HEADER_Z}. */
export const CALENDAR_HOVER_LAYER_Z = 520
/** Header column labels */
export const CALENDAR_HEADER_LABEL = "text-xs font-medium tabular-nums text-muted-foreground"
export const CALENDAR_HEADER_LABEL_ACTIVE = "text-xs font-semibold tabular-nums text-foreground"
export const CALENDAR_HEADER_DAY_NUM = "text-sm font-medium tabular-nums text-foreground"
export const CALENDAR_HEADER_DAY_NUM_ACTIVE = "text-sm font-semibold tabular-nums text-foreground"
export const CALENDAR_HEADER_WEEKDAY = "text-[10px] font-medium text-muted-foreground"
export const CALENDAR_HEADER_CONTEXT = "text-[11px] font-medium text-muted-foreground"
/** Operations resource rows — unchanged. */
export const DISCIPLINE_ROW_H = 36
/** Approval object-timeline row height — fits dashboard cluster cards. */
export const APPROVAL_OBJECT_ROW_H = 52

export const STATUS_LABEL: Record<SlotStatus, string> = {
  Approved: "Approved",
  "Request Pending": "Pending",
  Review: "Review",
  Declined: "Declined",
  Canceled: "Canceled",
}

/** Timeline bar styling — semantic tokens + status hues (not Coda chrome). */
export const STATUS_BAR_STYLE: Record<
  SlotStatus,
  { fill: string; border: string; text: string; dashed?: boolean; opacity?: number }
> = {
  Approved: {
    fill: "var(--chart-2, #16a34a)",
    border: "color-mix(in oklch, var(--chart-2, #16a34a) 80%, black)",
    text: "#fff",
  },
  "Request Pending": {
    fill: "color-mix(in oklch, var(--chart-4, #f59e0b) 35%, transparent)",
    border: "var(--chart-4, #d97706)",
    text: "var(--foreground)",
    dashed: true,
  },
  Review: {
    fill: "color-mix(in oklch, var(--chart-3, #3b82f6) 45%, transparent)",
    border: "var(--chart-3, #2563eb)",
    text: "var(--foreground)",
    dashed: true,
  },
  Declined: {
    fill: "color-mix(in oklch, var(--destructive, #dc2626) 25%, transparent)",
    border: "var(--destructive, #dc2626)",
    text: "var(--muted-foreground)",
    opacity: 0.65,
  },
  Canceled: {
    fill: "var(--muted)",
    border: "var(--border)",
    text: "var(--muted-foreground)",
    opacity: 0.45,
  },
}

export const HEALTH_COLOR: Record<
  "healthy" | "warning" | "critical",
  string
> = {
  healthy: "var(--chart-2, #16a34a)",
  warning: "var(--chart-4, #d97706)",
  critical: "var(--destructive, #dc2626)",
}

export const LEGEND_ITEMS = [
  { status: "Approved" as SlotStatus, label: "Approved" },
  { status: "Request Pending" as SlotStatus, label: "Pending" },
  { status: "Review" as SlotStatus, label: "Review" },
  { status: "Declined" as SlotStatus, label: "Declined" },
]

/** KPI figure colors — approval workflow (triage / decision queue). */
export const APPROVAL_KPI_VALUE_COLOR: Record<
  | "pendingRequests"
  | "inReview"
  | "awaitingDecision"
  | "avgApprovalAge"
  | "expiringThisWeek",
  string
> = {
  pendingRequests: "#d97706",
  inReview: "#2563eb",
  awaitingDecision: "#7c3aed",
  avgApprovalAge: "#475569",
  expiringThisWeek: "#dc2626",
}

/** KPI figure colors — operations workflow (schedules / capacity). */
export const OPERATIONS_KPI_VALUE_COLOR: Record<
  | "approvedPlacements"
  | "scheduledStudents"
  | "capacityUsed"
  | "utilization"
  | "conflicts",
  string
> = {
  approvedPlacements: "#16a34a",
  scheduledStudents: "#0d9488",
  capacityUsed: "#475569",
  utilization: "#2563eb",
  conflicts: "#dc2626",
}

/** @deprecated Legacy shared palette — prefer workflow-specific maps above. */
export const KPI_VALUE_COLOR: Record<
  "pending" | "review" | "approved" | "capacity" | "conflicts",
  string
> = {
  pending: "#d97706",
  review: "#2563eb",
  approved: "#16a34a",
  capacity: "#475569",
  conflicts: "#dc2626",
}
