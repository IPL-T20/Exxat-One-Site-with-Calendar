import { CALENDAR_TODAY } from "../constants"
import { computeQueueAgeDays } from "../queue-age"
import type { LocationCapacityRecord, SlotRequestRow } from "../types"
import type {
  CompetitionGroupSnapshot,
  DecisionSnapshot,
  DisciplineRowDecisionSnapshot,
  RequestDecisionSnapshot,
  SchedulingFootprint,
  SlotStatus,
} from "./decision-types"
import {
  buildCompetitionGroupMembers,
  competitionGroupId,
  findCompetitors,
} from "./footprint-competition"
import {
  computePeakLoadForFootprint,
  deriveApprovalRisk,
  deriveCapacityState,
  deriveCompetitionClass,
  deriveFutureCapacityRisk,
  getCapForFootprint,
  headroomAfterApproval,
  remainingHeadroom,
  slotsOverCapIfApproved,
  sumSlotsByStatus,
} from "./footprint-capacity"
import {
  ACTIVE_STATUSES,
  QUEUE_STATUSES,
  compareQueuePriority,
  computePriorityScore,
  computeQueuePriority,
  computeStrategicPriority,
  isDeclinedOrCanceled,
  isGoldPartner,
  isUrgentRequest,
  isWaitlistRow,
} from "./gold-partner-policy"
import { buildSchedulingFootprint } from "./schedule-footprint"

function dominantStatus(statuses: SlotStatus[]): SlotStatus {
  const order: SlotStatus[] = [
    "Request Pending",
    "Review",
    "Approved",
    "Declined",
    "Canceled",
  ]
  for (const s of order) {
    if (statuses.includes(s)) return s
  }
  return statuses[0] ?? "Request Pending"
}

