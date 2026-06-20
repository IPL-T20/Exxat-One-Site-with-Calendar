#!/usr/bin/env node
/**
 * Build runtime indexes from validated V2 Layer A + Layer B assets.
 * Output: public/medstar/manifest.json, requests.index.json, scenarios.index.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const V2_DATA = join(ROOT, "../../Exxat One Site V2/data/slot-requests")
const OUT = join(ROOT, "public/medstar")

const LAYER_A_FILE = "slot_requests.normalized_extract.json"
const LAYER_B_FILE = "calendar_scenarios.json"

const LAYER_A_PATH = join(V2_DATA, LAYER_A_FILE)
const LAYER_B_PATH = join(V2_DATA, LAYER_B_FILE)

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"))
}

function dedupeScenarios(calendarScenarios) {
  const byId = new Map()
  for (const bucket of Object.values(calendarScenarios.buckets ?? {})) {
    for (const scenario of bucket) {
      if (!byId.has(scenario.id)) byId.set(scenario.id, scenario)
    }
  }
  return byId
}

function buildRequestIdToScenarioIds(scenariosById) {
  const map = {}
  for (const scenario of scenariosById.values()) {
    for (const requestId of scenario.requestIds ?? []) {
      const key = String(requestId)
      if (!map[key]) map[key] = []
      if (!map[key].includes(scenario.id)) map[key].push(scenario.id)
    }
  }
  return map
}

function buildScenariosByFootprint(scenariosById) {
  const map = {}
  for (const scenario of scenariosById.values()) {
    const fp = scenario.footprint ?? "(unknown)"
    if (!map[fp]) map[fp] = []
    map[fp].push(scenario.id)
  }
  return map
}

function topScenarioIds(scenariosById, sortKey, limit = 25) {
  return [...scenariosById.values()]
    .sort((a, b) => (b[sortKey] ?? 0) - (a[sortKey] ?? 0) || a.id.localeCompare(b.id))
    .slice(0, limit)
    .map((s) => s.id)
}

function findDuplicateDisplayIds(requests) {
  const counts = new Map()
  for (const row of requests) {
    counts.set(row.id, (counts.get(row.id) ?? 0) + 1)
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id, count]) => ({ id, count }))
}

function verifyIndex(manifest, requests, scenariosIndex) {
  const report = {
    manifestLoaded: true,
    requestCount: requests.length,
    uniqueRequestCount: new Set(requests.map((r) => r.id)).size,
    scenarioCount: scenariosIndex.scenarioIds.length,
    orphanScenarioRequestIds: 0,
    duplicateDisplayIds: manifest.duplicateDisplayIds ?? [],
    warnings: [],
  }

  const requestIdSet = new Set(requests.map((r) => r.id))
  for (const [reqId, scenarioIds] of Object.entries(scenariosIndex.requestIdToScenarioIds)) {
    if (!requestIdSet.has(Number(reqId))) {
      report.orphanScenarioRequestIds++
      if (report.orphanScenarioRequestIds <= 3) {
        report.warnings.push(`Orphan requestId in scenarios: ${reqId}`)
      }
    }
    if (!scenarioIds.length) {
      report.warnings.push(`Empty scenario list for requestId ${reqId}`)
    }
  }

  if (report.requestCount !== manifest.requestCount) {
    report.warnings.push(
      `Request count mismatch: manifest=${manifest.requestCount} actual=${report.requestCount}`,
    )
  }
  if (report.scenarioCount !== manifest.scenarioCount) {
    report.warnings.push(
      `Scenario count mismatch: manifest=${manifest.scenarioCount} actual=${report.scenarioCount}`,
    )
  }

  return report
}

function main() {
  console.log("Building MedStar runtime indexes…")
  console.log("  Layer A:", LAYER_A_PATH)
  console.log("  Layer B:", LAYER_B_PATH)

  const layerA = readJson(LAYER_A_PATH)
  const requests = Array.isArray(layerA) ? layerA : layerA.records ?? layerA.requests ?? []

  const calendarScenarios = readJson(LAYER_B_PATH)
  const scenariosByIdMap = dedupeScenarios(calendarScenarios)
  const scenarioIds = [...scenariosByIdMap.keys()].sort()

  const scenariosById = Object.fromEntries(scenariosByIdMap)
  const requestIdToScenarioIds = buildRequestIdToScenarioIds(scenariosByIdMap)
  const scenariosByFootprint = buildScenariosByFootprint(scenariosByIdMap)

  const duplicateDisplayIds = findDuplicateDisplayIds(requests)
  const generatedAt = new Date().toISOString()

  const manifest = {
    tenantName: "MedStar Health",
    tenantId: "686d063e4597f078505cfa41",
    requestCount: requests.length,
    uniqueRequestCount: new Set(requests.map((r) => r.id)).size,
    scenarioCount: scenarioIds.length,
    generatedAt,
    sources: {
      layerA: LAYER_A_FILE,
      layerB: LAYER_B_FILE,
      layerAPath: LAYER_A_PATH,
      layerBPath: LAYER_B_PATH,
    },
    duplicateDisplayIds,
    indexFiles: {
      requests: "requests.index.json",
      scenarios: "scenarios.index.json",
    },
  }

  const scenariosIndex = {
    scenarioIds,
    scenariosById,
    requestIdToScenarioIds,
    scenariosByFootprint,
    topScenarioIds: {
      byActiveCount: topScenarioIds(scenariosByIdMap, "activeCount"),
      byPressureScore: topScenarioIds(scenariosByIdMap, "pressureScore"),
    },
  }

  const requestsIndex = {
    requests,
    duplicateDisplayIds,
  }

  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2))
  writeFileSync(join(OUT, "requests.index.json"), JSON.stringify(requestsIndex))
  writeFileSync(join(OUT, "scenarios.index.json"), JSON.stringify(scenariosIndex))

  const report = verifyIndex(manifest, requests, scenariosIndex)

  console.log("\n=== MedStar Index Verification ===")
  console.log("  manifest loaded:        ", report.manifestLoaded)
  console.log("  requests loaded:        ", report.requestCount)
  console.log("  unique request IDs:     ", report.uniqueRequestCount)
  console.log("  unique scenarios:       ", report.scenarioCount)
  console.log("  orphan scenario req IDs:", report.orphanScenarioRequestIds)
  console.log(
    "  duplicate displayIds:   ",
    report.duplicateDisplayIds.length,
    report.duplicateDisplayIds.length ? "(non-fatal)" : "",
  )
  if (report.duplicateDisplayIds.length) {
    console.log("    ", JSON.stringify(report.duplicateDisplayIds))
  }
  if (report.warnings.length) {
    console.log("  warnings:")
    report.warnings.forEach((w) => console.log("    -", w))
  }
  console.log("\nWrote:")
  console.log(" ", join(OUT, "manifest.json"))
  console.log(" ", join(OUT, "requests.index.json"))
  console.log(" ", join(OUT, "scenarios.index.json"))

  if (report.orphanScenarioRequestIds > 0) {
    process.exitCode = 1
  }
}

main()
