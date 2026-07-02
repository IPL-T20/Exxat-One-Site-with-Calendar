import type { CalendarViewGroup } from "../slot-requests-calendar/calendar-grouping"
import { formatPeriodNavLabel } from "../slot-requests-calendar/calendar-period-nav"
import type { CalendarZoom } from "../slot-requests-calendar/types"
import {
  AT_RISK_REASON_LABELS,
  getScheduleAtRiskReasons,
  isScheduleAtRisk,
  kpiPeriodNoun,
  kpiPeriodRange,
  type ScheduleAtRiskReason,
} from "./schedules-calendar-lens"
import type { ScheduleRecord } from "./types"

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

const DAY_MS = 86_400_000
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const
const MONTH_ABBR = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const
const DAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function addDays(d: Date, n: number): Date {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function daySpanInclusive(start: Date, end: Date): number {
  return Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS) + 1
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

function weekRangeFrom(date: Date): { start: Date; end: Date } {
  const start = new Date(date)
  const day = start.getDay()
  start.setDate(start.getDate() - ((day + 6) % 7))
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return { start, end }
}

function monthRangeFrom(date: Date): { start: Date; end: Date } {
  return {
    start: new Date(date.getFullYear(), date.getMonth(), 1),
    end: new Date(date.getFullYear(), date.getMonth() + 1, 0),
  }
}

function uniqueSchedulesInScope(
  groups: CalendarViewGroup[],
  scheduleById: Map<string, ScheduleRecord>,
): ScheduleRecord[] {
  const seen = new Set<string>()
  const rows: ScheduleRecord[] = []
  for (const group of groups) {
    for (const row of group.rows) {
      for (const placement of row.placements) {
        if (seen.has(placement.id)) continue
        const record = scheduleById.get(placement.id)
        if (!record) continue
        seen.add(placement.id)
        rows.push(record)
      }
    }
  }
  return rows
}

function formatDayLabel(d: Date): string {
  return `${DAY_ABBR[d.getDay()]} ${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`
}

function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month]} ${year}`
}

type PeakLoad = {
  label: string
  count: number
  title: string
  description: string
}

function peakDayLoad(
  start: Date,
  end: Date,
  inPeriod: ScheduleRecord[],
  periodNoun: string,
): PeakLoad | null {
  const counts = new Map<string, number>()
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    counts.set(isoDate(d), 0)
  }
  for (const row of inPeriod) {
    for (const dayIso of counts.keys()) {
      if (row.startDate <= dayIso && row.endDate >= dayIso) {
        counts.set(dayIso, (counts.get(dayIso) ?? 0) + 1)
      }
    }
  }
  let bestIso: string | null = null
  let best = 0
  for (const [dayIso, count] of counts) {
    if (count > best) {
      best = count
      bestIso = dayIso
    }
  }
  if (!bestIso || best === 0) return null
  const [y, m, day] = bestIso.split("-").map(Number)
  const label = formatDayLabel(new Date(y, m - 1, day))
  return {
    label,
    count: best,
    title: `Peak load on ${label}`,
    description: `Up to ${best} schedule${best === 1 ? "" : "s"} run concurrently that day — plan preceptor capacity for that window.`,
  }
}

function peakMonthLoad(
  start: Date,
  end: Date,
  inPeriod: ScheduleRecord[],
): PeakLoad | null {
  const counts = new Map<string, number>()
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cursor <= endMonth) {
    counts.set(`${cursor.getFullYear()}-${cursor.getMonth()}`, 0)
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  }
  for (const row of inPeriod) {
    for (const key of counts.keys()) {
      const [y, m] = key.split("-").map(Number)
      const monthStart = isoDate(new Date(y, m, 1))
      const monthEnd = isoDate(new Date(y, m + 1, 0))
      if (row.startDate <= monthEnd && row.endDate >= monthStart) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }
  }
  let bestKey: string | null = null
  let best = 0
  for (const [key, count] of counts) {
    if (count > best) {
      best = count
      bestKey = key
    }
  }
  if (!bestKey || best === 0) return null
  const [y, m] = bestKey.split("-").map(Number)
  const label = formatMonthLabel(y, m)
  return {
    label,
    count: best,
    title: `Peak load in ${label}`,
    description: `Up to ${best} schedule${best === 1 ? "" : "s"} overlap in that month — plan staffing and preceptor coverage ahead of time.`,
  }
}

function topAtRiskReason(
  rows: ScheduleRecord[],
  referenceDate: string,
): { reason: ScheduleAtRiskReason; label: string; count: number } | null {
  const counts = new Map<ScheduleAtRiskReason, number>()
  for (const row of rows) {
    for (const reason of getScheduleAtRiskReasons(row, referenceDate)) {
      counts.set(reason, (counts.get(reason) ?? 0) + 1)
    }
  }
  let best: ScheduleAtRiskReason | null = null
  let bestCount = 0
  for (const [reason, count] of counts) {
    if (count > bestCount) {
      best = reason
      bestCount = count
    }
  }
  if (!best || bestCount === 0) return null
  return { reason: best, label: AT_RISK_REASON_LABELS[best], count: bestCount }
}

function atRiskLocationsList(
  rows: ScheduleRecord[],
  referenceDate: string,
  limit = 4,
): { location: string; count: number }[] {
  const byLocation = new Map<string, number>()
  for (const row of rows) {
    if (!isScheduleAtRisk(row, referenceDate)) continue
    const loc = row.location?.trim() || "Unknown location"
    byLocation.set(loc, (byLocation.get(loc) ?? 0) + 1)
  }
  return [...byLocation.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([location, count]) => ({ location, count }))
}

export type PeriodTimelineBucket = {
  label: string
  shortLabel: string
  load: number
  starts: number
  ends: number
  isPeak: boolean
  isToday: boolean
}

function bucketLabel(d: Date, zoom: CalendarZoom, compact = false): string {
  if (zoom === "year") return MONTH_ABBR[d.getMonth()]
  if (compact) return String(d.getDate())
  return `${DAY_ABBR[d.getDay()]} ${d.getDate()}`
}

function countLoadOnDay(inPeriod: ScheduleRecord[], dayIso: string): number {
  let n = 0
  for (const row of inPeriod) {
    if (row.scheduleStatus === "Cancelled") continue
    if (row.startDate <= dayIso && row.endDate >= dayIso) n += 1
  }
  return n
}

function countStartsOnDay(rows: ScheduleRecord[], dayIso: string): number {
  let n = 0
  for (const row of rows) {
    if (row.scheduleStatus === "Cancelled") continue
    if (row.startDate === dayIso) n += 1
  }
  return n
}

function countEndsOnDay(rows: ScheduleRecord[], dayIso: string): number {
  let n = 0
  for (const row of rows) {
    if (row.scheduleStatus === "Cancelled") continue
    if (row.endDate === dayIso) n += 1
  }
  return n
}

function buildDayBuckets(
  start: Date,
  end: Date,
  inPeriod: ScheduleRecord[],
  todayIso: string,
  zoom: CalendarZoom,
): PeriodTimelineBucket[] {
  const buckets: PeriodTimelineBucket[] = []
  for (let d = new Date(start); d <= end; d = addDays(d, 1)) {
    const dayIso = isoDate(d)
    buckets.push({
      label: bucketLabel(d, zoom),
      shortLabel: bucketLabel(d, zoom, true),
      load: countLoadOnDay(inPeriod, dayIso),
      starts: countStartsOnDay(inPeriod, dayIso),
      ends: countEndsOnDay(inPeriod, dayIso),
      isPeak: false,
      isToday: dayIso === todayIso,
    })
  }
  const peak = Math.max(0, ...buckets.map((b) => b.load))
  for (const b of buckets) {
    if (b.load === peak && peak > 0) b.isPeak = true
  }
  return buckets
}

function buildWeekBucketsWithinMonth(
  start: Date,
  end: Date,
  inPeriod: ScheduleRecord[],
  todayIso: string,
): PeriodTimelineBucket[] {
  const buckets: PeriodTimelineBucket[] = []
  let cursor = new Date(start)
  while (cursor <= end) {
    const weekEnd = addDays(cursor, 6)
    const clampedEnd = weekEnd > end ? end : weekEnd
    const startIso = isoDate(cursor)
    const endIso = isoDate(clampedEnd)
    let load = 0
    let starts = 0
    let ends = 0
    for (let d = new Date(cursor); d <= clampedEnd; d = addDays(d, 1)) {
      const dayIso = isoDate(d)
      load = Math.max(load, countLoadOnDay(inPeriod, dayIso))
      starts += countStartsOnDay(inPeriod, dayIso)
      ends += countEndsOnDay(inPeriod, dayIso)
    }
    const isToday = todayIso >= startIso && todayIso <= endIso
    buckets.push({
      label: `${MONTH_ABBR[cursor.getMonth()]} ${cursor.getDate()}`,
      shortLabel: `W${buckets.length + 1}`,
      load,
      starts,
      ends,
      isPeak: false,
      isToday,
    })
    cursor = addDays(clampedEnd, 1)
  }
  const peak = Math.max(0, ...buckets.map((b) => b.load))
  for (const b of buckets) {
    if (b.load === peak && peak > 0) b.isPeak = true
  }
  return buckets
}

function buildMonthBucketsInYear(
  start: Date,
  end: Date,
  inPeriod: ScheduleRecord[],
  todayIso: string,
): PeriodTimelineBucket[] {
  const buckets: PeriodTimelineBucket[] = []
  let cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)
  while (cursor <= endMonth) {
    const y = cursor.getFullYear()
    const m = cursor.getMonth()
    const monthStart = isoDate(new Date(y, m, 1))
    const monthEnd = isoDate(new Date(y, m + 1, 0))
    let load = 0
    let starts = 0
    let ends = 0
    for (const row of inPeriod) {
      if (row.scheduleStatus === "Cancelled") continue
      if (row.startDate <= monthEnd && row.endDate >= monthStart) load += 1
      if (row.startDate >= monthStart && row.startDate <= monthEnd) starts += 1
      if (row.endDate >= monthStart && row.endDate <= monthEnd) ends += 1
    }
    const isToday = todayIso >= monthStart && todayIso <= monthEnd
    buckets.push({
      label: MONTH_ABBR[m],
      shortLabel: MONTH_ABBR[m],
      load,
      starts,
      ends,
      isPeak: false,
      isToday,
    })
    cursor = new Date(y, m + 1, 1)
  }
  const peak = Math.max(0, ...buckets.map((b) => b.load))
  for (const b of buckets) {
    if (b.load === peak && peak > 0) b.isPeak = true
  }
  return buckets
}

function buildPeriodTimeline(
  start: Date,
  end: Date,
  zoom: CalendarZoom,
  inPeriod: ScheduleRecord[],
  todayIso: string,
): PeriodTimelineBucket[] {
  const span = daySpanInclusive(start, end)
  if (zoom === "day") {
    const dayIso = isoDate(start)
    const load = countLoadOnDay(inPeriod, dayIso)
    return [
      {
        label: formatDayLabel(start),
        shortLabel: "Today",
        load,
        starts: countStartsOnDay(inPeriod, dayIso),
        ends: countEndsOnDay(inPeriod, dayIso),
        isPeak: true,
        isToday: dayIso === todayIso,
      },
    ]
  }
  if (zoom === "year") {
    return buildMonthBucketsInYear(start, end, inPeriod, todayIso)
  }
  if (zoom === "month" && span > 14) {
    return buildWeekBucketsWithinMonth(start, end, inPeriod, todayIso)
  }
  return buildDayBuckets(start, end, inPeriod, todayIso, zoom)
}

export type FocusPeriodInsightKind = "risk" | "peak" | "readiness" | "momentum"

export type FocusPeriodInsight = {
  kind: FocusPeriodInsightKind
  title: string
  detail: string
}

export type SchedulesFocusPeriodSnapshot = {
  periodLabel: string
  periodNoun: string
  zoom: CalendarZoom
  headline: string
  active: number
  upcoming: number
  atRisk: number
  endingToday: number
  endingThisWeek: number
  endingThisMonth: number
  inPeriod: number
  startingInPeriod: number
  endingInPeriod: number
  individualJoining: number
  groupJoining: number
  avgConcurrent: number
  peakConcurrent: number
  peakLabel: string | null
  loadMomentum: string | null
  readinessPercent: number
  readinessReady: number
  readinessTotal: number
  periodTimeline: PeriodTimelineBucket[]
  atRiskLocations: { location: string; count: number }[]
  primaryAlert: FocusPeriodInsight | null
  insights: FocusPeriodInsight[]
}

export function computeSchedulesFocusPeriodSnapshot(
  groups: CalendarViewGroup[],
  scheduleById: Map<string, ScheduleRecord>,
  referenceDate: string,
  periodAnchor: Date,
  zoom: CalendarZoom,
): SchedulesFocusPeriodSnapshot {
  const scoped = uniqueSchedulesInScope(groups, scheduleById)
  const { start, end } = kpiPeriodRange(periodAnchor, zoom)
  const startIso = isoDate(start)
  const endIso = isoDate(end)

  const refDate = new Date(
    Number(referenceDate.slice(0, 4)),
    Number(referenceDate.slice(5, 7)) - 1,
    Number(referenceDate.slice(8, 10)),
  )
  const todayIso = isoDate(refDate)
  const week = weekRangeFrom(refDate)
  const weekStartIso = isoDate(week.start)
  const weekEndIso = isoDate(week.end)
  const month = monthRangeFrom(refDate)
  const monthStartIso = isoDate(month.start)
  const monthEndIso = isoDate(month.end)

  const inPeriodRows = scoped.filter((row) => scheduleIntersectsRange(row, startIso, endIso))
  const inProgressRows = inPeriodRows.filter((row) => row.scheduleStatus !== "Cancelled")

  const schools = new Set<string>()
  const locations = new Set<string>()
  const departments = new Set<string>()

  let active = 0
  let upcoming = 0
  let startingInPeriod = 0
  let endingInPeriod = 0
  let endingToday = 0
  let endingThisWeek = 0
  let endingThisMonth = 0
  let needsAttention = 0
  let readinessReady = 0
  let readinessTotal = 0

  let individualJoining = 0
  let groupJoining = 0

  for (const row of inPeriodRows) {
    const isCancelled = row.scheduleStatus === "Cancelled"
    const isActiveNow =
      !isCancelled && row.startDate <= todayIso && row.endDate >= todayIso
    const isUpcoming =
      !isCancelled && row.startDate > todayIso && scheduleStartsInRange(row, startIso, endIso)
    const isReady =
      row.scheduleStatus === "Confirmed" &&
      (row.onboardingStatus === "Compliant" || row.onboardingStatus === "Not Applicable")
    const startsHere =
      !isCancelled && scheduleStartsInRange(row, startIso, endIso)

    if (isActiveNow) active += 1
    if (isUpcoming) {
      upcoming += 1
      readinessTotal += 1
      if (isReady) readinessReady += 1
    }
    if (startsHere) {
      startingInPeriod += 1
      if (row.experienceType === "Group") groupJoining += 1
      else individualJoining += 1
    }
    if (!isCancelled && scheduleEndsInRange(row, startIso, endIso)) endingInPeriod += 1
    if (!isCancelled && row.endDate === todayIso) endingToday += 1
    if (!isCancelled && row.endDate >= weekStartIso && row.endDate <= weekEndIso) {
      endingThisWeek += 1
    }
    if (!isCancelled && row.endDate >= monthStartIso && row.endDate <= monthEndIso) {
      endingThisMonth += 1
    }
    if (isScheduleAtRisk(row, referenceDate)) needsAttention += 1

    if (row.school) schools.add(row.school)
    if (row.location) locations.add(row.location)
    if (row.department) departments.add(`${row.location}::${row.department}`)
  }

  const periodNoun = kpiPeriodNoun(zoom)
  const peakLoad =
    zoom === "year"
      ? peakMonthLoad(start, end, inPeriodRows)
      : zoom === "day"
        ? null
        : peakDayLoad(start, end, inPeriodRows, periodNoun)

  const inProgress = inProgressRows.length
  const spanDays = daySpanInclusive(start, end)
  const attentionPercent =
    inProgress > 0 ? Math.round((needsAttention / inProgress) * 100) : 0
  const periodTimeline = buildPeriodTimeline(start, end, zoom, inPeriodRows, todayIso)
  const peakConcurrent =
    periodTimeline.length > 0 ? Math.max(...periodTimeline.map((b) => b.load)) : 0
  const peakBucket = periodTimeline.find((b) => b.load === peakConcurrent) ?? null
  const peakLabel = peakBucket && peakConcurrent > 0 ? peakBucket.label : null
  const avgConcurrent =
    periodTimeline.length > 0
      ? Math.round(
          (periodTimeline.reduce((sum, b) => sum + b.load, 0) / periodTimeline.length) * 10,
        ) / 10
      : 0

  const atRiskLocations = atRiskLocationsList(inPeriodRows, referenceDate)
  const topRisk = atRiskLocations[0] ?? null
  const topReason = topAtRiskReason(inPeriodRows, referenceDate)
  const readinessPercent =
    readinessTotal > 0 ? Math.round((readinessReady / readinessTotal) * 100) : 100

  const netStarts = startingInPeriod - endingInPeriod
  const loadMomentum =
    netStarts > 2
      ? `Net +${netStarts} starts in this ${periodNoun}`
      : netStarts < -2
        ? `${Math.abs(netStarts)} more endings than starts`
        : null

  const primaryAlert: FocusPeriodInsight | null =
    needsAttention > 0
      ? {
          kind: "risk",
          title:
            topReason != null
              ? `${topReason.count} flagged for ${topReason.label.toLowerCase()}`
              : `${attentionPercent}% need attention`,
          detail:
            topRisk != null
              ? `${needsAttention} at-risk across this ${periodNoun} — ${topRisk.count} at ${topRisk.location}.`
              : `${needsAttention} schedule${needsAttention === 1 ? "" : "s"} need a decision before students arrive.`,
        }
      : null

  const insights: FocusPeriodInsight[] = []
  if (primaryAlert) insights.push(primaryAlert)

  if (peakLoad && insights.length < 2) {
    const vsAvg =
      spanDays > 1 && inProgress > 0
        ? Math.round((peakLoad.count / (inProgress / spanDays)) * 10) / 10
        : null
    insights.push({
      kind: "peak",
      title: peakLoad.title,
      detail:
        vsAvg != null && vsAvg >= 1.25
          ? `${peakLoad.count} concurrent — ${vsAvg}× the daily average. Staff preceptors early.`
          : peakLoad.description,
    })
  }

  if (readinessTotal >= 3 && readinessPercent < 85 && insights.length < 2) {
    insights.push({
      kind: "readiness",
      title: `${readinessPercent}% of upcoming starts are ready`,
      detail: `${readinessReady} of ${readinessTotal} confirmed and compliant before go-live.`,
    })
  }

  if (loadMomentum && insights.length < 2) {
    insights.push({
      kind: "momentum",
      title: loadMomentum,
      detail:
        netStarts > 0
          ? `${startingInPeriod} starting vs ${endingInPeriod} ending in this ${periodNoun} — capacity may tighten.`
          : `${endingInPeriod} wrapping up vs ${startingInPeriod} new starts — lighter load ahead.`,
    })
  }

  const headline =
    needsAttention > 0
      ? `${needsAttention} need attention this ${periodNoun}`
      : peakLoad
        ? `Peak ${peakLoad.count} on ${peakLoad.label}`
        : loadMomentum ?? `${active} active · ${upcoming} upcoming`

  return {
    periodLabel: formatPeriodNavLabel(zoom, periodAnchor),
    periodNoun,
    zoom,
    headline,
    active,
    upcoming,
    atRisk: needsAttention,
    endingToday,
    endingThisWeek,
    endingThisMonth,
    inPeriod: inPeriodRows.length,
    startingInPeriod,
    endingInPeriod,
    individualJoining,
    groupJoining,
    avgConcurrent,
    peakConcurrent,
    peakLabel,
    loadMomentum,
    readinessPercent,
    readinessReady,
    readinessTotal,
    periodTimeline,
    atRiskLocations,
    primaryAlert,
    insights: insights.slice(0, 2),
  }
}