function buildCompetingSchools(
  competitors: SchedulingFootprint[],
  rowsById: Map<string, SlotRequestRow>,
): RequestDecisionSnapshot["competingSchools"] {
  const map = new Map<string, RequestDecisionSnapshot["competingSchools"][number]>()
  for (const c of competitors) {
    const row = rowsById.get(c.requestId)
    const key = c.school
    const existing = map.get(key)
    if (existing) {
      existing.requestIds.push(c.requestId)
      existing.slotDemand += c.requestedSlots
    } else {
      map.set(key, {
        school: c.school,
        schoolShort: c.schoolShort,
        requestIds: [c.requestId],
        slotDemand: c.requestedSlots,
        isGoldPartner: row ? isGoldPartner(row) : false,
        dominantStatus: c.status,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.slotDemand - a.slotDemand)
}

function findGroupIdForRequest(
  requestId: string,
  groups: CompetitionGroupSnapshot[],
): string | null {
  for (const g of groups) {
    if (g.requestIds.includes(requestId)) return g.id
  }
  return null
}

function worstClass(
  classes: RequestDecisionSnapshot["competitionClass"][],
): RequestDecisionSnapshot["competitionClass"] {
  const rank = { compatible: 0, soft: 1, hard: 2, over: 3 }
  return classes.reduce(
    (w, c) => (rank[c] > rank[w] ? c : w),
    "compatible" as RequestDecisionSnapshot["competitionClass"],
  )
}

function worstRisk(
  risks: RequestDecisionSnapshot["approvalRisk"][],
): RequestDecisionSnapshot["approvalRisk"] {
  const rank = { low: 0, medium: 1, high: 2, critical: 3 }
  return risks.reduce(
    (w, r) => (rank[r] > rank[w] ? r : w),
    "low" as RequestDecisionSnapshot["approvalRisk"],
  )
}

export function buildDecisionSnapshot(
  rows: SlotRequestRow[],
  capacityRecords: LocationCapacityRecord[],
  calendarToday: Date = CALENDAR_TODAY,
): DecisionSnapshot {
  const rowsById = new Map(rows.map((r) => [r.id, r]))
  const footprints: SchedulingFootprint[] = []
  const skippedIds: string[] = []

  for (const row of rows) {
    const fp = buildSchedulingFootprint(row)
    if (fp) footprints.push(fp)
    else skippedIds.push(row.id)
  }

  const byDiscipline = new Map<string, SchedulingFootprint[]>()
  for (const fp of footprints) {
    const list = byDiscipline.get(fp.disciplineId) ?? []
    list.push(fp)
    byDiscipline.set(fp.disciplineId, list)
  }

  const competitionGroups: CompetitionGroupSnapshot[] = []
  const rawGroups = buildCompetitionGroupMembers(footprints)

  for (const members of rawGroups) {
    if (members.length === 0) continue
    const lead = members[0]!
    const windowStart = new Date(Math.min(...members.map((m) => m.dateStart.getTime())))
    const windowEnd = new Date(Math.max(...members.map((m) => m.dateEnd.getTime())))
    const pool = byDiscipline.get(lead.disciplineId) ?? members
    const disciplineCount = new Set(pool.map((p) => p.discipline)).size
    const cap = getCapForFootprint(lead, capacityRecords, disciplineCount)
    const peaks = computePeakLoadForFootprint(lead, pool, { assumeAllQueueApproved: true })

    const approvedSlotDemand = sumSlotsByStatus(members, ["Approved"])
    const queueSlotDemand = sumSlotsByStatus(members, QUEUE_STATUSES)
    const totalSlotDemand = approvedSlotDemand + queueSlotDemand
    const schools = new Set(members.map((m) => m.school))
    const goldRequestCount = members.filter((m) => {
      const row = rowsById.get(m.requestId)
      return row ? isGoldPartner(row) : false
    }).length

    const basePeaks = computePeakLoadForFootprint(lead, pool)
    const capacityState = deriveCapacityState(
      basePeaks.peakApproved,
      basePeaks.peakDemand,
      cap,
    )
    const worstCompetitionClass =
      members.length <= 1
        ? "compatible"
        : deriveCompetitionClass(
            members.length - 1,
            basePeaks.peakApproved,
            basePeaks.peakDemand,
            cap,
          )

    competitionGroups.push({
      id: competitionGroupId(lead.footprintKey, windowStart, windowEnd),
      footprintKey: lead.footprintKey,
      footprintLabel: lead.footprintLabel,
      shiftBucket: lead.shiftBucket,
      weekdays: lead.weekdays,
      disciplineId: lead.disciplineId,
      locationId: lead.locationId,
      locationName: lead.locationName,
      discipline: lead.discipline,
      windowStart,
      windowEnd,
      requestIds: members.map((m) => m.requestId),
      cap,
      approvedSlotDemand,
      queueSlotDemand,
      totalSlotDemand,
      competingSchoolCount: schools.size,
      goldRequestCount,
      worstCompetitionClass,
      capacityState,
      approvalRisk: deriveFutureCapacityRisk(peaks.peakIfAllQueueApproved, cap, 0),
    })
  }

  const byRequestId: Record<string, RequestDecisionSnapshot> = {}

  for (const fp of footprints) {
    const row = rowsById.get(fp.requestId)!
    const pool = byDiscipline.get(fp.disciplineId) ?? [fp]
    const disciplineCount = new Set(pool.map((p) => p.discipline)).size
    const cap = getCapForFootprint(fp, capacityRecords, disciplineCount)
    const competitors = findCompetitors(fp, pool).filter((c) => c.requestId !== fp.requestId)

    const basePeaks = computePeakLoadForFootprint(fp, pool)
    const assumeApproved =
      fp.status === "Request Pending" || fp.status === "Review" ? fp.requestId : undefined
    const peaksIfApproved = computePeakLoadForFootprint(fp, pool, {
      assumeApprovedId: assumeApproved,
    })
    const peaksAllQueue = computePeakLoadForFootprint(fp, pool, {
      assumeAllQueueApproved: true,
    })

    const peakIfApproved = assumeApproved
      ? peaksIfApproved.peakDemand
      : basePeaks.peakApproved

    const competingQueueDemand = sumSlotsByStatus(competitors, QUEUE_STATUSES)
    const competingApproved = sumSlotsByStatus(competitors, ["Approved"])
    const competingSlotDemand = competingQueueDemand + competingApproved

    const competitionClass = isDeclinedOrCanceled(fp.status)
      ? "compatible"
      : deriveCompetitionClass(
          competitors.length,
          basePeaks.peakApproved,
          peakIfApproved,
          cap,
        )

    const capacityState = deriveCapacityState(
      basePeaks.peakApproved,
      basePeaks.peakDemand,
      cap,
    )

    const daysUntilStart = Math.ceil(
      (fp.dateStart.getTime() - calendarToday.getTime()) / 86_400_000,
    )
    const gold = isGoldPartner(row)
    const waitlist = isWaitlistRow(row)
    const urgent = isUrgentRequest(fp, calendarToday)
    const queueAge = computeQueueAgeDays(fp.requestedDate, calendarToday)

    const futureCapacityRisk = deriveFutureCapacityRisk(
      peaksAllQueue.peakIfAllQueueApproved,
      cap,
      daysUntilStart,
    )

    const approvalRisk = deriveApprovalRisk({
      competitionClass,
      capacityState,
      isUrgent: urgent,
      competingQueueDemand,
      daysUntilStart,
      futureCapacityRisk,
    })

    const strategicPriority = computeStrategicPriority({
      isGold: gold,
      isWaitlist: waitlist,
      isUrgent: urgent,
      requestedSlots: fp.requestedSlots,
      experienceType: fp.experienceType,
      queueAgeDays: queueAge,
    })

    const priorityScore = computePriorityScore({
      isGold: gold,
      isWaitlist: waitlist,
      isUrgent: urgent,
      requestedSlots: fp.requestedSlots,
      queueAgeDays: queueAge,
      school: fp.school,
      requestId: fp.requestId,
    })

    byRequestId[fp.requestId] = {
      requestId: fp.requestId,
      footprint: fp,
      isGoldPartner: gold,
      isWaitlist: waitlist,
      isUrgent: urgent,
      queueAgeDays: queueAge,
      queuePriority: computeQueuePriority({ isGold: gold, isWaitlist: waitlist, isUrgent: urgent }),
      strategicPriority,
      priorityScore,
      competitionClass,
      capacityState,
      approvalRisk,
      cap,
      peakApprovedSlots: basePeaks.peakApproved,
      peakDemandSlots: basePeaks.peakDemand,
      peakIfApproved,
      peakIfAllPendingApproved: peaksAllQueue.peakIfAllQueueApproved,
      remainingHeadroom: remainingHeadroom(basePeaks.peakApproved, cap),
      headroomAfterApproval: headroomAfterApproval(peakIfApproved, cap),
      slotsOverCapIfApproved: slotsOverCapIfApproved(peakIfApproved, cap),
      competingRequestIds: competitors.map((c) => c.requestId),
      competingSchools: buildCompetingSchools(competitors, rowsById),
      competingSlotDemand,
      competingQueueDemand,
      competitionGroupId: findGroupIdForRequest(fp.requestId, competitionGroups),
      daysUntilStart,
      futureCapacityRisk,
    }
  }

  const byDisciplineId: Record<string, DisciplineRowDecisionSnapshot> = {}

  for (const [disciplineId, pool] of byDiscipline.entries()) {
    if (pool.length === 0) continue
    const lead = pool[0]!
    const disciplineCount = new Set(pool.map((p) => p.discipline)).size
    const cap = getCapForFootprint(lead, capacityRecords, disciplineCount)
    const active = pool.filter((p) => ACTIVE_STATUSES.includes(p.status))
    const snapshots = active
      .map((p) => byRequestId[p.requestId])
      .filter(Boolean) as RequestDecisionSnapshot[]

    let forecastPeak = 0
    for (const shift of new Set(pool.map((p) => p.shiftBucket))) {
      const sample = pool.find((p) => p.shiftBucket === shift)!
      const peaks = computePeakLoadForFootprint(sample, pool, { assumeAllQueueApproved: true })
      forecastPeak = Math.max(forecastPeak, peaks.peakIfAllQueueApproved)
    }

    const approvedSlots = sumSlotsByStatus(pool, ["Approved"])
    const pendingCount = pool.filter((p) => p.status === "Request Pending").length
    const reviewCount = pool.filter((p) => p.status === "Review").length

    byDisciplineId[disciplineId] = {
      disciplineId,
      locationId: lead.locationId,
      locationName: lead.locationName,
      discipline: lead.discipline,
      cap,
      approvedSlots,
      pendingCount,
      reviewCount,
      capacityState: deriveCapacityState(
        Math.max(...snapshots.map((s) => s.peakApprovedSlots), 0),
        forecastPeak,
        cap,
      ),
      forecastPeakSlots: forecastPeak,
      futureCapacityRisk: worstRisk(snapshots.map((s) => s.futureCapacityRisk)),
      worstCompetitionClass: worstClass(snapshots.map((s) => s.competitionClass)),
      goldPartnerQueueCount: snapshots.filter((s) => s.isGoldPartner && QUEUE_STATUSES.includes(s.footprint.status)).length,
    }
  }

  const queueOrder = Object.values(byRequestId)
    .filter((s) => QUEUE_STATUSES.includes(s.footprint.status))
    .sort((a, b) =>
      compareQueuePriority(
        { priorityScore: a.priorityScore, school: a.footprint.school, requestId: a.requestId },
        { priorityScore: b.priorityScore, school: b.footprint.school, requestId: b.requestId },
      ),
    )
    .map((s) => s.requestId)

  return {
    builtAt: new Date(),
    calendarToday,
    byRequestId,
    byDisciplineId,
    competitionGroups,
    queueOrder,
  }
}

export function getRequestDecision(
  snapshot: DecisionSnapshot,
  requestId: string,
): RequestDecisionSnapshot | undefined {
  return snapshot.byRequestId[requestId]
}

export function getDisciplineDecision(
  snapshot: DecisionSnapshot,
  disciplineId: string,
): DisciplineRowDecisionSnapshot | undefined {
  return snapshot.byDisciplineId[disciplineId]
}

export function getCompetitionGroup(
  snapshot: DecisionSnapshot,
  groupId: string,
): CompetitionGroupSnapshot | undefined {
  return snapshot.competitionGroups.find((g) => g.id === groupId)
}
