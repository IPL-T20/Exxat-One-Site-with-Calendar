#!/usr/bin/env node
/**
 * Product-path guardrails — static checks (no dev server).
 */
import { readFileSync, existsSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..")
const failures = []

function read(rel) {
  const path = join(ROOT, rel)
  if (!existsSync(path)) {
    failures.push(`Missing file: ${rel}`)
    return ""
  }
  return readFileSync(path, "utf8")
}

function assert(condition, message) {
  if (!condition) failures.push(message)
}

console.log("=== Product Guardrails ===\n")

// Route
const appTsx = read("src/app/App.tsx")
assert(appTsx.includes('"/slot-requests/list"'), "App.tsx must define /slot-requests/list as product route")

// ?dataset= stripped
const productRoute = read("src/app/lib/decision-workflow/product-route.ts")
assert(
  productRoute.includes("sanitizeProductSearchParams"),
  "product-route.ts must strip ?dataset=",
)
assert(
  productRoute.includes('params.delete("dataset")'),
  "product-route.ts must delete dataset param",
)

// debugScenario QA-only
const debugScenario = read("src/app/lib/decision-workflow/debug-scenario.ts")
assert(
  debugScenario.includes("Internal QA deep-link"),
  "debug-scenario.ts must document QA-only usage",
)

// Fixture fallback only on load failure
const medstarContext = read("src/app/lib/medstar-data/medstar-data-context.tsx")
assert(
  medstarContext.includes('setSource("fixture")') &&
    medstarContext.includes("load failed"),
  "MedStarDataProvider must set fixture source only on load failure",
)
assert(
  !medstarContext.includes("getSlotRequestRows") ||
    medstarContext.includes("FIXTURE_ROWS = getSlotRequestRows"),
  "Fixture rows must be named FIXTURE_ROWS fallback",
)

// Exact scenario lookup module exists
assert(
  existsSync(join(ROOT, "src/app/lib/medstar-data/scenario-lookup.ts")),
  "scenario-lookup.ts must exist for exact scenario resolution",
)

// No approximate overlap scoring in medstar-data
const medstarDataFiles = [
  "src/app/lib/medstar-data/medstar-data-context.tsx",
  "src/app/lib/medstar-data/scenario-lookup.ts",
  "src/app/lib/medstar-data/index.ts",
]
for (const rel of medstarDataFiles) {
  const src = read(rel)
  assert(!src.includes("findBestScenario"), `${rel} must not use findBestScenario`)
  assert(!src.includes("overlapScore"), `${rel} must not use overlap scoring`)
}

// Compare modal prefers scenarioId via exact resolver
const approvalModal = read("src/app/components/calendar/approval-request-modal.tsx")
assert(
  approvalModal.includes("cluster?.scenarioId") &&
    approvalModal.includes("resolveScenarioForCluster"),
  "ApprovalClusterModal must resolve via resolveScenarioForCluster (scenarioId exact path)",
)

// Continue compare preserves scenarioId
const calendarView = read("src/app/components/SlotRequestsCalendarView.tsx")
assert(
  calendarView.includes("scenarioId"),
  "SlotRequestsCalendarView continue-compare must pass scenarioId",
)

// DATA_CONTRACT doc
assert(
  existsSync(join(ROOT, "docs/DATA_CONTRACT.md")),
  "docs/DATA_CONTRACT.md must exist",
)

if (failures.length) {
  console.log("FAIL")
  failures.forEach((f) => console.log("  ✗", f))
  process.exitCode = 1
} else {
  console.log("PASS — all product guardrails satisfied")
  console.log("  product route:     /slot-requests/list")
  console.log("  ?dataset=:         stripped (no product effect)")
  console.log("  ?debugScenario=:   QA only")
  console.log("  fixture fallback:  MedStarDataStore.load() failure only")
}
