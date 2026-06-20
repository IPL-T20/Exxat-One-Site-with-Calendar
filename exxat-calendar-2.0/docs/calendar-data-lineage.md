# Calendar Data Lineage Report

**Date:** 2026-06-03  
**Scope:** `exxat-calendar-2.0` — slot-requests calendar prototype  
**Constraint:** No existing fixtures overwritten; additive entity layer only.

---

## 1. Repository data inventory

| Asset | Path | Role | Records |
|-------|------|------|--------:|
| **Slot requests (canonical)** | `src/app/lib/mock/slot-requests.ts` | Primary healthcare-placement fixture; shared by list grid + calendar | **45** |
| **Slot request types** | `slot-requests.ts` + `types.ts` (`SlotRequestRow`) | Row shape for calendar pipeline | — |
| **Calendar parse helpers** | `src/app/lib/slot-requests-calendar/parse.ts` | Location, discipline, date parsing | — |
| **Location capacity catalog** | `src/app/lib/mock/location-capacity-catalog.ts` | Explicit capacity profiles (catalog + derived) | **27** locations |
| **Calendar entity factory** | `src/app/lib/mock/calendar-entity-factory.ts` | Builds Availability, Placement, Schedule from rows | — |
| **Calendar data bundle** | `src/app/lib/mock/calendar-data-bundle.ts` | Single assembly entry for `useCalendarModel` | — |
| **Jobs mock (unrelated)** | `src/app/data/mockData.ts` | Jobs/candidates demo only — **not** wired to calendar | — |
| **Design context (narrative)** | `src/imports/pasted_text/site-admin-context.md` | IA reference for site-admin flows | — |
| **Prior dataset audit** | `docs/slot-requests-dataset-audit.md` | Row/discipline/location statistics | — |

### Slot-request fixture (real repository data)

| Field | Source |
|-------|--------|
| `id` | Preserved sequential ids (`9000001001` …) in `slot-requests.ts` |
| `school` | 22 real school names from fixture |
| `availabilityName` | Site-published availability labels (e.g. `FALL 2026 MUMH NURSING 7E IMC`) |
| `requestedLocation` | MedStar facilities + units + location groups |
| `programType` | 12 program types → discipline via `parseDiscipline()` |
| `requestedDuration` | Parsed to `Date` range via `parseDurationRange()` |
| `requestedSlots`, `pendingDuration`, shifts, days, dates | Direct from fixture |
| `status` | Real distribution: Pending 29 · Approved 10 · Review 3 · Declined 2 · Canceled 1 |

### Derived at runtime (not separate fixtures)

| Entity | Builder | Count (full dataset) |
|--------|---------|---------------------:|
| **Discipline** | `parseDiscipline(programType)` | 9 unique |
| **Location unit / group** | `parseLocationParts(requestedLocation)` | 27 units · 8 groups |
| **Timeline `Placement`** | `rowToPlacement()` | 45 (timed subset used in tree) |
| **Location tree** | `buildLocationTree(rows, capacityCatalog)` | 27 location nodes |
| **Conflicts** | `detectConflicts(locations)` | **2** intervals |
| **Utilization** | `UtilizationSnapshot` from tree metrics | per discipline node |
| **KPIs** | `siteKpis(locations)` | pending/review/approved/capacity/conflicts |

### Synthesized entity records (new — built from slot requests, never mutating source)

| Entity | Builder | Count (full dataset) |
|--------|---------|---------------------:|
| **Availability** | `buildAvailabilityRecords()` | deduped from `availabilityName + location + programType` |
| **Placement record** | `buildPlacementRecords()` | **45** (1:1 with slot requests) |
| **Schedule record** | `buildScheduleRecords()` | **10** (approved rows with parseable dates) |
| **Location capacity profile** | `buildLocationCapacityCatalog()` | **27** |
| **Operations timeline bars** | `scheduleToTimelinePlacement()` | **10** keyed by discipline id |

---

## 2. Real vs mock matrix

