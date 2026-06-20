# Decision engine (P0) — canonical scheduling & competition model

**Code:** `src/app/lib/slot-requests-calendar/decision-engine/`  
**Entry:** `buildDecisionSnapshot(rows, capacityRecords)`  
**Wired:** `calendar-data-bundle.ts` → `useCalendarModel().decisionSnapshot`

This document defines the **compute layer only** — no UI. All Approval surfaces (Day/Week/Month/Year, cluster, hover, modal) must consume `DecisionSnapshot` outputs.

---

## 1. Scheduling footprint (per request)

Every `SlotRequestRow` maps to zero or one `SchedulingFootprint` via `buildSchedulingFootprint(row)`.

| Field | Source | Role |
|-------|--------|------|
| `dateStart` / `dateEnd` | `parseDurationRangeExtended(requestedDuration)` | Calendar span |
| `shiftBucket` | normalized from `requestedShifts` | `day12` · `day8` · `night12` · `evening8` · `custom` · `unknown` |
| `weekdays` | parsed from `requestedDaysOfWeek` | Empty raw → **all 7 days** (daily) |
| `discipline` | `parseDiscipline(programType)` | Capacity pool family |
| `locationId` / `locationName` | `parseLocationParts(requestedLocation)` | Unit |
| `facility` / `locationGroup` | location string | Site context |
| `requestedSlots` | row | Slot weight |
| `footprintKey` | `unit::discipline::shift::weekday-pattern` | Cluster merge key |
| `footprintLabel` | e.g. `Fri · Day 12h` | Human-readable footprint |

**Unparseable durations** → row skipped (no snapshot); logged in build stats.

---

## 2. Competition logic

### 2.1 True competition (`requestsTrulyCompete`)

Two requests **compete** iff **all** hold:

1. Same `locationId` (unit)  
2. Same `discipline`  
3. Same `shiftBucket`  
4. **Intersecting** weekday patterns (`weekdaysIntersect`)  
5. **Overlapping** date ranges  
6. Neither is `Declined` / `Canceled`

### 2.2 NOT competition

| Scenario | Why |
|----------|-----|
| Same dates, **different shifts** | Parallel lanes (ENT-T-05) |
| Same span, **MWF vs TTh** | No shared weekdays (ENT-T-06) |
| **Wed-only vs Fri-only** | Disjoint weekdays (ENT-C-04 vs ENT-T-01) |
| Same hospital, **different units** | Different locationId |
| Same unit, **different disciplines** | Nursing vs PT (ENT-X-01) |
| **Back-to-back** adjacent ranges | No date overlap (ENT-T-04) |
| Date overlap only, **disjoint weekdays** | Visual overlap, not footprint competition |

### 2.3 Partial overlap

Date ranges intersect; competition applies only on **shared active days** in the intersection window (`sharedCompetitionDates`). Peak slot math sweeps each calendar day separately.

### 2.4 Competition groups

For clustering/UI (P3): transitive groups of requests with:

- Identical `footprintKey`, and  
- Overlapping date ranges (chain merge)

Group id: `{footprintKey}::{windowStart}::{windowEnd}`

---

## 3. Capacity logic

### 3.1 Consumption model

- **Cap** = discipline cap from `LocationCapacityRecord` for unit (enterprise overrides apply).  
- **Pool** = unit × discipline × **shift bucket** (footprint pools share numeric cap independently per shift).  
- On each calendar day a footprint covers, **approved** slots consume cap.  
- **Pending/Review** contribute to **forecast** peaks, not approved peaks.

### 3.2 Peak calculations (`computePeakLoadForFootprint`)

| Metric | Definition |
|--------|------------|
| `peakApprovedSlots` | Max daily Σ approved slots (same unit, discipline, shift, active weekdays) |
| `peakDemandSlots` | Max daily Σ approved + pending/review |
| `peakIfApproved` | Max daily Σ if **this** request were approved |
| `peakIfAllPendingApproved` | Max daily Σ if **all** queue in pool approved |

### 3.3 Remaining capacity

| Field | Formula |
|-------|---------|
| `remainingHeadroom` | `max(0, cap − peakApproved)` |
| `headroomAfterApproval` | `cap − peakIfApproved` (negative = over) |
| `slotsOverCapIfApproved` | `max(0, peakIfApproved − cap)` |

### 3.4 Capacity state

