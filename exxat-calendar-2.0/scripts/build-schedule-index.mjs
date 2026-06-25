#!/usr/bin/env node
/**
 * Build runtime schedule indexes from Mapple_Health_Schedule_Dummy_Data.xlsx.
 * Output: public/mapple/schedules.json, schedules-by-{month,week,day}.json, manifest.json
 */
import { existsSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { readXlsx, tableToObjects, nullIfEmpty } from "./lib/xlsx-reader.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const IN_APP_XLSX = join(ROOT, "data/Mapple_Health_Schedule_Dummy_Data.xlsx")
const MONOREPO_XLSX = join(ROOT, "../data/Mapple_Health_Schedule_Dummy_Data.xlsx")
const XLSX_PATH =
  process.env.MAPPLE_SCHEDULE_XLSX ??
  (existsSync(IN_APP_XLSX)
    ? IN_APP_XLSX
    : existsSync(MONOREPO_XLSX)
      ? MONOREPO_XLSX
      : null)
const OUT = join(ROOT, "public/mapple")

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

const REFERENCE_DATE = process.env.SCHEDULE_REFERENCE_DATE ?? todayIso()
/** When set, keep XLSX statuses for near-term rows (demo / scenario testing). */
const PRESERVE_RAW_SCENARIOS = process.env.SCHEDULE_PRESERVE_RAW_SCENARIOS === "1"

/** Match src/app/lib/schedules/schedules-operational-horizon.ts */
const OPERATIONAL_HORIZON_DAYS = 14
const NEAR_TERM_GREEN_TARGET = 0.98
const NEAR_TERM_EXCEPTION_RATE = 1 - NEAR_TERM_GREEN_TARGET

function startOfDay(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function isoDate(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function scheduleIntersectsOperationalHorizon(row, referenceDate) {
  const ref = startOfDay(referenceDate)
  const horizon = new Date(ref)
  horizon.setDate(horizon.getDate() + OPERATIONAL_HORIZON_DAYS)
  const refIso = isoDate(ref)
  const horizonIso = isoDate(horizon)
  return row.startDate <= horizonIso && row.endDate >= refIso
}

function stableHash(value) {
  let hash = 0
  for (let i = 0; i < value.length; i++) hash = (hash * 31 + value.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function isNearTermException(row) {
  return stableHash(row.id) % 10_000 < Math.round(NEAR_TERM_EXCEPTION_RATE * 10_000)
}

function nearTermExceptionProfile(row) {
  const variant = stableHash(`${row.id}:exception`) % 4
  switch (variant) {
    case 0:
      return {
        ...row,
        scheduleStatus: "Confirmed",
        onboardingStatus: "Not Compliant",
        requirements: {
          ...row.requirements,
          pending: Math.max(1, row.requirements.pending),
        },
      }
    case 1:
      return {
        ...row,
        scheduleStatus: "Not Confirmed",
        onboardingStatus: "Compliant",
      }
    case 2:
      return {
        ...row,
        scheduleStatus: "Confirmed",
        onboardingStatus: "Compliant",
        studentName:
          row.experienceType === "Individual" ? null : row.studentName,
        preceptorName: row.experienceType === "Group" ? null : row.preceptorName,
      }
    default:
      return {
        ...row,
        scheduleStatus: "To be Scheduled",
        onboardingStatus: "Compliant",
      }
  }
}

function normalizeNearTermOperationalRow(row, referenceDate) {
  if (!scheduleIntersectsOperationalHorizon(row, referenceDate)) return row
  if (isNearTermException(row)) return nearTermExceptionProfile(row)

  const onboardingStatus =
    row.onboardingStatus === "Not Applicable" ? "Not Applicable" : "Compliant"

  return {
    ...row,
    scheduleStatus: "Confirmed",
    onboardingStatus,
    requirements:
      onboardingStatus === "Not Applicable"
        ? row.requirements
        : {
            ...row.requirements,
            pending: 0,
            notApproved: 0,
            approved: Math.max(row.requirements.total, row.requirements.approved),
          },
  }
}

function applyNearTermOperationalReality(schedules, referenceDate) {
  return schedules.map((row) => normalizeNearTermOperationalRow(row, referenceDate))
}

/** ~10% of schedules intersecting the reference week/month get demo month-day or block rhythm. */
function scheduleIntersectsReferencePeriod(row, referenceDate) {
  const ref = startOfDay(referenceDate)
  const weekStart = new Date(ref)
  weekStart.setDate(ref.getDate() - ref.getDay())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const monthStart = new Date(ref.getFullYear(), ref.getMonth(), 1)
  const monthEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
  const periodStart = weekStart < monthStart ? weekStart : monthStart
  const periodEnd = weekEnd > monthEnd ? weekEnd : monthEnd
  return row.startDate <= isoDate(periodEnd) && row.endDate >= isoDate(periodStart)
}

function parseIsoDate(iso) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate()
}

function pickDemoMonthDays(row, referenceDate) {
  const ref = startOfDay(referenceDate)
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const dim = daysInMonth(year, month)
  const candidates = []
  for (let day = 1; day <= dim; day += 1) {
    const iso = isoDate(new Date(year, month, day))
    if (iso >= row.startDate && iso <= row.endDate) candidates.push(day)
  }
  if (candidates.length === 0) return [1, 7, 13]

  const hash = stableHash(row.id)
  const targetCount = Math.min(candidates.length, 3 + (hash % 5))
  const picked = new Set()
  for (let i = 0; i < targetCount; i += 1) {
    picked.add(candidates[(hash + i * 5) % candidates.length])
  }
  if (hash % 4 === 0 && candidates.length > 6) {
    for (const day of candidates) {
      picked.add(day)
      if (picked.size >= 8) break
    }
  }
  return [...picked].sort((a, b) => a - b)
}

function pickDemoBlocks(row) {
  const start = parseIsoDate(row.startDate)
  const end = parseIsoDate(row.endDate)
  const spanMs = end.getTime() - start.getTime()
  if (spanMs <= 0) {
    return [{ startDate: row.startDate, endDate: row.endDate }]
  }

  const hash = stableHash(`${row.id}:blocks`)
  const segments = 2 + (hash % 2)
  if (segments === 2) {
    const splitA = new Date(start.getTime() + spanMs * 0.38)
    const splitB = new Date(start.getTime() + spanMs * 0.42)
    return [
      { startDate: row.startDate, endDate: isoDate(splitA) },
      { startDate: isoDate(splitB), endDate: row.endDate },
    ]
  }

  const t1 = new Date(start.getTime() + spanMs * 0.28)
  const t2 = new Date(start.getTime() + spanMs * 0.32)
  const t3 = new Date(start.getTime() + spanMs * 0.62)
  const t4 = new Date(start.getTime() + spanMs * 0.66)
  return [
    { startDate: row.startDate, endDate: isoDate(t1) },
    { startDate: isoDate(t2), endDate: isoDate(t3) },
    { startDate: isoDate(t4), endDate: row.endDate },
  ]
}

function applyRhythmDemoProfiles(schedules, referenceDate) {
  let rhythmDemoCount = 0
  const enriched = schedules.map((row) => {
    if (!scheduleIntersectsReferencePeriod(row, referenceDate)) return row
    if (stableHash(`${row.id}:rhythm`) % 100 >= 10) return row

    rhythmDemoCount += 1
    const kindRoll = stableHash(`${row.id}:rhythm-kind`) % 2
    if (kindRoll === 0) {
      return {
        ...row,
        scheduleRhythmKind: "month_day",
        monthDays: pickDemoMonthDays(row, referenceDate),
        scheduleBlocks: null,
      }
    }
    return {
      ...row,
      scheduleRhythmKind: "block",
      scheduleBlocks: pickDemoBlocks(row),
      monthDays: null,
    }
  })
  return { schedules: enriched, rhythmDemoCount }
}

function isNearTermOnTrack(row) {
  return (
    row.scheduleStatus === "Confirmed" &&
    (row.onboardingStatus === "Compliant" || row.onboardingStatus === "Not Applicable")
  )
}

function nearTermGreenStats(schedules, referenceDate) {
  const near = schedules.filter((r) => scheduleIntersectsOperationalHorizon(r, referenceDate))
  const onTrack = near.filter(isNearTermOnTrack)
  return {
    nearTermCount: near.length,
    onTrackCount: onTrack.length,
    onTrackPct: near.length ? onTrack.length / near.length : 1,
  }
}

function normalizeSchedule(row) {
  const preceptorName = row["Preceptor Name.1"] || row["Preceptor Name"] || ""
  const preceptorEmail = row["Preceptor Email.1"] || row["Preceptor Email"] || ""
  const reqNames = row["Requirement Name"]
    ? row["Requirement Name"].split(",").map((s) => s.trim()).filter(Boolean)
    : []

  return {
    id: row["Schedule ID"],
    studentName: nullIfEmpty(row["Student Name"]),
    studentEmail: nullIfEmpty(row["Student Email"]),
    school: row.School,
    discipline: row.Discipline,
    specialization: row.Specialization,
    experienceType: row["Experience Type"],
    location: row.Location,
    department: row.Department,
    unit: nullIfEmpty(row.Unit),
    locationGroup: nullIfEmpty(row["Location Group"]),
    startDate: row["Schedule Start Date"],
    endDate: row["Schedule End Date"],
    shift: nullIfEmpty(row.Shift),
    daysOfWeek: nullIfEmpty(row["Days of week"]),
    hours: row["Number of Hours"] ? Number(row["Number of Hours"]) : null,
    preceptorName: nullIfEmpty(preceptorName),
    preceptorEmail: nullIfEmpty(preceptorEmail),
    scheduleStatus: row["Schedule Status"],
    onboardingStatus: row["Onboarding Status"],
    requirements: {
      total: Number(row["Total No. of Requirements"] || 0),
      pending: Number(row["No. of Requirements Pending"] || 0),
      notApproved: Number(row["No. of Requirements Not Approved"] || 0),
      approved: Number(row["No. of Requirements Approved"] || 0),
      names: reqNames,
    },
    flaggedForHire: row["Flagged For Hire"] === "Yes",
    flaggedForHireCount: Number(row["Flagged For Hire Count"] || 0),
    flaggedBy: nullIfEmpty(row["Flagged By"]),
    hiringRemarks: nullIfEmpty(row["Hiring Remarks"]),
  }
}

function buildTimeBucketIndex(monthRows, bucketKey, scheduleById) {
  const byBucket = {}
  const seen = new Set()
  for (const row of monthRows) {
    const bucket = row[bucketKey]
    const sid = row["Schedule ID"]
    const key = `${bucket}|${sid}`
    if (seen.has(key)) continue
    seen.add(key)
    const schedule = scheduleById.get(sid)
    if (!byBucket[bucket]) byBucket[bucket] = []
    byBucket[bucket].push({
      [bucketKey === "Month" ? "month" : bucketKey === "Week" ? "week" : "day"]: bucket,
      scheduleId: sid,
      scheduleStatus: schedule?.scheduleStatus ?? row["Schedule Status"],
      onboardingStatus: schedule?.onboardingStatus ?? row["Onboarding Status"],
      startDate: schedule?.startDate ?? row["Schedule Start Date"],
    })
  }
  return byBucket
}

function main() {
  if (!XLSX_PATH || !existsSync(XLSX_PATH)) {
    console.error("Schedule workbook not found.")
    console.error(
      "Place Mapple_Health_Schedule_Dummy_Data.xlsx in data/ at repo root or exxat-calendar-2.0/data/, or set MAPple_SCHEDULE_XLSX.",
    )
    process.exit(1)
  }

  readXlsx(XLSX_PATH)
    .then((sheets) => {
      const byName = Object.fromEntries(sheets.map((s) => [s.name, s.rows]))
      const schedulesTable = byName.Schedules
      if (!schedulesTable?.length) throw new Error("Schedules sheet missing or empty")

      const normalized = tableToObjects(schedulesTable).map(normalizeSchedule)
      const operational = PRESERVE_RAW_SCENARIOS
        ? normalized
        : applyNearTermOperationalReality(normalized, REFERENCE_DATE)
      const { schedules, rhythmDemoCount } = applyRhythmDemoProfiles(operational, REFERENCE_DATE)
      const scheduleById = new Map(schedules.map((s) => [s.id, s]))
      const nearTerm = nearTermGreenStats(schedules, REFERENCE_DATE)
      const disciplines = [...new Set(schedules.map((s) => s.discipline))].sort()

      const monthRows = tableToObjects(byName.Month ?? [])
      const weekRows = tableToObjects(byName.Week ?? [])
      const dayRows = tableToObjects(byName.Day ?? [])

      const monthIndex = buildTimeBucketIndex(monthRows, "Month", scheduleById)
      const weekIndex = buildTimeBucketIndex(weekRows, "Week", scheduleById)
      const dayIndex = buildTimeBucketIndex(dayRows, "Day", scheduleById)

      const manifest = {
        version: 1,
        source: "Mapple_Health_Schedule_Dummy_Data.xlsx",
        sourcePath: XLSX_PATH.replace(ROOT + "/", ""),
        generatedAt: new Date().toISOString(),
        scheduleCount: schedules.length,
        disciplines,
        referenceDate: REFERENCE_DATE,
        preserveRawScenarios: PRESERVE_RAW_SCENARIOS,
        operationalHorizonDays: OPERATIONAL_HORIZON_DAYS,
        nearTermOnTrackPct: Math.round(nearTerm.onTrackPct * 1000) / 10,
        nearTermScheduleCount: nearTerm.nearTermCount,
        sheets: {
          Schedules: schedules.length,
          Month: monthRows.length,
          Week: weekRows.length,
          Day: dayRows.length,
        },
      }

      mkdirSync(OUT, { recursive: true })
      writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2))
      writeFileSync(join(OUT, "schedules.json"), JSON.stringify(schedules))
      writeFileSync(join(OUT, "schedules-by-month.json"), JSON.stringify(monthIndex))
      writeFileSync(join(OUT, "schedules-by-week.json"), JSON.stringify(weekIndex))
      writeFileSync(join(OUT, "schedules-by-day.json"), JSON.stringify(dayIndex))

      console.log(`Source: ${XLSX_PATH}`)
      console.log(
        `Reference date: ${REFERENCE_DATE}${PRESERVE_RAW_SCENARIOS ? " (raw scenarios preserved)" : ""}`,
      )
      console.log(`Wrote ${schedules.length} schedules → ${OUT}`)
      console.log(`Rhythm demo profiles (month-day / blocks): ${rhythmDemoCount}`)
      console.log(`Disciplines: ${disciplines.length}`)
      console.log(
        `Near-term on-track (today+${OPERATIONAL_HORIZON_DAYS}d): ${nearTerm.onTrackCount}/${nearTerm.nearTermCount} (${(nearTerm.onTrackPct * 100).toFixed(1)}%)`,
      )
      console.log(`Rollups: month=${monthRows.length} week=${weekRows.length} day=${dayRows.length}`)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

main()
