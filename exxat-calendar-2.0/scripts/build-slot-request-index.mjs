#!/usr/bin/env node
/**
 * Build runtime slot-request indexes from Mapple_Health_Slot_Request_Dummy_Data.xlsx.
 * Output: public/mapple/slot-requests.json, slot-requests-by-{month,week,day}.json, slot-requests-manifest.json
 */
import { existsSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { readXlsx, tableToObjects, nullIfEmpty } from "./lib/xlsx-reader.mjs"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const IN_APP_XLSX = join(ROOT, "data/Mapple_Health_Slot_Request_Dummy_Data.xlsx")
const MONOREPO_XLSX = join(ROOT, "../data/Mapple_Health_Slot_Request_Dummy_Data.xlsx")
const XLSX_PATH =
  process.env.MAPPLE_SLOT_REQUEST_XLSX ??
  (existsSync(IN_APP_XLSX)
    ? IN_APP_XLSX
    : existsSync(MONOREPO_XLSX)
      ? MONOREPO_XLSX
      : null)
const OUT = join(ROOT, "public/mapple")

function normalizeSlotRequest(row) {
  // Direct XLSX column mapping — do not infer location/department from other fields.
  const department = row["Department/Unit (Level 2)"]?.trim() ?? ""
  const unit = nullIfEmpty(row["Department/Unit (Level 3)"])

  return {
    id: row["Request ID"],
    programName: row["Program Name"],
    programCategory: nullIfEmpty(row["Program Category"]),
    availabilityName: row["Availability Name"],
    availabilityId: row["Availability ID"],
    locationLabel: row["Location/Department/Unit"],
    location: row["Location (Level 1)"],
    department,
    unit,
    locationGroup: nullIfEmpty(row["Location Group"]),
    discipline: row.Discipline,
    specialization: row.Specialization,
    startDate: row["Requested Start Date"],
    endDate: row["Requested End Date"],
    requestedSlots: Number(row["Requested Slots"] || 0),
    studentName: nullIfEmpty(row["Student Name"]),
    studentEmail: nullIfEmpty(row["Student Email"]),
    ciFacultyName: nullIfEmpty(row["CI/Faculty Name"]),
    ciFacultyEmail: nullIfEmpty(row["CI/Faculty Email"]),
    approvedSlots: row["Approved Slots"] !== "" ? Number(row["Approved Slots"]) : null,
    approvedSlotsWithStudents:
      row["Approved Slots with students"] !== ""
        ? Number(row["Approved Slots with students"])
        : null,
    approvedSlotsWithoutStudents:
      row["Approved Slots without students"] !== ""
        ? Number(row["Approved Slots without students"])
        : null,
    status: row.Status,
    approvedOn: nullIfEmpty(row["Approved On"]),
    requestedDate: row["Requested Date"],
    experienceType: row["Experience Type"],
    shifts: nullIfEmpty(row.Shifts),
    daysOfWeek: nullIfEmpty(row["Days of week"]),
    preceptor: nullIfEmpty(row.Preceptor),
    semester: nullIfEmpty(row.Semester),
    rotationNumber: nullIfEmpty(row["Rotation Number"]),
    graduationMonth: nullIfEmpty(row["Graduation Month"]),
    graduationYear: nullIfEmpty(row["Graduation Year"]),
    createdBy: nullIfEmpty(row["Created By"]),
  }
}

function buildTimeBucketIndex(bucketRows, bucketKey, requestById) {
  const byBucket = {}
  const seen = new Set()
  for (const row of bucketRows) {
    const bucket = row[bucketKey]
    const requestId = row["Request ID"]
    const key = `${bucket}|${requestId}`
    if (seen.has(key)) continue
    seen.add(key)
    const request = requestById.get(requestId)
    if (!byBucket[bucket]) byBucket[bucket] = []
    byBucket[bucket].push({
      [bucketKey === "Month" ? "month" : bucketKey === "Week" ? "week" : "day"]: bucket,
      requestId,
      status: request?.status ?? row.Status,
      startDate: request?.startDate ?? row["Requested Start Date"],
    })
  }
  return byBucket
}

function main() {
  if (!XLSX_PATH || !existsSync(XLSX_PATH)) {
    console.error("Slot request workbook not found.")
    console.error(
      "Place Mapple_Health_Slot_Request_Dummy_Data.xlsx in data/ at repo root or exxat-calendar-2.0/data/, or set MAPple_SLOT_REQUEST_XLSX.",
    )
    process.exit(1)
  }

  readXlsx(XLSX_PATH)
    .then((sheets) => {
      const byName = Object.fromEntries(sheets.map((s) => [s.name, s.rows]))
      const requestsTable = byName["Slot Requests"]
      if (!requestsTable?.length) throw new Error("Slot Requests sheet missing or empty")

      const slotRequests = tableToObjects(requestsTable).map(normalizeSlotRequest)
      const requestById = new Map(slotRequests.map((r) => [r.id, r]))
      const disciplines = [...new Set(slotRequests.map((s) => s.discipline))].sort()
      const statuses = [...new Set(slotRequests.map((s) => s.status))].sort()

      const monthRows = tableToObjects(byName.Month ?? [])
      const weekRows = tableToObjects(byName.Week ?? [])
      const dayRows = tableToObjects(byName.Day ?? [])

      const monthIndex = buildTimeBucketIndex(monthRows, "Month", requestById)
      const weekIndex = buildTimeBucketIndex(weekRows, "Week", requestById)
      const dayIndex = buildTimeBucketIndex(dayRows, "Day", requestById)

      const manifest = {
        version: 1,
        source: "Mapple_Health_Slot_Request_Dummy_Data.xlsx",
        sourcePath: XLSX_PATH.replace(ROOT + "/", ""),
        generatedAt: new Date().toISOString(),
        slotRequestCount: slotRequests.length,
        disciplines,
        statuses,
        sheets: {
          "Slot Requests": slotRequests.length,
          Month: monthRows.length,
          Week: weekRows.length,
          Day: dayRows.length,
        },
      }

      mkdirSync(OUT, { recursive: true })
      writeFileSync(join(OUT, "slot-requests-manifest.json"), JSON.stringify(manifest, null, 2))
      writeFileSync(join(OUT, "slot-requests.json"), JSON.stringify(slotRequests))
      writeFileSync(join(OUT, "slot-requests-by-month.json"), JSON.stringify(monthIndex))
      writeFileSync(join(OUT, "slot-requests-by-week.json"), JSON.stringify(weekIndex))
      writeFileSync(join(OUT, "slot-requests-by-day.json"), JSON.stringify(dayIndex))

      console.log(`Source: ${XLSX_PATH}`)
      console.log(`Wrote ${slotRequests.length} slot requests → ${OUT}`)
      console.log(`Disciplines: ${disciplines.length}`)
      console.log(`Statuses: ${statuses.join(", ")}`)
      console.log(`Rollups: month=${monthRows.length} week=${weekRows.length} day=${dayRows.length}`)
    })
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

main()
