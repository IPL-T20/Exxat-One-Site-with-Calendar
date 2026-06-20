import type { ApprovalObjectCluster } from "./approval-object-cluster"
import { requestIdFromPlacement } from "./approval-timeline-density"
import type { SlotRequestRow, SlotStatus } from "./types"
import type {
  CapacityState,
  CompetitionClass,
  RequestDecisionSnapshot,
  WeekdayCode,
} from "./decision-engine/decision-types"
import { extractShiftTimeWindow } from "./decision-engine/schedule-footprint"

export interface ClusterStatusMix {
  pending: number
  review: number
  approved: number
  declined: number
  canceled: number
}

export interface ClusterDecisionMeta {
  footprintLabel: string
  footprintKey: string
  locationName: string
  discipline: string
  totalSlotDemand: number
  cap: number
  worstCompetitionClass: CompetitionClass
  capacityState: CapacityState
  shiftLabel: string
  shiftTimeWindow: string | null
  weekdays: WeekdayCode[]
  requestCount: number
  statusMix: ClusterStatusMix
  schoolCount: number
  /** Tightest headroom among cluster members if each were approved. */
  minHeadroomIfApproved: number
}

const COMPETITION_RANK: CompetitionClass[] = ["compatible", "soft", "hard", "over"]
const CAPACITY_RANK: CapacityState[] = ["open", "tight", "exhausted", "overbooked"]

function worstCompetition(classes: CompetitionClass[]): CompetitionClass {
  return classes.reduce<CompetitionClass>(
    (w, c) => (COMPETITION_RANK.indexOf(c) > COMPETITION_RANK.indexOf(w) ? c : w),
    "compatible",
  )
}

function worstCapacity(states: CapacityState[]): CapacityState {
  return states.reduce<CapacityState>(
    (w, s) => (CAPACITY_RANK.indexOf(s) > CAPACITY_RANK.indexOf(w) ? s : w),
    "open",
  )
}

function countStatuses(rows: Pick<SlotRequestRow, "status">[]): ClusterStatusMix {
  const mix: ClusterStatusMix = {
    pending: 0,
    review: 0,
    approved: 0,
    declined: 0,
    canceled: 0,
  }
  for (const row of rows) {
    switch (row.status) {
      case "Request Pending":
        mix.pending += 1
        break
      case "Review":
        mix.review += 1
        break
      case "Approved":
        mix.approved += 1
        break
      case "Declined":
        mix.declined += 1
        break
      case "Canceled":
        mix.canceled += 1
        break
      default:
        break
    }
  }
  return mix
}

function buildMetaFromSnapsAndRows(
  snaps: RequestDecisionSnapshot[],
  slotDemand: number,
  rows: Pick<SlotRequestRow, "status">[],
  footprintLabelOverride?: string,
  footprintKeyOverride?: string,
): ClusterDecisionMeta {
  const lead = snaps[0]!
  const minHeadroomIfApproved = Math.min(...snaps.map((s) => s.headroomAfterApproval))

  return {
    footprintLabel: footprintLabelOverride ?? lead.footprint.footprintLabel,
    footprintKey: footprintKeyOverride ?? lead.footprint.footprintKey,
    locationName: lead.footprint.locationName,
    discipline: lead.footprint.discipline,
    totalSlotDemand: slotDemand,
    cap: lead.cap,
    worstCompetitionClass: worstCompetition(snaps.map((s) => s.competitionClass)),
    capacityState: worstCapacity(snaps.map((s) => s.capacityState)),
    shiftLabel: lead.footprint.shiftLabel,
    shiftTimeWindow: extractShiftTimeWindow(lead.footprint.shiftRaw),
    weekdays: lead.footprint.weekdays,
    requestCount: rows.length,
    statusMix: countStatuses(rows),
    schoolCount: new Set(snaps.map((s) => s.footprint.school)).size,
    minHeadroomIfApproved,
  }
}

export function enrichClusterDecisionMeta(
  cluster: ApprovalObjectCluster,
  getDecision: (id: string) => RequestDecisionSnapshot | undefined,
): ClusterDecisionMeta | undefined {
  const snaps = cluster.placements
    .map((p) => getDecision(requestIdFromPlacement(p)))
    .filter(Boolean) as RequestDecisionSnapshot[]

  if (snaps.length === 0) return undefined

  const totalSlotDemand = cluster.placements.reduce((sum, p) => {
    if (p.status === "Declined" || p.status === "Canceled") return sum
    return sum + p.requestedSlots
  }, 0)

  const rows = cluster.placements.map((p) => ({ status: p.status }))

  return buildMetaFromSnapsAndRows(
    snaps,
    totalSlotDemand,
    rows,
    cluster.footprintLabel,
    cluster.footprintKey,
  )
}

export function attachClusterDecisionMeta(
  clusters: ApprovalObjectCluster[],
  getDecision: (id: string) => RequestDecisionSnapshot | undefined,
): ApprovalObjectCluster[] {
  return clusters.map((cluster) => ({
    ...cluster,
    decisionMeta: enrichClusterDecisionMeta(cluster, getDecision),
  }))
}

/** Cluster modal header from sorted request ids + slot totals from rows. */
export function buildClusterHeaderMeta(
  requestIds: string[],
  getDecision: (id: string) => RequestDecisionSnapshot | undefined,
  slotDemand: number,
  rows: Pick<SlotRequestRow, "status">[],
): ClusterDecisionMeta | undefined {
  const snaps = requestIds
    .map((id) => getDecision(id))
    .filter(Boolean) as RequestDecisionSnapshot[]
  if (snaps.length === 0) return undefined

  return buildMetaFromSnapsAndRows(snaps, slotDemand, rows)
}

/** Human-readable status mix for cluster header. */
export function formatClusterStatusMix(mix: ClusterStatusMix): string {
  const parts: string[] = []
  if (mix.pending > 0) parts.push(`Pending ${mix.pending}`)
  if (mix.review > 0) parts.push(`Review ${mix.review}`)
  if (mix.approved > 0) parts.push(`Approved ${mix.approved}`)
  if (mix.declined > 0) parts.push(`Declined ${mix.declined}`)
  if (mix.canceled > 0) parts.push(`Canceled ${mix.canceled}`)
  return parts.join(" · ")
}

/** Cluster pressure subtitle — schools + over-cap / headroom narrative. */
export function formatClusterPressureLine(meta: ClusterDecisionMeta): string {
  const schools = `${meta.schoolCount} school${meta.schoolCount === 1 ? "" : "s"}`
  if (meta.minHeadroomIfApproved < 0) {
    return `${schools} · ${Math.abs(meta.minHeadroomIfApproved)} over if all pending approve`
  }
  return `${schools} · ${meta.minHeadroomIfApproved} slots headroom (tightest request)`
}
