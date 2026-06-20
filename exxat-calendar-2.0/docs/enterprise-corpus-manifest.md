# Enterprise placement scheduling corpus — manifest

**Dataset:** `ENTERPRISE_SLOT_REQUESTS` in `src/app/lib/mock/slot-requests-enterprise.ts`  
**Load:** append `?dataset=enterprise` to the Slot Requests route (baseline `slot-requests.ts` unchanged at 45 rows).  
**Row count:** 250 (28 scenario tags; throws at build if &lt; 250).  
**Capacity overrides:** `src/app/lib/mock/enterprise-capacity-overrides.ts` — applied automatically when any row carries an `[ENT-*]` tag.

---

## Ontology (scheduling dimensions)

| Dimension | Field(s) | Used by Approval canvas today? |
|-----------|----------|--------------------------------|
| Location unit | `requestedLocation` → `locationId` | Yes — row key |
| Discipline | `programType` | Yes — sub-row under location |
| Date range | `requestedDuration` | Yes — card position + width |
| Shift | `requestedShifts` | **No** — stored only |
| Days of week | `requestedDaysOfWeek` | **No** — stored only |
| Slot weight | `requestedSlots` | Partial — single-card label; not cluster totals |
| Status | `status` | Yes — color + KPIs |
| Partner tier | `partnerCategory` | Partial — gold star heuristic |
| Experience type | `experienceType` | Detail modal only |

**Ground-truth rule:** Real competition is **schedule footprint overlap** (date range ∩ shift ∩ days-of-week). The current Approval timeline treats **date-range overlap only** unless noted otherwise in “Expected visualization behavior.”

---

## Scenario catalog

Each scenario includes: business purpose, operational importance, expected scheduling / approval / visualization behavior, and **ground truth outcome**.

### Capacity & demand

#### ENT-C-01-APPROVED-BASE
| | |
|---|---|
| **Business purpose** | Establish approved baseline load before pending competition arrives. |
| **Why it matters** | Directors need to see committed capacity before judging new requests. |
| **Scheduling behavior** | 2 approved Nursing rows on 7E IMCU, daily day shift, 4 slots each, Sep–Nov 2026. |
| **Approval behavior** | Already approved; new Fri-day pile competes against remaining headroom (cap **8** concurrent with overrides). |
| **Visualization behavior** | Approved cards visible; utilization should reflect ~8 approved slots peak on unit. |
| **Ground truth** | **CP-APPROVED-BASELINE:** Peak approved slots on 7E Nursing = 8 (2×4). Pending Fri requests do not reduce displayed approved load. |

#### ENT-C-01-AVAILABLE
| | |
|---|---|
| **Business purpose** | Low-pressure units with distant future demand. |
| **Why it matters** | Validates that sparse rows do not false-trigger density clusters. |
| **Scheduling behavior** | 5 single-slot requests, Mar–May 2027, Nursing Education ambulatory. |
| **Approval behavior** | Straightforward approve/decline; no competition. |
| **Visualization behavior** | Isolated chips; no cluster on any zoom. |
| **Ground truth** | **CP-OPEN:** Zero conflicts; cards readable at Month/Day. |

#### ENT-C-02-NEARLY-EXHAUSTED
| | |
|---|---|
| **Business purpose** | Unit near cap with mixed approved + pending. |
| **Why it matters** | Tests “one more approval breaks the unit” decisions. |
| **Scheduling behavior** | NICU Franklin: 2 approved (2 slots each) + 4 pending (2 slots). Catalog cap default; moderate utilization. |
| **Approval behavior** | Approving more pending may trigger forecast conflict in Operations mode. |
| **Visualization behavior** | Pending and approved overlap in time — Approval canvas shows overlap as visual pile, not capacity math. |
| **Ground truth** | **CP-NEAR-CAP:** Operations `detectConflicts` may show **forecast** if pending+approved exceed discipline cap; Approval canvas does not surface cap headroom. |

#### ENT-C-03-OVERBOOKED
| | |
|---|---|
| **Business purpose** | Already over-committed approved load (data error or historical exception). |
| **Why it matters** | Site must see overbooking before adding queue. |
| **Scheduling behavior** | 2G ICU: 2 approved rows × 6 slots, daily, Sep–Dec (12 slots vs cap **6**). |
| **Approval behavior** | New approvals should be blocked or escalated. |
| **Visualization behavior** | Operations conflicts KPI &gt; 0; Approval cards still render without red cap breach on canvas. |
| **Ground truth** | **CP-OVERBOOKED:** `detectConflicts` **capacity** kind with slotsOver ≥ 6 on 2G Nursing; Approval timeline does not show breach badge on row. |

