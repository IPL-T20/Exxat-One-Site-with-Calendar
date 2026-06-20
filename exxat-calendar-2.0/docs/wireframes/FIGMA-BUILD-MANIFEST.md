# Figma Build Manifest — 8-Frame Usability Prototype

**Status:** Build mode · Implementation-ready  
**Source specs:** `F1-month-view-midfi-spec.md` · `F3-intermediary-modal-midfi-spec.md` · `F4-F5-F6-detail-modal-midfi-spec.md` · `F7-F8-outcome-refresh-midfi-spec.md`  
**Do not deviate:** No new concepts · workflows · or decision logic

---

## 0. Figma file setup

### 0.1 File structure (pages)

| Page | Contents |
|------|----------|
| `00 — Tokens & Components` | Variables, text styles, component set |
| `01 — F1 Month` | F1 frames + F8 variants |
| `02 — F2 Hover` | Optional hover overlay |
| `03 — F3 Compare` | Intermediary modal frames |
| `04 — F4/F5/F6 Detail` | Detail variants + sub-flows |
| `05 — F7 Outcome` | Outcome modals |
| `06 — Prototype` | Wired flows (duplicate key frames here OR wire on page 01–05) |

### 0.2 Global canvas

| Token | Value | Figma variable name |
|-------|-------|---------------------|
| Canvas width | 1440 | `canvas/w` |
| Canvas height | 900 | `canvas/h` |
| Sidebar width | 280 | `layout/sidebar-w` |
| KPI strip height | 72 | `layout/kpi-h` |
| Toolbar height | 48 | `layout/toolbar-h` |
| Date header height | 56 | `layout/date-header-h` |
| Location row height | 48 | `layout/location-row-h` |
| Discipline row min | 52 | `layout/discipline-row-min` |
| Modal compare/detail w | 1216 | `layout/modal-lg-w` |
| Modal compare/detail max h | 920 | `layout/modal-lg-h` |
| Modal outcome w | 720 | `layout/modal-sm-w` |
| Modal padding x | 32 | `space/xl` |
| Posture rail w | 3 | `layout/posture-rail-w` |
| Hover card w | 300 | `layout/hover-w` |
| Cluster card min h | 44 | `layout/cluster-card-h` |
| Triage row min h | 72 | `layout/triage-row-h` |

### 0.3 Spacing scale (auto-layout gaps & padding)

| Token | px | Use |
|-------|-----|-----|
| `space/xs` | 4 | Icon gaps, badge internal |
| `space/sm` | 8 | Channel line, button row, card pad-y |
| `space/md` | 16 | Section padding, header stacks |
| `space/lg` | 24 | Modal header blocks |
| `space/xl` | 32 | Modal horizontal padding |

### 0.4 Corner radius

| Element | px |
|---------|-----|
| Card / modal | 6 |
| Badge / pill | 4 |
| Button | 6 |
| Toast | 6 |

### 0.5 Wireframe color tokens (mid-fi only — label swatches on frame)

| Token | Hex | Use |
|-------|-----|-----|
| `posture/ready` | #22C55E | Ready rail |
| `posture/risk` | #F59E0B | Risk rail |
| `posture/hold` | #3B82F6 | Hold rail |
| `posture/blocked` | #EF4444 | Blocked rail |
| `posture/sequence` | #7C3AED | Decide first rail |
| `surface/canvas` | #FAFAFA | Page bg |
| `surface/card` | #FFFFFF | Cards |
| `surface/muted` | #F4F4F5 | Toolbar, banner |
| `border/default` | #E4E4E7 | Borders |
| `text/primary` | #18181B | Body |
| `text/muted` | #71717A | Captions |
| `overlay` | #000000 50% | Modal overlay |

### 0.6 Text styles

| Style name | Size | Weight | Case | Use |
|------------|------|--------|------|-----|
| `text/eyebrow` | 11 | Medium | UPPER | Step labels, section labels |
| `text/caption` | 11 | Regular | — | KPI captions, ratio sublabels |
| `text/body-sm` | 12 | Regular | — | Channels, meta |
| `text/body` | 14 | Regular | — | Body, triage meta |
| `text/body-semibold` | 14 | Semibold | — | Sequence line |
| `text/title-sm` | 16 | Semibold | — | Verdict sentence |
| `text/title` | 24 | Semibold | — | School name header |
| `text/kpi-value` | 22 | Bold | — | KPI numbers |
| `text/cluster-l1` | 11 | Semibold | — | 54/10 line |
| `text/mono` | 11 | Regular | Mono | Request ID |

