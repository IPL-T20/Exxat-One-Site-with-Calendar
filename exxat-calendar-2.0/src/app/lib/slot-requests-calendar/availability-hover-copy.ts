import type { ApprovalObjectCluster } from "./approval-object-cluster"
import { abbreviateSchool, isGoldPartner } from "./approval-timeline-density"
import type { ClusterDecisionMeta } from "./cluster-decision-meta"
import type { MedStarScenario } from "../medstar-data/types"
import { formatScenarioDateSpan } from "../medstar-real/adapter"
import type { CalendarGroupByMode } from "./calendar-grouping"
import { viewByRibbonEntityLabel } from "./calendar-grouping"

export interface HoverSchoolChip {
  name: string
  gold: boolean
  requestCount: number
}

export interface AvailabilityHoverCopy {
  /** Work focus — the nested entity inside the sidebar grouping. */
  title: string | null
  /** Parent grouping the coordinator already selected (breadcrumb only). */
  contextLabel: string | null
  dateRange: string | null
  requestCount: number
  slotsRequested: number | null
  schoolCount: number
  schools: HoverSchoolChip[]
  moreSchools: number
}

function labelsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a?.trim() || !b?.trim()) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function resolveTitle(
  mode: CalendarGroupByMode | undefined,
  sidebar: { rowLabel?: string; parentLabel?: string } | undefined,
  decisionMeta: ClusterDecisionMeta | undefined,
  fallbackHeader: string | null,
): string | null {
  if (mode && sidebar?.rowLabel?.trim()) {
    const fromRow = viewByRibbonEntityLabel(mode, sidebar.rowLabel)
    if (fromRow) return fromRow
  }
  if (decisionMeta) {
    if (mode === "location" && decisionMeta.discipline?.trim()) return decisionMeta.discipline.trim()
    if ((mode === "discipline" || mode === "availability") && decisionMeta.locationName?.trim()) {
      return decisionMeta.locationName.trim()
    }
  }
  return fallbackHeader?.trim() || null
}

function resolveContextLabel(
  title: string | null,
  sidebar: { parentLabel?: string } | undefined,
): string | null {
  const parent = sidebar?.parentLabel?.trim()
  if (!parent || labelsMatch(parent, title)) return null
  return parent
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
      name: abbreviateSchool(s.schoolShort, 22),
      gold: s.gold,
      requestCount: s.count,
    }))
    return { schools, schoolCount, moreSchools: Math.max(0, schoolCount - limit) }
  }

  const raw = scenario?.schools ?? cluster.stats.schoolBreakdown.map((s) => s.schoolShort)
  const seen = new Set<string>()
  const unique: HoverSchoolChip[] = []
  for (const school of raw) {
    const key = school.trim()
    if (!key || seen.has(key.toLowerCase())) continue
    seen.add(key.toLowerCase())
    unique.push({
      name: abbreviateSchool(key, 22),
      gold: isGoldPartner(key),
      requestCount: 1,
    })
    if (unique.length >= limit) break
  }
  const schoolCount = scenario?.schoolCount ?? cluster.stats.schoolCount
  return {
    schools: unique,
    schoolCount,
    moreSchools: Math.max(0, schoolCount - unique.length),
  }
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
    /** Location header from scenario — fallback only. */
    fallbackHeader?: string | null
  },
): AvailabilityHoverCopy {
  const decisionMeta = options?.decisionMeta ?? cluster.decisionMeta
  const scenario = options?.scenario
  const sidebar = options?.sidebarContext
  const mode = sidebar?.groupBy

  const title = resolveTitle(mode, sidebar, decisionMeta, options?.fallbackHeader ?? null)
  const contextLabel = resolveContextLabel(title, sidebar)
  const dateRange = resolveDateRange(cluster, scenario)
  const requestCount = cluster.stats.requestCount
  const slotsRequested = resolveSlotsRequested(cluster, decisionMeta, scenario)
  const { schools, schoolCount, moreSchools } = buildSchoolChips(cluster, scenario, 3)

  return {
    title,
    contextLabel,
    dateRange,
    requestCount,
    slotsRequested,
    schoolCount,
    schools,
    moreSchools,
  }
}
