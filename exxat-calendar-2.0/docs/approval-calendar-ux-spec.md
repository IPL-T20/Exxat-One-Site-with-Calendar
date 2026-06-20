# Approval Calendar — implementation UX specification

**Status:** Final planning artifact for implementation + enterprise corpus validation  
**Inputs:** Approved scheduling ontology, Decision Intelligence Layer (DIL), enterprise corpus (`?dataset=enterprise`), gap report  
**Out of scope:** Visual polish, Operations mode merge, backend API design  
**Validation:** Every `CP-*` ground-truth code in `enterprise-corpus-manifest.md` must pass after implementation

---

## 0. Purpose & governing principles

The Approval Calendar is a **decision-support system** for committing clinical capacity. Zoom levels change **the question being answered**, not only scale.

| Principle | Rule |
|-----------|------|
| **Footprint is the competition unit** | Competition = overlap on **unit × discipline × shift × weekday pattern × date range**, weighted by **requested slots**. Date overlap alone is never sufficient. |
| **Row is the capacity anchor** | Discipline row owns cap, approved load, forecast, and row-level capacity state. |
| **Progressive disclosure** | Row → card/cluster → hover → list drilldown → modal. Approver reaches **“does this deserve attention?”** without opening modal. |
| **One primary attention glyph on objects** | Card/cluster shows **competition class** as primary; capacity state lives on row (secondary echo on object only when row is collapsed). |
| **Slot-weighted aggregates** | Clusters count **Σ requestedSlots**, not request count alone. |
| **Gold is priority, not decoration** | Gold affects sort order, cluster lead label, and pre-modal badges — never only modal sort. |

### Compute layer (implementation prerequisite)

All surfaces consume a shared **`DecisionSnapshot`** built at model time (`useCalendarModel` extension):

```
FootprintKey     = unitId + discipline + normalize(shift) + normalize(daysOfWeek)
Footprint        = { key, dateStart, dateEnd, shift, daysPattern, label }  // label e.g. "Fri · Day 12h"
CompetitionGroup = { footprintKey, windowStart, windowEnd, requestIds[], slotDemand, cap, peakCommitted, peakIfAllPending }
CapacityState    = Open | Tight (≥80%) | Exhausted (≥100% pending+approved) | Overbooked (approved>cap)
CompetitionClass = Compatible | Soft | Hard | Over   // derived from footprint overlap + slot math
RiskLevel        = Low | Medium | High | Critical     // worst of capacity + competition + time pressure
PriorityScore    = f(gold, waitlist, urgent, pendingDuration, slotDemand)  // for sort only
HeadroomIfApproved(request) = cap - peakCommittedAfter(request) on matching footprint
```

**Cluster merge rule (replaces date-only merge):** Two canvas objects merge iff **same FootprintKey** AND **footprint date ranges overlap** AND **pixel rects overlap** at current zoom. Month zoom may add **≤3 day** adjacency merge for **same footprint only** (handoff visibility — not cross-footprint).

---

## 1. Information model — signal placement matrix

Legend: **●** required · **○** optional/suppressed · **—** must not appear (wrong surface)

### 1.1 Identity & context

| Signal | Row | Card | Cluster | Hover | List drilldown | Modal | First discovery |
|--------|-----|------|---------|-------|----------------|-------|-----------------|
| Location unit name | ● sidebar | — | — | ○ | ○ | ● | Row |
| Facility / location group | ● subtitle | — | — | ○ | ○ | ● | Row |
| Discipline name | ● sub-row | — | — | ○ | ● column | ● | Row |
| School name (full) | — | ○ abbrev | ○ lead | ● | ● | ● | Card/Hover |
| Program type | — | — | — | ○ | ○ | ● | Modal |
| Request ID | — | — | — | ○ mono | ○ mono | ● mono | Modal |
| Availability name | — | — | — | — | ○ | ● | Modal |

**Why:** Row establishes **where** in the hospital; cards carry **who** at scan depth; full identity is commitment-level (modal).

### 1.2 Schedule footprint

| Signal | Row | Card | Cluster | Hover | List drilldown | Modal | First discovery |
|--------|-----|------|---------|-------|----------------|-------|-----------------|
| Date range (span) | ○ window hint | ● width | ● band width | ● | ● | ● | Card position |
| Shift | — | ● chip | ● chip | ● | ● | ● | **Card** |
| Weekday pattern | — | ● chip | ● chip | ● | ● | ● | **Card** |
| Footprint label (`Fri · Day 12h`) | — | ● | ● | ● | ● | ● | **Card** |
| Duration class (1-day / semester / multi-year) | — | ○ glyph | ○ | ○ | ○ | ● | Card/Year |
| Experience type (Individual/Group) | — | ○ | ○ | ○ | ● | ● | Hover/List |

