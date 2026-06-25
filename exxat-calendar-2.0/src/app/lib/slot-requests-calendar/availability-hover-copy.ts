import type { ApprovalObjectCluster } from "./approval-object-cluster"
import { abbreviateSchool, isGoldPartner } from "./approval-timeline-density"
import type { ClusterDecisionMeta } from "./cluster-decision-meta"
import type { WeekdayCode } from "./decision-engine/decision-types"
import {
  extractShiftTimeWindow,
  normalizeShiftBucket,
  parseWeekdays,
  shiftLabel,
} from "./decision-engine/schedule-footprint"
import type { MedStarScenario } from "../medstar-data/types"
import { formatScenarioDateSpan } from "../medstar-real/adapter"
import type { CalendarGroupByMode } from "./calendar-grouping"
import {
  formatSchoolCompetition,
  formatStripeDecisionSignal,
} from "./coordinator-copy"
import { STATUS_LABEL } from "./constants"
import type { SlotStatus } from "./types"

export const HOVER_SCHOOL_PREVIEW_LIMIT = 6

export interface HoverSchoolChip {
  name: string
  gold: boolean
  requestCount: number
}

export interface AvailabilityHoverCopy {
  /** Primary line — school (single) or queue summary (multi). */
  headline: string
  /** Parent grouping the coordinator already selected (breadcrumb only). */
  contextLabel: string | null
  /** Prominent location for hierarchy block (c). */
  locationName: string
  /** Footprint / shift secondary line under location. */
  footprintLine: string | null
  dateRange: string | null
  /** Scan signal — status, review queue, or competition. */
  signalLine: string | null
  signalStatus: SlotStatus | null
  actionLabel: string
  /** Total slot requests in cluster (a). */
  requestCount: number
  /** Human label e.g. "16 slot requests". */
  requestCountLabel: string
  groupRequestCount: number
  individualRequestCount: number
  showGroupedBadge: boolean
  showIndividualBadge: boolean
  /** Week + shift detail for a single slot request preview. */
  singleFootprint: {
    weekdays: WeekdayCode[]
    shiftTitle: string
    shiftTiming: string | null
  } | null
  overlapGroupSize: number
  slotsRequested: number | null
  schoolCount: number
  schoolCountLabel: string
  schools: HoverSchoolChip[]
  moreSchools: number
}

function labelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function resolveContextLabel(sidebar?: { parentLabel?: string; rowLabel?: string }): string | null {
  const parent = sidebar?.parentLabel?.trim()
  const row = sidebar?.rowLabel?.trim()
  if (!parent) return null
  if (row && labelsMatch(parent, row)) return parent
  if (row) return `${parent} · ${row}`
  return parent
}

function resolveLocationName(
  cluster: ApprovalObjectCluster,
  decisionMeta: ClusterDecisionMeta | undefined,
  sidebar?: { parentLabel?: string; rowLabel?: string },
): string {
  const fromMeta = decisionMeta?.locationName?.trim()
  if (fromMeta) return fromMeta
  const fromPlacement = cluster.placements[0]?.locationName?.trim()
  if (fromPlacement) return fromPlacement
  const parent = sidebar?.parentLabel?.trim()
  if (parent) return parent
  const row = sidebar?.rowLabel?.trim()
  if (row) return row
  return "Location"
}

function resolveFootprintLine(
  cluster: ApprovalObjectCluster,
  decisionMeta: ClusterDecisionMeta | undefined,
): string | null {
  const label = decisionMeta?.footprintLabel?.trim() || cluster.footprintLabel?.trim()
  if (!label) return null
  const shift = decisionMeta?.shiftLabel?.trim()
  if (shift && !label.toLowerCase().includes(shift.toLowerCase())) {
    return `${label} · ${shift}`
  }
  return label
}

function resolveDateRange(
  cluster: ApprovalObjectCluster,
  scenario?: MedStarScenario,
): string | null {
  if (scenario?.earliestStart && scenario?.latestEnd) {
    return formatScenarioDateSpan(scenario)
  }
  const duration = cluster.placements[0]?.requestedDuration?.trim()
  if (duration && duration !== "—") return duration
  return null
}

