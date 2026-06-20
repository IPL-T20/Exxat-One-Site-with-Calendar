# F3 — Intermediary Modal · Mid-Fidelity Wireframe Specification

**Frame ID:** F3  
**Cognitive role:** Understand — *Why here? Why linked? Who competes? Who first?*  
**Constitution:** §A §10, 20–21 · §B (no approve in F3) · §C visible/hidden · §D validation items  
**Assumptions validated:** A2 (cluster = linked decisions) · A4 (F3 enables correct row choice)  
**Entry:** F1 cluster card click  
**Exit:** Row click or footer CTA → F4/F5/F6 Detail · Close → F1 (scroll preserved)  
**Fixture:** MedStar · Behavioral Health · OT · Oct 2026 · Cap 10 · Wed Oct 15 critical

**Mid-fidelity intent:** Validate the Understand layer and F1→F3 transition before Detail implementation.

---

## 1. Purpose

| Dimension | Specification |
|-----------|---------------|
| **Exact purpose** | Compare **linked decisions** sharing footprint and capacity coupling; choose which request to open first |
| **Primary question** | *Who competes, who goes first, and which request should I open?* |
| **Step label** | Step 1 of 2 — compare before commit |
| **Success signal** | ≥4/6 choose Hopkins as first open row without moderator hint (T2/T3) |

### 1.1 Questions answered vs deferred

| Answered in F3 | Deferred to Detail (F4/F5/F6) |
|----------------|-------------------------------|
| Why are these requests linked? | Can I approve this request? |
| Who competes for shared capacity? | Why (VerdictBand channels)? |
| Who should be decided first? | What happens if I approve? (consequence + impact) |
| How tight is busiest day? (header ratio) | Hold / decline consequences |
| Which row to open next? | Acknowledgment gate |
| Per-row headroom surrogate | Policy / Ops lens evidence |
| | Request submission / audit |

---

## 2. Modal anatomy

### 2.1 Shell (shared with Detail — Constitution §A §21)

```
DialogOverlay [50% — calendar remains mounted beneath]
└── DialogContent [1216 × min(920, 80vh), centered, flex column, overflow hidden]
    ├── DialogHeader [shrink-0, px=32, pt=24, pb=16, border-b]
    │   ├── CloseButton [top-right, icon only]
    │   ├── Eyebrow
    │   ├── FootprintTitle + WeekdayStrip
    │   ├── LocationMeta
    │   ├── CapacityCompetitionBlock
    │   ├── SequenceLine [violet]
    │   └── SortHint
    ├── TriageList [flex-1, overflow-y auto, px=32, divide-y]
    │   └── TriageRow × n
    └── ModalFooter [shrink-0, px=32, py=12, border-t]
        ├── CountLabel
        └── PrimaryCTA only
```

### 2.2 Region dimensions

| Region | Height / behavior |
|--------|-------------------|
| DialogHeader | ~200–240px (wrap allowed) |
| TriageList | flex-1 · scroll when >5 rows |
| TriageRow | min 72px each (py=12) |
| ModalFooter | 48px |
| Horizontal padding | 32px (`px-8` in codebase) |

### 2.3 Sticky vs scrollable

| Region | Scroll |
|--------|--------|
| Header | Fixed — does not scroll |
| Triage list | Scrolls independently |
| Footer | Fixed |
| Calendar behind | Preserved position — not remounted |

### 2.4 Element traceability matrix