| State | Condition |
|-------|-----------|
| `open` | peakDemand < 80% cap |
| `tight` | peakDemand ≥ 80% cap |
| `exhausted` | peakDemand ≥ cap |
| `overbooked` | peakApproved > cap |

### 3.5 Future capacity risk

`deriveFutureCapacityRisk(peakIfAllQueueApproved, cap, daysUntilStart)`:

- `critical` if forecast > 120% cap  
- `high` if forecast > cap  
- `medium` if forecast > 85% cap and start > 30 days out  
- else `low`

---

## 4. Gold Partner policy

### 4.1 Detection

`isGoldPartner(row)` if `partnerCategory` contains `"Gold Partner"` OR school prefix matches Towson / Duke / Johns Hopkins.

### 4.2 Queue priority (sort/display only)

| Priority | When |
|----------|------|
| `waitlist` | Review + waitlist partnerCategory |
| `high` | Gold + urgent, or urgent alone |
| `elevated` | Gold alone |
| `standard` | default |

### 4.3 Sort rules (`priorityScore` — higher first)

1. Gold (+1_000_000)  
2. Waitlist lane (+500_000)  
3. Urgent (+250_000)  
4. Requested slots (×10_000)  
5. Queue age (×100)  
6. School name (stable tie-break)

**Gold tie-break** (two Gold on same footprint): higher slots → older queue age → priority score.

### 4.4 Where Gold does NOT apply

- Capacity peaks, headroom, competition class  
- Approval blocking when over cap  
- Cross-discipline or cross-footprint inheritance  
- `futureCapacityRisk` math  

Gold affects **`strategicPriority`** (0–100), **`queuePriority`**, **`priorityScore`**, and **`queueOrder`** only.

---

## 5. DecisionSnapshot model

### 5.1 Per-request (`RequestDecisionSnapshot`)

| Field | Description |
|-------|-------------|
| `footprint` | Full `SchedulingFootprint` |
| `competitionClass` | `compatible` · `soft` · `hard` · `over` |
| `capacityState` | Footprint-worst-day state |
| `approvalRisk` | `low` · `medium` · `high` · `critical` |
| `cap` | Discipline cap at unit |
| `peakApprovedSlots` | Current approved peak |
| `peakDemandSlots` | Approved + queue peak |
| `peakIfApproved` | Peak if this request approved |
| `peakIfAllPendingApproved` | Forecast if all queue approves |
| `remainingHeadroom` | Slots left before cap (approved basis) |
| `headroomAfterApproval` | Slots left if this approves |
| `slotsOverCapIfApproved` | Over-cap amount if approved |
| `competingRequestIds` | True competitors only |
| `competingSchools` | Aggregated by school + slot demand |
| `competingSlotDemand` | Σ competitor slots (approved + queue) |
| `competingQueueDemand` | Σ pending/review competitor slots |
| `competitionGroupId` | Canvas cluster group link |
| `isGoldPartner` | boolean |
| `isWaitlist` | boolean |
| `isUrgent` | start within 14 days of `CALENDAR_TODAY` |
| `queueAgeDays` | `pendingDuration` |
| `queuePriority` | `standard` · `elevated` · `high` · `waitlist` |
| `strategicPriority` | 0–100 composite |
| `priorityScore` | Sort key |
| `daysUntilStart` | From calendar today |
| `futureCapacityRisk` | Row-level forecast risk |

### 5.2 Competition class derivation

| Class | Condition |
|-------|-----------|
| `compatible` | Zero true competitors |
| `soft` | Competitors exist; `peakIfApproved ≤ cap` |
| `hard` | `peakIfApproved > cap` but `peakApproved ≤ cap` |
| `over` | `peakApproved > cap` (already overbooked) |

### 5.3 Per-discipline row (`DisciplineRowDecisionSnapshot`)

Rollup for timeline sidebar: `cap`, `approvedSlots`, `pendingCount`, `reviewCount`, `capacityState`, `forecastPeakSlots`, `futureCapacityRisk`, `worstCompetitionClass`, `goldPartnerQueueCount`.

### 5.4 Competition group (`CompetitionGroupSnapshot`)

Cluster payload: `footprintKey`, `footprintLabel`, `windowStart/End`, `requestIds[]`, slot demands (approved/queue/total), `cap`, school count, gold count, worst class/state/risk.

### 5.5 Top-level (`DecisionSnapshot`)

