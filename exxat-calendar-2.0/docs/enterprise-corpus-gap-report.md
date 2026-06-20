# Enterprise corpus — visualization gap report

**Scope:** Evaluate **current** Approval timeline (`ConceptCodaTimeline` + `approval-timeline-density.ts`) against **250-row enterprise corpus** ground truth. **No redesign proposed** — success/failure proof only.

**Load corpus:** `?dataset=enterprise` on Slot Requests → Calendar → Approval mode.

**Evaluation date:** 2026-06-03 · Baseline code: date-range overlap clustering; shift/days **not** in positioning or conflict geometry.

---

## Executive summary

| View | Overall vs enterprise ground truth |
|------|-----------------------------------|
| **Day** | Best for reading **individual** school labels on uncrowded rows; **fails** on hot rows (7E, 5E) — false competition merges, no cap/slot math, gold buried in clusters. |
| **Week** | Primary approval zoom for duration; **same failure modes as Day** with slightly wider cards; Fri pile becomes opaque cluster at ~20+ requests. |
| **Month** | Density engine active (7-day gap merge, aggregate chips); **hides** footprint differences and **inflates** competition via merge chains; best for seasonal shape, worst for priority decisions. |
| **Year** | **Start-month buckets only** — useful for ENT-SE-01 fall spike **starts**, misleading for ENT-DU-01 one-day, ENT-Y-01 duration, ENT-C-06 **end-weighted** risk; no individual request fidelity. |

**Core structural gap:** The model’s **competition unit** is *date-range overlap on a discipline row*. Enterprise ground truth requires *schedule footprint overlap* (dates × shift × days-of-week) weighted by *requested slots* against *discipline concurrent cap*.

---

## Method

1. Generated **250 tagged requests** covering 28 scenario families (`docs/enterprise-corpus-manifest.md`).
2. Applied **enterprise capacity overrides** (7E cap 8, 5E cap 10, 5T cap 6, 2G cap 6).
3. Traced rendering rules in:
   - `approval-timeline-density.ts` — `shouldMergePair`, `clusterApprovalObjects`, `buildCardDisplay`
   - `build-tree.ts` — `detectConflicts` (Operations; date-range sweep)
   - `concept-coda.tsx` — row layout, queue counts
4. For each scenario family, compared **expected ground truth** to **observable canvas + drill-in behavior**.

---

## Where the current model **succeeds**

### 1. Location × discipline row model (ENT-X-01)
- **Ground truth:** Nursing, PT, OT on 7E IMCU are independent approval queues.
- **Canvas:** Separate sub-rows under collapsed location. **Pass.**
- **Caveat:** Location header `queueCount` sums all disciplines — overstates “Nursing pressure” when PT/OT pending exist.

### 2. Horizontal placement by date range (ENT-T-02, ENT-Y-01)
- **Ground truth:** Staggered starts and long spans visible as offset/full-width bars.
- **Canvas:** `cardRect` / `widthOfRange` correctly position by `requestedDuration`. **Pass** at Week/Day/Month.

### 3. Status encoding & Approval KPIs (ENT-SE-01, ENT-WL)
- **Ground truth:** Pending vs Review vs Approved counts drive coordinator workload.
- **Canvas:** Status chip colors; KPI strip (`pendingRequests`, `inReview`, `avgApprovalAge`, `expiringThisWeek`). **Pass** at app level (not row-local).

### 4. Progressive disclosure exists (ENT-D-01, ENT-T-01)
- **Ground truth:** 20+ requests cannot render as readable individual cards.
- **Canvas:** Clusters → `ApprovalClusterModal` with school breakdown, gold sort in modal list. **Partial pass** — disclosure works; **content** of aggregate is wrong (see failures).

### 5. Gold partner hinting (ENT-G-03)
- **Ground truth:** Gold partners identifiable on inspection.
- **Canvas:** `isGoldPartner` → star on single card; `goldStarCount` on wide cluster dashboard layout. **Partial pass** — discoverability weak inside large clusters.

### 6. Operations mode conflict engine (ENT-C-03, ENT-C-02)
- **Ground truth:** Overbooking detectable.
- **Operations canvas + KPI `conflicts`:** `detectConflicts` sweeps date ranges vs cap. **Pass in Operations mode only** — Approval mode does not surface same signal on canvas.

### 7. Cross-unit portfolio scroll (ENT-FILL-BALANCE)
- **Ground truth:** 250 rows across ~15+ location groups without DOM meltdown.
- **Canvas:** Build succeeds; virtual row expand/collapse keeps DOM bounded. **Pass** with performance notes below.