#### ENT-C-04-WED-EXHAUST
| | |
|---|---|
| **Business purpose** | Same calendar span, **Wed-only** footprint stacking on hot unit. |
| **Why it matters** | Weekday pattern reduces real overlap vs daily approved baseline. |
| **Scheduling behavior** | 5 pending Wed-only requests on 7E IMCU, 3 slots each, Oct–Dec. |
| **Approval behavior** | Should compete only on Wednesdays vs other Wed requests — **not** vs Fri pile. |
| **Visualization behavior** | **Incorrect today:** date overlap merges Wed pile with Fri pile and daily approved in clusters. |
| **Ground truth** | **CP-WED-ONLY:** Real overlap = Wed instances only (~13 weeks × 3 slots per request vs cap 8 Wed concurrent). Canvas implies full-span competition. |

#### ENT-C-06-FUTURE-RISK
| | |
|---|---|
| **Business purpose** | Late-semester pipeline that will collide when earlier requests approve. |
| **Why it matters** | Strategic planning — November crunch on ICU. |
| **Scheduling behavior** | 8 pending daily requests, Nov–Dec, 3 slots each on 2G ICU (already stressed). |
| **Approval behavior** | Queue ordering by `pendingDuration`; expiring-soon KPI. |
| **Visualization behavior** | Month view clusters Nov starts; Year view buckets to November start month only. |
| **Ground truth** | **CP-FUTURE-RISK:** If ENT-C-03 approved load persists, approving any Nov pipeline row worsens overcap; forecast conflicts span Nov–Dec. |

---

### Temporal competition patterns

#### ENT-T-01-FRI-DAY-PILE
| | |
|---|---|
| **Business purpose** | High-demand **same footprint** — classic approval bottleneck. |
| **Why it matters** | 20 schools competing for Friday day IMCU slots; director prioritization. |
| **Scheduling behavior** | 20 pending/review, Fri + day 12h, Sep–Nov 2026, 2–4 slots on 7E IMCU. |
| **Approval behavior** | Gold + pending duration + slot count should drive queue; only subset can approve. |
| **Visualization behavior** | Week/Day: massive cluster; cluster modal lists schools; **slot totals not summed on chip**. |
| **Ground truth** | **CP-FRI-PILE:** 20 requests, ~44 requested slots, **max 8 concurrent** on unit — **≥36 slots must wait or decline**. Canvas shows “20 requests” not “44 slots / 8 cap”. |

#### ENT-T-02-PARTIAL-OVERLAP
| | |
|---|---|
| **Business purpose** | Staggered cohort starts — partial calendar overlap, not identical windows. |
| **Why it matters** | Director sequences cohorts; overlap severity varies by week. |
| **Scheduling behavior** | 6 requests, TTh, staggered Sep–Nov starts, Franklin 5T Med Surg. |
| **Approval behavior** | Early cohort approval constrains later overlapping cohorts. |
| **Visualization behavior** | Cards offset horizontally; Month merge may chain if 7-day gap rule fires. |
| **Ground truth** | **CP-PARTIAL:** Pairwise overlap fractions 15–85%; conflict severity **week-dependent**, not binary. Canvas treats any date overlap as full collision in clusters. |

#### ENT-T-04-BACK-TO-BACK-A / ENT-T-04-BACK-TO-BACK-B
| | |
|---|---|
| **Business purpose** | Sequential cohort handoff (zero gap desired). |
| **Why it matters** | Maximizes unit utilization without simultaneous over-cap. |
| **Scheduling behavior** | Towson Gold: A ends Oct 17 / Nov 1; B starts Oct 18 / Nov 1; Wed-only. |
| **Approval behavior** | Approve both as pipeline; no simultaneous slot demand if footprints disjoint. |
| **Visualization behavior** | Adjacent cards; should **not** cluster as competing if end+1=start and footprints align. |
| **Ground truth** | **CP-HANDOFF:** Simultaneous slot demand ≤ one cohort; **not** a conflict pair. Date-adjacent cards may still merge in Month zoom (7-day gap). |

