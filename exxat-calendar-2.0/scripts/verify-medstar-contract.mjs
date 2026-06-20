#!/usr/bin/env node
/**
 * MedStar data-contract verification — index integrity, scenario lookup, KPIs, overrides.
 */
import {
  EXPECTED,
  PINNED_SCENARIOS,
  KPI_REFERENCE,
  loadMedstarIndexes,
  medStarRequestToRow,
  findExactScenario,
  resolveScenarioForCluster,
  splitScenarioRows,
  recomputeActiveCount,
  applyLocalRowOverrides,
  computeApprovalWorkflowKpis,
  countOrphanScenarioRequestIds,
} from "./lib/medstar-contract-lib.mjs"

const failures = []
const warnings = []

function fail(msg) {
  failures.push(msg)
}

function warn(msg) {
  warnings.push(msg)
}

function assertEq(actual, expected, label) {
  if (actual !== expected) fail(`${label}: expected ${expected}, got ${actual}`)
}

console.log("=== MedStar Data Contract Verification ===\n")

const { manifest, requests, scenariosIndex, requestIdSet } = loadMedstarIndexes()
const scenariosById = scenariosIndex.scenariosById ?? {}
const requestsById = new Map(requests.map((r) => [String(r.id), r]))
const allRows = requests.map(medStarRequestToRow)

// --- Index counts ---
console.log("Index counts")
assertEq(requests.length, EXPECTED.requestCount, "record count")
assertEq(requestIdSet.size, EXPECTED.uniqueRequestCount, "unique request IDs")
assertEq((scenariosIndex.scenarioIds ?? []).length, EXPECTED.scenarioCount, "scenario count")
assertEq(manifest.requestCount, EXPECTED.requestCount, "manifest.requestCount")
console.log(`  ✓ ${EXPECTED.requestCount} records / ${EXPECTED.uniqueRequestCount} unique IDs / ${EXPECTED.scenarioCount} scenarios\n`)

// --- Orphans ---
const orphans = countOrphanScenarioRequestIds(requestIdSet, scenariosIndex)
console.log("Referential integrity")
assertEq(orphans, 0, "orphan scenario request IDs")
console.log(`  ✓ 0 orphan scenario request IDs\n`)

// --- Exact scenario lookup (all multi-request scenarios) ---
console.log("Exact scenario lookup")
let lookupMisses = 0
for (const scenario of Object.values(scenariosById)) {
  if ((scenario.requestIds ?? []).length < 2) continue
  const ids = scenario.requestIds.map(String)
  const found = findExactScenario(scenariosById, ids)
  if (!found || found.id !== scenario.id) {
    lookupMisses++
    if (lookupMisses <= 3) {
      fail(`findExactScenario failed for ${scenario.id}`)
    }
  }
}
if (lookupMisses === 0) {
  console.log(`  ✓ all ${Object.values(scenariosById).filter((s) => (s.requestIds ?? []).length >= 2).length} multi-request scenarios resolve by exact ID set`)
} else {
  fail(`${lookupMisses} scenarios failed exact lookup`)
}

// --- scenarioId wins over inference ---
console.log("\nscenarioId propagation contract")
for (const [label, scenarioId] of Object.entries(PINNED_SCENARIOS)) {
  const scenario = scenariosById[scenarioId]
  if (!scenario) {
    fail(`Pinned scenario missing: ${label} (${scenarioId})`)
    continue
  }
  const subsetIds = scenario.requestIds.slice(0, Math.max(2, scenario.requestIds.length - 1)).map(String)
  const inferred = findExactScenario(scenariosById, subsetIds)
  const resolved = resolveScenarioForCluster(scenariosById, subsetIds, scenarioId)
  if (!resolved || resolved.id !== scenarioId) {
    fail(`${label}: resolveScenarioForCluster must return pinned id when scenarioId provided`)
  } else if (inferred && inferred.id !== scenarioId) {
    console.log(`  ✓ ${label}: scenarioId preserved (inference alone would pick ${inferred.id})`)
  } else {
    console.log(`  ✓ ${label}: scenarioId exact lookup OK`)
  }
}

// --- Pinned scenario metadata ---
console.log("\nPinned scenario metadata")
const PINNED_EXPECTATIONS = {
  [PINNED_SCENARIOS.medicalSurgical]: { compare: 15, active: 4, context: 11 },
  [PINNED_SCENARIOS.behavioralHealth]: { compare: 45, active: 5, context: 40 },
  [PINNED_SCENARIOS.emergency]: { compare: 16, active: 2, context: 14 },
}

