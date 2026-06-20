# F1 — Month View · Mid-Fidelity Wireframe Specification

**Frame ID:** F1  
**Cognitive role:** Notice — *Where is pressure? What deserves investigation?*  
**Constitution:** §A §1–4, 9, 19–20 · §C visible/hidden · §B (no commit on surface)  
**Assumptions validated:** A1 (capacity/ratio) · A2 (cluster = linked decisions) · A3 (↪ / decide first)  
**Fixture:** MedStar Good Samaritan Hospital · Behavioral Health · OT · October 2026  
**Canvas:** 1440 × 900 (desktop primary) · Month zoom selected · Approval mode

**Mid-fidelity intent:** Validate hierarchy, scannability, and click motivation — not visual polish.

---

## 1. Purpose

| Dimension | Specification |
|-----------|---------------|
| **Exact purpose** | Orient coordinator on **when** and **where** linked decisions need attention across the month timeline |
| **Primary question** | *Where do I click next?* |
| **Not answered here** | Can I approve? Why? What happens if I approve/decline? (F3/F4/F5/F6/F7) |
| **Success signal** | User opens correct cluster within 30s of scan without moderator hint (T1) |

---

## 2. Page anatomy

### 2.1 Region stack (top → bottom, all `flex-shrink-0` except canvas)

```
Page [1440 × 900, flex column, overflow hidden]
├── AppChrome [existing Rubix — out of frame scope; gray-50 shell]
├── KPIStrip [h=72, px=16, border-b]
├── CalendarToolbar [h=48, px=16, border-b]
├── CalendarCanvas [flex-1, min-h=0, overflow-auto]  ← primary wireframe focus
│   ├── DateHeader [sticky top, h=56, z=30]
│   └── TimelineBody [scroll-x + scroll-y]
│       ├── LocationRow[s] [h=48 each]
│       └── DisciplineRow[s] [min-h=52, grows for cluster card height]
├── WorkflowModals [not visible on F1 — mount point only]
└── PrototypeChrome [frame badge F1 — facilitator only]
```

### 2.2 Sticky behavior

| Region | Sticky axis | z-index |
|--------|-------------|---------|
| Sidebar column (location + discipline labels) | left | 10–20 |
| DateHeader month labels | top | 30 |
| KPI + Toolbar | none (fixed in page stack) | — |

### 2.3 Scroll behavior

- **Horizontal:** Timeline pans Sep–Nov 2026 in viewport; Oct centered on load
- **Vertical:** Location expand/collapse; discipline rows scroll
- **Preserved on return from F3/F7:** scroll position + zoom + scope (predictability guarantee)

---

## 3. KPI strip

**Component:** `CalendarKpiStrip` → `CalendarKpiCards` (approval mode)  
**Height:** 72px total (16px vertical padding + card)

### 3.1 Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ [Pending Requests] [In Review] [Awaiting Decision] [Avg Approval Age] [Expiring] │
│      2                  1              3                  4d              1      │
│   caption line       caption        caption            caption         caption   │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Fixture values (usability dataset)

| KPI | Value | Caption |
|-----|-------|---------|
| Pending Requests | **2** | 5 slots awaiting approval |
| In Review | **1** | 1 slot in review |
| Awaiting Decision | **3** | 3 requests need action |
| Avg Approval Age | **4d** | Days in pending + review |
| Expiring This Week | **1** | 1 start date this week |

### 3.3 Information hierarchy

| Priority | Element | Treatment |
|----------|---------|-----------|
| 1 | Metric value | 22px bold tabular-nums |
| 2 | Metric label | 11px + info tooltip icon |
| 3 | Caption | 11px muted |

### 3.4 Interaction

| Action | Result |
|--------|--------|
| Click Pending / In Review / Awaiting Decision | Scope filter applied to calendar rows |
| Click Avg Age / Expiring | No filter (display only) |

### 3.5 Constitution note

- KPI counts are **portfolio grain** — not busiest-day ratio
- Do not label KPI capacity numbers as equivalent to cluster `54/10` (A1 validation tension — observe only)

---

## 4. Calendar toolbar

**Component:** `CalendarToolbar`  
**Height:** 48px

### 4.1 Layout (left → right)

```
[◀] [Jan 2024 – Dec 2027] [▶] [Today] [Expand all ▾]
[☐ Show declined & canceled] [☐ Show empty disciplines]
                                    ——— spacer ———
                              [Day] [Week] [Month●] [Year]
```

### 4.2 Fixture state

