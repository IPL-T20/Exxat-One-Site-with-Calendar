#!/usr/bin/env node
/**
 * Verify public/mapple schedule indexes match data/Mapple_Health_Schedule_Dummy_Data.xlsx.
 */
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const OUT = join(ROOT, "public/mapple")

function fail(msg) {
  console.error(`verify:schedule-index FAILED — ${msg}`)
  process.exit(1)
}

const manifestPath = join(OUT, "manifest.json")
const schedulesPath = join(OUT, "schedules.json")

if (!existsSync(manifestPath) || !existsSync(schedulesPath)) {
  fail("Run npm run build:schedule-index first.")
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
const schedules = JSON.parse(readFileSync(schedulesPath, "utf8"))

if (manifest.source !== "Mapple_Health_Schedule_Dummy_Data.xlsx") {
  fail(`Unexpected manifest.source: ${manifest.source}`)
}

if (schedules.length !== manifest.scheduleCount) {
  fail(`scheduleCount mismatch: manifest=${manifest.scheduleCount} json=${schedules.length}`)
}

if (schedules.length !== 2000) {
  fail(`Expected 2000 schedules from workbook, got ${schedules.length}`)
}

const ampUnits = schedules.filter((r) => r.unit?.includes("&amp;"))
if (ampUnits.length > 0) {
  fail(`${ampUnits.length} records still contain HTML-encoded ampersands in unit`)
}

const facilityCount = new Set(schedules.map((r) => r.location)).size
const departmentCount = new Set(schedules.map((r) => r.department)).size
const locationDepartmentPairs = new Set(
  schedules.map((r) => `${r.location}|||${r.department}`),
).size
const disciplineCount = new Set(schedules.map((r) => r.discipline)).size

if (facilityCount !== 8) fail(`Expected 8 XLSX Location facilities, got ${facilityCount}`)
if (departmentCount !== 23) fail(`Expected 23 XLSX Department values, got ${departmentCount}`)
if (locationDepartmentPairs !== 35) {
  fail(`Expected 35 Location+Department pairs, got ${locationDepartmentPairs}`)
}
if (disciplineCount !== 13) fail(`Expected 13 XLSX Discipline values, got ${disciplineCount}`)

const missingDepartment = schedules.filter((r) => !r.department?.trim())
if (missingDepartment.length > 0) {
  fail(`${missingDepartment.length} records missing XLSX Department`)
}

const ids = new Set(schedules.map((r) => r.id))
if (ids.size !== schedules.length) {
  fail("Duplicate Schedule IDs in schedules.json")
}

const required = [
  "id",
  "school",
  "discipline",
  "startDate",
  "endDate",
  "scheduleStatus",
  "onboardingStatus",
  "experienceType",
]
for (const row of schedules.slice(0, 50)) {
  for (const key of required) {
    if (row[key] === undefined || row[key] === "") {
      fail(`Row ${row.id} missing required field ${key}`)
    }
  }
}

for (const file of ["schedules-by-month.json", "schedules-by-week.json", "schedules-by-day.json"]) {
  if (!existsSync(join(OUT, file))) fail(`Missing ${file}`)
}

const refDate = manifest.referenceDate ?? "2026-06-18"
const horizonDays = manifest.operationalHorizonDays ?? 14
const ref = new Date(refDate + "T12:00:00")
const horizon = new Date(ref)
horizon.setDate(horizon.getDate() + horizonDays)
const refIso = ref.toISOString().slice(0, 10)
const horizonIso = horizon.toISOString().slice(0, 10)
const nearTerm = schedules.filter((r) => r.startDate <= horizonIso && r.endDate >= refIso)
const onTrack = nearTerm.filter(
  (r) =>
    r.scheduleStatus === "Confirmed" &&
    (r.onboardingStatus === "Compliant" || r.onboardingStatus === "Not Applicable"),
)
const onTrackPct = nearTerm.length ? onTrack.length / nearTerm.length : 1
if (!manifest.preserveRawScenarios && onTrackPct < 0.95) {
  fail(
    `Near-term on-track rate ${(onTrackPct * 100).toFixed(1)}% is below 95% (expected ~98% for today+${horizonDays}d)`,
  )
}

console.log("verify:schedule-index OK")
console.log(`  schedules: ${schedules.length}`)
console.log(
  `  near-term on-track: ${onTrack.length}/${nearTerm.length} (${(onTrackPct * 100).toFixed(1)}%)`,
)
console.log(`  generated: ${manifest.generatedAt}`)
console.log(`  source: ${manifest.sourcePath ?? manifest.source}`)