for (const [scenarioId, exp] of Object.entries(PINNED_EXPECTATIONS)) {
  const scenario = scenariosById[scenarioId]
  if (!scenario) continue
  const { memberRows, primary, context } = splitScenarioRows(scenario, requestsById)
  assertEq(memberRows.length, exp.compare, `${scenarioId} compare rows`)
  assertEq(primary.length, exp.active, `${scenarioId} active rows`)
  assertEq(context.length, exp.context, `${scenarioId} context rows`)
  assertEq(recomputeActiveCount(scenario, requestsById), scenario.activeCount, `${scenarioId} activeCount parity`)
  console.log(`  ✓ ${scenario.location ?? scenarioId}: ${exp.compare}/${exp.active}/${exp.context}`)
}

// --- KPI baseline ---
console.log("\nKPI baseline (all rows, ref Aug 15 2026)")
const baselineKpis = computeApprovalWorkflowKpis(allRows, KPI_REFERENCE)
const expectedKpis = {
  pendingRequests: 1,
  inReview: 186,
  awaitingDecision: 187,
  avgApprovalAgeDays: 40.9,
  expiringThisWeek: 0,
}
for (const [key, val] of Object.entries(expectedKpis)) {
  if (baselineKpis[key] !== val) {
    fail(`KPI ${key}: expected ${val}, got ${baselineKpis[key]}`)
  }
}
console.log(`  ✓ pending=${baselineKpis.pendingRequests} inReview=${baselineKpis.inReview} awaiting=${baselineKpis.awaitingDecision}`)

// --- Local override → KPI + active count ---
console.log("\nLocal action override simulation")
const bhScenario = scenariosById[PINNED_SCENARIOS.behavioralHealth]
if (bhScenario) {
  const { primary } = splitScenarioRows(bhScenario, requestsById)
  const approveTargetId = primary[0] ? String(primary[0].id) : null
  if (approveTargetId) {
    const overridden = applyLocalRowOverrides(allRows, {
      approvedIds: new Set([approveTargetId]),
    })
    const afterKpis = computeApprovalWorkflowKpis(overridden, KPI_REFERENCE)
    if (afterKpis.inReview !== baselineKpis.inReview - 1) {
      fail(`Approve override: inReview should drop by 1 (${baselineKpis.inReview} → ${afterKpis.inReview})`)
    }
    if (afterKpis.awaitingDecision !== baselineKpis.awaitingDecision - 1) {
      fail(`Approve override: awaitingDecision should drop by 1`)
    }
    let activeAfter = 0
    for (const id of bhScenario.requestIds) {
      const row = overridden.find((r) => r.id === String(id))
      if (row && (row.status === "Review" || row.status === "Request Pending")) activeAfter++
    }
    if (activeAfter !== primary.length - 1) {
      fail(`Approve override: BH active count should be ${primary.length - 1}, got ${activeAfter}`)
    }
    console.log(
      `  ✓ approve ${approveTargetId}: inReview ${baselineKpis.inReview}→${afterKpis.inReview}, BH active ${primary.length}→${activeAfter}`,
    )
  }
}

// --- Active count drift (sample) ---
console.log("\nActive count parity (all scenarios)")
let activeDrift = 0
for (const scenario of Object.values(scenariosById)) {
  const recomputed = recomputeActiveCount(scenario, requestsById)
  if (recomputed !== scenario.activeCount) activeDrift++
}
if (activeDrift > 0) {
  warn(`${activeDrift} scenarios have activeCount drift vs Layer A status (Layer B metadata)`)
  console.log(`  ⚠ ${activeDrift} scenarios with activeCount drift (non-fatal — Layer B source)`)
} else {
  console.log("  ✓ all scenarios activeCount matches Layer A status")
}

// --- Summary ---
console.log("\n=== Summary ===")
if (warnings.length) {
  console.log("Warnings:")
  warnings.forEach((w) => console.log("  ⚠", w))
}
if (failures.length) {
  console.log("FAIL")
  failures.forEach((f) => console.log("  ✗", f))
  process.exitCode = 1
} else {
  console.log("PASS — data contract verified")
}