| Element | F1 question answered | Detail question deferred | Constitution rule |
|---------|---------------------|--------------------------|-----------------|
| **Modal overlay** | *What deserves investigation?* — confirms drill-in from noticed cluster | All commit questions | §A §20 frozen path F1→F3 |
| **Same shell as Detail** | *Where was I?* — predictable step 1 of 2 | VerdictBand anatomy | §A §21 predictability |
| **Eyebrow** | *Why linked?* — names compare intent | Can I approve? | §A §10 F3 = Understand |
| **Footprint title + weekday strip** | *Where is pressure?* — expands F1 `Fri · Day · BH` | Full schedule eligibility | §C F1 footprint visible → F3 full |
| **Location · discipline · dates** | *Why here?* — situates cluster on timeline | Submission location fields | §C F3 triage context |
| **Busiest-day ratio line** | *Where is pressure?* — expands F1 `54/10 · Busiest Wed` | Consequence bar if approve | §A §19 busiest-day grain |
| **Competition line** | *What deserves investigation?* — names coupling | Impact Effect column | §C F3 competition framing |
| **Sequence line** | *What deserves investigation?* — expands F1 `↪1` | Policy lens detail | §A §17 lenses separate |
| **Competition badge [Hard]** | *Where is pressure?* — expands F1 `[Hard]` | Merged verdict score | §B no merged channels |
| **Capacity badge [Tight/Full]** | *Where is pressure?* — busiest-day state | Duplicate capacity grid | §B no duplicate cap math |
| **Sort hint** | *Who first?* | Approve order enforcement | §A §10 understand-only |
| **TriageRow rank** | *Who first?* | Verdict sentence | §C F3 triage rows |
| **School name (row)** | — (hidden on F1 cluster) | — | §C F1 hide names · F3 show |
| **Review first label** | *Who first?* — expands ★/↪ | Open Hopkins link (F4) | §A §10 sequence |
| **Status pill (row)** | Request workflow state | Decision posture rail | §A §18 status ≠ posture |
| **Slots · queue age** | *Who competes?* — demand signals | Ack / consequence | §C aggregate vs row grain |
| **Headroom on busiest Wed** | *How tight?* — per-row surrogate | Consequence `9/10→10/10` | §B no duplicate full preview |
| **Rank signal chips** | *Who first?* — policy/gold cues | Policy lens bullets | §A §17 three lenses |
| **Row click** | *Which request to open?* | Approve action | §B no approve in F3 |
| **Footer CTA** | *Recommended next action* | Confirm approve | §B approve only in Detail |
| **Footer count** | *How many linked?* | — | §C aggregate school/request count |
| **Close (X)** | Return to noticed calendar | — | §A §21 scroll preserved |

---

## 3. Header specification

### 3.1 Eyebrow

| Property | Value |
|----------|-------|
| Copy | `Compare linked decisions · Step 1 of 2 · 4 linked` |
| Style | 11px uppercase muted (`WorkflowModalEyebrow`) |
| F1 answers | *Why linked?* — contrasts with F1 cluster card |
| Detail defers | Step 2 verdict |
| Constitution | §A §10 · §A §20 Step 1 of 2 |

### 3.2 Footprint title row

```
Fri · Day · BH                    [M T W T F S S]  ← weekday strip (Wed+Fri active)
Day Shift (12-Hours)(07:00-19:00)
```

| Field | Fixture copy |
|-------|--------------|
| Footprint | `Fri · Day · BH` |
| Weekdays active | Wed · Fri (strip highlights W + F) |
| Shift window | `Day Shift (12-Hours)(07:00-19:00)` |

| Trace | |
|-------|--|
| F1 | Expands schedule lane from cluster L2 |
| Detail defers | Weekday adjust / Modify panel |
| Constitution | §C cross-zoom footprint identity |

### 3.3 Location meta

| Copy | `MedStar Good Samaritan Hospital · Behavioral Health · Sep 4 – Dec 18, 2026` |
|------|-------------------------------------------------------------------------------|
| F1 | Answers *why here* on timeline |
| Detail defers | Full submission address grid |
| Constitution | §C F3 context only |

### 3.4 Capacity block

```
54/10 · Busiest Wed Oct 15
3 schools competing for 10 slots on shared days
[Hard]  [Tight]
```

| Line | Exact copy | F1 | Detail defers | Constitution |
|------|------------|-----|---------------|--------------|
| Ratio + grain | `54/10 · Busiest Wed Oct 15` | Expands F1 L1 | Consequence preview numbers | §A §19 · §C grain label |
| Competition | `3 schools competing for 10 slots on shared days` | Expands `3 sch` | Impact table rows | §C F3 competition framing |
| Badges | `[Hard]` + `[Tight]` | Expands F1 surrogates | Capacity ‖ Policy ‖ Ops channels | §A §17 · §B no merge |

**Do not show:** `totalSlotDemand/cap slots` without busiest-day label as primary line (engine fallback — wireframe uses fixture copy above).

### 3.5 Sequencing treatment

```
Decide Johns Hopkins University first — partner obligation · shared Wednesdays
```

| Property | Value |
|----------|-------|
| Style | 14px · violet text · full width below capacity block |
| Icon | Optional `↪` prefix |
| Fixture copy | Exact string above |
| F1 answers | Expands `↪1` surrogate — *what deserves investigation first* |
| Detail defers | F4 disabled Approve + Open Hopkins link mechanics |
| Constitution | §A §17 policy as understand signal · §C F3 sequence |

### 3.6 Recommendation treatment (header-level)

