# Enterprise validation corpus — manifest

**Dataset:** `ENTERPRISE_VALIDATION_SLOT_REQUESTS` in `src/app/lib/mock/slot-requests-enterprise-validation.ts`  
**Location registry:** `src/app/lib/mock/enterprise-validation-locations.ts` (95 units)  
**Load:** `?dataset=enterprise-validation`  
**Capacity overrides:** `enterprise-capacity-overrides.ts` (tags `[VALID-*]`, `[STRESS-*]`, `[ENT-*]`)

## Purpose

Expose weaknesses in Approval Calendar **before UI refinement**: hierarchy depth, aggregation at Day/Week/Month/Year, clustering, capacity math, footprint competition, Gold rarity, and decision-support blind spots.

**No UI changes** — data-only stress corpus.

## Corpus profile (build-time)

| Metric | Target | Delivered |
|--------|--------|-----------|
| Registry locations | 90–100 | **95** |
| Unique locations in rows | ≥ 90 | **≥ 90** (validated at build) |
| Total rows | Enterprise density | **~2,400+** (validated at build) |
| Schools | Many + long-tail | **70** in pool |
| Gold partner rows | Rare (~10–15%) | **~2%** (55 rows · 5 Gold schools) |
| Facilities | Multi-site | **8** MedStar facilities |

## Location hierarchy tiers (95 units)

| Bucket | Count | Disciplines per unit |
|--------|------:|---------------------|
| Simple clinics | 12 | 1 |
| Paired specialty | 8 | 2 |
| Med-surg / ambulatory | 25 | 3–5 |
| ICU / ED / rehab | 28 | 6–10 |
| Institute hubs | 15 | 11–15 |
| Academic mega-hubs | 7 | 16–20 |

**Healthcare mix (20 disciplines):** Nursing, Medical Surgical, ICU, PT, OT, SLP, Respiratory Therapy, Radiologic Technology, Sonography, Pharmacy, Social Work, Psychology, Counseling, Dietetics, Behavioral Health, Pediatrics, Imaging, Surgical Technology, Medical Assistant, Allied Health.

**Hierarchy rendering:** Registry disciplines merge into the Approval Calendar tree via `validation-registry-tree.ts` — empty disciplines appear as expandable rows (0 requests) alongside light / saturated / hotspot disciplines.

**Load tiers (`VALID-MATRIX`):** ~18% empty · light · moderate · saturated · hotspot (mega-hubs) — per discipline, not uniform cycling.

## Scenario index (`[VALID-*]` tags)

### Scheduling & overlap topology

| Tag | Stresses |
|-----|----------|
| `VALID-ISO` | Isolated requests — no competition |
| `VALID-COMP-10/20/30/52/55` | True footprint competition (10 → 55 requests) |
| `VALID-COMP-STEALTH` | Compete with minimal calendar overlap |
| `VALID-FALSE-SHIFT-DAY/NIGHT` | Same dates — different shift (no competition) |
| `VALID-FALSE-WD-MWF/TTH` | Same shift — different weekdays |
| `VALID-OVERLAP-IDENTICAL` | Identical date ranges |
| `VALID-OVERLAP-NESTED` | Nested date ranges |
| `VALID-OVERLAP-PARTIAL` | Partial overlap |
| `VALID-OVERLAP-MINIMAL` | Minimal edge overlap |
| `VALID-OVERLAP-NON` | Non-overlapping windows |
| `VALID-SEQ-A/B` | Back-to-back / handoff cohorts |
| `VALID-SCHED-WEEKEND` | Weekend-only footprints |
| `VALID-SCHED-ALT` | Alternating weekday patterns |
| `VALID-LONG` | Multi-year placements |
| `VALID-SHORT` | Short-term blocks |

### Capacity

| Tag | Stresses |
|-----|----------|
| `VALID-CAP-EMPTY` | Empty / near-zero demand |
| `VALID-CAP-UNDER` | Underutilized |
| `VALID-CAP-BALANCED` | Balanced load |
| `VALID-CAP-NEAR` | Approaching capacity |
| `VALID-CAP-OVER` | Over-capacity demand |
| `VALID-CAP-OVER-APPROVED/PENDING` | Approved overbook + pending queue (2G ICU) |
| `VALID-CAP-UNEVEN` | One discipline dominates |
| `VALID-CAP-FUTURE` | Future-capacity risk |

### Schools & Gold

| Tag | Stresses |
|-----|----------|
| `VALID-MULTI-DISC` | One school → many disciplines |
| `VALID-MULTI-LOC` | One school → many locations |
| `VALID-SCHOOL-REPEAT` | Repeat schools system-wide |
| `VALID-SCHOOL-LONGTAIL` | Long-tail single-request schools |
| `VALID-GOLD-VS-NON` | Gold vs non-Gold (rare) |
| `VALID-GOLD-VS-GOLD` | Gold vs Gold |
| `VALID-GOLD-SPARSE` | Gold in simple sparse unit |

### Seasonal / Year view

| Tag | Stresses |
|-----|----------|
| `VALID-SEASON-FALL` | Fall concentration |
| `VALID-SEASON-SUMMER-LULL` | Low-demand summer |
| `VALID-SEASON-Q1/Q3` | Quarterly spikes |
| `VALID-YEAR-RECUR` | Recurring annual demand (3 years) |
| `VALID-MATRIX` | Per-discipline load tiers (empty / light / moderate / saturated / hotspot) across all registered disciplines |

### Aggregation

| Tag | Stresses |
|-----|----------|
| `VALID-LARGE-VS-SMALL-GROUP/RIVAL` | 10-slot block vs 35×1-slot |
| `VALID-MIXED-STATES` | Pending / review / approved / declined / canceled in one cluster |
| `VALID-SPECIALTY` | Imaging, pharmacy, allied health spread |

## Hot rows (manual QA)

| Unit | Slug | Primary scenario |
|------|------|------------------|
| 7E - IMCU | `7e-imcu` | 55-request Fri Day pile |
| 9E - Med Surg/Tele | `9e-med-surg-tele` | 52-request TTh pile |
| NICU | `*nicu*` | 30-request cluster |
| 2G - Medical ICU | `2g-medical-icu` | Overbook approved + pending |
| 4H - Burn/Trauma ICU | `4h-burn-trauma-icu` | Shift false-overlap |
| Behavioral Health | `behavioral-health` | Gold vs Gold / vs non-Gold |
| Multidisciplinary Clinic | `*multidisciplinary*` | Multi-discipline school stress |

## Validation checklist (DecisionSnapshot + calendar chrome)

- [ ] 95 location rows expand/collapse without timeout
- [ ] Single-discipline clinics render as leaf rows (no false grouping)
- [ ] Hub units show 10–15 discipline children
- [ ] Fri pile merges as **one footprint cluster**, not date-only blob
- [ ] Day/Night on 4H render as **separate** competition groups
- [ ] MWF vs TTh on Oncology do **not** share competition class
- [ ] 2G row shows overbook when approved + pending exceed cap
- [ ] Gold rows ≤ ~12% of corpus; stars-only card chrome (when wired)
- [ ] Year view shows fall spike bands + multi-year long-run footprints
- [ ] Month/week clusters ≥ 30 requests remain readable (aggregation stress)
- [ ] Hover + modal survive 50+ request clusters without empty state

## Related datasets

| ID | Use |
|----|-----|
| `baseline` | Regression (45 rows) |
| `enterprise` | Legacy 250+ corpus |
| `enterprise-stress` | Narrow DecisionSnapshot stress (366 rows) |
| **`enterprise-validation`** | **Primary enterprise-scale validation** |