**Why:** Footprint separates **ENT-T-05/06** lanes; must appear on card before modal. Row omits footprint — row is discipline-wide, not footprint-specific.

### 1.3 Capacity & consumption

| Signal | Row | Card | Cluster | Hover | List drilldown | Modal | First discovery |
|--------|-----|------|---------|-------|----------------|-------|-----------------|
| Discipline cap (concurrent) | ● `8 slots` | — | — | ○ | — | ● | **Row** |
| Approved slots (row total) | ● | — | — | ○ | — | ● | **Row** |
| Row capacity state | ● badge | ○ echo if collapsed | — | ○ | — | ● | **Row** |
| Peak committed on footprint | — | — | ● | ● | ○ | ● | Cluster/Hover |
| Slot demand (Σ pending+review slots) | ○ row forecast | ● `4 slots` | ● `44/8` | ● | ● | ● | Card/Cluster |
| Headroom if **this** request approved | — | ○ micro | — | ● | ● | ● | **Hover** |
| Utilization % | ● compact | — | — | ○ | — | ● | Row |
| Overbooked breach indicator | ● row stripe | ○ on approved cards | ○ | ● | ○ | ● | **Row** |

**Why:** Cap is a **row property**; headroom is **request-specific** → hover/modal, not row label noise.

### 1.4 Competition & conflicts

| Signal | Row | Card | Cluster | Hover | List drilldown | Modal | First discovery |
|--------|-----|------|---------|-------|----------------|-------|-----------------|
| Competition class | ○ worst in row | ● badge | ● badge | ● | ● column | ● | **Card/Cluster** |
| Competing request count | — | ○ | ● | ● | — | ● | Cluster |
| Competing school count | — | ○ | ● | ● | ● | ● | Cluster |
| Top competitors (names + slots) | — | — | ○ | ● top 3 | ● full | ● | Hover/List |
| Competition group ID / footprint key | — | — | ○ aria | — | — | ○ debug | — |
| Conflict severity (soft/hard/over) | ○ row | ● | ● | ● | ● | ● | Card |
| Related requests (same row, other footprints) | — | — | — | ○ | ○ | ● | Modal |
| Same-school multi-site rollup | — | — | — | ○ | ○ | ● | Modal |

**Why:** Competition class is the **primary object glyph** — answers “is this a fight?” without modal. Full competitor list is drilldown/modal work.

### 1.5 Priority & queue

| Signal | Row | Card | Cluster | Hover | List drilldown | Modal | First discovery |
|--------|-----|------|---------|-------|----------------|-------|-----------------|
| Status | ○ counts | ● color | ● mix | ● | ● | ● | Card |
| Gold Partner | ○ `★` count | ● star | ● lead + count | ● | ● | ● | Card |
| Waitlist / Review class | ○ | ● `WL` badge | ○ count | ● | ● | ● | Card |
| Urgent (start ≤14d) | ○ | ● dot | ○ | ● | ● | ● | Card |
| Queue age (`pendingDuration`) | — | ○ | ○ | ● | ● | ● | Hover |
| Priority score (computed) | — | — | — | — | ● sort | ○ | List |
| Opportunity cost hint | — | — | — | ○ | ○ | ● | Modal |

**Why:** Gold/urgent/waitlist are **attention filters** — visible on card. Priority score is sort key in list, not another card glyph.

### 1.6 Risk & forecast

| Signal | Row | Card | Cluster | Hover | List drilldown | Modal | First discovery |
|--------|-----|------|---------|-------|----------------|-------|-----------------|
| Risk level | ● worst | ● border | ● border | ● | ● | ● | Row/Card |
| Future capacity risk (Nov pipeline) | ○ row | ○ | ● in span | ● | ○ | ● | Cluster/Hover |
| Forecast conflict if all pending approve | ● `+36 forecast` | — | ● | ● | — | ● | **Row/Cluster** |
| Approval impact summary | — | — | — | ● one line | ○ | ● | Hover/Modal |

**Why:** Future risk is row/cluster scale; per-request impact belongs in hover/modal.

### 1.7 Aggregates & rollups (zoom-specific)