```typescript
{
  builtAt: Date
  calendarToday: Date
  byRequestId: Record<string, RequestDecisionSnapshot>
  byDisciplineId: Record<string, DisciplineRowDecisionSnapshot>
  competitionGroups: CompetitionGroupSnapshot[]
  queueOrder: string[]  // pending/review ids, priority sorted
}
```

---

## 6. UI consumption map (output fields only)

| UI surface (future) | Primary fields |
|---------------------|----------------|
| **Discipline row** | `DisciplineRowDecisionSnapshot.*` |
| **Request card** | `competitionClass`, `footprint.footprintLabel`, `requestedSlots`, `isGoldPartner`, `isUrgent`, `isWaitlist`, `capacityState` |
| **Cluster chip** | `CompetitionGroupSnapshot.totalSlotDemand`, `cap`, `competingSchoolCount`, `goldRequestCount`, `worstCompetitionClass` |
| **Hover** | `headroomAfterApproval`, `competingSchools`, `competingSlotDemand`, `approvalRisk`, `peakDemandSlots` |
| **List drilldown** | `queueOrder`, per-row `priorityScore`, `headroomAfterApproval`, all card fields |
| **Request modal** | Full `RequestDecisionSnapshot` + `competingRequestIds` detail |

Access helpers on `CalendarModel`:

- `decisionSnapshot`  
- `getRequestDecision(id)`  
- `getDisciplineDecision(disciplineId)`  
- `getCompetitionGroup(groupId)`

---

## 7. Worked examples

Run in browser console after import:

```typescript
import { runDecisionEngineExamples } from "./decision-engine/decision-examples"
runDecisionEngineExamples()
```

### 7.1 Simple request (TTh · Day on 7E)

- **Competition:** `compatible` (no peers)  
- **Headroom:** 8 − 0 = **8** if approved  
- **Risk:** `low`

### 7.2 Competing requests (two Fri · Day, 4 slots each)

- **Each sees:** 1 competitor, `competingSlotDemand=4`  
- **peakIfApproved:** 8 on Fridays → `headroomAfterApproval=0`  
- **Class:** `soft` (both fit exactly) or `hard` if baseline approved load exists

### 7.3 Shift-separated (daily day + daily night)

- **`requestsTrulyCompete`:** `false`  
- **Class:** both `compatible`  
- **Peaks:** independent 4-slot peaks per shift bucket

### 7.4 Weekday-separated (MWF vs TTh)

- **`requestsTrulyCompete`:** `false`  
- **Class:** both `compatible`  
- Validates ENT-T-06 ground truth

### 7.5 Saturated capacity (6 approved + 4 pending Fri)

- **Approved:** `capacityState=overbooked` or `tight`, `remainingHeadroom=2`  
- **Pending:** `competitionClass=hard`, `headroomAfterApproval=-2`, `approvalRisk=high`

### 7.6 Gold vs non-Gold (same Fri footprint)

- **Same** competition class and headroom for both  
- **Gold:** higher `priorityScore`, first in `queueOrder`  
- **Non-gold:** lower priority, identical capacity physics

### 7.7 Large cluster (12 × 2 slots Fri)

- **Single** `CompetitionGroupSnapshot` with `totalSlotDemand=24`, `cap=8`  
- **Each member:** `competingRequestIds.length=11`, `competitionClass=hard`, `peakIfApproved` ≥ 24 on worst Friday

---

## 8. Enterprise corpus validation hooks

| CP code | Engine check |
|---------|--------------|
| CP-SHIFT-LANES | `requestsTrulyCompete(day,night)===false` |
| CP-WEEKDAY-LANES | `requestsTrulyCompete(mwf,tth)===false` |
| CP-FRI-PILE | group `totalSlotDemand` >> `cap` |
| CP-OVERBOOKED | `capacityState===overbooked` on 2G |
| CP-GOLD-GOLD | both `isGoldPartner`, sort by `priorityScore` |

---

## 9. Module index

| File | Responsibility |
|------|----------------|
| `decision-types.ts` | Type definitions |
| `schedule-footprint.ts` | Footprint parse + keys |
| `parse-duration.ts` | Extended date parsing |
| `footprint-competition.ts` | True compete + groups |
| `footprint-capacity.ts` | Peak sweep + headroom |
| `gold-partner-policy.ts` | Gold + priority |
| `build-decision-snapshot.ts` | Orchestrator |
| `decision-examples.ts` | Runnable scenarios |
| `index.ts` | Public exports |

---

*Next phase (P1+): UI reads `DecisionSnapshot` only — no parallel competition math in components.*
