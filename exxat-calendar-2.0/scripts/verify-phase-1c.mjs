#!/usr/bin/env node
/**
 * Phase 1C verification — scoped calendar rows, KPIs, scenario coverage.
 */
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const MEDSTAR = join(ROOT, "public/medstar")

const SCOPE_START = new Date(2026, 7, 1)
const SCOPE_END = new Date(2026, 11, 31, 23, 59, 59, 999)
const KPI_REFERENCE = new Date(2026, 7, 15)
const MS_DAY = 86_400_000

function readJson(name) {
  return JSON.parse(readFileSync(join(MEDSTAR, name), "utf8"))
}

function mapStatus(api) {
  switch (api) {
    case "In-Progress": return "Review"
    case "Approved": return "Approved"
    case "Rejected": return "Declined"
    case "Revoked": return "Canceled"
    case "Draft": return "Request Pending"
    default: return "Review"
  }
}

function formatDuration(start, end) {
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  if (!start || !end) return "—"
  const s = new Date(start)
  const e = new Date(end)
  return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}–${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`
}

function parseDurationRange(value) {
  const normalized = value.replace(/[–—]/g, "-").trim()
  const match = normalized.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/)
  if (!match) return null
  const MONTH_MAP = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
  const year = parseInt(match[5], 10)
  const startMonth = MONTH_MAP[match[1]]
  const endMonth = MONTH_MAP[match[3]]
  if (startMonth === undefined || endMonth === undefined) return null
  const startYear = startMonth > endMonth ? year - 1 : year
  return {
    start: new Date(startYear, startMonth, parseInt(match[2], 10)),
    end: new Date(year, endMonth, parseInt(match[4], 10)),
  }
}

function rowOverlapsAugDec2026(duration) {
  const range = parseDurationRange(duration)
  if (!range) return false
  return range.start <= SCOPE_END && range.end >= SCOPE_START
}

function parseUnit(requestedLocation) {
  return requestedLocation.split("(")[0]?.trim() ?? requestedLocation
}

function medStarToRow(req) {
  const loc = req.location?.trim() || "General"
  const path = req.locationPath?.trim()
  const requestedLocation = path ? `${loc} (${path})` : loc
  return {
    id: String(req.id),
    status: mapStatus(req.status),
    pendingDuration: req.reqPendingDuration ?? 0,
    requestedLocation,
    requestedDuration: formatDuration(req.startDate, req.endDate),
    requestedSlots: req.requestedSlots ?? 0,
  }
}

function buildScopedRows(allRows, scenariosIndex) {
  const rowById = new Map(allRows.map((r) => [r.id, r]))
  const requestIds = new Set()
  const topIds = [
    ...(scenariosIndex.topScenarioIds?.byActiveCount ?? []),
    ...(scenariosIndex.topScenarioIds?.byPressureScore ?? []),
  ]
  const seen = new Set()
  for (const sid of topIds) {
    if (seen.has(sid)) continue
    seen.add(sid)
    const scenario = scenariosIndex.scenariosById[sid]
    if (!scenario) continue
    for (const id of scenario.requestIds ?? []) {
      const row = rowById.get(String(id))
      if (row && rowOverlapsAugDec2026(row.requestedDuration)) requestIds.add(row.id)
    }
  }
  if (requestIds.size === 0) {
    return allRows.filter((r) => rowOverlapsAugDec2026(r.requestedDuration))
  }
  return allRows.filter((r) => requestIds.has(r.id))
}

function computeKpis(rows, refDate) {
  const pending = rows.filter((r) => r.status === "Request Pending")
  const review = rows.filter((r) => r.status === "Review")
  const decision = rows.filter((r) => r.status === "Request Pending" || r.status === "Review")
  const ageSum = decision.reduce((s, r) => s + r.pendingDuration, 0)
  const today = refDate.getTime()
  const weekEnd = today + 7 * MS_DAY
  const expiring = decision.filter((r) => {
    const range = parseDurationRange(r.requestedDuration)
    if (!range) return false
    const start = range.start.getTime()
    return start >= today && start <= weekEnd
  }).length
  return {
    pendingRequests: pending.length,
    inReview: review.length,
    awaitingDecision: decision.length,
    avgApprovalAgeDays: decision.length ? Math.round((ageSum / decision.length) * 10) / 10 : 0,
    expiringThisWeek: expiring,
  }
}

const manifest = readJson("manifest.json")
const requestsIndex = readJson("requests.index.json")
const scenariosIndex = readJson("scenarios.index.json")

const allRows = requestsIndex.requests.map(medStarToRow)
const calendarRows = buildScopedRows(allRows, scenariosIndex)
const units = [...new Set(calendarRows.map((r) => parseUnit(r.requestedLocation)))].sort()
const kpis = computeKpis(allRows, KPI_REFERENCE)

console.log("=== Phase 1C Verification ===")
console.log("  product URL:           /slot-requests/list")
console.log("  requests loaded:      ", manifest.requestCount)
console.log("  scenario count:       ", manifest.scenarioCount)
console.log("  calendar scoped rows: ", calendarRows.length)
console.log("  unique calendar units:", units.length)
console.log("  KPI (all 2,470 rows, ref Aug 15 2026):")
console.log("    pendingRequests:    ", kpis.pendingRequests)
console.log("    inReview:           ", kpis.inReview)
console.log("    awaitingDecision:   ", kpis.awaitingDecision)
console.log("    avgApprovalAgeDays: ", kpis.avgApprovalAgeDays)
console.log("    expiringThisWeek:   ", kpis.expiringThisWeek)
console.log("  first 10 calendar units:")
units.slice(0, 10).forEach((u, i) => console.log(`    ${i + 1}. ${u}`))
console.log("  fixture fallback:      only on MedStarDataStore.load() failure")

const failures = []
if (manifest.requestCount !== 2470) failures.push(`request count ${manifest.requestCount} !== 2470`)
if (calendarRows.length !== 455) failures.push(`calendar scoped rows ${calendarRows.length} !== 455`)
if (units.length !== 33) failures.push(`unique calendar units ${units.length} !== 33`)
if (kpis.pendingRequests !== 1) failures.push(`pendingRequests ${kpis.pendingRequests} !== 1`)
if (kpis.inReview !== 186) failures.push(`inReview ${kpis.inReview} !== 186`)
if (kpis.awaitingDecision !== 187) failures.push(`awaitingDecision ${kpis.awaitingDecision} !== 187`)
if (kpis.avgApprovalAgeDays !== 40.9) failures.push(`avgApprovalAgeDays ${kpis.avgApprovalAgeDays} !== 40.9`)
if (kpis.expiringThisWeek !== 0) failures.push(`expiringThisWeek ${kpis.expiringThisWeek} !== 0`)

if (failures.length) {
  console.log("\nFAIL")
  failures.forEach((f) => console.log("  ✗", f))
  process.exitCode = 1
} else {
  console.log("\nPASS")
}