function resolveSlotsRequested(
  cluster: ApprovalObjectCluster,
  decisionMeta: ClusterDecisionMeta | undefined,
  scenario?: MedStarScenario,
): number | null {
  if (decisionMeta?.totalSlotDemand != null && decisionMeta.totalSlotDemand > 0) {
    return decisionMeta.totalSlotDemand
  }
  const sum = cluster.placements.reduce((total, p) => {
    if (p.status === "Declined" || p.status === "Canceled") return total
    return total + p.requestedSlots
  }, 0)
  if (sum > 0) return sum
  if (scenario?.requestedSlotsTotal != null && scenario.requestedSlotsTotal > 0) {
    return scenario.requestedSlotsTotal
  }
  return null
}

function awaitingCount(cluster: ApprovalObjectCluster): number {
  const mix = cluster.decisionMeta?.statusMix
  if (mix) return mix.pending + mix.review
  return cluster.placements.filter(
    (p) => p.status === "Request Pending" || p.status === "Review",
  ).length
}

function resolveSingleFootprint(
  cluster: ApprovalObjectCluster,
): AvailabilityHoverCopy["singleFootprint"] {
  if (cluster.stats.requestCount !== 1) return null
  const placement = cluster.placements[0]
  if (!placement) return null

  const weekdays = parseWeekdays(placement.requestedDaysOfWeek)
  const shiftRaw = placement.requestedShifts.trim()
  const shiftTitle =
    shiftRaw || shiftLabel(normalizeShiftBucket(placement.requestedShifts))
  const shiftTiming = extractShiftTimeWindow(placement.requestedShifts)

  return { weekdays, shiftTitle, shiftTiming }
}

function resolveRequestTypeCounts(cluster: ApprovalObjectCluster): {
  groupRequestCount: number
  individualRequestCount: number
} {
  let groupRequestCount = 0
  let individualRequestCount = 0
  for (const placement of cluster.placements) {
    if (placement.experienceType === "Group") groupRequestCount += 1
    else individualRequestCount += 1
  }
  return { groupRequestCount, individualRequestCount }
}