---

## Where the current model **fails**

### Failure F1 — False competition: shift lanes (ENT-T-05)
| | |
|---|---|
| **Ground truth** | Day (4) + Night (4) = parallel lanes, **zero** cross-shift competition. |
| **Canvas** | `shouldMergePair` → `dateRangesOverlap` + pixel overlap → **single cluster of 8**. |
| **Missing** | Shift lane split, shift label on card, merge exclusion rule. |
| **Misleading** | Director sees “8 competing requests” instead of “4 day + 4 night”. |
| **Severity** | **Blocker** for any unit running 12h day/night preceptor pairs. |

### Failure F2 — False competition: weekday patterns (ENT-T-06, ENT-C-04)
| | |
|---|---|
| **Ground truth** | MWF vs TTh vs Wed-only vs Fri — mostly **non-overlapping footprints**. |
| **Canvas** | Shared Sep–Nov span → merged clusters with daily approved baseline. |
| **Missing** | Days-of-week on card face; footprint-aware overlap. |
| **Hidden too deep** | `requestedDaysOfWeek` only in detail modal. |
| **Severity** | **Blocker** — drives incorrect approve-decline sequencing. |

### Failure F3 — Slot-weight blind aggregates (ENT-T-01, ENT-G-04, ENT-D-01)
| | |
|---|---|
| **Ground truth** | Fri pile ~**44 slots** vs cap **8**; JHU Gold group **6 slots**. |
| **Canvas** | Cluster chip: **“20 requests”**, school count; no `Σ requestedSlots`, no “/ cap” suffix. |
| **Incorrect aggregation** | Request count ≠ capacity consumption (group vs individual mix). |
| **Severity** | **Blocker** for placement directors — primary decision metric absent. |

### Failure F4 — Capacity headroom invisible in Approval (ENT-C-01, ENT-C-04, ENT-C-06)
| | |
|---|---|
| **Ground truth** | Approved baseline consumes cap; pending adds **forecast** overage. |
| **Canvas** | No row-level “3/8 slots” or red over-cap band in Approval mode. |
| **Hidden** | Capacity math only in Operations KPI `%` and conflict list — not row-local. |
| **Severity** | **Blocker** — Approval mode is the decision surface but lacks capacity truth. |

### Failure F5 — Mega-cluster heterogeneous footprints (ENT-D-02)
| | |
|---|---|
| **Ground truth** | 3 pools: Fri day (15), Night Mon-Wed (15), TTh (15). |
| **Canvas** | Week/Day: date overlap merges **45** into 1–3 undifferentiated piles. |
| **Misleading** | Implies all 45 compete; actual competition is **within** each pool (~15 each). |
| **Severity** | **Blocker** on 5E Oncology row at enterprise scale. |

### Failure F6 — Year view start-month distortion (ENT-DU-01, ENT-Y-01, ENT-SE-03)
| | |
|---|---|
| **Ground truth** | One-day ED visit ≠ 12-month affiliation ≠ Nov **end** crunch. |
| **Canvas** | `bucketYearAggregates` by `monthKey(start)` → one-day Nov 15 = same bucket weight as Jul–Jun bar. |
| **Incorrect aggregation** | No duration encoding; end dates ignored; **CP-ONE-DAY** and **CP-FUTURE-RISK** invisible. |
| **Severity** | **Issue** for strategic planning zoom; acceptable only as “start histogram”, not labeled as such. |

### Failure F7 — Month 7-day gap merge chains (ENT-T-02, ENT-T-04)
| | |
|---|---|
| **Ground truth** | Partial overlaps and handoffs are **distinct** cohorts. |
| **Canvas** | `mergeChainClusters` extends merge if `start <= groupEnd + 7 days`. |
| **Misleading** | Staggered starts within 7 days fuse into one aggregate — loses cohort count. |
| **Severity** | **Issue** at Month zoom. |

### Failure F8 — Gold priority buried (ENT-G-04)
| | |
|---|---|
| **Ground truth** | Gold 6-slot group must surface before bulk Fri pending. |
| **Canvas** | Cluster label prioritizes request count; gold stars need wide chip + modal drill-in. |
| **Hidden too deep** | `sortPlacementsGoldFirst` applies in modal, not canvas z-order or cluster sort key. |
| **Severity** | **Issue** — contractual risk. |

### Failure F9 — Waitlist semantics flattened (ENT-WL)
| | |
|---|---|
| **Ground truth** | Review + “Waitlist — capacity full” ≠ new pending. |
| **Canvas** | Same Review styling; `partnerCategory` waitlist string not surfaced on card. |
| **Missing** | Waitlist rank, promotion affordance, distinct lane. |
| **Severity** | **Issue** — operational workflow gap. |