---

## 1. Component library (`00 — Tokens & Components`)

Build as **Figma components** before frames. Use **auto-layout** on all.

### 1.1 Component inventory

| Component set | Variants | Properties |
|---------------|----------|------------|
| `PostureRail` | ready, risk, hold, blocked, sequence | `posture` |
| `KpiMetric` | default, filterable | `filterable` |
| `KpiStrip` | approval-5col | — |
| `CalendarToolbar` | month-selected | `zoom` |
| `DateHeader` | month | — |
| `LocationRow` | expanded, collapsed | `state` |
| `DisciplineSidebarCell` | with-cap-badge | — |
| `ClusterCard` | decide-first, risk, default | `posture` |
| `SingleRequestCard` | review, pending | `status` |
| `Badge/Competition` | hard, soft, over | `level` |
| `Badge/Capacity` | tight, full, open | `state` |
| `Badge/RequestStatus` | pending, review, approved | `status` |
| `Badge/Chip` | gold, sequence, hold | `type` |
| `Surrogate/Gold` | count-1, count-2 | `n` |
| `Surrogate/Sequence` | count-1 | — |
| `HoverCard` | cluster, single | `type` |
| `ModalShell/Lg` | f3, f4-f5-f6 | — |
| `ModalShell/Sm` | f7 | — |
| `ModalOverlay` | 50pct | — |
| `CompareHeader` | default | — |
| `TriageRow` | rank1-review-first, rank2-blocked, rank3-default | `rank`, `chips` |
| `CompareFooter` | with-cta | — |
| `VerdictBand` | f4-decide-first, f5-ready, f6-risk | `variant` |
| `ContinueBanner` | default | — |
| `DetailHeader` | from-cluster | — |
| `Section/Suggested` | f4, f5, f6 | `variant` |
| `Section/Consequence` | active, greyed | `state` |
| `Section/ImpactTable` | f4, f5, f6 | `variant` |
| `AckCheckbox` | unchecked, checked | `checked` |
| `LensAccordion` | collapsed, expanded | `lens`, `state` |
| `ReasonPicker` | hold, decline | `type` |
| `ModifyPanel` | default | — |
| `ObjectNav` | 1of3, 2of3 | `index` |
| `DetailFooter` | default, f4-disabled-approve | `variant` |
| `OutcomeModal` | approve, hold, decline | `outcome` |
| `F8Toast` | approve, hold, decline | `tone` |
| `FrameBadge` | f1–f8 | `frame` |

---

## 2. F1 — Month View

### 2.1 Primary frame

| Property | Value |
|----------|-------|
| **Frame name** | `F1-001 · Month · Default` |
| **Frame size** | 1440 × 900 |
| **Layout mode** | Vertical auto-layout, clip content |

### 2.2 Layer hierarchy

```
F1-001 [FRAME 1440×900, vertical, gap 0]
├── AppChromePlaceholder [OPTIONAL 56h gray bar — out of test scope, or omit]
├── KpiStrip [INSTANCE, h=72, fill width]
├── CalendarToolbar [INSTANCE, h=48, fill width]
├── CalendarCanvas [FRAME, vertical, fill container, min-h 0]
│   ├── DateHeaderRow [FRAME, horizontal, h=56, sticky note]
│   │   ├── SidebarCell [280w] "Location / Discipline"
│   │   └── TimelineMonths [fill] Oct · Nov · Dec bands
│   └── ScrollBody [FRAME, vertical]
│       ├── LocationRow [INSTANCE expanded, h=48]
│       └── DisciplineRow [FRAME, horizontal, min-h=52]
│           ├── DisciplineSidebarCell [INSTANCE 280w]
│           └── TimelineLane [FRAME, fill, relative]
│               ├── GridLines [background]
│               ├── TodayLine [1px vertical]
│               └── ClusterCard [INSTANCE decide-first, absolute x/y per Oct span]
├── F8Toast [hidden in F1-001]
└── FrameBadge [INSTANCE f1, absolute BR]
```

### 2.3 ClusterCard placement (fixture)

