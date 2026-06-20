# Frontend Handoff — Backend Freeze Checkpoint

**Status:** Backend/data layer **FROZEN** as of this checkpoint.  
**Safe to begin UI refinement (Phase 2A+).** Do not modify frozen files without a new data-contract review.

---

## Product URL

| Item | Value |
|------|-------|
| **Product URL** | `http://localhost:5176/slot-requests/list` |
| **Dev command** | `npm run dev` (Vite pinned to port 5176) |
| **Tenant label** | MedStar Health (header + compare modal) |
| **`?dataset=`** | Stripped on load — **must not** change product data |
| **`?debugScenario=`** | QA only — loads static medical-surgical fixture; not product path |
| **`?facilitator=1`** | Shows prototype frame indicator only |

Related routes in app shell (`/slot-requests`, `/slot-requests/reports`) render the same Slot Requests page; **calendar product experience lives on `/slot-requests/list`**.

---

## Verification gate (run before/after UI PRs)

```bash
npm run verify:medstar:all   # index + scope + workflow + contract + guardrails + build
```

Individual scripts: `verify:medstar`, `verify:medstar-index`, `verify:medstar-contract`, `verify:product-guardrails`, `verify:phase-1c`, `verify:phase-1d`.

See also: [DATA_CONTRACT.md](./DATA_CONTRACT.md)

---

## Real data summary (frozen)

| Metric | Value |
|--------|-------|
| Requests (Layer A) | **2,470** (2,467 unique IDs) |
| Scenarios (Layer B) | **466** |
| Calendar display rows | **455** scoped (Aug–Dec 2026, top/active scenarios) |
| Calendar units | **33** unique units |
| KPI reference date | **Aug 15, 2026** (`MEDSTAR_CALENDAR_FOCUS_DATE`) |

### KPI source (defined — do not rewire)

| Surface | Row source | Function |
|---------|------------|----------|
| KPI **values** (pending / in review / awaiting / age / expiring) | Full **2,470** rows + local approve/hold/decline overrides | `computeApprovalWorkflowKpis(kpiRows)` via `SlotRequestsCalendarWorkspace` |
| KPI **captions** (e.g. “327 slots in review”) | Scoped **calendar** rows (`model.rows`, ~455) | `approvalKpiCaption()` in `calendar-shell.tsx` |

**Known UI debt (Phase 2A):** headline counts and captions use different row sets/units (requests vs slots). Backend contract is intentional; **fix in UI only** by aligning captions to `kpiRows`.

### Scenario lookup (exact — frozen)

1. Card click → `MedStarClusterSurface.scenarioId`
2. `setApprovalCluster({ requestIds, scenarioId })`
3. `resolveScenarioForCluster(store, ids, scenarioId)` — **when `scenarioId` is set, only `getScenarioById`**
4. Outcome continue-compare preserves `scenarioId`

**Never** use overlap scoring or partial match when `scenarioId` is available.

---

## Data fields UI can rely on

### `SlotRequestRow` (calendar + compare + decide)

From `src/app/lib/slot-requests-calendar/types.ts` via `medStarRequestToRow`:

- `id`, `school`, `status` (`Request Pending` | `Review` | `Approved` | `Declined` | `Canceled`)
- `requestedLocation`, `requestedDuration`, `requestedSlots`, `approvedInfo`
- `pendingDuration`, `programType`, `requestedShifts`, `availabilityName`, etc.

### `MedStarClusterSurface` (calendar cards)

From `buildMedStarClusterSurface()` — `src/app/lib/medstar-real/cluster-surface.ts`:

- `scenarioId`, `unit`, `shift`, `dateSpan`
- `totalRequests`, `activeCount`, `schoolCount`
- `requestedSlots`, `approvedSlots`, `pressureLabel`
- `cardPrimary`, `cardSecondary`, `cardMeta`, `ariaLabel`, `postureColor`

### `MedStarScenario` (compare header + workflow)

From active scenario via `resolveScenarioForCluster`:

- `id`, `location`, `shiftName`, `recordCount`, `schoolCount`, `activeCount`
- `requestedSlotsTotal`, `approvedSlotsTotal`, `pressureBand`
- `requestIds[]`, `earliestStart`, `latestEnd`

### Compare modal (`proto.primaryRows` / `proto.contextRows`)

- **Primary:** active Review / Request Pending rows in scenario
- **Context:** Approved / Declined / Canceled (+ locally declined)
- Counts must match scenario metadata (`recordCount`, active split)

### Decide (`buildScenarioRecommendedAction`)

- `action`, `why`, `potentialImpact`, `otherAffected`, `remains`
- Labeled **recommendation-supported**, not backend rules

### Outcome (`WorkflowOutcome` / `buildScenarioOutcome`)

- `type`, `school`, `consequenceLead`, `consequenceDetail`
- `remainingActive`, `continueCompareIds`, **`scenarioId`**
- Dynamic: “N requests in this scenario still need review”

### Hover (`ApprovalHoverCard`, MedStar mode)

- Unit · shift, request/school counts (no capacity/headroom on MedStar path)

### `ApprovalWorkflowKpis`

- `pendingRequests`, `inReview`, `awaitingDecision`, `avgApprovalAgeDays`, `expiringThisWeek`

---

## Safe to change (UI refinement)

Frontend designers and UI engineers **may** edit layout, typography, spacing, colors, copy tone, and interaction polish in:

### Calendar shell & timeline
- `src/app/components/calendar/calendar-shell.tsx` — KPI strip presentation, toolbar
- `src/app/components/calendar/calendar-shared.tsx` — date header, grid lines
- `src/app/components/calendar/concept-coda.tsx` — approval timeline layout, expand/collapse defaults
- `src/app/components/calendar/concept-planner.tsx` — operations mode (if touched)
- `src/app/components/calendar/scope/*` — scope UI chrome

### Cards & hover
- `src/app/components/calendar/approval-object-card.tsx` — card layout/typography
- `src/app/components/calendar/approval-hover-card.tsx` — hover presentation (keep MedStar guardrails)
- `src/app/components/calendar/gold-partner-star.tsx`

### Workflow modals (presentation only)
- `src/app/components/calendar/approval-request-modal.tsx` — compare/decide shell styling
- `src/app/components/calendar/decision-compare-table.tsx` — table layout, sticky header
- `src/app/components/calendar/decision-intelligence-band.tsx` — verdict band copy/layout
- `src/app/components/calendar/decision-intelligence.tsx` — badges, panels (MedStar path gating must remain)
- `src/app/components/calendar/usability-prototype/workflow-outcome-modal.tsx`
- `src/app/components/calendar/usability-prototype/workflow-verdict-band.tsx` — **MedStar mode** props must stay
- `src/app/components/calendar/usability-prototype/prototype-chrome.tsx` — hide facilitator chrome on product path

### Workspace wiring (UI-only options)
- `src/app/components/SlotRequestsCalendarWorkspace.tsx` — default zoom, scroll focus (no KPI source change)
- `src/app/components/SlotRequestsCalendarView.tsx` — layout wrappers only
- `src/app/components/SlotRequestsListView.tsx` — tab chrome (grid/kanban); calendar delegates to workspace

### Styles
- `src/styles/globals.css`, Tailwind classes in components above

---

## DO NOT touch (frozen backend/data)

### Index pipeline & verification
- `scripts/build-medstar-index.mjs`
- `scripts/verify-*.mjs`, `scripts/lib/medstar-contract-lib.mjs`
- `public/medstar/*` (generated indexes — rebuild via `npm run build:medstar-index`)
- `docs/DATA_CONTRACT.md` (reference only; update only with data-layer changes)

### MedStar data layer
- `src/app/lib/medstar-data/**` — store, adapter, scope, lookup, workflow outcomes
- `src/app/lib/medstar-real/cluster-surface.ts` — field **names/shapes** frozen (presentation consumers may change)
- `src/app/lib/medstar-real/adapter.ts`, `types.ts`, `review-order.ts`

### Routing & product guardrails
- `src/app/lib/decision-workflow/product-route.ts`
- `src/app/lib/decision-workflow/debug-scenario.ts`
- `src/app/App.tsx` — product path default (`/slot-requests/list`)
- `vite.config.ts` — port 5176

### Workflow state (logic frozen; UI wrappers OK)
- `src/app/components/calendar/usability-prototype/workflow-prototype-context.tsx` — state machine, overrides, scenario outcomes
- `src/app/components/calendar/useCalendarModel.ts` — cluster state shape (`scenarioId`), KPI wiring contract

### Fixture / decision engine (used for fallback & derived signals)
- `src/app/lib/mock/usability-fixture-alignment.ts` — override logic
- `src/app/lib/mock/usability-prototype-rows.ts`
- `src/app/lib/slot-requests-calendar/decision-engine/**` — do not expose fixture capacity copy on MedStar path

### KPI computation
- `src/app/lib/slot-requests-calendar/calendar-workflow-kpis.ts`

---

## Must-not-break rules

1. **Product URL** stays `/slot-requests/list` with no `?dataset=` behavior.
2. **MedStarDataStore.load()** is the only product data path; fixture fallback **only** on load failure.
3. **`scenarioId`** must propagate: card → `setApprovalCluster` → compare → outcome continue.
4. **Exact scenario lookup** — no fuzzy/overlap matching when `scenarioId` exists.
5. **KPI values** must continue to use full **2,470** rows (+ overrides) via `kpiRows`; do not silently switch to scoped rows for headline counts.
6. **Forbidden on MedStar product path:** Hopkins-first sequence, “over cap”, “capacity exceeded”, “Wed Oct 15” fixture grain, fake headroom as truth.
7. **`npm run verify:medstar:all`** must pass before merging UI work that touches workflow wiring.
8. Do not add `?dataset=` or new URL switches that alter production data loading.

---

## Pinned demo scenarios (for QA)

| Label | scenarioId |
|-------|------------|
| Medical Surgical | `SC-5T_-_Med_Surg_Neuro/Stroke--Day_Shift_(1-2026-08-24-58` |
| Behavioral Health | `SC-Behavioral_Health--Day_Shift_(12-Hours)--2026-07-06-13` |
| Emergency | `SC-Emergency--Day_Shift_(12-Hours)--07:00_--2026-08-21-7` |

Compare → Decide → Outcome verified for all three via `verify:phase-1d`.

---

## Phase 2A UI scope (next step — not started)

See UI readiness audit. Suggested first UI-only tasks:

1. Align KPI captions with `kpiRows` (requests vs slots)
2. Default calendar collapsed / week zoom for demo
3. Sidebar label dedupe and truncation
4. Compare/decide modal product tone (remove prototype labels)
5. Suppress hover when modals open

**Do not start Phase 2A until explicitly requested.**