| Entity | Real repository data | Derived data | Mock / synthesized data |
|--------|---------------------|--------------|-------------------------|
| **Slot request** | ✅ `SLOT_REQUESTS` (45 rows, all fields) | — | — |
| **School** | ✅ `school` on each row | — | — |
| **Location** | ✅ `requestedLocation` string | ✅ `locationId`, unit, facility, group via `parseLocationParts` | — |
| **Program / discipline** | ✅ `programType` | ✅ `discipline` via `parseDiscipline` | — |
| **Status** | ✅ `status` on each row | — | — |
| **Dates** | ✅ `requestedDuration` text | ✅ `start` / `end` `Date` via `parseDurationRange` | — |
| **Slot counts** | ✅ `requestedSlots` | ✅ approved slot sums in tree KPIs | — |
| **Availability** | ✅ name + location + program on rows | ✅ dedupe key + `slotRequestIds[]` | ✅ stable `ava-*` ids (hash of key) |
| **Placement** | ✅ request fields | ✅ `Placement` for timeline; `PlacementRecord` links | ✅ `plc-{requestId}` wrapper ids |
| **Schedule** | ✅ approved rows + parsed dates + shifts | ✅ lifecycle from `CALENDAR_TODAY` | ✅ `sch-{requestId}` ids; lifecycle enum |
| **Capacity** | ✅ 8 catalogued units (site-admin values) | ✅ peak-approved sweep per location | ✅ derived cap = `max(20, ceil(peak×1.15))` for unknown units |
| **Discipline capacity** | — | ✅ weighted split of location cap (Nursing 65%, PT 20%, …) | — |
| **Conflict** | — | ✅ interval sweep vs discipline capacity | — |
| **Utilization** | — | ✅ `approvedSlots / capacity` per discipline | — |

**Not wired to calendar (remain disconnected by design):**

| Surface | Data | Notes |
|---------|------|-------|
| Overview tab | Hardcoded KPIs in `SlotRequestsPage.tsx` | 83/271/16/181/1 — not from `SLOT_REQUESTS` |
| List pagination | `TOTAL_ITEMS = 2456` | Display-only; page slices real 45 rows |
| Jobs views | `mockData.ts` | Separate product demo |

---

## 3. Calendar data architecture

```
SLOT_REQUESTS (slot-requests.ts) — READ ONLY
        │
        ▼
buildCalendarDataBundle(filteredRows)     ← scope filter via rowMatchesScope
        │
        ├── buildAvailabilityRecords()     → AvailabilityRecord[]
        ├── buildLocationCapacityCatalog() → LocationCapacityRecord[]
        ├── buildPlacementRecords()        → PlacementRecord[]
        ├── buildScheduleRecords()         → ScheduleRecord[]
        ├── buildLocationTree(rows, catalog) → LocationNode[]
        ├── detectConflicts(locations)     → ConflictRecord[]
        ├── buildScheduleTimelineByDiscipline() → Map<disciplineId, Placement[]>
        └── utilizationSnapshots           → UtilizationSnapshot[]

useCalendarModel(SLOT_REQUESTS)
        │
        ├── Approval mode → ConceptCodaTimeline
        │       visiblePlacements(disc.placements)  ← slot-request statuses
        │       KPIs: pending count, review count, approved slots, capacity %, conflicts
        │
        └── Operations mode → ConceptPlannerTimeline
                disciplineTimelinePlacements(scheduleBars + pending/review forecast)
                KPIs: capacity/utilization, conflicts, open slots
                Capacity layer + conflict shading from tree + conflictRecords
```

**Mode-specific primary timeline objects:**

| Mode | Primary timeline object | Secondary / overlay |
|------|-------------------------|---------------------|
| **Approval** | Slot-request `Placement` (all statuses per layer rules) | Approved shown as secondary emphasis |
| **Operations** | `ScheduleRecord` → `Placement` (`timelineKind: "schedule"`) | Pending / Review as forecast bars |

**Reference date:** `CALENDAR_TODAY = 2026-06-05` (`constants.ts`) — drives schedule lifecycle (Scheduled / Active / Completed).

---

## 4. Screens using real data

| Screen / component | Real data consumed |
|--------------------|-------------------|
| **Slot requests list grid** | `SLOT_REQUESTS` slice (ids, schools, locations, statuses, dates) |
| **Calendar — Approval (Coda)** | Row statuses, schools, locations, disciplines, parsed date ranges, slot counts |
| **Calendar — Operations (Planner)** | Schedule records sourced from **approved** rows (same dates/slots/shifts) |
| **KPI strip** | `siteKpis` from scoped location tree — pending/review **request counts**, approved **slot sum** |
| **Scope popover facets** | Distinct values from scoped rows (location, discipline, program, school, status, group) |
| **Detail panel** | Selected placement fields from underlying slot request |
| **Conflict shading** | Derived from real approved + pending slot loads vs capacity |

---

## 5. Screens using synthesized data

