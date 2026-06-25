import {
  AT_RISK_REASON_LABELS,
  getScheduleAtRiskReasons,
  isScheduleAtRisk,
  kpiPeriodRange,
  type ScheduleAtRiskReason,
} from "./schedules-calendar-lens"
import type { ScheduleRecord } from "./types"
import type { CalendarZoom, Placement } from "../slot-requests-calendar/types"

export interface ScheduleRowKpis {
  active: number
  starting: number
  ending: number
  atRisk: number
}

export function formatScheduleKpiSubtitle(kpis: ScheduleRowKpis): string | null {
  const parts: string[] = []
  if (kpis.starting > 0) parts.push(`${kpis.starting} starting`)
  if (kpis.ending > 0) parts.push(`${kpis.ending} ending`)
  if (kpis.atRisk > 0) parts.push(`${kpis.atRisk} at risk`)
  return parts.length > 0 ? parts.join(" · ") : null
}

/** Screen reader summary for schedules sidebar row chips. */
export function formatSchedulesSidebarKpiAria(kpis: ScheduleRowKpis): string {
  const parts: string[] = []
  if (kpis.active > 0) parts.push(`${kpis.active} active`)
  if (kpis.starting > 0) parts.push(`${kpis.starting} starting`)
  if (kpis.ending > 0) parts.push(`${kpis.ending} ending`)
  if (kpis.atRisk > 0) parts.push(`${kpis.atRisk} at risk`)
  return parts.length > 0 ? parts.join(", ") : "no schedules in this period"
}

/** Sidebar copy — period motion plus top at-risk reason labels (not generic “at risk”). */
const SCHEDULE_SIDEBAR_REASON_LABELS: Record<ScheduleAtRiskReason, string> = {
  compliance_gap: "not compliant",
  requirements_pending: "requirements pending",
  unassigned_student: "student not assigned",
  unassigned_preceptor: "preceptor not assigned",
  unconfirmed_near_start: "not confirmed near start",
  recently_cancelled: "recently cancelled",
  ending_offboarding: "offboarding incomplete",
  starting_imminent_gap: "starting within 48h",
}

function aggregateAtRiskReasonCounts(
  placements: Placement[],
  scheduleById: Map<string, ScheduleRecord>,
  referenceDate: string,
  periodAnchor: Date,
  zoom: CalendarZoom,
): Map<string, number> {
  const { start, end } = kpiPeriodRange(periodAnchor, zoom)
  const startIso = isoDate(start)
  const endIso = isoDate(end)
  const counts = new Map<string, number>()

  for (const p of placements) {
    const record = scheduleById.get(p.id)
    if (!record) continue
    if (!scheduleIntersectsRange(record, startIso, endIso)) continue
    if (!isScheduleAtRisk(record, referenceDate)) continue
    for (const reason of getScheduleAtRiskReasons(record, referenceDate)) {
      const label = SCHEDULE_SIDEBAR_REASON_LABELS[reason] ?? AT_RISK_REASON_LABELS[reason]
      counts.set(label, (counts.get(label) ?? 0) + 1)
    }
  }

  return counts
}

export function formatScheduleSidebarSubtitle(
  kpis: ScheduleRowKpis,
  placements: Placement[],
  scheduleById: Map<string, ScheduleRecord>,
  referenceDate: string,
  periodAnchor: Date,
  zoom: CalendarZoom,
  maxReasonLabels = 2,
): string | null {
  const parts: string[] = []
  if (kpis.starting > 0) parts.push(`${kpis.starting} starting`)
  if (kpis.ending > 0) parts.push(`${kpis.ending} ending`)

  const reasonCounts = aggregateAtRiskReasonCounts(
    placements,
    scheduleById,
    referenceDate,
    periodAnchor,
    zoom,
  )
  const reasonParts = [...reasonCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxReasonLabels)
    .map(([label, count]) => (count > 1 ? `${count} ${label}` : `1 ${label}`))

  parts.push(...reasonParts)

  if (reasonParts.length === 0 && kpis.atRisk > 0) {
    parts.push(`${kpis.atRisk} at risk`)
  }

  return parts.length > 0 ? parts.join(" · ") : null
}

export function buildScheduleRecordMap(rows: ScheduleRecord[]): Map<string, ScheduleRecord> {
  return new Map(rows.map((r) => [r.id, r]))
}

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function scheduleIntersectsRange(
  row: ScheduleRecord,
  startIso: string,
  endIso: string,
): boolean {
  return row.startDate <= endIso && row.endDate >= startIso
}

function scheduleStartsInRange(
  row: ScheduleRecord,
  startIso: string,
  endIso: string,
): boolean {
  return row.startDate >= startIso && row.startDate <= endIso
}

function scheduleEndsInRange(
  row: ScheduleRecord,
  startIso: string,
  endIso: string,
): boolean {
  return row.endDate >= startIso && row.endDate <= endIso
}

export function computeScheduleRowKpis(
  placements: Placement[],
  scheduleById: Map<string, ScheduleRecord>,
  referenceDate: string,
  periodAnchor: Date,
  zoom: CalendarZoom,
): ScheduleRowKpis {
  const { start, end } = kpiPeriodRange(periodAnchor, zoom)
  const startIso = isoDate(start)
  const endIso = isoDate(end)

  let active = 0
  let starting = 0
  let ending = 0
  let atRisk = 0

  for (const p of placements) {
    const record = scheduleById.get(p.id)
    if (!record) continue
    const inPeriod = scheduleIntersectsRange(record, startIso, endIso)
    if (inPeriod) active += 1
    if (scheduleStartsInRange(record, startIso, endIso)) starting += 1
    if (scheduleEndsInRange(record, startIso, endIso)) ending += 1
    if (inPeriod && isScheduleAtRisk(record, referenceDate)) atRisk += 1
  }

  return { active, starting, ending, atRisk }
}
