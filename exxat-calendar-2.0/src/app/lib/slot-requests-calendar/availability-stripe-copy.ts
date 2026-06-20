import type { ApprovalObjectCluster } from "./approval-object-cluster"
import type { ClusterDecisionMeta } from "./cluster-decision-meta"
import { abbreviateSchool, clusterHasGoldPartner } from "./approval-timeline-density"
import type { MedStarScenario } from "../medstar-data/types"
import { formatScenarioDateSpan } from "../medstar-real/adapter"
import {
  formatLocationRibbonHeader,
  formatRibbonStats,
  formatRibbonWorkHeader,
  formatSchoolCompetition,
  formatSlotsRequestedHelp,
  formatStripeDecisionSignal,
  formatStripeSubheader,
} from "./coordinator-copy"
import {
  type CalendarGroupByMode,
  viewByRibbonEntityLabel,
} from "./calendar-grouping"

export interface AvailabilityStripeCopy {
  header: string | null
  subheader: string | null
  demandSignal: string | null
  ariaLabel: string
  slotsAvailable: number | null
  requestCount: number
  schoolCount: number
  dateRange: string | null
  topSchools: string[]
  awaitingDecisionCount: number | null
  slotsRequested: number | null
  slotsApproved: number | null
  shiftCount: number | null
  /** Primary ribbon line — work item inside the active View By grouping. */
  stripePrimary: string | null
  /** Secondary ribbon line — queue + placement volume for this cluster. */
  stripeSecondary: string | null
  /** Show gold partner marker on the ribbon surface. */
  hasGoldPartner: boolean
}

function awaitingCount(cluster: ApprovalObjectCluster): number {
  const mix = cluster.decisionMeta?.statusMix
  if (mix) return mix.pending + mix.review
  return cluster.placements.filter(
    (p) => p.status === "Request Pending" || p.status === "Review",
  ).length
}

function resolveSlotsAvailable(
  decisionMeta: ClusterDecisionMeta | undefined,
  scenario?: MedStarScenario,
): number | null {
  if (decisionMeta?.cap != null) return decisionMeta.cap
  if (scenario?.approvedSlotsTotal != null && scenario.requestedSlotsTotal != null) {
    const open = scenario.approvedSlotsTotal - scenario.requestedSlotsTotal
    if (open > 0) return open
  }
  return null
}

function resolveSlotsRequested(
  cluster: ApprovalObjectCluster,
  decisionMeta: ClusterDecisionMeta | undefined,
  scenario?: MedStarScenario,
): number | null {
  if (scenario?.requestedSlotsTotal != null && scenario.requestedSlotsTotal > 0) {
    return scenario.requestedSlotsTotal
  }
  if (decisionMeta?.totalSlotDemand != null && decisionMeta.totalSlotDemand > 0) {
    return decisionMeta.totalSlotDemand
  }
  const sum = cluster.placements.reduce((total, p) => {
    if (p.status === "Declined" || p.status === "Canceled") return total
    return total + p.requestedSlots
  }, 0)
  return sum > 0 ? sum : null
}

function resolveHeader(
  cluster: ApprovalObjectCluster,
  scenario?: MedStarScenario,
): string | null {
  if (scenario?.location?.trim()) return scenario.location
  const placement = cluster.placements[0]
  const avail = placement?.availabilityName?.trim()
  if (avail && avail !== "—") return avail
  const ctx = scenario?.availabilityContext?.[0]?.trim()
  if (ctx) return ctx
  const footprint = cluster.decisionMeta?.footprintLabel ?? cluster.footprintLabel
  return footprint?.trim() || null
}

function countShifts(
  cluster: ApprovalObjectCluster,
  scenario?: MedStarScenario,
): number | null {
  const shifts = new Set(
    cluster.placements
      .map((p) => p.requestedShifts)
      .filter((s) => s && s !== "—"),
  )
  if (shifts.size > 0) return shifts.size
  if (scenario?.shiftName) return 1
  return null
}

function resolveDateRange(
  cluster: ApprovalObjectCluster,
  scenario?: MedStarScenario,
): string | null {
  if (scenario?.earliestStart && scenario?.latestEnd) {
    return formatScenarioDateSpan(scenario)
  }
  const p = cluster.placements[0]
  const duration = p?.requestedDuration?.trim()
  if (duration && duration !== "—") return duration
  return null
}