#### ENT-T-05-DAY-NIGHT-DAY / ENT-T-05-DAY-NIGHT-NIGHT
| | |
|---|---|
| **Business purpose** | Same dates, **different shifts** — parallel capacity lanes. |
| **Why it matters** | Day and night preceptors are separate resources. |
| **Scheduling behavior** | 4 day + 4 night rows, daily, same span on 7E IMCU. |
| **Approval behavior** | Independent approval paths per shift. |
| **Visualization behavior** | **Failure:** merged into same cluster (date overlap + pixel overlap). |
| **Ground truth** | **CP-SHIFT-LANES:** Zero cross-shift competition. Canvas shows false competition. |

#### ENT-T-06-MWF / ENT-T-06-TTH
| | |
|---|---|
| **Business purpose** | Same span, **different weekday patterns**. |
| **Why it matters** | M/W/F and T/Th cohorts can run concurrently within cap. |
| **Scheduling behavior** | 3 MWF + 3 TTh on 7E IMCU. |
| **Approval behavior** | Approve both patterns if cap allows **per-day** peaks. |
| **Visualization behavior** | Clusters merge all six as overlapping competitors. |
| **Ground truth** | **CP-WEEKDAY-LANES:** At most one shared day (none for MWF vs TTh); **no full-span competition**. Canvas incorrect. |

---

### Partner & school competition

#### ENT-G-03-GOLD-VS-GOLD
| | |
|---|---|
| **Business purpose** | Two Gold partners collide on identical footprint. |
| **Why it matters** | Contractual obligation vs contractual obligation — escalation. |
| **Scheduling behavior** | Towson vs Duke, Fri day, 7E IMCU, 2 slots each. |
| **Approval behavior** | Priority policy needed; both show gold stars. |
| **Visualization behavior** | Stars on cards; cluster aggregate may hide “2 Gold” unless modal opened. |
| **Ground truth** | **CP-GOLD-GOLD:** Both deserve priority flag; **only one** should win Fri footprint; tie-break not modeled in UI. |

#### ENT-G-04-GOLD-IN-PILE
| | |
|---|---|
| **Business purpose** | Gold partner inside large non-Gold pile. |
| **Why it matters** | Risk of burying JHU 6-slot group request in “+18” cluster. |
| **Scheduling behavior** | JHU Gold, group, 6 slots, Fri day, among ENT-T-01 pile. |
| **Approval behavior** | Should surface to top of queue; `sortPlacementsGoldFirst` in modal only. |
| **Visualization behavior** | Cluster chip: request count; gold count in dashboard layout if wide enough. |
| **Ground truth** | **CP-GOLD-BURIED:** Gold visually discoverable only after drill-in; **6 slots** materially larger than peers — slot weight lost in aggregate. |

#### ENT-A-03-SAME-SCHOOL-MULTI
| | |
|---|---|
| **Business purpose** | One school, multiple units (GWU across MWHC system). |
| **Why it matters** | Affiliation strategy — avoid double-committing same cohort. |
| **Scheduling behavior** | GWU × 4 locations, Oct–Nov 2026. |
| **Approval behavior** | Coordinator may approve all; school-side constraint external. |
| **Visualization behavior** | Four separate discipline rows; no cross-row “GWU total” band. |
| **Ground truth** | **CP-MULTI-SITE-SCHOOL:** No automatic school-level aggregation on canvas; director must mentally sum. |

#### ENT-X-01-CROSS-DISCIPLINE
| | |
|---|---|
| **Business purpose** | PT/OT on same **location** as Nursing pile. |
| **Why it matters** | Discipline-specific caps; shared unit calendar noise. |
| **Scheduling behavior** | PT Wed + OT Fri on 7E IMCU (different discipline rows). |
| **Approval behavior** | Independent discipline approval. |
| **Visualization behavior** | **Success:** separate sub-rows under 7E; Nursing pile does not mix PT/OT. |
| **Ground truth** | **CP-CROSS-DISC:** Row isolation correct; location header queue count sums all disciplines (may overstate Nursing-only pressure). |

---

### Density & cluster families