| Control | State |
|---------|-------|
| Zoom | **Month** selected (`aria-pressed=true`) |
| Mode | Approval (toggle in parent toolbar — `SlotRequestsViewToolbar`) |
| Today | Scrolls to Jun 5 2026 reference line; Oct cluster visible after user pans or on task script |
| Layer toggles | Declined off · Empty disciplines off |

### 4.3 Copy (exact)

- Period label: display current visible range (mock: `Jan 2024 – Dec 2027`)
- Today button: `Today`
- Expand control: `Expand all` / `Collapse all`
- Layer: `Show declined & canceled` · `Show empty disciplines`
- Zoom pills: `Day` · `Week` · `Month` · `Year`

### 4.4 Hierarchy

| Priority | Element |
|----------|---------|
| 1 | Zoom control (Month selected) |
| 2 | Today + period navigation |
| 3 | Layer toggles |
| 4 | Expand all |

---

## 5. Date header

**Component:** `DateHeader`  
**Height:** 56px · **Sidebar cell width:** 280px

### 5.1 Layout

```
┌─ Sidebar 280px ─┬─ Oct ─────┬─ Nov ─────┬─ Dec ─────┬─ ...
│ Location /      │  W  T  F  │  W  T  F  │  W  T  F  │
│ Discipline      │  1  2  3  │  ...      │  ...      │
└─────────────────┴───────────┴───────────┴───────────┘
```

### 5.2 Month view granularity

- Month band labels: `Oct` `Nov` (primary task window)
- Week start markers within month at `ppd=4` (existing engine)
- **Today line:** 1px vertical, full canvas height, labeled in facilitator script as Jun 5 2026 (dataset reference)

### 5.3 Sidebar header label

- Exact copy: `Location / Discipline`

---

## 6. Location row

**Component:** Location expand row in `ConceptCodaTimeline`  
**Height:** 48px · **Sidebar:** 280px sticky

### 6.1 Fixture row (expanded)

```
┌─ Sidebar ─────────────────────┬─ Timeline (muted band) ─────────────────────┐
│ ▾ MedStar Good Samaritan     │  (grid lines only — no objects at location    │
│   Hospital                   │   level in approval mode)                     │
│                          [3] │                                               │
└──────────────────────────────┴───────────────────────────────────────────────┘
```

### 6.2 Copy

| Field | Value |
|-------|-------|
| Location name | `MedStar Good Samaritan Hospital` |
| Queue badge | `3` (awaiting decision in subtree) |

### 6.3 Interaction

| Action | Result |
|--------|--------|
| Click location row | Toggle expand/collapse of discipline children |
| Default state | Expanded (fixture) |

---

## 7. Discipline row (sidebar cell)

**Component:** Discipline sticky cell  
**Min height:** 52px (grows to fit cluster card, max ~60px for dashboard layout)

### 7.1 Fixture — Behavioral Health · OT

```
┌─ Sidebar 280px ─────────────────────────┐
│   Occupational Therapy                  │
│   8/10  [Tight]                         │  ← discipline cap; NOT busiest-day
│                                    [3]  │  ← queue count badge
└─────────────────────────────────────────┘
```

### 7.2 Copy (exact)

| Field | Value | Grain |
|-------|-------|-------|
| Discipline | `Occupational Therapy` | — |
| Capacity line | `8/10` | Discipline approved/cap (sidebar) |
| Capacity badge | `Tight` | `CapacityStateBadge` xs |
| Queue badge | `3` | Requests awaiting decision |

### 7.3 Hierarchy (sidebar)

| Priority | Element |
|----------|---------|
| 1 | Discipline name |
| 2 | Queue count badge (amber, tabular) |
| 3 | `8/10` + capacity state badge |

### 7.4 Constitution flag

- Sidebar `8/10` **must not** be labeled busiest day — validate A1 paraphrase in testing
- No approve action in sidebar

---

## 8. Timeline canvas (discipline row)

**Component:** `ConceptCodaTimeline` grid area  
**Background:** card · grid lines subtle · today line overlay

### 8.1 Row contents (fixture)

| Object | Type | Span | Position |
|--------|------|------|----------|
| BH OT cluster | Cluster card | Sep 8 – Dec 18 2026 | Single cluster spanning footprint |
| (optional) Villanova approved | Absorbed in cluster | — | Not separate card at month zoom |

At month zoom with 4 linked requests: **one cluster card** only (no school names on surface).

---

## 9. Cluster card anatomy (primary F1 wireframe)

**Component:** `ApprovalObjectCard` · layout `dashboard`  
**Min width:** 64px+ at month zoom · **Height:** 44px (3-line dashboard)  
**Click target:** Full card → opens F3 (`ApprovalClusterModal`)

