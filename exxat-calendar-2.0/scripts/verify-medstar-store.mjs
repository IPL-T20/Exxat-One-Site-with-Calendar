#!/usr/bin/env node
/**
 * Runtime smoke test for MedStarDataStore (fetch against local dev server or file://).
 * Usage: node scripts/verify-medstar-store.mjs [baseUrl]
 */
const baseUrl = process.argv[2] ?? "http://localhost:5176/medstar"

async function load(base) {
  const root = base.replace(/\/$/, "")
  const [manifestRes, requestsRes, scenariosRes] = await Promise.all([
    fetch(`${root}/manifest.json`),
    fetch(`${root}/requests.index.json`),
    fetch(`${root}/scenarios.index.json`),
  ])
  if (!manifestRes.ok) throw new Error(`manifest ${manifestRes.status}`)
  if (!requestsRes.ok) throw new Error(`requests ${requestsRes.status}`)
  if (!scenariosRes.ok) throw new Error(`scenarios ${scenariosRes.status}`)

  const manifest = await manifestRes.json()
  const requestsIndex = await requestsRes.json()
  const scenariosIndex = await scenariosRes.json()

  const requests = requestsIndex.requests ?? []
  const requestIdSet = new Set(requests.map((r) => r.id))
  let orphanScenarioRequestIds = 0
  for (const reqId of Object.keys(scenariosIndex.requestIdToScenarioIds ?? {})) {
    if (!requestIdSet.has(Number(reqId))) orphanScenarioRequestIds++
  }

  return {
    manifestLoaded: true,
    requestCount: requests.length,
    uniqueRequestCount: requestIdSet.size,
    scenarioCount: (scenariosIndex.scenarioIds ?? []).length,
    orphanScenarioRequestIds,
    duplicateDisplayIds: manifest.duplicateDisplayIds ?? [],
    topByActiveCount: scenariosIndex.topScenarioIds?.byActiveCount?.length ?? 0,
    topByPressureScore: scenariosIndex.topScenarioIds?.byPressureScore?.length ?? 0,
  }
}

load(baseUrl)
  .then((report) => {
    console.log("=== MedStarDataStore runtime load ===")
    console.log("  baseUrl:                ", baseUrl)
    console.log("  manifest loaded:        ", report.manifestLoaded)
    console.log("  requests loaded:        ", report.requestCount)
    console.log("  unique request IDs:     ", report.uniqueRequestCount)
    console.log("  unique scenarios:       ", report.scenarioCount)
    console.log("  orphan scenario req IDs:", report.orphanScenarioRequestIds)
    console.log("  duplicate displayIds:   ", report.duplicateDisplayIds.length, "(non-fatal)")
    console.log("  top scenarios (active): ", report.topByActiveCount)
    console.log("  top scenarios (pressure):", report.topByPressureScore)
  })
  .catch((err) => {
    console.error("MedStarDataStore runtime load failed:", err.message)
    process.exitCode = 1
  })