| Element | Role |
|---------|------|
| Sequence line | **Primary recommendation** — who first and why (policy) |
| Sort hint | **Secondary recommendation** — reinforces row order |

**Sort hint copy:** `Sorted by review priority — open row 1 first.`

| F1 | *Who first?* from ↪ |
| Detail defers | Suggested section narrative |
| Constitution | §A §10 understand not decide |

### 3.7 Competition treatment (header-level)

| Signal | Treatment | Not |
|--------|-----------|-----|
| Competition line | Plain language count | Overlap geometry |
| [Hard] badge | `CompetitionSeverityBadge` xs | Single merged risk score |
| School names in header | **None** — count only | Full competitor list prose |

| F1 | Expands `[Hard]` + `3 sch` |
| Detail defers | Impact Effect verbs per school |
| Constitution | §B not overlap-based · §C F3 framing |

### 3.8 Capacity treatment (header-level)

| Signal | Grain | Copy |
|--------|-------|------|
| Primary ratio | Busiest active day | `54/10 · Busiest Wed Oct 15` |
| Capacity badge | Cluster worst state | `[Tight]` or `[Full]` |
| Secondary (optional muted) | Period demand | `8 slots requested · cap 10` — subordinate, not headline |

| F1 | Answers *where is pressure* at day grain |
| Detail defers | Consequence bar · Capacity lens accordion |
| Constitution | §A §6 active-day · §B no sidebar-cap equivalence |

**Forbidden in header:** Discipline sidebar `8/10` · second capacity grid · merged cap score.

### 3.9 Sort hint

| Copy | `Sorted by review priority — open row 1 first.` |
|------|--------------------------------------------------|
| Style | 14px muted |
| F1 | Action literacy from notice |
| Detail defers | VerdictBand decision sentence |
| Constitution | §A §10 |

---

## 4. Triage row anatomy

**Component:** `ClusterTriageCard`  
**Interaction:** Full row button → opens Detail Step 2 · preserves list scroll on back

### 4.1 Row structure

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [rank]  ★ Johns Hopkins University · Review first          [Review]     │
│         Master of Occupational Therapy (OT) · OT                         │
│         1 slot · 4d in queue · 0 left on busiest Wed · [Gold partner]    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Row fields (fixture — 3 need-decision rows)

#### Row 1 — Johns Hopkins ★ (suggested first)

| Field | Value |
|-------|-------|
| Rank | `1` |
| School | `Johns Hopkins University` + `★` |
| Review first | `· Review first` (muted suffix on rank 1 only) |
| Status pill | `Review` (blue fill — **request status**) |
| Program | `Master of Occupational Therapy (OT) · OT` |
| Slots | `1 slot` |
| Queue age | `4d in queue` |
| Headroom | `0 left on busiest Wed` |
| Chip | `Gold partner` (brand tone) |

#### Row 2 — Towson

| Field | Value |
|-------|-------|
| Rank | `2` |
| School | `Towson University` |
| Status pill | `Pending` (amber) |
| Slots | `3 slots` |
| Queue age | `6d in queue` |
| Headroom | `0 left on busiest Wed` |
| Chip | `Sequence blocked` (violet) — until Hopkins decided |

#### Row 3 — Duke

| Field | Value |
|-------|-------|
| Rank | `3` |
| School | `Duke University` |
| Status pill | `Pending` |
| Slots | `2 slots` |
| Queue age | `3d in queue` |
| Headroom | `Would block` or `0 left on busiest Wed` |
| Chip | none or `Competing` (muted) |

**Not in triage list:** Villanova (Approved) — shown only in Detail impact as context, not F3 row.

### 4.3 Row field traceability

| Field | F1 question | Detail deferred | Constitution |
|-------|-------------|-----------------|--------------|
| Rank | *Who first?* | Verdict priority | §C F3 triage |
| School name | Names competitors hidden on F1 | — | §C F1 hide · F3 show |
| ★ | Expands F1 `★2` at row level | Partner lens | §C gold surrogate |
| Review first | *Who first?* | F4 Decide first for Towson | §A §10 |
| Status pill | Workflow state per row | Posture rail | §A §18 |
| Slots | *Who competes?* | Modify stepper | §C row grain |
| Queue age | *What deserves attention?* | SLA / inaction | §D deferred |
| Headroom busiest Wed | *How tight?* per row | Consequence + Impact | §B no full preview |
| Sequence blocked chip | Expands ↪ for this row | F4 blocker link | §A §17 policy |
| Row hover | Preview — no actions | — | §B no approve |
| Row click | *Which to open?* | Approve | §B · §A §11 |