| Property | Value |
|----------|-------|
| X | Align to Sep–Dec span in OT row (~x=400 from timeline start — tune to Oct) |
| Y | Vertically centered in discipline row |
| W | min 280px (span footprint) |
| H | 44px |
| Instance | `ClusterCard/posture=sequence` |

**ClusterCard internal auto-layout (horizontal):**

```
ClusterCard [horizontal, gap 0, align center]
├── PostureRail [3×44, sequence color]
└── CardBody [vertical, pad 6×4, gap 2, fill]
    ├── Line1 [horizontal, gap 4] "54/10 · Busiest Wed"
    ├── Line2 "Fri · Day · BH"
    └── Line3 [horizontal, gap 8] "4 need decision · 3 sch" + ★2 + ↪1 + Badge/Hard
```

### 2.4 F1 variant frames

| Frame ID | Delta from F1-001 |
|--------|-------------------|
| F1-002 | ClusterCard + 2px ring stroke selected |
| F1-003 | LocationRow `collapsed` |
| F1-004 | KPI "In Review" highlighted |
| F1-005 | Empty discipline copy |
| F1-006 | SingleRequestCard instead of cluster |
| F1-007 | HoverCard instance over cluster |

### 2.5 F1 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| ClusterCard | On click | `F3-001` (Smart animate 200ms) |
| SingleRequestCard | On click | `F5-001` or `F3-004` |
| KPI filterable | On click | `F1-004` |
| (none) | Approve | — forbidden |

---

## 3. F2 — Hover (optional)

### 3.1 Frame

| Property | Value |
|----------|-------|
| **Frame name** | `F2-001 · Hover · Cluster` |
| **Frame size** | 1440 × 900 |
| **Base** | Duplicate `F1-001` |

### 3.2 Placement

```
HoverCard [INSTANCE cluster, w=300]
  position: above ClusterCard center, offset y=-8
  pointer: note "no actions"
```

### 3.3 Prototype link

| Hotspot | Action | Destination |
|---------|--------|-------------|
| ClusterCard click | On click | `F3-001` (skip F2 in primary flow) |

---

## 4. F3 — Intermediary Compare Modal

### 4.1 Primary frame

| Property | Value |
|----------|-------|
| **Frame name** | `F3-001 · Compare · Default` |
| **Frame size** | 1440 × 900 |
| **Background** | `F1-001` at 100% + `ModalOverlay` + centered modal |

### 4.2 Modal position

| Property | Value |
|----------|-------|
| ModalShell/Lg | 1216 × 920 max (use 1216 × 820 for fixture content) |
| Position | Center X/Y on canvas |
| Overlay | Rectangle 1440×900 fill overlay 50% |

### 4.3 Modal internal hierarchy

```
ModalShell/Lg [VERTICAL, gap 0, clip]
├── DialogHeader [VERTICAL, pad 32, gap 10, hug top]
│   ├── CloseButton [absolute TR 32,32]
│   ├── Eyebrow "COMPARE LINKED DECISIONS · STEP 1 OF 2 · 4 LINKED"
│   ├── TitleRow [HORIZONTAL, gap 12]
│   │   ├── "Fri · Day · BH" text/title-sm
│   │   └── WeekdayStrip [component]
│   ├── Shift "Day Shift (12-Hours)(07:00-19:00)"
│   ├── LocationMeta
│   ├── CapacityBlock [VERTICAL, gap 6]
│   │   ├── "54/10 · Busiest Wed Oct 15" semibold
│   │   ├── "3 schools competing for 10 slots on shared days"
│   │   └── BadgeRow [Hard] [Tight]
│   ├── SequenceLine [14px semibold, sequence color]
│   └── SortHint
├── TriageList [VERTICAL, fill, overflow scroll, pad 0 32]
│   ├── TriageRow rank1
│   ├── TriageRow rank2
│   └── TriageRow rank3
└── CompareFooter [HORIZONTAL, pad 12 32, space between]
    ├── "3 of 3 requests"
    └── Button "Open suggested request →"
```

### 4.4 TriageRow auto-layout

```
TriageRow [HORIZONTAL, pad 12 0, gap 12, min-h 72, fill width]
├── Rank [24w] "1"
└── Content [VERTICAL, gap 4, fill]
    ├── Row1 [HORIZONTAL, space-between]
    │   ├── SchoolLine [★ + name + · Review first]
    │   └── Badge/RequestStatus
    ├── Program line
    └── MetaLine [HORIZONTAL, wrap, gap 6] slots · age · headroom · chips
```