| Screen / component | Synthesized / derived layer |
|--------------------|----------------------------|
| **Calendar — Operations timeline bars** | `ScheduleRecord` entities (`sch-{id}`) mapped to timeline `Placement` |
| **Calendar — capacity sidebar %** | `LocationCapacityRecord` + discipline weight split |
| **Calendar — capacity gradient overlay** | Utilization from synthesized caps (not from API) |
| **Calendar — conflict intervals** | `detectConflicts()` — not persisted fixtures |
| **Availability context (model only)** | `model.availabilities` — deduped windows; UI unchanged, data ready |
| **Overview tab charts/KPIs** | Still hardcoded — **not** updated (out of scope) |

---

## 6. Field-level synthesis documentation

| Field | Source | Derived or Mock | Generation logic |
|-------|--------|-----------------|------------------|
| `AvailabilityRecord.id` | — | Mock | `ava-` + slug of `availabilityName\|unit\|programType` |
| `AvailabilityRecord.slotRequestIds` | `SlotRequest.id` | Derived | All rows sharing dedupe key |
| `AvailabilityRecord.discipline` | `programType` | Derived | `parseDiscipline()` |
| `AvailabilityRecord.locationId` | `requestedLocation` | Derived | `locationId(unit)` |
| `PlacementRecord.id` | `SlotRequest.id` | Mock | `plc-{slotRequestId}` |
| `PlacementRecord.scheduleId` | `status` | Derived | `sch-{id}` if Approved, else `null` |
| `PlacementRecord.availabilityId` | Availability build | Derived | Lookup by request id |
| `ScheduleRecord.id` | `SlotRequest.id` | Mock | `sch-{slotRequestId}` |
| `ScheduleRecord.slots` | `requestedSlots` | Real | Copied from approved row |
| `ScheduleRecord.start/end` | `requestedDuration` | Derived | `parseDurationRange()` |
| `ScheduleRecord.status` | dates + `CALENDAR_TODAY` | Derived | Before today → Completed; spans today → Active; else Scheduled |
| `ScheduleRecord.disciplineId` | location + discipline | Derived | `{locationId}::{discipline-slug}` |
| `LocationCapacityRecord.totalSlots` | unit name + approved peak | Catalog or Derived | 8 known caps from site-admin map; else `max(20, ceil(peak×1.15))` |
| `LocationCapacityRecord.disciplineCaps` | location cap + discipline mix | Derived | Nursing 65%, PT 20%, remainder split |
| `LocationCapacityRecord.source` | unit name | Derived | `"catalog"` if in `KNOWN_LOCATION_CAPACITY`, else `"derived"` |
| `UtilizationSnapshot.utilizationPct` | tree aggregates | Derived | `round(approvedSlots / capacity × 100)` |
| `ConflictRecord.*` | placements + caps | Derived | Sweep-line over timed placements; forecast if pending contributes |
| `Placement.timelineKind` | mode mapping | Derived | `"slot-request"` from `rowToPlacement`; `"schedule"` from schedule mapper |
| `Timeline bar id (operations)` | ScheduleRecord | Mock | `sch-{slotRequestId}` (distinct from request id for selection) |

---

## 7. Entity lineage summary

| Entity | Real repository data | Derived data | Mock data |
|--------|---------------------|--------------|-----------|
| Slot request | All 45 rows | — | — |
| School | `school` column | — | — |
| Location | `requestedLocation` | `locationId`, facility, group | — |
| Program | `programType` | Discipline label | — |
| Status | `status` | KPI counts | — |
| Dates | `requestedDuration` | `start`, `end` | — |
| Availability | Name, location, program on rows | Deduped groups, request links | Stable `ava-*` ids |
| Placement | Request fields | Timeline placement, metrics | `plc-*` record ids |
| Schedule | Approved requests | Lifecycle status, discipline id | `sch-*` record ids |
| Capacity | 8 catalog unit caps | Peak sweep, discipline weights | Derived caps for 19 units |
| Conflict | — | Interval detection | — |
| Utilization | — | Per-discipline % | — |

---

## 8. Wiring checklist (implemented)

- [x] `buildCalendarDataBundle()` — single assembly path
- [x] `useCalendarModel` exposes availabilities, schedules, capacity, conflicts, utilization
- [x] **Approval:** `ConceptCodaTimeline` → slot-request placements + real statuses
- [x] **Operations:** `ConceptPlannerTimeline` → schedule records as primary bars + pending/review forecast
- [x] Capacity catalog extracted from inline `build-tree` map (preserved values)
- [x] `slot-requests.ts` unchanged
- [x] No layout / interaction changes

---

## 9. Regenerating counts

After changing `SLOT_REQUESTS`, rebuild and inspect:

```bash
cd exxat-calendar-2.0
npm run build
```

Bundle assembly runs at runtime in `useCalendarModel`; counts above reflect the 45-row fixture as of 2026-06-03.