### 9.1 Visual structure

```
┌─ posture rail 3px ─┬─ Card body (border 1px, radius 6px, pad 6×4) ─────────────┐
│ VIOLET (Decide     │ LINE 1 (primary, 11px semibold):  54/10 · Busiest Wed    │
│  first)            │ LINE 2 (secondary, 10px):          Fri · Day · BH          │
│                    │ LINE 3 (meta, 9px):                4 need decision · 3 sch │
│                    │ SURROGATES (inline end):           ★2  ↪1  [Hard]          │
└────────────────────┴────────────────────────────────────────────────────────────┘
```

### 9.2 Field specification

| # | Field | Exact copy (fixture) | Hierarchy | Notes |
|---|-------|----------------------|-----------|-------|
| L1 | Busiest-day ratio | `54/10` | **Dominant** | Tabular nums · largest line |
| L1b | Grain label | `· Busiest Wed` | Paired with L1 | Required per Constitution §C |
| L2 | Footprint identity | `Fri · Day · BH` | Secondary | Schedule lane — not school names |
| L3 | Need-decision pressure | `4 need decision` | Tertiary | Posture driver |
| L3b | School count | `· 3 sch` | Tertiary | Number only — no names |
| S1 | Gold surrogate | `★2` | Surrogate | 2 gold-partner requests in cluster |
| S2 | Sequence surrogate | `↪1` | Surrogate | 1 sequence constraint |
| S3 | Competition badge | `Hard` | Badge xs | `CompetitionSeverityBadge` — not merged with ratio |

### 9.3 Posture rail (decision status)

| Property | Value |
|----------|-------|
| Width | 3px left border |
| Posture | **Decide first** |
| Meaning | Policy sequence — not request workflow status |
| Color token | Violet (posture) — wire as labeled swatch, not final brand color |

**Distinct from card fill:** Card body uses neutral/muted aggregate fill — **not** Review blue or Pending amber fill for cluster.

### 9.4 Request status fill (cluster)

| Property | Value |
|----------|-------|
| Fill | Muted aggregate (`color-mix card 92% muted`) |
| Border | `1px solid border` |
| Meaning | Container for linked requests — not single request status |

### 9.5 Hidden on cluster surface (Constitution §C)

- School names
- Full competitor list
- Approve / Decline / Hold
- Request IDs
- Consequence preview
- Headroom numbers (deferred to F2 hover / F3)

### 9.6 `aria-label` (accessibility)

```
Linked decisions: 54 of 10 on busiest Wednesday, Fri Day BH,
4 need decision, 3 schools, 2 gold partners, 1 sequence constraint, hard competition.
Click to compare.
```

---

## 10. Single request card anatomy (reference state)

**When:** 1 request on footprint at month zoom (not primary fixture path)  
**Component:** `ApprovalObjectCard` · single layout

### 10.1 Structure

```
┌─ rail 3px ─┬─ Card ─────────────────────────────────────┐
│ (posture)  │  Johns Hopkins Univ · 1 slot               │  ← school name OK on single
│            │  Fri · Day · BH                            │
└────────────┴────────────────────────────────────────────┘
```

### 10.2 Fixture note

Usability fixture shows **cluster only** on BH OT row. Include single-card frame as component variant inventory — not primary F1 test path.

### 10.3 Single vs cluster rule

| | Single card | Cluster card |
|--|-------------|--------------|
| School name | Visible (abbrev) | **Hidden** |
| Ratio line | Optional headroom | **54/10 · Busiest Wed** required |
| Click | F3 if multi elsewhere; else Detail | **Always F3** |

---

## 11. Signals at Month zoom

### 11.1 Visible (required)

| Signal | Surrogate | Location |
|--------|-----------|----------|
| Busiest-day pressure | `54/10 · Busiest Wed` | Cluster L1 |
| Footprint | `Fri · Day · BH` | Cluster L2 |
| Need-decision count | `4 need decision` | Cluster L3 |
| School count | `3 sch` | Cluster L3 |
| Gold partner | `★2` | Cluster surrogate |
| Sequence | `↪1` | Cluster surrogate |
| Competition severity | `[Hard]` badge | Cluster surrogate |
| Decision posture | Violet 3px rail | Cluster left |
| Today | Vertical line | Canvas |
| Queue pressure | Badge on sidebar | Discipline row |

### 11.2 Intentionally hidden

| Signal | Where it appears |
|--------|------------------|
| School names (cluster) | F3 triage rows |
| Headroom if approved | F2 hover · F3 · Detail |
| Verdict / channels | Detail VerdictBand |
| Impact table | Detail |
| Approve actions | Detail only |
| Request ID | Detail audit |
| Full status mix prose | F3 header |