| Signal | Day | Week | Month | Year |
|--------|-----|------|-------|------|
| Individual request cards | ● | ● | ○ thin | — |
| Footprint cluster chips | ● | ● | ● | — |
| Footprint-month bucket | — | — | ○ | ● |
| Row capacity strip | ● | ● | ● | ● |
| Start-month histogram | — | — | ○ | ● (secondary) |

---

## 2. Pre-modal decision-support contract

An approver **must** answer these **without opening modal** (hover permitted, ≤1s scan):

| Question | Required signals | Surfaces |
|----------|------------------|----------|
| **Can I approve this?** | Competition class ≤ Hard; headroom ≥ 0 on hover; row not Overbooked | Row state + card badge + hover headroom |
| **Capacity remaining?** | Row `approved/cap`; hover `headroom if approved` | Row + hover |
| **Who competes for this footprint?** | Cluster Σ slots; top 3 schools on hover; footprint label | Cluster + hover |
| **Strategically important?** | Gold star; group slot count | Card + cluster lead |
| **Gold Partner?** | ★ on card; gold count on cluster | Card/cluster |
| **Future capacity problem?** | Row forecast badge; cluster risk border | Row + cluster |
| **Opportunity cost?** | One-line hover: “Approving uses 4 of 2 remaining Fri-day slots” | Hover only (not card — too verbose) |

**Explicitly NOT required pre-modal:** history, comments, related multi-site GWU totals, full competitor list (&gt;3), approve/decline actions.

---

## 3. Visual contract by zoom level

### 3.1 Day view

**Question answered:** *“Exactly which schools want this footprint on this day window, and can any of them be approved right now?”*

| Category | Specification |
|----------|---------------|
| **Objects** | Individual **cards** when ≤2 overlapping same-footprint requests in visible day band; **clusters** when ≥3 or width &lt;36px. One card = one request. |
| **Card face (min width 120px)** | School abbrev · footprint chip · `N slots` · competition badge · status color · ★/urgent/WL if applicable |
| **Cluster face** | Footprint chip · `Σslots/cap` · `N reqs · M schools` · competition badge · gold lead |
| **Row chrome** | Capacity strip: `6/8 approved · forecast 12/8` · capacity state badge · pending+review count |
| **Aggregates** | None beyond clusters |
| **Actions** | Click card → request modal; click cluster → list drilldown; hover → decision preview; row expand/collapse; scroll horizontal |
| **Suppress** | Year-style month buckets; request count without slot weight |

### 3.2 Week view (default approval zoom)

**Question answered:** *“Who overlaps this placement window on this unit/discipline footprint, and where is the bottleneck this week?”*

| Category | Specification |
|----------|---------------|
| **Objects** | Individual cards when footprint overlap count ≤2 in cluster chain; **group** (2–4) shows split chips; **cluster** (≥5 same footprint) |
| **Card face (min 88px)** | School abbrev · `N slots` · footprint short (`Fri Day`) · competition badge · status |
| **Cluster face** | `44/8 slots` primary · `20 req · 14 sch` secondary · competition · ★×n |
| **Row chrome** | Same as Day + optional thin **forecast heat** under timeline for visible week |
| **Aggregates** | Cluster only — **never cross-footprint** |
| **Actions** | Same as Day + keyboard nav between objects in row |
| **Suppress** | Full school names on cards &lt;88px; date-only merge across shifts |

### 3.3 Month view

**Question answered:** *“How dense is demand this month on each footprint, and where are the hot weeks?”*

| Category | Specification |
|----------|---------------|
| **Objects** | **Clusters default** for ≥2 same-footprint overlaps; singles only when isolated footprint |
| **Cluster face** | Dashboard layout: line1 `Σslots/cap` · line2 footprint · line3 status mix or `★ Gold ×2` |
| **Row chrome** | Capacity state + worst competition in month |
| **Aggregates** | Same-footprint clusters; optional **week tick** density inside cluster (aria only) |
| **Merge rule** | Same footprint + overlap + optional **≤3 day** gap for handoffs (ENT-T-04) |
| **Actions** | Click cluster → list drilldown; double-click single → modal; hover preview |
| **Suppress** | Individual school names unless width ≥140px; cross-footprint merge (ENT-D-02 fix) |

### 3.4 Year view

**Question answered:** *“When does demand start, how long does it run, and which months are structurally overloaded?”*

