#!/usr/bin/env node
/**
 * Verify public/mapple slot-request indexes match Mapple_Health_Slot_Request_Dummy_Data.xlsx.
 */
import { existsSync, readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const OUT = join(ROOT, "public/mapple")

function fail(msg) {
  console.error(`verify:slot-request-index FAILED — ${msg}`)
  process.exit(1)
}

const manifestPath = join(OUT, "slot-requests-manifest.json")
const requestsPath = join(OUT, "slot-requests.json")

if (!existsSync(manifestPath) || !existsSync(requestsPath)) {
  fail("Run npm run build:slot-request-index first.")
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"))
const slotRequests = JSON.parse(readFileSync(requestsPath, "utf8"))

if (manifest.source !== "Mapple_Health_Slot_Request_Dummy_Data.xlsx") {
  fail(`Unexpected manifest.source: ${manifest.source}`)
}

if (slotRequests.length !== manifest.slotRequestCount) {
  fail(
    `slotRequestCount mismatch: manifest=${manifest.slotRequestCount} json=${slotRequests.length}`,
  )
}

if (slotRequests.length !== 2000) {
  fail(`Expected 2000 slot requests from workbook, got ${slotRequests.length}`)
}

const disciplineCount = new Set(slotRequests.map((r) => r.discipline)).size
if (disciplineCount !== 13) {
  fail(`Expected 13 XLSX Discipline values, got ${disciplineCount}`)
}

const ids = new Set(slotRequests.map((r) => r.id))
if (ids.size !== slotRequests.length) {
  fail("Duplicate Request IDs in slot-requests.json")
}

const required = [
  "id",
  "programName",
  "discipline",
  "startDate",
  "endDate",
  "status",
  "experienceType",
  "requestedSlots",
]
for (const row of slotRequests.slice(0, 50)) {
  for (const key of required) {
    if (row[key] === undefined || row[key] === "") {
      fail(`Row ${row.id} missing required field ${key}`)
    }
  }
}

for (const file of [
  "slot-requests-by-month.json",
  "slot-requests-by-week.json",
  "slot-requests-by-day.json",
]) {
  if (!existsSync(join(OUT, file))) fail(`Missing ${file}`)
}

console.log("verify:slot-request-index OK")
console.log(`  slot requests: ${slotRequests.length}`)
console.log(`  generated: ${manifest.generatedAt}`)
console.log(`  source: ${manifest.sourcePath ?? manifest.source}`)
