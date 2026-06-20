/**
 * Shared MedStar data-contract helpers for verification scripts.
 * Mirrors runtime logic in src/app/lib/medstar-data/* (no TS import required).
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

export const EXPECTED = {
  requestCount: 2470,
  uniqueRequestCount: 2467,
  scenarioCount: 466,
}

export const PINNED_SCENARIOS = {
  medicalSurgical: "SC-5T_-_Med_Surg_Neuro/Stroke--Day_Shift_(1-2026-08-24-58",
  behavioralHealth: "SC-Behavioral_Health--Day_Shift_(12-Hours)--2026-07-06-13",
  emergency: "SC-Emergency--Day_Shift_(12-Hours)--07:00_--2026-08-21-7",
}

export const KPI_REFERENCE = new Date(2026, 7, 15)
export const MS_DAY = 86_400_000

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..")
export const MEDSTAR_DIR = join(ROOT, "public/medstar")

export function readMedstarJson(name) {
  const path = join(MEDSTAR_DIR, name)
  if (!existsSync(path)) throw new Error(`Missing ${path}`)
  return JSON.parse(readFileSync(path, "utf8"))
}

export function loadMedstarIndexes() {
  const manifest = readMedstarJson("manifest.json")
  const requestsIndex = readMedstarJson("requests.index.json")
  const scenariosIndex = readMedstarJson("scenarios.index.json")
  const requests = requestsIndex.requests ?? []
  const requestIdSet = new Set(requests.map((r) => r.id))
  return { manifest, requests, scenariosIndex, requestIdSet }
}

export function mapMedStarStatus(apiStatus) {
  switch (apiStatus) {
    case "In-Progress":
      return "Review"
    case "Approved":
      return "Approved"
    case "Rejected":
      return "Declined"
    case "Revoked":
      return "Canceled"
    case "Draft":
      return "Request Pending"
    default:
      return "Review"
  }
}

export function medStarRequestToRow(req) {
  const loc = req.location?.trim() || "General"
  const path = req.locationPath?.trim()
  const requestedLocation = path ? `${loc} (${path})` : loc
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const formatDuration = (start, end) => {
    if (!start || !end) return "—"
    const s = new Date(start)
    const e = new Date(end)
    return `${MONTHS[s.getUTCMonth()]} ${s.getUTCDate()}–${MONTHS[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`
  }
  return {
    id: String(req.id),
    status: mapMedStarStatus(req.status),
    pendingDuration: req.reqPendingDuration ?? 0,
    requestedLocation,
    requestedDuration: formatDuration(req.startDate, req.endDate),
    requestedSlots: req.requestedSlots ?? 0,
    school: req.school ?? "",
  }
}

export function findExactScenario(scenariosById, requestIds) {
  if (requestIds.length === 0) return undefined
  const nums = requestIds.map((id) => Number(id))
  const scenarios = Object.values(scenariosById)
  const matches = scenarios.filter((scenario) =>
    nums.every((id) => scenario.requestIds.includes(id)),
  )
  if (matches.length === 0) return undefined
  return matches.sort(
    (a, b) =>
      a.requestIds.length - b.requestIds.length ||
      b.activeCount - a.activeCount ||
      a.id.localeCompare(b.id),
  )[0]
}

export function resolveScenarioForCluster(scenariosById, requestIds, scenarioId) {
  if (scenarioId) {
    return scenariosById[scenarioId] ?? undefined
  }
  return findExactScenario(scenariosById, requestIds)
}

export function splitScenarioRows(scenario, requestsById) {
  const memberRows = scenario.requestIds
    .map((id) => requestsById.get(String(id)))
    .filter(Boolean)
  const primary = memberRows.filter((r) => {
    const s = mapMedStarStatus(r.status)
    return s === "Review" || s === "Request Pending"
  })
  const context = memberRows.filter((r) => {
    const s = mapMedStarStatus(r.status)
    return s === "Approved" || s === "Declined" || s === "Canceled"
  })
  return { memberRows, primary, context }
}

export function recomputeActiveCount(scenario, requestsById) {
  let count = 0
  for (const id of scenario.requestIds) {
    const req = requestsById.get(String(id))
    if (!req) continue
    const s = mapMedStarStatus(req.status)
    if (s === "Review" || s === "Request Pending") count++
  }
  return count
}

export function applyLocalRowOverrides(rows, { approvedIds = new Set(), declinedIds = new Set() }) {
  return rows.map((row) => {
    if (declinedIds.has(row.id)) return { ...row, status: "Declined" }
    if (approvedIds.has(row.id)) return { ...row, status: "Approved" }
    return row
  })
}

export function computeApprovalWorkflowKpis(rows, referenceDate = KPI_REFERENCE) {
  const pendingRows = rows.filter((r) => r.status === "Request Pending")
  const reviewRows = rows.filter((r) => r.status === "Review")
  const decisionRows = rows.filter(
    (r) => r.status === "Request Pending" || r.status === "Review",
  )
  const ageSum = decisionRows.reduce((s, r) => s + r.pendingDuration, 0)
  const today = referenceDate.getTime()
  const weekEnd = today + 7 * MS_DAY
  const expiringThisWeek = decisionRows.filter((r) => {
    const normalized = r.requestedDuration.replace(/[–—]/g, "-").trim()
    const match = normalized.match(/^([A-Za-z]+)\s+(\d+)\s*-\s*([A-Za-z]+)\s+(\d+),\s*(\d{4})$/)
    if (!match) return false
    const MONTH_MAP = { Jan:0,Feb:1,Mar:2,Apr:3,May:4,Jun:5,Jul:6,Aug:7,Sep:8,Oct:9,Nov:10,Dec:11 }
    const year = parseInt(match[5], 10)
    const startMonth = MONTH_MAP[match[1]]
    const endMonth = MONTH_MAP[match[3]]
    if (startMonth === undefined || endMonth === undefined) return false
    const startYear = startMonth > endMonth ? year - 1 : year
    const start = new Date(startYear, startMonth, parseInt(match[2], 10)).getTime()
    return start >= today && start <= weekEnd
  }).length

  return {
    pendingRequests: pendingRows.length,
    inReview: reviewRows.length,
    awaitingDecision: decisionRows.length,
    avgApprovalAgeDays: decisionRows.length
      ? Math.round((ageSum / decisionRows.length) * 10) / 10
      : 0,
    expiringThisWeek,
  }
}

export function countOrphanScenarioRequestIds(requestIdSet, scenariosIndex) {
  let orphan = 0
  for (const reqId of Object.keys(scenariosIndex.requestIdToScenarioIds ?? {})) {
    if (!requestIdSet.has(Number(reqId))) orphan++
  }
  return orphan
}
