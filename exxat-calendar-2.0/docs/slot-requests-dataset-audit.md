# Slot Requests Dataset Audit

**Date:** 2026-06-03  
**Scope:** `exxat-calendar-2.0` prototype — calendar + list views  
**Source file:** `src/app/lib/mock/slot-requests.ts`

---

## Executive summary

The **legacy inline dataset** (50 rows, Nursing-only) created a false hierarchy and invalidated multi-discipline calendar evaluation. It was replaced with a **45-row MedStar multi-location sample** spanning **9 derived disciplines**, **12 program types**, **27 location units**, and **22 schools**.

---

## Audit questions (before → after)

| # | Question | Legacy (pre-fix) | Current (post-fix) |
|---|----------|------------------|---------------------|
| 1 | How many unique `programType` values? | **2** (`Pre-Licensure (Nursing)`, `Post-Licensure (Nursing)`) | **12** |
| 2 | How many unique locations exist? | **30** location units | **27** location units |
| 3 | Which fields derive Discipline? | `programType` via `parseDiscipline()` in `parse.ts` — extracts parenthetical suffix `(…)`; falls back to `"Nursing"` if string contains "nursing" | Same derivation — unchanged |
| 4 | Is Nursing the only derived discipline? | **Yes** — 100% of rows → `Nursing` | **No** — 9 disciplines |
| 5 | Are multiple disciplines present? | **No** | **Yes** — see distribution below |
| 6 | Are multiple programs present? | **No** (2 Nursing variants only) | **Yes** — Nursing, PT, OT, SLP, RT, and specialty nursing tracks |
| 7 | Were we incorrectly collapsing everything into Nursing? | **Yes** — all rows used Nursing `programType` patterns | **No** — disciplines distributed by `programType` suffix |

---

## Discipline derivation

**Function:** `parseDiscipline(programType)` in `src/app/lib/slot-requests-calendar/parse.ts`

```ts
// 1. Parenthetical suffix wins: "Pre-Licensure (ICU)" → "ICU"
// 2. Else if programType includes "nursing" → "Nursing"
// 3. Else first token of programType
```

**Implication:** Discipline is **not** a separate column in source data — it is **derived at runtime** from `programType`. Location group (e.g. Medical Surgical, Intensive Care) is a **separate dimension** parsed from `requestedLocation`.

---

## Current dataset statistics

| Metric | Count |
|--------|------:|
| Total rows | 45 |
| Unique `programType` | 12 |
| Unique location units | 27 |
| Unique schools | 22 |
| Unique location groups | 8 |

### Discipline distribution (derived)

| Discipline | Rows |
|------------|-----:|
| Nursing | 14 |
| PT | 5 |
| OT | 5 |
| ICU | 4 |
| SLP | 4 |
| Respiratory Therapy | 4 |
| Medical Surgical | 3 |
| Pediatrics | 3 |
| Behavioral Health | 3 |

### Status distribution

| Status | Rows |
|--------|-----:|
| Request Pending | 29 |
| Approved | 10 |
| Review | 3 |
| Declined | 2 |
| Canceled | 1 |

### Program types (raw)

- `Pre-Licensure (Nursing)`
- `Pre-Licensure (Medical Surgical)`
- `Pre-Licensure (ICU)`
- `Pre-Licensure (Pediatrics)`
- `Pre-Licensure (Behavioral Health)`
- `Post-Licensure (Nursing)`
- `Post-Licensure (ICU)`
- `Doctor of Physical Therapy (PT)`
- `Master of Occupational Therapy (OT)`
- `Master of Science (SLP)`
- `Bachelor of Science (Respiratory Therapy)`
- `Associate of Applied Science (Respiratory Therapy)`

### Location groups (parsed from `requestedLocation`)

Medical Surgical · Intensive Care · Intermediate Care · Behavioral Health · Women's Health · MHVI - Cardiac · Ambulatory · Emergency Medicine

### Facilities represented

MedStar Washington Hospital Center · MedStar Franklin Square Medical Center · MedStar Union Memorial Hospital · MedStar Southern Maryland Hospital Center · MedStar National Rehabilitation Hospital · MedStar Good Samaritan Hospital

---

## Design validation coverage

The updated dataset supports evaluation of:

- **Approval mode (Coda timeline)** — pending/review/declined request density, aging, triage across disciplines
- **Operations mode (Planner timeline)** — approved schedules, capacity overlays, conflict detection across units
- **Compact scope filter** — discipline, program, school, location, location group, status facets with realistic cardinality

---

## Regenerating this audit

From `exxat-calendar-2.0/`:

```bash
node --input-type=module -e "
import { SLOT_REQUESTS } from './src/app/lib/mock/slot-requests.ts';
// … use parseDiscipline / parseLocationParts from parse.ts
"
```

Or inspect facets live via the Scope popover on the Calendar tab.

---

## Screenshots (production architecture)

| Mode | Timeline | File |
|------|----------|------|
| Approval | Coda (request triage) | `docs/screenshots/approval-mode-coda-timeline.png` |
| Operations | Planner (capacity / schedules) | `docs/screenshots/operations-mode-planner-timeline.png` |