### 4.4 Row hierarchy (scan order)

| Priority | Element |
|----------|---------|
| 1 | Rank + school + Review first |
| 2 | Headroom on busiest Wed |
| 3 | Status pill |
| 4 | Slots · queue age |
| 5 | Program line |
| 6 | Chips |

### 4.5 Row states

| State | Visual |
|-------|--------|
| Default | Transparent · divider below |
| Hover | `bg-muted/25` |
| Focus | Ring inset |
| After return from Detail | Scroll position restored — no row removed unless declined via F7 (F8 path) |

---

## 5. Footer specification

### 5.1 Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 3 of 3 requests                              [Open suggested request →]  │
└──────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Elements

| Element | Copy | Interaction |
|---------|------|-------------|
| Count | `3 of 3 requests` | Display only |
| Primary CTA | `Open suggested request →` | Opens rank 1 row (Hopkins) → F5 |
| Secondary actions | **None** | — |
| Approve / Hold / Decline | **Absent** | — |

| Trace | |
|-------|--|
| F1 | Recommended action from noticed cluster |
| Detail defers | All commit actions |
| Constitution | §B no approve in F3 · §A §10 |

---

## 6. Hover interactions

### 6.1 In-modal row hover

| Property | Spec |
|----------|------|
| Trigger | Pointer on triage row |
| Surface | Row background only — **no popover** |
| Content change | None — scannability over tooltip density |
| F1 | — |
| Detail defers | — |
| Constitution | §A §10 no second layer in Understand |

### 6.2 Calendar hover (F2) while F3 open

| Property | Spec |
|----------|------|
| Behavior | **Suppressed** while modal open |
| Rationale | Focus on compare list |
| Constitution | Progressive disclosure |

### 6.3 Row `title` / tooltip (optional mid-fi)

| Target | Tooltip |
|--------|---------|
| Headroom | `Remaining slots on busiest Wednesday if you approve this request.` |
| Sequence blocked | `Johns Hopkins must be decided before this request can be approved.` |
| Review first | `Highest review priority in this linked set.` |

---

## 7. Interactions

| Action | Result | Next frame |
|--------|--------|------------|
| Click row 1 (Hopkins) | Open Detail | F5 |
| Click row 2 (Towson) | Open Detail | F4 |
| Click footer CTA | Open rank 1 | F5 |
| Click X / overlay / Escape | Close modal | F1 scroll preserved |
| Back from Detail | Return here | F3 scroll preserved |
| Tab through rows | Focus ring | — |
| Enter on focused row | Open Detail | F4/F5/F6 |

**Forbidden:** Approve · Hold · Decline · Bulk select · Reorder drag

---

## 8. ASCII wireframe (fixture)

```
┌──────────────────────────── Modal 1216 ────────────────────────────────────────────────┐
│ [X]                                                                                    │
│ COMPARE LINKED DECISIONS · STEP 1 OF 2 · 4 LINKED                                      │
│                                                                                        │
│ Fri · Day · BH                              [M][T][W][F][F][S][S]  (W F on)             │
│ Day Shift (12-Hours)(07:00-19:00)                                                     │
│ MedStar Good Samaritan Hospital · Behavioral Health · Sep 4 – Dec 18, 2026             │
│                                                                                        │
│ 54/10 · Busiest Wed Oct 15                                                             │
│ 3 schools competing for 10 slots on shared days                                        │
│ [Hard]  [Tight]                                                                        │
│                                                                                        │
│ Decide Johns Hopkins University first — partner obligation · shared Wednesdays         │
│ Sorted by review priority — open row 1 first.                                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 1  ★ Johns Hopkins University · Review first                              [Review]    │
│    Master of Occupational Therapy (OT) · OT                                            │
│    1 slot · 4d in queue · 0 left on busiest Wed · Gold partner                        │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2  Towson University                                                      [Pending]    │
│    Master of Occupational Therapy (OT) · OT                                            │
│    3 slots · 6d in queue · 0 left on busiest Wed · Sequence blocked                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3  Duke University                                                        [Pending]    │
│    Master of Occupational Therapy (OT) · OT                                            │
│    2 slots · 3d in queue · 0 left on busiest Wed                                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3 of 3 requests                                        [Open suggested request →]      │
└────────────────────────────────────────────────────────────────────────────────────────┘
         Calendar (F1) visible beneath overlay — scroll position unchanged
                                                          [F3] facilitator badge
```

---

## 9. Empty states

### 9.1 Cluster opens with zero need-decision rows