### 4.5 TriageRow instances (fixture)

| Instance | School | Status | Chips |
|----------|--------|--------|-------|
| rank1 | ★ Johns Hopkins · Review first | Review | Gold partner |
| rank2 | Towson | Pending | Sequence blocked |
| rank3 | Duke | Pending | — |

### 4.6 F3 variant frames

| Frame ID | Delta |
|--------|-------|
| F3-003 | TriageRow hover bg |
| F3-005 | Annotation: user path to F4 |
| F3-006 | Row1 dimmed checkmark (return state) |
| F3-007 | 2 rows (post-decline) |
| F3-008 | Empty list message |

### 4.7 F3 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| TriageRow rank1 | On click | `F5-001` |
| TriageRow rank2 | On click | `F4-001` |
| TriageRow rank3 | On click | `F6-001` (or F5 if out of order test) |
| Footer CTA | On click | `F5-001` |
| Close X | On click | `F1-001` |
| Overlay | On click | `F1-001` |

---

## 5. F4 — Detail · Decide First (Towson)

### 5.1 Frame

| Property | Value |
|----------|-------|
| **Frame name** | `F4-001 · Detail · Towson · Decide first` |
| **Canvas** | 1440 × 900 · F1 bg + overlay + ModalShell/Lg 1216 |

### 5.2 Hierarchy

```
ModalShell/Lg [VERTICAL]
├── VerdictBand [INSTANCE f4-decide-first, sticky note]
├── DetailHeader [INSTANCE, Back link visible]
├── DetailBody [VERTICAL, scroll, pad 0 32]
│   ├── Section/Suggested f4
│   ├── Section/Consequence greyed
│   ├── Section/ImpactTable f4 (1 row)
│   └── LensAccordion ×5 collapsed
├── ObjectNav [INSTANCE 2of3]
└── DetailFooter [INSTANCE f4-disabled-approve]
```

### 5.3 VerdictBand variant `f4-decide-first`

```
VerdictBand [VERTICAL, pad 16 32, gap 8, fill width, bottom border]
├── "DECIDE JOHNS HOPKINS FIRST"
├── Channels [HORIZONTAL, gap 16] Capacity ✓ | Policy ⚠ | Ops ✓
├── Actions [HORIZONTAL, gap 8] Approve DISABLED | Modify | Hold | Decline
└── Link "Open Johns Hopkins →"
```

### 5.4 F4 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| Open Johns Hopkins → | On click | `F5-003` (F5 + Continue banner) |
| Back to compare | On click | `F3-001` |
| Hold | On click | `F4-002` ReasonPicker |
| Decline | On click | `F4-003` ReasonPicker decline |
| Approve disabled | No link | Tooltip overlay optional |
| Close | On click | `F1-001` |

---

## 6. F5 — Detail · Ready (Hopkins)

### 6.1 Primary frame

| Property | Value |
|----------|-------|
| **Frame name** | `F5-001 · Detail · Hopkins · Ready` |
| **VerdictBand** | `f5-ready` |

### 6.2 DetailBody section order (fixed)

| # | Component | Variant |
|---|-----------|---------|
| 1 | Section/Suggested | f5 |
| 2 | Section/Consequence | active · 9/10→10/10 |
| 3 | Section/ImpactTable | f5 · 3 rows |
| 4 | AckCheckbox | unchecked |
| 5 | LensAccordion | all collapsed |

### 6.3 Section/Consequence structure

```
Section/Consequence [VERTICAL, pad 16 0, gap 8]
├── Label "CONSEQUENCE IF YOU APPROVE"
├── "Wed Oct 15"
├── Bar [FRAME 8h, full width] track + fill 90%→100%
├── "9/10 → 10/10" tabular
└── Note "Busiest day in this commitment window"
```

### 6.4 Section/ImpactTable structure

```
Section/ImpactTable [VERTICAL, gap 12]
├── Title "If you approve, these change"
└── Table [VERTICAL]
    ├── HeaderRow [HORIZONTAL, 4 cols] School | Slots | Status | Effect
    └── DataRows ×3
```