### Failure F10 — School-level multi-site blindness (ENT-A-03)
| | |
|---|---|
| **Ground truth** | GWU on 4 units — affiliation cap may limit total concurrent GWU students. |
| **Canvas** | Four independent rows; no GWU summary band or cross-row warning. |
| **Severity** | **Issue** — school competition partially visible only via search/filter outside calendar. |

### Failure F11 — Urgent / time-to-start not on card (ENT-UR)
| | |
|---|---|
| **Ground truth** | June starts require immediate action vs Sep pile. |
| **Canvas** | `pendingDuration` in modal; KPI `expiringThisWeek` global only. |
| **Missing** | Urgent badge, start-date proximity on chip. |
| **Severity** | **Issue**. |

### Failure F12 — Overbooked approved load silent in Approval (ENT-C-03)
| | |
|---|---|
| **Ground truth** | 12 approved slots on cap 6 = existing breach. |
| **Canvas** | Approved green cards; no breach indicator on 2G row in Approval mode. |
| **Severity** | **Blocker** — director may approve more into known breach. |

---

## View-by-view scorecard

Legend: ✅ Pass · ⚠️ Partial · ❌ Fail

| Scenario family | Day | Week | Month | Year |
|-----------------|-----|------|-------|------|
| ENT-T-01 Fri pile | ❌ | ❌ | ⚠️ aggregate | ⚠️ count only |
| ENT-T-05 shift lanes | ❌ | ❌ | ❌ | ❌ |
| ENT-T-06 weekday lanes | ❌ | ❌ | ❌ | ❌ |
| ENT-T-02 partial overlap | ⚠️ | ⚠️ | ⚠️ 7d merge | ❌ |
| ENT-T-04 back-to-back | ✅ adjacent | ✅ | ⚠️ merge | ⚠️ |
| ENT-G-03 Gold vs Gold | ⚠️ | ⚠️ | ⚠️ | ❌ |
| ENT-G-04 Gold in pile | ❌ | ❌ | ❌ | ❌ |
| ENT-D-01 homogeneous 20 | ❌ | ❌ | ⚠️ modal | ⚠️ |
| ENT-D-02 mixed footprint | ❌ | ❌ | ❌ | ❌ |
| ENT-C-03 overbooked | ⚠️ no breach | ⚠️ | ⚠️ | ❌ |
| ENT-C-04 Wed exhaust | ❌ | ❌ | ❌ | ❌ |
| ENT-C-06 future risk | ⚠️ | ⚠️ | ⚠️ | ❌ |
| ENT-WL waitlist | ⚠️ | ⚠️ | ⚠️ | ❌ |
| ENT-DU-01 one-day | ⚠️ narrow | ⚠️ | ⚠️ | ❌ |
| ENT-Y-01 multi-year | ✅ | ✅ | ✅ | ⚠️ duration |
| ENT-SE-01 fall spike | ⚠️ | ⚠️ | ✅ shape | ⚠️ starts only |
| ENT-SE-02 summer low | ✅ | ✅ | ✅ | ✅ sparse |
| ENT-X-01 cross-discipline | ✅ | ✅ | ✅ | ✅ |
| ENT-A-03 same school multi | ⚠️ | ⚠️ | ⚠️ | ❌ |

---

## Gap taxonomy (requested format)

### Information missing from canvas
- Concurrent **slot totals** vs **discipline cap** (per row, per footprint).
- **Shift** and **days-of-week** on card face (Approval).
- **Footprint-aware conflict** indicator (who actually competes with whom).
- **Approved over-cap breach** badge in Approval mode.
- **Waitlist** rank / distinct queue class.
- **Urgent** / start-within-N-days signal on chip.
- **School-level** roll-up across units (GWU total).
- **Slot-weighted** cluster metrics (`Σ requestedSlots`, group multiplier).
- Year view: **duration**, **end month**, **footprint class**.

### Information hidden too deeply
- `requestedDaysOfWeek`, `requestedShifts` — detail modal only.
- `requestedSlots` vs cap — Operations KPI / conflict panel, not decision row.
- Gold priority — cluster modal list sort, not canvas prominence.
- `partnerCategory` waitlist string — not on Review cards.
- Competition pool identity on 5E — requires opening cluster and mentally filtering.

### Incorrect aggregations
- Cluster **`requestCount`** treats 1-slot and 6-slot group requests equally.
- **`detectConflicts`** sums slots across **full date span** ignoring weekdays/shifts.
- **Year buckets** by start month equate one-day and 12-month placements.
- **Location queue badge** sums pending across disciplines.
- **Month merge** chains non-competing cohorts within 7-day start gap.