| Condition | All linked requests Approved or Declined |
| Display | Header intact · triage list empty |
| Copy | `No requests need a decision in this cluster.` |
| CTA | `Close` only — no `Open suggested request` |
| F1 | User opened resolved cluster |
| Detail defers | — |
| Constitution | §C need-decision pressure |

### 9.2 Single request in cluster (degenerate)

| Condition | 1 linked request only |
| Display | Header + 1 row |
| Eyebrow | `Compare linked decisions · Step 1 of 2 · 1 linked` |
| Footer | `1 of 1 requests` · CTA opens sole row |
| Note | Wireframe variant F3-004 — not primary usability path |

### 9.3 All rows on hold

| Condition | Prototype hold state from F7 return |
| Display | Rows show `On hold` chip + blue indicator |
| Header ratio | Unchanged |
| F1 | Posture update on F8 — row still in list |
| Constitution | §A §18 hold ≠ resolved |

---

## 10. Edge cases

| Case | Behavior | Wireframe frame |
|------|----------|-----------------|
| User opens Towson (row 2) before Hopkins | Allowed → F4 Decide first | F3-005 |
| User clicks footer CTA | Always rank 1 — Hopkins | F3-001 |
| Return from F5 with Back to compare | F3 scroll restored · Hopkins row dimmed optional | F3-006 |
| Declined row (post-F7) | Row removed from list · count updates | F3-007 |
| Long school name | Wrap · do not truncate rank/headroom | — |
| 6+ rows | Triage list scrolls · header/footer fixed | F3-008 stress reference only |
| Keyboard only | Tab rows · Enter opens Detail | — |
| Screen reader | `aria-label` on row includes rank, school, review first, headroom | — |

---

## 11. Component mapping

| Wireframe | Code component | Mid-fi note |
|-----------|----------------|-------------|
| Shell | `DialogContent` `WORKFLOW_MODAL_SHELL` | Same as Detail |
| Eyebrow | `WorkflowModalEyebrow` | Copy frozen |
| Header | `ClusterModalHeader` | Add sequence line + busiest-day ratio |
| Weekday strip | `FootprintWeekdayStrip` | Existing |
| Badges | `CompetitionSeverityBadge` · `CapacityStateBadge` | Separate |
| Row | `ClusterTriageCard` | Headroom copy: busiest Wed |
| Footer | `ClusterModalFooter` | CTA copy frozen |
| Sequence line | **Wireframe new in header** | Violet text block |

---

## 12. Figma frame inventory (F3)

| ID | State |
|----|-------|
| F3-001 | Default · 3 rows · Hopkins rank 1 (**primary**) |
| F3-002 | Header only annotation legend |
| F3-003 | Row hover |
| F3-004 | Single-request cluster |
| F3-005 | User path annotation → Towson → F4 |
| F3-006 | Return from Detail · scroll preserved |
| F3-007 | Post-decline · 2 rows |
| F3-008 | Empty need-decision |

**Artboard context:** F1 grayed behind 50% overlay · 1440 × 900

---

## 13. Spacing priorities

| Priority | Rule |
|----------|------|
| P0 | Sequence line visible without scrolling header on 900px viewport |
| P0 | `54/10 · Busiest Wed Oct 15` never below fold in header |
| P1 | Row 1 school + Review first on one line when possible |
| P1 | Headroom column scannable down list |
| P2 | Status pills align right |
| P3 | Program line truncates before headroom |

---

## 14. Acceptance criteria (wireframe sign-off)

- [ ] Eyebrow exact: `Compare linked decisions · Step 1 of 2`
- [ ] No Approve / Hold / Decline on F3
- [ ] Busiest-day ratio + grain in header — not period-total alone
- [ ] Competition line: `3 schools competing for 10 slots on shared days`
- [ ] Violet sequence line present with fixture copy
- [ ] School names on rows only — not in header competition line
- [ ] Status pills = request status — not posture rail
- [ ] Footer CTA: `Open suggested request →` only
- [ ] Same modal width/height as Detail frame annotation
- [ ] Element traceability table §2.4 complete for all header/footer/row fields
- [ ] Constitution checklist items B, C, F3 row pass

---

## 15. Prototype alignment notes

| Wireframe element | Prototype gap | Action |
|-------------------|---------------|--------|
| `54/10 · Busiest Wed Oct 15` | May show `8/10 slots` demand | Build to wireframe — flag V3/V4 |
| Sequence line | Missing in code header | **Required for F3 wireframe** |
| `0 left on busiest Wed` | May say `headroom` generic | Copy alignment |
| `Sequence blocked` chip | May use rank signal only | Wireframe explicit chip on Towson |
| Villanova absent from list | Correct if approved filtered | Match engine filter rules |