### 6.5 F5 variant frames

| Frame ID | Delta |
|--------|-------|
| F5-002 | AckCheckbox checked · Approve enabled |
| F5-003 | + ContinueBanner below VerdictBand |
| F5-004 | ReasonPicker hold |
| F5-005 | ReasonPicker decline |
| F5-006 | Policy lens expanded |

### 6.6 F5 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| AckCheckbox | On click | Toggle `F5-002` |
| Approve (requires F5-002) | On click | `F7-001` |
| Hold → Confirm | On click | `F7-003` |
| Decline → Confirm | On click | `F7-004` |
| Back to compare | On click | `F3-001` |
| ObjectNav next | On click | `F4-001` |

---

## 7. F6 — Detail · Approve with Risk (Towson return)

### 7.1 Frame

| Property | Value |
|----------|-------|
| **Frame name** | `F6-001 · Detail · Towson · Approve with risk` |
| **VerdictBand** | `f6-risk` |
| **Consequence** | 10/10→10/10 |
| **Impact** | Duke Would block · Hopkins No change |
| **Suggested** | mentions Duke |

### 7.2 F6 variants

| Frame ID | Delta |
|--------|-------|
| F6-002 | ModifyPanel open |

### 7.3 F6 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| Approve + ack | On click | `F7-002` |
| Modify | On click | `F6-002` |

---

## 8. F7 — Outcome Modals

### 8.1 Shared OutcomeModal structure

| Property | Value |
|----------|-------|
| Frame size | 1440 × 900 (F1 dimmed bg) |
| Modal | 720w · auto height · pad 32 · gap 24 vertical |

```
OutcomeModal [VERTICAL, gap 24]
├── OutcomeHeader [icon + title + subtitle]
├── ConsequenceSummary [lead + detail + hold line if hold]
├── ImpactBlock [label + row list]
├── CalendarDeltaLine [caption muted]
├── ActionRow [HORIZONTAL, space-between]
│   ├── Primary CTA
│   └── Secondary [View on calendar] [Close]
└── RequestIdFooter mono
```

### 8.2 F7 frames

| Frame | Instance | Primary CTA |
|-------|----------|-------------|
| `F7-001` | approve-hopkins | Review Towson next → |
| `F7-002` | approve-towson | Review Duke next → |
| `F7-003` | hold | Review Johns Hopkins → |
| `F7-004` | decline | Review Duke next → |

### 8.3 F7 fixture copy (embed in instances)

**F7-001 Approve Hopkins**
- Lead: `Wed Oct 15 is now full.`
- Detail: `9/10 → 10/10 on busiest day in this window.`
- Impact: Towson Would tighten · Duke Would block · Villanova No change
- Delta: `Calendar will show Wed Oct 15 full · cluster posture Risk`
- ID: `R-1041`

**F7-003 Hold**
- Lead: `No capacity change.`
- Anti-line: `Hold does not free slots or advance other schools.`
- Impact title: `What stayed the same`

**F7-004 Decline**
- Lead: `3 slots released from this request.`
- Impact title: `What changed for others`
- Duke: `Headroom improved`

### 8.4 F7 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| Review Towson next → | On click | `F6-001` or `F3-001` |
| Review Duke next → | On click | `F3-001` (row 3) |
| View on calendar / Close | On click | `F8-001` / `F8-002` / `F8-003` per outcome |
| Return to compare | On click | `F3-001` |

---

## 9. F8 — Calendar Refresh

F8 frames are **F1-001 duplicates** with deltas + toast. Do not rebuild shell.

### 9.1 F8 frame matrix

| Frame | Base | ClusterCard delta | Toast | FrameBadge |
|-------|------|-------------------|-------|------------|
| `F8-001` post-approve Hopkins | F1-001 | posture=risk, ratio updated, ring pulse | approve-hopkins | f8 |
| `F8-002` post-hold | F1-001 | blue hold rail on Towson single if shown; ratio same | hold | f8 |
| `F8-003` post-decline | F1-001 | ratio 51/10, need-decision 3 | decline | f8 |
| `F8-004` post-continue | F1-001 | ↪ pulse annotation on cluster | none | f8 |

### 9.2 F8Toast placement

```
F8Toast [INSTANCE, absolute]
  x: 16
  y: canvas.h - toast.h - 16  (bottom-left)
  max-w: 360
```

