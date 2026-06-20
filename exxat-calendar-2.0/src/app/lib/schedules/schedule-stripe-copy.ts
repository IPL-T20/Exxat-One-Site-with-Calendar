import type { ApprovalObjectCluster } from "../slot-requests-calendar/approval-object-cluster"
import type { CalendarGroupByMode } from "../slot-requests-calendar/calendar-grouping"
import { viewByRibbonEntityLabel } from "../slot-requests-calendar/calendar-grouping"
import type { AvailabilityStripeCopy } from "../slot-requests-calendar/availability-stripe-copy"
import type { Placement } from "../slot-requests-calendar/types"

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
  if (placement.experienceType === "Group") {
    return placement.schoolShort || `Group · ${placement.school}` || "Group schedule"
  }
  return placement.schoolShort || placement.school || "Schedule student"
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
): Pick<AvailabilityStripeCopy, "stripePrimary" | "stripeSecondary" | "ariaLabel" | "header" | "dateRange"> {
  const count = cluster.stats.requestCount
  const placement = cluster.placements[0]
  const stripePrimary = primaryLine(placement, count)
  const stripeSecondary = secondaryLine(placement, count)
  const dateRange =
    placement.requestedDuration?.trim() && placement.requestedDuration !== "—"
      ? placement.requestedDuration
      : null

  const entity =
    sidebarContext?.groupBy && sidebarContext.rowLabel
      ? viewByRibbonEntityLabel(sidebarContext.groupBy, sidebarContext.rowLabel)
      : null

  const ariaParts = [
    stripePrimary,
    stripeSecondary,
    dateRange,
    entity ? `at ${entity}` : null,
    "Click to open schedule detail.",
  ].filter(Boolean)

  return {
    header: stripePrimary,
    dateRange,
    stripePrimary,
    stripeSecondary,
    ariaLabel: ariaParts.join(" "),
  }
}

export interface ScheduleHoverCopy {
  title: string | null
  contextLabel: string | null
  dateRange: string | null
  scheduleStatus: string
  onboardingStatus: string | null
  experienceType: string | null
  scheduleId: string
}

export function buildScheduleHoverCopy(
  cluster: ApprovalObjectCluster,
  sidebarContext?: {
    rowLabel?: string
    parentLabel?: string
    groupBy?: CalendarGroupByMode
  },
): ScheduleHoverCopy {
  const placement = cluster.placements[0]
  const count = cluster.stats.requestCount
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

  return {
    title,
    contextLabel: uniqueContext.length > 0 ? uniqueContext.join(" · ") : null,
    dateRange:
      placement.requestedDuration?.trim() && placement.requestedDuration !== "—"
        ? placement.requestedDuration
        : null,
    scheduleStatus: scheduleStatusLabel(placement.status),
    onboardingStatus: onboardingLabel(placement.partnerCategory),
    experienceType: placement.experienceType ?? null,
    scheduleId: placement.slotRequestId ?? placement.id,
  }
}