| Category | Specification |
|----------|---------------|
| **Objects** | **Footprint-month buckets** only — no individual requests |
| **Bucket face** | `MonthAbbrev · footprintShort · Σslots` · risk tint · `N req` secondary |
| **Bucket key** | `footprintKey + startMonth` (NOT start month alone) |
| **Duration encoding** | Span indicator: dot (1-day) · bar (semester) · wide band (multi-year) within bucket |
| **Row chrome** | Year utilization trend + worst month badge |
| **Aggregates** | Sum slots per footprint per month; show **peak concurrent** not just starts |
| **Actions** | Click bucket → list drilldown filtered to footprint+month; zoom-to-month shortcut |
| **Suppress** | School names; competition detail; approve actions |

---

## 4. Cluster behavior specification

Clusters are **CompetitionGroups** with canvas representation. Counts below are **same-footprint overlapping requests** in the visible window.

### 4.1 Summary table

| Size | Aggregation level | Label (primary) | Label (secondary) | Sort in drilldown | Gold | Status | Slots | Drilldown |
|------|-------------------|-----------------|-------------------|-------------------|------|--------|-------|-----------|
| **2** | group (2 chips or paired) | `[Lead school] +1` OR two abbrevs if width allows | footprint chip | priority ↓, slots ↓ | ★ on affected chip | dominant per chip | per chip | list (2) or split click |
| **5** | cluster | `18/8 slots` | `5 req · 4 sch · Fri Day` | priority ↓ | ★ lead school named | status mix line | **Σ required** | list modal |
| **10** | cluster | `32/8 slots` | `10 req · 8 sch` | priority ↓ | `★2 Gold` + lead | Review:2 Pending:8 | **Σ required** | list modal + filter |
| **25** | aggregate | `58/8 slots` | `25 req · 18 sch` | priority ↓ | `★3 · JHU…` | worst status drives border | **Σ required** | list modal + footprint header |
| **50+** | aggregate | `124/8 slots` | `50+ req` | priority ↓ | `★n` count only | Critical risk border | **Σ required** | list modal + virtualized scroll |

### 4.2 Labeling rules

1. **Primary line always slot-weighted:** `{slotDemand}/{cap} slots` when cap known; else `{slotDemand} slots`.
2. **Secondary line:** `{n} req · {m} sch · {footprintShort}`.
3. **Never primary with request count alone** — fixes ENT-T-01 / ENT-G-04 gap.
4. **Width fallback (&lt;56px):** `{n}↑` with aria-label carrying full stats.

### 4.3 Sort order (list drilldown)

Stable sort, descending:

1. Gold Partner (yes/no)  
2. Waitlist/Review-with-waitlist-tag  
3. Urgent (start ≤14d)  
4. Priority score (slot demand × queue age weight)  
5. Requested slots (desc)  
6. pendingDuration (desc)  
7. School name (asc)

### 4.4 Gold treatment

| Size | Canvas | Drilldown list |
|------|--------|----------------|
| 2 | ★ on gold chip; gold left if split | Gold rows pinned top |
| 5–10 | Lead label = highest-priority gold school if present | ★ column + gold rows first |
| 25+ | `★{n} Gold` meta line; gold lead if width ≥110px | Gold section header optional if ≥3 |

### 4.5 Status treatment

| Size | Canvas border/fill | Label |
|------|---------------------|-------|
| 2 | Per-request status colors | per chip |
| 5–10 | **Worst** status in group tints border; fill = neutral | `Pending:8 · Review:2` |
| 25+ | **Critical** if any Overbooked interaction | status mix meta only |
| Approved-only cluster | Green-neutral fill; dashed if includes overbooked approved (ENT-C-03) | `Approved:2 ⚠ over cap` |

### 4.6 Slot-weight treatment

- **Canvas:** Always show Σ slots vs cap for clusters ≥2.  
- **Hover:** Add “+{request.slots} if approved → {headroom} remaining”.  
- **Drilldown:** Column `Slots` + column `If approved` headroom.  
- **Group vs individual:** Group requests show `6g` suffix (group slots).

### 4.7 Drilldown behavior

| Trigger | Result |
|---------|--------|
| Click cluster chip | **Cluster list modal** — footprint header + sortable table |
| Click row in list | **Request modal**; preserves list back-stack |
| Click single card (≤2 group) | Direct **request modal** |
| Year bucket click | List filtered to footprint+month; then request modal |
| Esc | Close top overlay only |

**List modal header (required):**  
`{footprint label} · {location} · {discipline} · {slotDemand}/{cap} slots · {competition class}`

---

## 5. Screen-level specifications

### 5.1 Day screen

