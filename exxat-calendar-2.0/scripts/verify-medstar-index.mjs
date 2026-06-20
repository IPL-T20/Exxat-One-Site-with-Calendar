#!/usr/bin/env node
/**
 * Verify generated public/medstar indexes (no dev server required).
 */
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { EXPECTED, loadMedstarIndexes, countOrphanScenarioRequestIds } from "./lib/medstar-contract-lib.mjs"

const failures = []

function assert(condition, message) {
  if (!condition) failures.push(message)
}

function main() {
  const { manifest, requests, scenariosIndex, requestIdSet } = loadMedstarIndexes()
  const orphanScenarioRequestIds = countOrphanScenarioRequestIds(requestIdSet, scenariosIndex)

  const report = {
    manifestLoaded: true,
    requestCount: requests.length,
    uniqueRequestCount: requestIdSet.size,
    scenarioCount: (scenariosIndex.scenarioIds ?? []).length,
    orphanScenarioRequestIds,
    duplicateDisplayIds: manifest.duplicateDisplayIds ?? [],
  }

  console.log("=== MedStar Index Verification ===")
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

  assert(report.requestCount === EXPECTED.requestCount, `record count must be ${EXPECTED.requestCount}`)
  assert(
    report.uniqueRequestCount === EXPECTED.uniqueRequestCount,
    `unique request IDs must be ${EXPECTED.uniqueRequestCount}`,
  )
  assert(report.scenarioCount === EXPECTED.scenarioCount, `scenario count must be ${EXPECTED.scenarioCount}`)
  assert(orphanScenarioRequestIds === 0, "orphan scenario request IDs must be 0")
  assert(report.requestCount === manifest.requestCount, "manifest.requestCount must match index")
  assert(report.uniqueRequestCount === manifest.uniqueRequestCount, "manifest.uniqueRequestCount must match")
  assert(report.scenarioCount === manifest.scenarioCount, "manifest.scenarioCount must match")

  if (failures.length) {
    console.log("\nFAIL")
    failures.forEach((f) => console.log("  ✗", f))
    process.exitCode = 1
  } else {
    console.log("\nPASS")
  }
}

main()