#### ENT-D-01-HOMOGENEOUS-20
| | |
|---|---|
| **Business purpose** | 20 similar weekend requests — cluster density stress test. |
| **Why it matters** | Validates progressive disclosure at scale. |
| **Scheduling behavior** | Franklin 5T, weekend day, Sep–Nov, cap **6**. |
| **Approval behavior** | Majority must waitlist/decline. |
| **Visualization behavior** | Month: aggregate chip “20 req · N schools”; Week: cluster modal required. |
| **Ground truth** | **CP-CLUSTER-20:** ~40 slots requested vs 6 cap; cluster stats should ideally show **slot-weighted** demand. |

#### ENT-D-02-MIXED-FOOTPRINT
| | |
|---|---|
| **Business purpose** | Same unit, **heterogeneous** footprints (Fri day / night Mon-Wed / TTh). |
| **Why it matters** | Cluster algorithm must not assume homogeneous competition. |
| **Scheduling behavior** | 45 rows on 5E Oncology (15 per footprint class). |
| **Approval behavior** | Three independent competition pools. |
| **Visualization behavior** | **Failure:** single date-span overlap merges Fri + Night + TTh into mega-clusters at Week/Day. |
| **Ground truth** | **CP-MIXED-3-POOLS:** Three non-overlapping footprint pools; canvas shows 1–2 undifferentiated piles. |

---

### Seasonal & strategic

#### ENT-SE-01-FALL-SPIKE
| | |
|---|---|
| **Business purpose** | Enterprise-wide high demand period (Sep–Nov). |
| **Why it matters** | Portfolio-level staffing and preceptor recruitment. |
| **Scheduling behavior** | 25 rows across Union/Franklin med-surg units, staggered fall starts. |
| **Approval behavior** | Bulk queue aging; KPI avg approval age rises. |
| **Visualization behavior** | Year: many September/October start buckets; loses end-date seasonality. |
| **Ground truth** | **CP-FALL-SPIKE:** System demand peak Q3–Q4; Year view undercounts November **ends**. |

#### ENT-SE-02-SUMMER-LOW
| | |
|---|---|
| **Business purpose** | Low demand window. |
| **Why it matters** | Maintenance, preceptor PTO, easy approvals. |
| **Scheduling behavior** | 10 low-slot ambulatory requests Jun–Aug. |
| **Approval behavior** | Fast path. |
| **Visualization behavior** | Sparse chips in Jun–Aug columns. |
| **Ground truth** | **CP-SUMMER-LOW:** Low cluster density; KPI pending concentrated elsewhere — **scope filter** may hide if user zoomed to fall. |

#### ENT-SE-03-GRAD-SURGE
| | |
|---|---|
| **Business purpose** | Graduation-driven last-minute ICU demand. |
| **Why it matters** | Hard deadlines; high `pendingDuration` variance. |
| **Approval behavior** | `expiringThisWeek` / urgent prioritization. |
| **Visualization behavior** | Nov cluster on 2G ICU overlaps ENT-C-06 and ENT-C-03. |
| **Ground truth** | **CP-GRAD-SURGE:** Nov 10–Dec 6 window competes with pipeline; **12+ high-slot pending** on stressed unit. |

#### ENT-Y-01-MULTI-YEAR
| | |
|---|---|
| **Business purpose** | Longitudinal affiliations spanning fiscal/academic year. |
| **Why it matters** | Year zoom planning; cap affects multiple semesters. |
| **Scheduling behavior** | 5 rows Jul 2026–Jun 2027, rehab med-surg. |
| **Approval behavior** | Single approve locks unit for 12 months. |
| **Visualization behavior** | Year: single wide bar per row; Month/Day readable. |
| **Ground truth** | **CP-MULTIYEAR:** Occupies full Year band; should show **duration label** and block shorter requests in overlap — canvas shows bar only. |

---

### Duration extremes

#### ENT-DU-01-ONE-DAY
| | |
|---|---|
| **Business purpose** | Observation/shadowing single day. |
| **Why it matters** | Minimum card width; easy to miss at Month/Year. |
| **Scheduling behavior** | 8 ED rows, one calendar day each, Nov 2026. |
| **Visualization behavior** | Day: narrow chip; Year: lumped into November start bucket with semester-long rows. |
| **Ground truth** | **CP-ONE-DAY:** 1 slot × 1 day; Year aggregation **misleading** (counts like semester placement). |

