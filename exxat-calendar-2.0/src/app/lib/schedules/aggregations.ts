import type {
  MonthBarPoint,
  MonthBucketEntry,
  OnboardingSlice,
  ScheduleActivity,
  ScheduleRecord,
  SchedulesByMonth,
  ScheduleStatusSlice,
  KpiCardData,
} from "./types"
import {
  formatScheduleLocationDepartment,
  scheduleStudentDiscipline,
} from "./schedule-location-model"

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export function formatDisplayDate(iso: string): string {
  return parseIsoDate(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function filterByDisciplines(
  rows: ScheduleRecord[],
  selected: string[] | null,
): ScheduleRecord[] {
  if (!selected || selected.length === 0) return rows
  const set = new Set(selected)
  return rows.filter((r) => set.has(scheduleStudentDiscipline(r)))
}

function uniqueSchools(rows: ScheduleRecord[]): number {
  return new Set(rows.map((r) => r.school)).size
}

export function computeKpis(
  rows: ScheduleRecord[],
  referenceDate: string,
): {
  ongoing: KpiCardData
  upcomingConfirmed: KpiCardData
  upcomingNonConfirmed: KpiCardData
} {
  const today = parseIsoDate(referenceDate)

  const ongoingRows = rows.filter((r) => {
    const start = parseIsoDate(r.startDate)
    const end = parseIsoDate(r.endDate)
    return start <= today && today <= end
  })

  const upcomingConfirmedRows = rows.filter((r) => {
    const start = parseIsoDate(r.startDate)
    return start > today && r.scheduleStatus === "Confirmed"
  })

  const upcomingNonConfirmedRows = rows.filter((r) => {
    const start = parseIsoDate(r.startDate)
    return (
      start > today &&
      (r.scheduleStatus === "Not Confirmed" || r.scheduleStatus === "To be Scheduled")
    )
  })

  return {
    ongoing: { count: ongoingRows.length, schoolCount: uniqueSchools(ongoingRows) },
    upcomingConfirmed: {
      count: upcomingConfirmedRows.length,
      schoolCount: uniqueSchools(upcomingConfirmedRows),
    },
    upcomingNonConfirmed: {
      count: upcomingNonConfirmedRows.length,
      schoolCount: uniqueSchools(upcomingNonConfirmedRows),
    },
  }
}

function upcomingRows(
  rows: ScheduleRecord[],
  referenceDate: string,
  windowDays: number | null,
): ScheduleRecord[] {
  const today = parseIsoDate(referenceDate)
  const end =
    windowDays != null
      ? new Date(today.getFullYear(), today.getMonth(), today.getDate() + windowDays)
      : null

  return rows.filter((r) => {
    const start = parseIsoDate(r.startDate)
    if (start <= today) return false
    if (end && start > end) return false
    return true
  })
}

export function computeScheduleStatusDonut(
  rows: ScheduleRecord[],
  referenceDate: string,
  window: "30d" | "all",
): ScheduleStatusSlice[] {
  const pool =
    window === "30d"
      ? upcomingRows(rows, referenceDate, 30)
      : upcomingRows(rows, referenceDate, null)

  const counts: Record<string, number> = {}
  for (const r of pool) {
    counts[r.scheduleStatus] = (counts[r.scheduleStatus] ?? 0) + 1
  }

  const order: Array<ScheduleStatusSlice["name"]> = [
    "Confirmed",
    "Not Confirmed",
    "To be Scheduled",
    "Cancelled",
  ]

  return order
    .map((name) => ({
      name,
      value: counts[name] ?? 0,
      key: name as ScheduleStatusSlice["key"],
    }))
    .filter((s) => s.value > 0)
}

export function mapOnboardingBucket(r: ScheduleRecord): OnboardingSlice["key"] | null {
  if (r.scheduleStatus !== "Confirmed") return null
  if (r.onboardingStatus === "Not Applicable") return null
  if (r.onboardingStatus === "Compliant") return "compliant"
  if (r.requirements.pending > 0) return "notStarted"
  return "actionNeeded"
}

export function computeOnboardingDonut(
  rows: ScheduleRecord[],
  referenceDate: string,
  window: "30d" | "all",
): OnboardingSlice[] {
  const pool =
    window === "30d"
      ? upcomingRows(rows, referenceDate, 30)
      : upcomingRows(rows, referenceDate, null)

  const counts = { compliant: 0, actionNeeded: 0, notStarted: 0 }
  for (const r of pool) {
    const bucket = mapOnboardingBucket(r)
    if (bucket) counts[bucket] += 1
  }

  return [
    { name: "Compliant", value: counts.compliant, key: "compliant" },
    { name: "Some action needed", value: counts.actionNeeded, key: "actionNeeded" },
    { name: "Not started", value: counts.notStarted, key: "notStarted" },
  ].filter((s) => s.value > 0)
}

function parseMonthLabel(label: string): Date {
  return new Date(`${label} 1`)
}

function monthBarLabel(label: string): string {
  const d = parseMonthLabel(label)
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" })
}

export function computeMonthBarChart(
  byMonth: SchedulesByMonth,
  scheduleIds: Set<string> | null,
  referenceDate: string,
  monthCount = 12,
): MonthBarPoint[] {
  const ref = parseIsoDate(referenceDate)
  const startMonth = new Date(ref.getFullYear(), ref.getMonth(), 1)

  const months = Object.keys(byMonth)
    .map((m) => ({ label: m, date: parseMonthLabel(m) }))
    .filter((m) => m.date >= startMonth)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, monthCount)

  return months.map(({ label, date }) => {
    const entries = byMonth[label] ?? []
    const filtered: MonthBucketEntry[] = scheduleIds
      ? entries.filter((e) => scheduleIds.has(e.scheduleId))
      : entries

    let approved = 0
    let confirmed = 0
    let compliant = 0
    for (const e of filtered) {
      if (e.scheduleStatus !== "Cancelled") approved += 1
      if (e.scheduleStatus === "Confirmed") confirmed += 1
      if (e.scheduleStatus === "Confirmed" && e.onboardingStatus === "Compliant") compliant += 1
    }

    return {
      month: label,
      label: monthBarLabel(label),
      approved,
      confirmed,
      compliant,
    }
  })
}

export function buildRecentActivities(
  rows: ScheduleRecord[],
  limit = 10,
): ScheduleActivity[] {
  const sorted = [...rows].sort(
    (a, b) => parseIsoDate(b.endDate).getTime() - parseIsoDate(a.endDate).getTime(),
  )

  return sorted.slice(0, limit).map((r) => {
    const dateRange = `${formatDisplayDate(r.startDate)} - ${formatDisplayDate(r.endDate)}`
    const verb =
      r.scheduleStatus === "Confirmed"
        ? "confirmed schedule"
        : r.scheduleStatus === "Cancelled"
          ? "cancelled schedule"
          : "updated schedule"

    return {
      id: r.id,
      description: `${r.school} ${verb} for ${dateRange}. (${r.experienceType})`,
      discipline: scheduleStudentDiscipline(r),
      location: formatScheduleLocationDepartment(r),
      scheduleStatus: r.scheduleStatus,
    }
  })
}

export function scheduleIdSet(rows: ScheduleRecord[]): Set<string> {
  return new Set(rows.map((r) => r.id))
}
