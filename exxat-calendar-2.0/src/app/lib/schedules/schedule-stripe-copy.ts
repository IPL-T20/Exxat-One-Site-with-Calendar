import type { ApprovalObjectCluster } from "../slot-requests-calendar/approval-object-cluster"
import type { CalendarGroupByMode } from "../slot-requests-calendar/calendar-grouping"
import { viewByRibbonEntityLabel } from "../slot-requests-calendar/calendar-grouping"
import type { AvailabilityStripeCopy } from "../slot-requests-calendar/availability-stripe-copy"
import type { Placement } from "../slot-requests-calendar/types"
import {
  formatScheduleBarSpan,
  resolveScheduleBarRhythm,
  scheduleRhythmAriaSummary,
  scheduleRhythmSectionLabel,
  type ScheduleBarRhythm,
} from "./schedule-bar-rhythm"
import { scheduleStripeSignal } from "./schedule-stripe-signal"
import type { FontAwesomeIconName } from "../../components/font-awesome-icon"
import {
  AT_RISK_REASON_LABELS,
  getScheduleAtRiskReasons,
} from "./schedules-calendar-lens"
import type { ScheduleRecord } from "./types"

function scheduleStatusLabel(status: Placement["status"]): string {
  switch (status) {
    case "Approved":
      return "Confirmed"
    case "Review":
      return "Not confirmed"
    case "Request Pending":
      return "To be scheduled"
    case "Canceled":
      return "Cancelled"
    default:
      return status
  }
}

function onboardingLabel(partnerCategory: string | undefined): string | null {
  if (!partnerCategory?.trim()) return null
  return partnerCategory
}

function scheduleEntityLabel(placement: Placement): string {
  if (placement.schoolShort?.trim()) {
    return placement.schoolShort.trim()
  }
  if (placement.experienceType === "Group") {
    return placement.school?.trim() ? `Group · ${placement.school}` : "Group schedule"
  }
  return placement.school?.trim() || "Schedule student"
}

function primaryLine(placement: Placement, count: number): string {
  if (count > 1) {
    return `${count} schedules`
  }
  return scheduleEntityLabel(placement)
}

function secondaryLine(placement: Placement, count: number): string | null {
  const status = scheduleStatusLabel(placement.status)
  const onboarding = onboardingLabel(placement.partnerCategory)
  const shift =
    placement.requestedShifts?.trim() && placement.requestedShifts !== "—"
      ? placement.requestedShifts.split(",")[0]?.trim()
      : null

  if (count > 1) {
    const compliant = placement.status === "Approved" && onboarding === "Compliant"
    return compliant ? `${status} · on track` : `${status}${onboarding ? ` · ${onboarding}` : ""}`
  }

  const parts = [status, onboarding, shift].filter(Boolean)
  return parts.length > 0 ? parts.join(" · ") : null
}

export function buildScheduleStripeCopy(
  cluster: ApprovalObjectCluster,
  sidebarContext?: {
    rowLabel?: string
    parentLabel?: string
    groupBy?: CalendarGroupByMode
  },
): Pick<
  AvailabilityStripeCopy,
  "stripePrimary" | "stripeSecondary" | "ariaLabel" | "header" | "dateRange"
> & {
  experienceType: Placement["experienceType"]
  compactDateRange: string | null
} {
  const count = cluster.stats.requestCount
  const placement = cluster.placements[0]
  const stripePrimary = primaryLine(placement, count)
  const stripeSecondary = secondaryLine(placement, count)
  const dateRange =
    placement.requestedDuration?.trim() && placement.requestedDuration !== "—"
      ? placement.requestedDuration
      : null

  const startIso = placement.start ? isoFromDate(placement.start) : null
  const endIso = placement.end ? isoFromDate(placement.end) : null
  const compactDateRange =
    startIso && endIso ? formatScheduleBarSpan(startIso, endIso) : null

  const rhythm = count === 1 ? resolveScheduleBarRhythm(placement) : null
  const rhythmSummary = scheduleRhythmAriaSummary(rhythm)

  const entity =
    sidebarContext?.groupBy && sidebarContext.rowLabel
      ? viewByRibbonEntityLabel(sidebarContext.groupBy, sidebarContext.rowLabel)
      : null

  const ariaParts = [
    placement.experienceType,
    stripePrimary,
    stripeSecondary,
    compactDateRange ?? dateRange,
    rhythmSummary,
    entity ? `at ${entity}` : null,
    "Click to open schedule detail.",
  ].filter(Boolean)

  return {
    header: stripePrimary,
    dateRange,
    stripePrimary,
    stripeSecondary,
    experienceType: placement.experienceType,
    compactDateRange,
    ariaLabel: ariaParts.join(" "),
  }
}

function isoFromDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const HOVER_MONTH = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const

/** Hover card dates — full year on both ends: May 12, 2026 – Jul 21, 2026 */
export function formatScheduleHoverDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) => `${HOVER_MONTH[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  if (start.getTime() === end.getTime()) return fmt(start)
  return `${fmt(start)} – ${fmt(end)}`
}

function rhythmSectionLabel(rhythm: ScheduleBarRhythm): string {
  return scheduleRhythmSectionLabel(rhythm)
}

function parseShiftTimings(
  placement: Placement,
  scheduleById?: Map<string, ScheduleRecord>,
): string[] {
  const record = scheduleById?.get(placement.id)
  const raw = (record?.shift ?? placement.requestedShifts)?.trim()
  if (!raw || raw === "—") return []
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
}

export interface ScheduleHoverCopy {
  title: string | null
  contextLabel: string | null
  dateRange: string | null
  scheduleStatus: string
  onboardingStatus: string | null
  experienceType: string | null
  scheduleId: string
  atRiskReasons: string[]
  rhythm: ScheduleBarRhythm | null
  rhythmSummary: string | null
  rhythmSectionLabel: string | null
  school: string | null
  shiftTimings: string[]
  programLabel: string | null
  signalLabel: string | null
  signalIcon: FontAwesomeIconName | null
  signalIconClass: string | null
}

function collectScheduleAtRiskReasons(
  cluster: ApprovalObjectCluster,
  scheduleById?: Map<string, ScheduleRecord>,
  referenceDate?: string,
): string[] {
  if (!scheduleById || !referenceDate) return []
  const labels = new Set<string>()
  for (const placement of cluster.placements) {
    const record = scheduleById.get(placement.id)
    if (!record) continue
    for (const reason of getScheduleAtRiskReasons(record, referenceDate)) {
      labels.add(AT_RISK_REASON_LABELS[reason])
    }
  }
  return [...labels]
}

export function buildScheduleHoverCopy(
  cluster: ApprovalObjectCluster,
  options?: {
    sidebarContext?: {
      rowLabel?: string
      parentLabel?: string
      groupBy?: CalendarGroupByMode
    }
    scheduleById?: Map<string, ScheduleRecord>
    referenceDate?: string
  },
): ScheduleHoverCopy {
  const placement = cluster.placements[0]
  const count = cluster.stats.requestCount
  const sidebarContext = options?.sidebarContext
  const title =
    count > 1
      ? `${count} schedules`
      : primaryLine(placement, 1)

  const contextParts = [
    sidebarContext?.parentLabel?.trim(),
    sidebarContext?.rowLabel?.trim() && sidebarContext.rowLabel !== sidebarContext?.parentLabel
      ? sidebarContext.rowLabel
      : null,
    placement.locationName?.trim(),
    placement.discipline?.trim(),
  ].filter(Boolean)

  const uniqueContext = [...new Set(contextParts.map((p) => p!.toLowerCase()))].map((key) =>
    contextParts.find((p) => p!.toLowerCase() === key),
  )

  const rhythm = count === 1 ? resolveScheduleBarRhythm(placement) : null
  const rhythmSummary = scheduleRhythmAriaSummary(rhythm)

  const shiftTimings = parseShiftTimings(placement, options?.scheduleById)

  const school =
    placement.school?.trim() && placement.school !== "—" ? placement.school : null

  const programLabel =
    placement.discipline?.trim() || placement.programType?.trim() || null

  const signal = count === 1 ? scheduleStripeSignal(placement) : null

  const hoverDateRange =
    placement.start && placement.end
      ? formatScheduleHoverDateRange(placement.start, placement.end)
      : placement.requestedDuration?.trim() && placement.requestedDuration !== "—"
        ? placement.requestedDuration
        : null

  return {
    title,
    contextLabel: uniqueContext.length > 0 ? uniqueContext.join(" · ") : null,
    dateRange: hoverDateRange,
    scheduleStatus: scheduleStatusLabel(placement.status),
    onboardingStatus: onboardingLabel(placement.partnerCategory),
    experienceType: placement.experienceType ?? null,
    scheduleId: placement.slotRequestId ?? placement.id,
    atRiskReasons: collectScheduleAtRiskReasons(
      cluster,
      options?.scheduleById,
      options?.referenceDate,
    ),
    rhythm,
    rhythmSummary,
    rhythmSectionLabel: rhythm ? rhythmSectionLabel(rhythm) : null,
    school,
    shiftTimings,
    programLabel,
    signalLabel: signal?.shortLabel ?? null,
    signalIcon: signal?.icon ?? null,
    signalIconClass: signal?.iconClass ?? null,
  }
}