function buildSchoolChips(
  cluster: ApprovalObjectCluster,
  scenario: MedStarScenario | undefined,
  limit: number,
): { schools: HoverSchoolChip[]; schoolCount: number; moreSchools: number } {
  const breakdown = cluster.stats.schoolBreakdown
  if (breakdown.length > 0) {
    const sorted = [...breakdown].sort((a, b) => {
      if (a.gold !== b.gold) return a.gold ? -1 : 1
      return b.count - a.count
    })
    const schoolCount = sorted.length
    const schools = sorted.slice(0, limit).map((s) => ({
      name: s.schoolShort.trim() || abbreviateSchool(s.schoolShort, 28),
      gold: s.gold,
      requestCount: s.count,
    }))
    return { schools, schoolCount, moreSchools: Math.max(0, schoolCount - limit) }
  }

  const raw = scenario?.schools ?? []
  const seen = new Set<string>()
  const unique: HoverSchoolChip[] = []
  for (const school of raw) {
    const key = school.trim()
    if (!key || seen.has(key.toLowerCase())) continue
    seen.add(key.toLowerCase())
    unique.push({
      name: key,
      gold: isGoldPartner({ school: key, partnerCategory: "" }),
      requestCount: 1,
    })
  }
  unique.sort((a, b) => {
    if (a.gold !== b.gold) return a.gold ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  const schoolCount = scenario?.schoolCount ?? cluster.stats.schoolCount
  return {
    schools: unique.slice(0, limit),
    schoolCount,
    moreSchools: Math.max(0, schoolCount - unique.length),
  }
}

function resolveHeadline(
  cluster: ApprovalObjectCluster,
  slotsRequested: number | null,
): string {
  const { requestCount, schoolCount } = cluster.stats
  if (requestCount === 1) {
    return cluster.placements[0]?.schoolShort?.trim() || "Slot request"
  }
  const slotPart =
    slotsRequested != null && slotsRequested > 0
      ? ` · ${slotsRequested} slot${slotsRequested === 1 ? "" : "s"}`
      : ""
  if (schoolCount > 1) {
    return `${requestCount} requests · ${schoolCount} schools${slotPart}`
  }
  return `${requestCount} requests${slotPart}`
}

function resolveSignal(
  cluster: ApprovalObjectCluster,
): { line: string | null; status: SlotStatus | null } {
  const awaiting = awaitingCount(cluster)
  const queueSignal = formatStripeDecisionSignal(awaiting, cluster.stats.requestCount)
  if (queueSignal) return { line: queueSignal, status: "Review" }

  const competition = formatSchoolCompetition(cluster.stats.schoolCount)
  if (competition) return { line: competition, status: null }

  if (cluster.stats.requestCount === 1) {
    const status = cluster.placements[0]?.status ?? "Review"
    return { line: STATUS_LABEL[status], status }
  }

  return { line: null, status: null }
}

function resolveActionLabel(cluster: ApprovalObjectCluster): string {
  const n = cluster.stats.requestCount
  if (n === 1) {
    const status = cluster.placements[0]?.status
    if (status === "Request Pending" || status === "Review") return "Review request"
    return "View request"
  }
  return `Browse ${n} requests`
}

function requestCountLabel(n: number): string {
  return `${n} slot request${n === 1 ? "" : "s"}`
}

function schoolCountLabel(n: number): string {
  return `${n} school${n === 1 ? "" : "s"}`
}

/** Estimate card height for viewport placement — avoids clipping / internal scroll. */
export function estimateAvailabilityHoverHeight(copy: AvailabilityHoverCopy): number {
  const statsBlock = 118
  const footprintBlock = copy.singleFootprint ? 72 : 0
  const locationBlock =
    72 +
    (copy.singleFootprint ? 0 : copy.footprintLine ? 16 : 0) +
    (copy.dateRange ? 16 : 0) +
    (copy.requestCount === 1 && copy.schools[0] ? 28 : 0)
  const footer = 52
  const badgeCount =
    (copy.showGroupedBadge ? 1 : 0) + (copy.showIndividualBadge ? 1 : 0)
  const badgeRow = badgeCount > 0 ? 24 + (badgeCount > 1 ? 4 : 0) : 0

  if (copy.schoolCount <= 1 && copy.schools.length <= 1 && copy.requestCount === 1) {
    return statsBlock + badgeRow + locationBlock + footprintBlock + footer + 16
  }

  const schoolHeader = 28
  const rows = copy.schools.length
  const moreRow = copy.moreSchools > 0 ? 24 : 0
  return statsBlock + badgeRow + locationBlock + schoolHeader + rows * 30 + moreRow + footer + 32
}

export function buildAvailabilityHoverCopy(
  cluster: ApprovalObjectCluster,
  options?: {
    scenario?: MedStarScenario
    decisionMeta?: ClusterDecisionMeta
    sidebarContext?: {
      rowLabel?: string
      parentLabel?: string
      groupBy?: CalendarGroupByMode
    }
    overlapGroupSize?: number
  },
): AvailabilityHoverCopy {
  const decisionMeta = options?.decisionMeta ?? cluster.decisionMeta
  const scenario = options?.scenario
  const requestCount = cluster.stats.requestCount
  const slotsRequested = resolveSlotsRequested(cluster, decisionMeta, scenario)
  const { schools, schoolCount, moreSchools } = buildSchoolChips(
    cluster,
    scenario,
    HOVER_SCHOOL_PREVIEW_LIMIT,
  )
  const signal = resolveSignal(cluster)
  const overlapGroupSize = options?.overlapGroupSize ?? 0
  const { groupRequestCount, individualRequestCount } = resolveRequestTypeCounts(cluster)
  const showGroupedBadge = groupRequestCount > 0
  const showIndividualBadge = individualRequestCount > 0
  const singleFootprint = resolveSingleFootprint(cluster)

  return {
    headline: resolveHeadline(cluster, slotsRequested),
    contextLabel: resolveContextLabel(options?.sidebarContext),
    locationName: resolveLocationName(cluster, decisionMeta, options?.sidebarContext),
    footprintLine: resolveFootprintLine(cluster, decisionMeta),
    dateRange: resolveDateRange(cluster, scenario),
    signalLine: overlapGroupSize > 1 ? null : signal.line,
    signalStatus: signal.status,
    actionLabel: resolveActionLabel(cluster),
    requestCount,
    requestCountLabel: requestCountLabel(requestCount),
    groupRequestCount,
    individualRequestCount,
    showGroupedBadge,
    showIndividualBadge,
    singleFootprint,
    overlapGroupSize,
    slotsRequested,
    schoolCount,
    schoolCountLabel: schoolCountLabel(schoolCount),
    schools,
    moreSchools,
  }
}