#### ENT-DU-02-LONG-SEMESTER
| | |
|---|---|
| **Business purpose** | Full-semester blocks dominating row bands. |
| **Why it matters** | Visual dominance; obscures shorter requests underneath. |
| **Scheduling behavior** | 10 rows Aug–Dec, TTh, 2–6 slots. |
| **Visualization behavior** | Full-width bars; z-order may hide shorter overlaps. |
| **Ground truth** | **CP-LONG-SPAN:** Long bars cause **pixel overlap clustering** with any same-row date overlap. |

---

### Waitlist & queue semantics

#### ENT-WL-WAITLIST
| | |
|---|---|
| **Business purpose** | Explicit waitlist / capacity-full review state. |
| **Why it matters** | Different SLA than fresh pending. |
| **Scheduling behavior** | 6 Review rows, high `pendingDuration`, one tagged “Waitlist — capacity full”. |
| **Approval behavior** | Should not compete equally with new pending — **waitlist promotion** workflow. |
| **Visualization behavior** | Review status color; **no waitlist lane** or rank number on canvas. |
| **Ground truth** | **CP-WAITLIST:** Queue semantics distinct from ENT-T-01 pending; UI treats all Review identically. |

#### ENT-UR-URGENT
| | |
|---|---|
| **Business purpose** | Imminent start date (June) while queue busy. |
| **Why it matters** | Time-to-start SLA breach. |
| **Scheduling behavior** | 3 pending, daily, Jun 8–28 2026, low `pendingDuration`. |
| **Visualization behavior** | Left of “today” line if today fixed; expiring KPI. |
| **Ground truth** | **CP-URGENT:** Should rank above Sep pile; **no urgent badge** on canvas card. |

---

### Fill & balance

#### ENT-FILL-PT / ENT-FILL-BALANCE
| | |
|---|---|
| **Business purpose** | Realistic volume across low-traffic units + discipline mix. |
| **Why it matters** | Prevents overfitting UI to hot rows only. |
| **Scheduling behavior** | 25 rows varied locations/disciplines/status mix. |
| **Visualization behavior** | Exercises scroll performance and row expand/collapse. |
| **Ground truth** | **CP-BALANCE:** No single scenario; supports scalability baseline. |

---

## Hot-row reference (director desk)

| Location | Discipline | Rows | Cap (override) | Primary scenarios |
|----------|------------|------|----------------|-------------------|
| 7E IMCU | Nursing | ~51 | 8 | ENT-T-01, ENT-G-*, ENT-T-05/06, ENT-C-01/04 |
| 5E Oncology | Nursing | 45 | 10 | ENT-D-02 |
| 5T Med Surg | Nursing | 26 | 6 | ENT-D-01, ENT-T-02 |
| 2G ICU | Nursing | 18+ | 6 | ENT-C-03/06, ENT-WL, ENT-SE-03 |

---

## Ground-truth index (machine-readable summary)

| Code | Outcome |
|------|---------|
| CP-FRI-PILE | 20 reqs / ~44 slots vs cap 8 — mass waitlist |
| CP-SHIFT-LANES | Day/night independent — **no** merge |
| CP-WEEKDAY-LANES | MWF vs TTh independent — **no** merge |
| CP-WED-ONLY | Wed footprint ≠ daily/Fri competition |
| CP-MIXED-3-POOLS | 3 footprint pools on 5E — separate clusters |
| CP-GOLD-BURIED | Gold + high slots visible without drill-in |
| CP-OVERBOOKED | Approved &gt; cap — breach visible on Approval canvas |
| CP-FUTURE-RISK | Nov pipeline + existing overcap = forecast |
| CP-WAITLIST | Review/waitlist distinct from pending queue |
| CP-ONE-DAY | Year bucket ≠ one-day semantics |
| CP-MULTI-SITE-SCHOOL | School-level roll-up across rows |
| CP-CLUSTER-20 | Slot-weighted cluster stats |

---

## Files

| File | Role |
|------|------|
| `slot-requests-enterprise.ts` | Generator + export |
| `slot-request-fixture-utils.ts` | Shared row builders + tags |
| `slot-requests-datasets.ts` | `?dataset=enterprise` switch |
| `enterprise-capacity-overrides.ts` | Hot-row caps |
| `calendar-data-bundle.ts` | Applies overrides when enterprise detected |
