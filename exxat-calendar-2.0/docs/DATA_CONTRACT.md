# MedStar Data Contract

Stabilization checkpoint for the real-data layer in `exxat-calendar-2.0`. This document defines what is **backend truth**, what is **derived**, what is **inferred recommendation**, and what must **never** be shown as truth on the product path.

**Product route:** `/slot-requests/list` (no `?dataset=`)

---

## Source layers

| Layer | File (V2 repo) | Role | Counts |
|-------|----------------|------|--------|
| **Layer A** | `data/slot-requests/slot_requests.normalized_extract.json` | Authoritative request records (16 fields per row) | **2,470** rows · **2,467** unique `id` values (3 duplicate displayIds) |
| **Layer B** | `data/slot-requests/calendar_scenarios.json` | Authoritative scenario groupings + metadata | **466** unique scenarios |
| **Runtime index** | `public/medstar/{manifest,requests.index,scenarios.index}.json` | Build artifact served by Vite; consumed by `MedStarDataStore.load()` | Same counts as Layer A/B |

Build command: `npm run build:medstar-index`

---

## Pipeline (end-to-end)

```
Layer A + Layer B (V2)
  → build-medstar-index.mjs
  → public/medstar/*.json
  → MedStarDataStore.load()
  → request-adapter (medStarRequestToRow)
  → calendar-scope (Aug–Dec 2026 subset for calendar display)
  → cluster-surface (scenarioId on card click)
  → ApprovalClusterModal (resolveScenarioForCluster)
  → workflow-prototype-context (primary/context rows, local overrides)
  → calendar-workflow-kpis (KPI strip from allRows + overrides)
```

### Key modules

| Module | Responsibility |
|--------|----------------|
| `scripts/build-medstar-index.mjs` | Dedupe scenarios, build indexes, fail on orphan scenario request IDs |
| `MedStarDataStore.ts` | Fetch indexes, `getScenarioById`, `getRequestById` |
| `request-adapter.ts` | Layer A status → UI status (`In-Progress` → `Review`, etc.) |
| `scenario-lookup.ts` | **Exact-only** cluster inference; `scenarioId` wins over inference |
| `calendar-scope.ts` | Calendar rows from top/active scenarios overlapping Aug–Dec 2026 |
| `scenario-workflow.ts` | Primary/context split, recommended action copy, outcome copy |
| `usability-fixture-alignment.ts` | **Local-only** approve/hold/decline overrides (in-memory) |
| `calendar-workflow-kpis.ts` | KPI recomputation from row set + reference date |

---

## What is backend truth

These values come directly from Layer A/B or the built index. UI must not contradict them.

- Request `id`, `school`, API `status`, dates, slots, location, shift
- Scenario `id`, `recordCount`, `schoolCount`, `activeCount`, `requestIds[]`
- Scenario pressure band / score (Layer B)
- Tenant metadata (`MedStar Health`, tenant id)
- KPI counts when computed from **full 2,470 rows** with no local overrides

---

## What is derived intelligence

Computed at runtime from truth + calendar/decision engine helpers. Label as derived, not backend rules.

- Calendar scope row count (~455 rows, 33 units in Aug–Dec 2026 window)
- Cluster card pressure labels (`Extreme pressure`, `High pressure`)
- Compare row ordering (`sortPrimaryReviewRows`, decision-engine snapshots)
- Decision-engine snapshots (`headroomAfterApproval`, `capacityState`, `competitionClass`) — **fixture/decision-engine only; hidden on MedStar product path**
- `formatClusterHeaderMeta` slot demand / cap ratios

---

## What is inferred recommendation

Soft guidance only. Must use language like *recommended*, *inferred*, *not rule-enforced*.

- Compare modal: “Recommended order based on pressure, status, overlap, and request pattern”
- Decide band: “Recommended action · recommendation-supported (not rule-enforced)”
- `buildScenarioRecommendedAction` / `buildScenarioOutcome` copy
- Outcome modal: “X requests in this scenario still need review”

---

## Must never be shown as truth (MedStar product path)

These are **usability-fixture constructs** or decision-engine fiction. Allowed only when `MedStarDataStore.load()` fails and `source === "fixture"`.

| Forbidden on product path | Fixture source |
|---------------------------|----------------|
| “Decide Johns Hopkins first” / Hopkins-first sequence | `USABILITY_SEQUENCE_LINE` |
| “Capacity exceeded” / “blocked by capacity” / “over cap” | Decision engine + fixture triage |
| “Wed Oct 15” busiest-day fixture grain | `USABILITY_FIXTURE_FOCUS_DATE` |
| Hard sequence / partner obligation enforcement | `usabilityTriageRowMeta.sequenceBlocked` |
| Fake capacity / headroom (`Lead headroom if approved`, `0 left on busiest Wed`) | Decision engine + hover card |

---

## Scenario resolution contract

1. **Card click** → `MedStarClusterSurface.scenarioId` (from Layer B scenario that owns all cluster request IDs)
2. **Compare open** → `setApprovalCluster({ requestIds, scenarioId })`
3. **Modal resolve** → `resolveScenarioForCluster(store, ids, scenarioId)`:
   - If `scenarioId` is set → **`getScenarioById` only** (no overlap scoring, no partial match)
   - If `scenarioId` absent → `findExactScenario` (all cluster IDs must be subset of scenario; smallest match wins)
4. **Outcome continue-compare** → must preserve `scenarioId` so step 3 does not re-infer a different scenario

**Never:** request-ID overlap scoring, nearest/partial scenario match when `scenarioId` is available.

---

## Local workflow overrides

Approve / hold / decline in the prototype workflow:

- Stored in `workflow-prototype-context` (`approvedIds`, `declinedIds`, `holdIds`)
- Applied via `applyUsabilityRowOverrides` on **`allRows` (2,470)** for KPI recomputation
- **Not persisted** to Layer A or indexes
- Fixture-only: `hopkinsApproved` flag (ignored when `isMedStarWorkflow`)

---

## Guardrails

| Rule | Enforcement |
|------|-------------|
| Product route | `/slot-requests/list` — see `App.tsx` |
| No `?dataset=` | Stripped by `sanitizeProductSearchParams` / `syncCanonicalProductUrl` |
| `?debugScenario=` | QA only — loads static medical-surgical fixture when id matches `MEDSTAR_SCENARIO_ID` |
| Fixture fallback | **Only** when `MedStarDataStore.load()` rejects — `MedStarDataProvider` catch → 4-row BH fixture |
| Verification | `npm run verify:medstar` (index + scope + workflow + contract + guardrails + build) |

---

## Verification commands

```bash
npm run build:medstar-index   # rebuild indexes from V2 Layer A/B
npm run verify:medstar        # full data-contract gate (no dev server)
npm run verify:medstar:all      # above + production build
```

Individual scripts: `verify:medstar-index`, `verify:phase-1c`, `verify:phase-1d`, `verify:medstar-contract`, `verify:product-guardrails`

---

## Related docs (V2)

- `Exxat One Site V2/data/slot-requests/calendar_domain_model.md` — Layers A–D domain model
- `Exxat One Site V2/data/slot-requests/calendar_ui_readiness.md` — UI build rules

Legacy fixture docs (`docs/calendar-data-lineage.md`) describe the 4-row BH prototype — **not** this pipeline.