### 11.3 Compressed surrogates legend

| Glyph | Meaning |
|-------|---------|
| `★n` | n gold-partner requests in cluster |
| `↪n` | n sequence constraints |
| `[Hard]` | Hardest competition class in cluster |
| `3 sch` | 3 schools — not names |

---

## 12. Interaction specifications

### 12.1 Primary interactions (F1)

| User action | System response | Next frame |
|-------------|-----------------|------------|
| Click cluster card | Open F3 Intermediary modal · calendar remains mounted | F3 |
| Hover cluster card (pointer) | Show F2 hover preview (optional path) | F2 |
| Click single card | Open Detail (if alone on footprint) | F4/F5 |
| Scroll timeline | Pan months · preserve vertical position | F1 |
| Change zoom | Switch to Year/Week/Day frame spec — not F1 | — |
| Click KPI filter | Filter visible rows | F1 filtered |
| Expand/collapse location | Toggle discipline rows | F1 |

### 12.2 Explicitly absent

| Action | Constitution |
|--------|--------------|
| Approve on card | §B forbidden |
| Approve in hover | §B forbidden |
| Right-click menu | Not in v0 |
| Drag to reschedule | Not in v0 |

### 12.3 Selection state

| State | Visual |
|-------|--------|
| Default | Standard border + shadow |
| Hover | `shadow-md` elevation |
| Selected (return from F3) | `2px ring ring` · z-index 4 · optional 2s pulse on F8 return |

### 12.4 Keyboard

| Key | Action |
|-----|--------|
| Tab | Move between cards in row |
| Enter | Open cluster (same as click) |
| Escape | Close modal if open — return F1 |

---

## 13. ASCII wireframe — full F1 (fixture)

```
┌────────────────────────────────────────── 1440 ──────────────────────────────────────────┐
│ KPI  Pending 2 │ In Review 1 │ Awaiting 3 │ Avg Age 4d │ Expiring 1                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ [◀] Jan 2024 – Dec 2027 [▶]  Today  Expand all   ☐ declined  ☐ empty    Day Week Month Year│
├──────────── 280 ────────────┬────────────────── Timeline ──────────────────────────────────┤
│ Location / Discipline       │        Sep        Oct           Nov        Dec              │
│                             │        ...        1 2 3 ... 15 ...        ...              │
├─────────────────────────────┼────────────────────────────────────────────────────────────┤
│ ▾ MedStar Good Samaritan    │                                                            │
│   Hospital               3  │                                                            │
├─────────────────────────────┼────────────────────────────────────────────────────────────┤
│   Occupational Therapy      │     ┌─╫──────────────────────────────────────┐             │
│   8/10 Tight             3  │     ║ 54/10 · Busiest Wed                  │             │
│                             │     ║ Fri · Day · BH                       │             │
│                             │     ║ 4 need decision · 3 sch    ★2 ↪1 Hard│             │
│                             │     └──────────────────────────────────────┘             │
│                             │                    ↑ cluster card (violet rail)           │
│                             │                              │ today line                │
├─────────────────────────────┼────────────────────────────────────────────────────────────┤
│   (other disciplines        │                                                            │
│    collapsed / empty)       │                                                            │
└─────────────────────────────┴────────────────────────────────────────────────────────────┘
                                                          [F1]  ← facilitator badge only
```

---

## 14. Component mapping (build reference)

| Wireframe region | Existing component | Mid-fi wireframe component |
|------------------|-------------------|---------------------------|
| KPI strip | `CalendarKpiStrip` | `KpiStrip` (5 metrics) |
| Toolbar | `CalendarToolbar` | `CalendarToolbar` |
| Date header | `DateHeader` | `DateHeader` |
| Location row | `ConceptCodaTimeline` | `LocationRow` |
| Discipline sidebar | `ConceptCodaTimeline` | `DisciplineSidebarCell` |
| Cluster card | `ApprovalObjectCard` | `ClusterCard` / variant `dashboard` |
| Single card | `ApprovalObjectCard` | `SingleRequestCard` |
| Posture rail | (gap in code — wireframe defines) | `PostureRail` 3px |
| Competition badge | `CompetitionSeverityBadge` | `CompetitionBadge` |
| Gold stars | `GoldPartnerStarsInline` | `GoldSurrogate` ★n |
| Sequence | (gap — wireframe defines) | `SequenceSurrogate` ↪n |
| Hover | `ApprovalHoverCard` | F2 — optional |

---

## 15. Figma frame inventory (F1)