### 9.3 F8 prototype links

| Hotspot | Action | Destination |
|---------|--------|-------------|
| ClusterCard | On click | `F3-001` or `F3-007` if declined |
| Toast | Auto note only | — |

---

## 10. Continue banner (F7-Continue — not modal)

**Frame:** `F5-003` includes banner between VerdictBand and DetailHeader

```
ContinueBanner [HORIZONTAL, pad 8 32, fill width, violet tint bg]
├── ↪ + "Continuing review · Towson unchanged · Johns Hopkins is next"
└── Dismiss text button
```

**Prototype:** Dismiss → `F5-001` without banner

---

## 11. ReasonPicker (Detail sub-flow)

**Frames:** `F5-004` hold · `F5-005` decline · `F4-002` hold

```
ReasonPicker [VERTICAL, pad 16 32, gap 12, replaces DetailFooter]
├── Title "Place on hold" | "Decline request"
├── Reasons [HORIZONTAL wrap, gap 8] chip buttons
├── Textarea optional
└── [Confirm] [Cancel]
```

**Prototype:** Confirm hold → `F7-003` · Confirm decline → `F7-004` · Cancel → parent Detail frame

---

## 12. Master prototype flow (usability path)

Wire on page `06 — Prototype` OR link across pages.

```
FLOW A — Happy path (primary)
F1-001
  →(cluster) F3-001
  →(footer CTA or row1) F5-001
  →(ack) F5-002
  →(approve) F7-001
  →(review next) F6-001
  →(ack) F6-002 variant
  →(approve) F7-002
  →(close) F8-001

FLOW B — Sequence path
F1-001
  → F3-001
  →(row2) F4-001
  →(open hopkins) F5-003
  →(dismiss banner) F5-001
  → … FLOW A from ack

FLOW C — Hold
F5-001
  →(hold) F5-004
  →(confirm) F7-003
  →(close) F8-002

FLOW D — Decline
F5-001
  →(decline) F5-005
  →(confirm) F7-004
  →(close) F8-003

FLOW E — Return paths
F5-001 →(back) F3-001
F3-001 →(close) F1-001
F7-* →(view calendar) F8-*
```

### 12.1 Prototype settings

| Setting | Value |
|---------|-------|
| Device | None (desktop frame) |
| Animation | Smart animate 200ms ease-out |
| Overflow | Vertical scroll on TriageList + DetailBody only |
| Starting frame | `F1-001` |

---

## 13. Build sequence (recommended)

| Step | Task |
|------|------|
| 1 | Create variables + text styles (§0) |
| 2 | Build atomic components: PostureRail, Badges, Surrogates |
| 3 | Build ClusterCard + TriageRow + VerdictBand variants |
| 4 | Build ModalShell/Lg + Section components |
| 5 | Build OutcomeModal variants + F8Toast |
| 6 | Assemble F1-001 |
| 7 | Duplicate F1 → F8 variants |
| 8 | Assemble F3-001 on F1 bg |
| 9 | Assemble F4-001, F5-001, F6-001 |
| 10 | Assemble F7-001–004 |
| 11 | Wire prototype flows (§12) |
| 12 | Add FrameBadge to every frame |

---

## 14. Frame checklist (all frames)

| Frame | Size | Modal | Badge |
|-------|------|-------|-------|
| F1-001 | 1440×900 | — | F1 |
| F2-001 | 1440×900 | — | F2 |
| F3-001 | 1440×900 | 1216 | F3 |
| F4-001 | 1440×900 | 1216 | F4 |
| F5-001 | 1440×900 | 1216 | F5 |
| F5-003 | 1440×900 | 1216 + banner | F5 |
| F6-001 | 1440×900 | 1216 | F6 |
| F7-001–004 | 1440×900 | 720 | F7 |
| F8-001–004 | 1440×900 | — | F8 |

---

## 15. Constraints reminder (do not build)

- Approve button on F1, F3
- Compare table inside Detail
- Request ID in Detail header
- Hold/decline consequence block inside Detail
- Merged Capacity+Policy+Ops badge
- School names on F1 cluster card
- Second capacity grid in Detail lenses
- Blocking modal for Continue/defer

---

*Build exactly as specified. Reference mid-fi specs for copy fidelity only — do not extend scope.*