---

## 16. Top 5 usability assumptions tested by F3

| # | Assumption | Evidence code | Pass signal |
|---|------------|---------------|-------------|
| **1** | Users understand **linked decisions** after F1 cluster click — not grouped by date or availability | A2 · C-COM-1 | ≥5/6 describe as linked/competing in debrief |
| **2** | F3 header **competition line + ratio** answers *who competes* and *how tight* without Detail | A1 · A4 | ≥4/6 name 3 schools + busiest Wed after 30s in F3 |
| **3** | **Sequence line + rank 1** communicate Hopkins-first without moderator | A3 · A4 | ≥5/6 open Hopkins first via row or CTA |
| **4** | **Per-row headroom on busiest Wed** is believed as triage signal — not full approve consequence | A7 (partial) | ≥4/6 use headroom to explain row order |
| **5** | Users accept **no approve in F3** — they expect to open a row to commit | Workflow | ≥5/6 do not hunt approve on F3; proceed to Detail |

---

## 17. Top 5 failure modes

| # | Failure mode | Observable behavior | Assumption hit |
|---|--------------|---------------------|----------------|
| **1** | **F3 skipped** — users demand approve on compare or return to F1 frustrated | Click approve area habitually · "why can't I decide here?" | #5 · I-COM-2 |
| **2** | **Competition line ignored** — users read only school names, miss shared-days coupling | Cannot state "shared Wednesdays" or slot cap after F3 | #2 · I-COM-3 |
| **3** | **Sequence line missed** — users open Towson row despite header + rank 1 | Wrong-first-open ≥3/6 | #3 · I-SEQ-2 |
| **4** | **Ratio misread in header** — treat `54/10` as period total or sidebar cap | Same paraphrase error as F1 after F3 exposure | #2 · I-CAP-1 |
| **5** | **Headroom list distrusted** — users scroll expecting Impact table in F3 | "Where does it say who blocks Duke?" before opening Detail | #4 · opens Detail prematurely OK; failure if refuse to open |

---

## 18. Evidence that would invalidate F1 → F3 transition model

**Invalidation** = evidence at **S4 tier** (≥4/6) per Evidence Review Framework — not single-participant friction.

| # | Invalidating evidence | What it would imply | Change class (not automatic redesign) |
|---|----------------------|---------------------|--------------------------------------|
| **1** | ≥4/6 **bypass F3** — click cluster expecting Detail or approve; express F3 as unnecessary step | Compare layer adds friction without comprehension gain | Workflow refinement review — not remove F3 without Round 2 |
| **2** | ≥4/6 **no better after F3** than after F1 at naming competitors or sequence | F3 does not add understanding over F1 card + hover | UI refinement F3 header — or F1 surrogate boost — Constitution §D only |
| **3** | ≥4/6 **cannot choose correct first row** after full F3 dwell despite sequence line + rank | Understand layer fails sequencing job | Workflow refinement · **not** approve in F3 |
| **4** | ≥4/6 treat F3 as **availability bucket** picker — "pick any school in the offering" | Linked-decision model not transmitted F1→F3 | UI refinement copy · validate A2 before cluster model change |
| **5** | ≥4/6 **abandon task** at F3 — modal overwhelm, wrong ratio, or approve-hunt | Step 1 of 2 breaks calendar-first path | Pause study · F7/F3 split review — architecture only if §E bar met in Round 2 |

**Would NOT invalidate transition (log only):**

- One user opens Towson first then recovers on F4
- Users prefer footer CTA over row click
- Users want Villanova visible as context row (approved)

---

## 19. F1 → F3 transition diagram

```
F1 Notice                          F3 Understand                      Detail Decide
─────────                          ─────────────                      ──────────────
Where is pressure?        ──────►  Why linked?                 ───►  Can I approve?
What deserves investigation?       Who competes?                      Why?
                                   Who first?                         What if I approve?
54/10 · Busiest Wed                54/10 · Busiest Wed Oct 15         VerdictBand
Fri · Day · BH                     3 schools · 10 slots              Consequence
4 need decision · 3 sch            Sequence line                       Impact
★2 ↪1 [Hard]                      Ranked rows + headroom              Ack + actions
(no school names)                  (school names)                      (no compare table)
```

---

*Next frame: F4/F5/F6 Detail mid-fi spec*