function ribbonEntityFallback(
  mode: CalendarGroupByMode,
  decisionMeta: ClusterDecisionMeta | undefined,
): string | null {
  if (!decisionMeta) return null
  if (mode === "location") return decisionMeta.discipline?.trim() || null
  if (mode === "discipline" || mode === "availability") {
    return decisionMeta.locationName?.trim() || null
  }
  return null
}

function labelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function buildViewByStripeLines(
  mode: CalendarGroupByMode,
  sidebar: NonNullable<NonNullable<Parameters<typeof buildAvailabilityStripeCopy>[1]>["sidebarContext"]>,
  requestCount: number,
  slotsRequested: number | null,
  decisionMeta: ClusterDecisionMeta | undefined,
): { stripePrimary: string | null; stripeSecondary: string | null } {
  if (mode === "location") {
    return {
      stripePrimary: formatLocationRibbonHeader(requestCount),
      stripeSecondary: formatSlotsRequestedHelp(slotsRequested),
    }
  }

  let entity =
    viewByRibbonEntityLabel(mode, sidebar.rowLabel) ??
    ribbonEntityFallback(mode, decisionMeta)

  if (entity && labelsMatch(entity, sidebar.parentLabel)) {
    entity = ribbonEntityFallback(mode, decisionMeta)
  }

  const stats = formatRibbonStats(requestCount, slotsRequested)

  if (entity) {
    return {
      stripePrimary: formatRibbonWorkHeader(mode, entity),
      stripeSecondary: stats,
    }
  }

  return { stripePrimary: stats, stripeSecondary: null }
}

export function buildAvailabilityStripeCopy(
  cluster: ApprovalObjectCluster,
  options?: {
    scenario?: MedStarScenario
    decisionMeta?: ClusterDecisionMeta
    sidebarContext?: {
      rowLabel?: string
      parentLabel?: string
      groupBy?: CalendarGroupByMode
    }
  },
): AvailabilityStripeCopy {
  const decisionMeta = options?.decisionMeta ?? cluster.decisionMeta
  const scenario = options?.scenario
  const requestCount = cluster.stats.requestCount
  const schoolCount = scenario?.schoolCount ?? cluster.stats.schoolCount
  const slotsAvailable = resolveSlotsAvailable(decisionMeta, scenario)
  const slotsRequested = resolveSlotsRequested(cluster, decisionMeta, scenario)
  const awaiting = awaitingCount(cluster)

  const subheader = formatStripeSubheader(slotsRequested, requestCount)

  let demandSignal: string | null = formatStripeDecisionSignal(awaiting, requestCount)
  if (!demandSignal) {
    demandSignal = formatSchoolCompetition(schoolCount)
  }

  const topSchools = (scenario?.schools ?? cluster.stats.schoolBreakdown.map((s) => s.schoolShort))
    .slice(0, 3)
    .map((s) => abbreviateSchool(s, 28))

  const header = resolveHeader(cluster, scenario)
  const dateRange = resolveDateRange(cluster, scenario)
  const shiftCount = countShifts(cluster, scenario)
  const slotsApproved = scenario?.approvedSlotsTotal ?? null

  const sidebar = options?.sidebarContext
  const mode = sidebar?.groupBy

  let stripePrimary: string | null
  let stripeSecondary: string | null

  if (
    sidebar &&
    mode &&
    (mode === "location" || mode === "discipline" || mode === "availability")
  ) {
    ;({ stripePrimary, stripeSecondary } = buildViewByStripeLines(
      mode,
      sidebar,
      requestCount,
      slotsRequested,
      decisionMeta,
    ))
  } else {
    const legacyHeader = header ?? dateRange
    stripePrimary = legacyHeader ?? subheader
    stripeSecondary = legacyHeader && subheader ? subheader : null
  }

  const ariaParts = [
    stripePrimary,
    stripeSecondary,
    clusterHasGoldPartner(cluster) ? "Includes gold partner school" : null,
    "Click to view requests.",
  ].filter(Boolean)

  return {
    header,
    subheader,
    demandSignal,
    ariaLabel: ariaParts.join(". "),
    slotsAvailable,
    requestCount,
    schoolCount,
    dateRange,
    topSchools,
    awaitingDecisionCount: awaiting > 0 ? awaiting : null,
    slotsRequested,
    slotsApproved,
    shiftCount,
    stripePrimary,
    stripeSecondary,
    hasGoldPartner: clusterHasGoldPartner(cluster),
  }
}