### Misleading visualizations
- Merged day+night clusters (**F1**).
- Merged MWF+TTh+Fri+daily (**F2**).
- 45-request “competition” blob on 5E (**F5**).
- Year November bucket looks like single demand pulse hiding **end-loaded** grad surge + pipeline (**F6**).
- Green approved cards on overbooked 2G (**F12**).

### Failure cases (director questions unanswered)
1. “How many **Friday day slots** are still free on 7E?” → **Cannot answer** from canvas.
2. “Which two Gold partners collide this week?” → Must drill into cluster; no footprint filter.
3. “If I approve JHU 6-slot, what happens to cap?” → No headroom preview.
4. “Are these 20 requests actually competing?” → Often **no** (shift/day lanes) but UI says yes.
5. “What’s waitlisted vs new?” → Not distinguishable on canvas.
6. “Where’s my November risk?” → Year view shows starts, not **accumulated** Nov concurrent load.

### Scalability concerns (250+ rows)
| Concern | Observation |
|---------|-------------|
| **Hot row cluster size** | 7E Nursing ~51 objects; Week/Day clusters force modal for every decision — OK for disclosure, **not** for scan-ability. |
| **Row height expansion** | `rowMaxCardHeight` grows with dashboard clusters — tall rows reduce visible locations per viewport. |
| **Modal-only resolution** | At 20+ requests, **100% of Fri approvals** require modal — throughput bottleneck for directors. |
| **Year aggregate chips** | Multiple months with 10+ starts collapse to “N req” — modal recursion depth grows O(locations × disciplines × months). |
| **Sort order** | Locations sorted by utilization — hot rows rise to top (**good**), but within-row ordering is start-date merge only — **no priority sort** (gold, slots, urgent). |
| **Build/bundle** | 250 rows client-side fine; **2,500+** will need virtualization of timeline objects (not just row collapse) and server-side aggregation. |
| **Conflict O(n²) risk** | Current merge is O(n) chain; conflict sweep O(events). Safe at 250; **500+** per discipline may need indexing by footprint bucket. |

---

## Operations vs Approval asymmetry

Enterprise ground truth for **ENT-C-03**, **ENT-C-02**, **ENT-C-06** is partially modeled in **Operations** (`detectConflicts`, utilization KPIs) but **Approval** is the coordinator’s queue surface. Gap: **decision intelligence is split across modes** — directors in Approval cannot see what Operations math already knows.

---

## Proof checklist (corpus validation steps)

Manual verification script for QA:

1. Load `?dataset=enterprise` → Calendar → Approval → expand **7E IMCU → Nursing**.
2. **Week zoom**, Sep–Nov: confirm Fri pile clusters **≥15** requests — note absence of slot/cap label (**F3**).
3. Toggle same row: confirm **day+night** rows visually merged (**F1**).
4. **Month zoom**: confirm **MWF+TTh** not separable without modal (**F2**).
5. **Year zoom**: confirm Nov **one-day ED** rows same visual weight as **Jul–Jun** affiliation (**F6**).
6. Switch **Operations** mode → confirm **Conflicts KPI &gt; 0** for 2G ICU (**F12** partial fix).
7. Open cluster modal on Fri pile → confirm gold schools listed but **not** prioritized on canvas (**F8**).

---

## Conclusion

The current Day / Week / Month / Year experiences **correctly** handle:

- Row topology (location × discipline)
- Calendar positioning by date range
- Status-colored workload KPIs
- Cluster progressive disclosure at high request counts
- Seasonal **start** density at Month/Year (approximate)

They **do not** communicate enterprise ground truth for:

- Footprint-specific competition (shift, weekdays)
- Slot-weighted capacity consumption
- Approval-mode capacity breaches and forecasts
- Priority classes (Gold, waitlist, urgent)
- Strategically correct Year aggregations

**Recommendation (evaluation only):** Treat this gap report as the acceptance baseline before any redesign. Next phase should address **competition unit** definition (footprint × slots × cap) first; visualization changes follow that model — not the reverse.

---

## Related artifacts

- `docs/enterprise-corpus-manifest.md` — scenario definitions + ground-truth codes
- `src/app/lib/mock/slot-requests-enterprise.ts` — data generator
- `src/app/lib/mock/slot-requests-datasets.ts` — `?dataset=enterprise`
- `src/app/lib/slot-requests-calendar/approval-timeline-density.ts` — clustering rules under test
