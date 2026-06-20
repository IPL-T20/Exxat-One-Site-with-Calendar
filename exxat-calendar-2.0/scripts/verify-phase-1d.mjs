#!/usr/bin/env node
/**
 * Phase 1D verification — pinned scenarioIds, compare/decide metadata.
 */
import {
  PINNED_SCENARIOS,
  loadMedstarIndexes,
  splitScenarioRows,
  mapMedStarStatus,
} from "./lib/medstar-contract-lib.mjs"

const failures = []

function fail(msg) {
  failures.push(msg)
}

function cardLabel(scenario) {
  return `${scenario.location} · ${scenario.shiftName} (${scenario.recordCount} req, ${scenario.activeCount} active)`
}

const PINNED_EXPECTATIONS = [
  {
    label: "Medical Surgical",
    scenarioId: PINNED_SCENARIOS.medicalSurgical,
    compare: 15,
    active: 4,
    context: 11,
  },
  {
    label: "Behavioral Health",
    scenarioId: PINNED_SCENARIOS.behavioralHealth,
    compare: 45,
    active: 5,
    context: 40,
  },
  {
    label: "Emergency/Telemetry",
    scenarioId: PINNED_SCENARIOS.emergency,
    compare: 16,
    active: 2,
    context: 14,
  },
]

const { scenariosIndex, requests } = loadMedstarIndexes()
const scenariosById = scenariosIndex.scenariosById ?? {}
const requestsById = new Map(requests.map((r) => [String(r.id), r]))

console.log("=== Phase 1D Scenario Verification ===")
console.log("product URL: /slot-requests/list\n")

for (const pick of PINNED_EXPECTATIONS) {
  const scenario = scenariosById[pick.scenarioId]
  if (!scenario) {
    fail(`${pick.label}: scenario not found (${pick.scenarioId})`)
    console.log(`${pick.label}: NOT FOUND\n`)
    continue
  }
  const { memberRows, primary, context } = splitScenarioRows(scenario, requestsById)
  const first = primary[0]

  if (memberRows.length !== pick.compare) {
    fail(`${pick.label}: compare rows expected ${pick.compare}, got ${memberRows.length}`)
  }
  if (primary.length !== pick.active) {
    fail(`${pick.label}: active rows expected ${pick.active}, got ${primary.length}`)
  }
  if (context.length !== pick.context) {
    fail(`${pick.label}: context rows expected ${pick.context}, got ${context.length}`)
  }

  console.log(`${pick.label}:`)
  console.log(`  scenarioId:     ${scenario.id}`)
  console.log(`  card label:     ${cardLabel(scenario)}`)
  console.log(`  compare rows:   ${memberRows.length}`)
  console.log(`  active rows:    ${primary.length}`)
  console.log(`  context rows:   ${context.length}`)
  console.log(
    `  first Decide:   ${first ? `${first.school} / ${mapMedStarStatus(first.status)}` : "(read-only — no active rows)"}`,
  )
  console.log(
    `  outcome after 1 approve: 1 request approved. ${Math.max(0, primary.length - 1)} requests in this scenario still need review.`,
  )
  console.log("")
}

if (failures.length) {
  console.log("FAIL")
  failures.forEach((f) => console.log("  ✗", f))
  process.exitCode = 1
} else {
  console.log("PASS")
}