| Frame ID | Name | State |
|----------|------|-------|
| F1-001 | Month · Default · BH cluster visible | Primary |
| F1-002 | Month · Cluster selected (ring) | Return from F3 |
| F1-003 | Month · Location collapsed | Secondary |
| F1-004 | Month · KPI filtered (Review only) | Secondary |
| F1-005 | Month · Empty discipline row | Empty state |
| F1-006 | Month · Single card variant | Component reference |
| F1-007 | Month · Cluster + F2 hover open | Optional |

**Artboard:** 1440 × 900 · Grayscale + posture color labels only (no brand exploration)

---

## 16. Spacing priorities

| Region | Priority | Rule |
|--------|----------|------|
| Cluster L1 ratio | P0 | Never truncated below `54/10 · Busiest Wed` at min card width 64px |
| Posture rail | P0 | Always visible — never clipped |
| Footprint L2 | P1 | Truncate after `Fri · Day · BH` pattern |
| Surrogates ★ ↪ badge | P1 | Wrap to line 3 before truncating L1 |
| Sidebar queue badge | P2 | Never hidden by discipline name |
| KPI captions | P3 | May wrap on narrow viewports |

---

## 17. Empty and edge states

### 17.1 Empty discipline row

```
│   Speech-Language Pathology │  No requests in this period                    │
```

- Copy: `No requests in this period` (italic, 10px muted)

### 17.2 Collapsed location

- Timeline band shows: `4 requests · 3 awaiting decision`

### 17.3 No clusters in scope (filtered)

- Row: empty grid · sidebar queue `0`

### 17.4 Minimum card width (28px)

- Fallback chip: `4 req` + rail color only — **not used in primary fixture** (card spans full footprint width)

---

## 18. Content clarity requirements

### 18.1 Required tooltips (info icon or native `title`)

| Element | Tooltip copy |
|---------|--------------|
| `54/10 · Busiest Wed` | `Load on the busiest shared day in this commitment window — not total slots for the period.` |
| `★2` | `2 requests from gold partner schools in this cluster.` |
| `↪1` | `1 request must be decided before others — open compare to see sequence.` |
| `[Hard]` | `Hard competition — shared capacity on the same active days.` |
| `4 need decision` | `4 requests awaiting approve, hold, or decline.` |
| Sidebar `8/10` | `Approved slots vs discipline capacity at this location — not busiest-day pressure.` |

### 18.2 Terminology (do not paraphrase in wireframe)

| Use | Do not use |
|-----|------------|
| `need decision` | needs approval |
| `linked decisions` | grouped requests |
| `Busiest Wed` | total slots |
| `compare` (in F3 eyebrow) | review list |
| `Fri · Day · BH` | availability name |

---

## 19. Design review checklist (F1)

| Item | Pass criterion |
|------|----------------|
| B | No approve/decline on F1 surface |
| C | Footprint + ratio + rail + need-decision + ★ + ↪ visible on cluster |
| C | School names hidden on cluster |
| C | Busiest-day grain label paired with ratio |
| D | Sidebar vs cluster cap both present (tension logged) |
| Hierarchy | L1 ratio scannable in &lt;3s at 1440 canvas |
| Flow | Cluster click → F3 (prototype wire annotation) |

---

## 20. Prototype alignment notes

| Spec element | Current prototype (`?dataset=usability-prototype`) | Wireframe intent |
|--------------|---------------------------------------------------|------------------|
| `54/10 · Busiest Wed` | May show engine `demand/cap slots` | **Wireframe uses fixture copy** — implementation gap flagged V1/V4 |
| Posture rail | Not rendered in code | **Wireframe requires** 3px violet rail |
| `↪1` surrogate | May be absent on card | **Wireframe requires** on cluster |
| `4 need decision` | May show status mix line | **Wireframe uses** explicit need-decision copy |
| Facilitator badge | `F1` bottom-right | Keep for sessions |

**Mid-fi wireframe is source for Figma build.** Prototype code may lag — do not weaken wireframe to match code.

---

## 21. Acceptance criteria (wireframe sign-off)

- [ ] One cluster card readable at arm's length — ratio line dominant
- [ ] Posture rail and request fill visually distinct (annotation legend on frame)
- [ ] No commit actions on F1
- [ ] Sidebar `8/10` and cluster `54/10` both present with different tooltip grains
- [ ] Click target annotated → F3
- [ ] All copy matches fixture table §9.2
- [ ] Frame F1-001 through F1-005 in Figma frame inventory
- [ ] Constitution checklist §19 all pass

---

*Next frame: F3 Intermediary Modal mid-fi spec*