```
┌─────────────────────────────────────────────────────────────────────────┐
│ KPI strip (global queue — unchanged)                                     │
│ Toolbar: zoom Day | filters | layers | today                             │
├──────────────┬──────────────────────────────────────────────────────────┤
│ Location ▾   │  Day grid                                               │
│  7E IMCU     │  ┌──────────────┐ ┌─cluster──────────────────────┐   │
│  [6/8·Tight] │  │ CCBC · Fri   │ │ 44/8 slots · 20 req · Hard   │   │
│   Nursing ●  │  │ Day · 2 slots│ │ ★ Towson +18                  │   │
│              │  └──────────────┘ └──────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

**Row sidebar (discipline):**  
`Nursing` · `{pending+review count}` · `[capacity state pill]` · `{approved}/{cap}`

**Interactions:** Hover → decision preview portal; click → modal/drilldown per §4.

### 5.2 Week screen

Default landing zoom. Layout identical to Day with wider cards and more readable abbrevs.

**Additional:** Visible week range in header; footprint chips always shown on cards ≥88px.

### 5.3 Month screen

**Row height:** Dynamic by tallest cluster dashboard (max 52px).

**Cluster dashboard (≥64px width):**

```
┌─────────────────────────────┐
│ 44/8 slots          [Hard]  │
│ Fri · Day 12h               │
│ ★2 · Pending:18 Review:2     │
└─────────────────────────────┘
```

### 5.4 Year screen

**No request cards.** Footprint-month buckets span month column width.

**Bucket tooltip:** `{footprint} · {month} · {Σslots} slot-demand · {n} requests · peak {peak}/{cap}`

**Click:** Opens filtered list drilldown → month zoom shortcut in header.

### 5.5 Hover specification

**Single request (300px portal):**

| Block | Fields |
|-------|--------|
| Header | School (full) · ★ · status pill |
| Footprint | `{requestedDuration}` · `{shift}` · `{days}` · footprint label |
| Decision | Competition class · `{slots} requested` · **Headroom if approved: {n}** |
| Competitors | Up to 3: school · slots · status · ★ |
| Footer | “Click for full detail” · Request ID mono |

**Cluster hover:**

| Block | Fields |
|-------|--------|
| Header | `{slotDemand}/{cap} slots` · competition class · risk |
| Footprint | footprint label · date span of cluster |
| Schools | Top 5 by priority with slots |
| Status | Mix line |
| Footer | “Click to review list” |

**Why hover holds headroom:** Card must stay compact; headroom is decision-critical but request-specific (§2).

### 5.6 Cluster list drilldown

**Layout:** Centered dialog (existing shell), max ~40rem width.

**Header:** Footprint + location + discipline + aggregate stats (§4.7)

**Table columns:**

| Column | Content |
|--------|---------|
| Priority | ★ / urgent / WL icons |
| School | full name |
| Slots | N (+ group indicator) |
| Footprint | shift · days (redundant OK) |
| Status | pill |
| Headroom if approved | `{n}` or `Over` |
| Age | `{pendingDuration}d` |
| Action | chevron → modal |

**Footer:** `Open highest priority` shortcut (optional v1.1).

### 5.7 Request modal

**Existing sections retained + required additions:**

| Section | Additions |
|---------|-----------|
| Header | ★ Gold · competition class pill · risk pill · footprint label |
| **Decision panel (new, above details)** | Headroom if approved · peak footprint week · top 5 competitors with slot overlap · forecast warning |
| Request details | + shifts · days · experience type (existing) |
| Capacity context | Replace generic with **footprint-scoped** cap · approved on footprint · Σ competing pending |
| Related | Split: same footprint vs same row other footprints vs same school other units |
| Actions | Approve (disabled if Over + no override) · Decline · Request changes · Waitlist promote |

**Why modal owns commitment:** Only here does approver act; full competitor list and audit trail are high cognitive load.

---

## 6. Signal placement justifications (why here, not elsewhere)

| Signal | Appears at | Does NOT appear at | Reason |
|--------|------------|-------------------|--------|
| **Row capacity state** | Row | Card primary | Cap is discipline-wide; repeating on every card adds noise (P19). |
| **Competition class** | Card/cluster | Row default | Competition is footprint-specific; row shows **worst** only as summary. |
| **Footprint label** | Card/cluster | Row | Row spans multiple footprints (ENT-D-02). |
| **Headroom if approved** | Hover/modal | Card | Requires simulating single request — too heavy for canvas; hover is decision preview. |
| **Gold star** | Card/cluster | Row | Partner priority attaches to **requests**, not units. |
| **Σ slots / cap** | Cluster | Single card (show own slots only) | Aggregation belongs to competition group. |
| **School full name** | Hover/modal/list | Card at Week | Width constraint; abbrev on card, full on hover (P10 recognition). |
| **Priority score** | List sort key | Card | Opaque number — sort implementation detail, not visual chrome. |
| **History/comments** | Modal | Hover | Audit narrative — commitment context only. |
| **Forecast row badge** | Row | Year bucket | Forecast is concurrent load across visible span; year bucket uses peak math separately. |
| **Opportunity cost prose** | Modal | Hover one-liner | Full prose too long for hover; one line sufficient for scan. |
| **Same-school multi-site** | Modal | Row | Cross-row rollup; row scope is single discipline line. |
| **Duration class** | Year bucket | Day card | Day view shows literal dates; year needs duration encoding. |

---

## 7. Enterprise corpus validation map

| CP code | Spec surface that must pass |
|---------|----------------------------|
| CP-FRI-PILE | Cluster `44/8 slots`; list sort with gold; ENT-T-01 |
| CP-SHIFT-LANES | No merge day/night; separate clusters ENT-T-05 |
| CP-WEEKDAY-LANES | No merge MWF/TTh ENT-T-06 |
| CP-WED-ONLY | Wed footprint distinct from Fri/daily ENT-C-04 |
| CP-MIXED-3-POOLS | 3 clusters on 5E ENT-D-02 |
| CP-GOLD-BURIED | Gold lead on cluster ≥5 ENT-G-04 |
| CP-GOLD-GOLD | Both ★ in drilldown top ENT-G-03 |
| CP-OVERBOOKED | Row Overbooked + approved ⚠ ENT-C-03 |
| CP-FUTURE-RISK | Row forecast + Nov cluster risk ENT-C-06 |
| CP-WAITLIST | WL badge on card ENT-WL |
| CP-ONE-DAY | Year dot vs bar ENT-DU-01 |
| CP-MULTI-SITE-SCHOOL | Modal GWU rollup ENT-A-03 |
| CP-HANDOFF | Month ≤3d gap merge same footprint only ENT-T-04 |
| CP-PARTIAL | Week offset cards; no false full-span merge ENT-T-02 |

---

## 8. Implementation phases (engineering sequence)

| Phase | Deliverable | Unblocks |
|-------|-------------|----------|
| **P0** | `DecisionSnapshot` compute: FootprintKey, competition groups, capacity state, headroom | All surfaces |
| **P1** | Row capacity strip + state badge | Pre-modal Q2, ENT-C-03 |
| **P2** | Card footprint chips + competition badge | ENT-T-05/06, CP-SHIFT-LANES |
| **P3** | Footprint-aware cluster merge + slot-weight labels | ENT-T-01, ENT-D-02 |
| **P4** | Hover decision preview (headroom + top 3) | Pre-modal Q1/Q3 |
| **P5** | List drilldown table + sort | ENT-G-04, 25+ clusters |
| **P6** | Request modal decision panel | Full 7 director questions |
| **P7** | Year footprint-month buckets + duration encoding | ENT-DU-01, ENT-Y-01 |

**Do not reorder:** P3 before P2 (labels without correct merge groups mislead worse than today).

---

## 9. Acceptance checklist (ship gate)

- [ ] `?dataset=enterprise` · 7E Nursing Fri pile shows **`Σslots/cap`** not request count only  
- [ ] Day+night on 7E render as **≥2 clusters**, not one  
- [ ] MWF and TTh on 7E render as **separate clusters**  
- [ ] 5E Oncology shows **3 cluster families** at Week zoom  
- [ ] 2G ICU row shows **Overbooked** with approved warning  
- [ ] Hover on Fri pile cluster shows **headroom if approved** for top priority row  
- [ ] Gold JHU 6-slot surfaces in **cluster lead** without modal  
- [ ] Year view one-day ED ≠ semester bar width  
- [ ] All 28 scenario tags traceable via `[ENT-*]` in list filter  
- [ ] axe: competition badges + capacity states have text alternatives  

---

## 10. Related documents

| Doc | Role |
|-----|------|
| `enterprise-corpus-manifest.md` | Scenario ground truth |
| `enterprise-corpus-gap-report.md` | Baseline failures this spec fixes |
| `calendar-data-lineage.md` | Data pipeline |
| `approval-timeline-density.ts` | Current cluster engine (to replace merge logic) |

---

*This specification is the implementation contract. UI implementation must not ship without P0–P3 against enterprise corpus validation.*
