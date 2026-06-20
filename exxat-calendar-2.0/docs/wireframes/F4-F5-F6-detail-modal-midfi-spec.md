# F4 / F5 / F6 — Detail Modal · Mid-Fidelity Wireframe Specification

**Frame IDs:** F4 (Decide first) · F5 (Ready) · F6 (Approve with risk)  
**Cognitive role:** Decide — *Can I commit? Why? What happens if I approve?*  
**Constitution:** §A §11, 13–18, 20–21 · §B · §C Detail visible/hidden · §D A5–A8  
**Entry:** F3 row click or footer CTA · F4 also via Open Hopkins from F4  
**Exit:** Approve/Hold/Decline → F7 · Back to compare → F3 · Close → F1  
**Fixture:** Hopkins R-1041 · Towson R-1042 · Duke R-1043 · Villanova R-1044 · Cap 10 · Wed Oct 15

**Risk posture:** Highest-risk decision surface in the product — commit intent lives here only.

**Mid-fidelity intent:** Validate Decide layer before F7/F8 assembly.

---

## 1. Purpose and frame variants

| Frame | School | Verdict sentence | Approve | Primary task |
|-------|--------|------------------|---------|--------------|
| **F4** | Towson | `DECIDE JOHNS HOPKINS FIRST` | Disabled | Sequence recovery |
| **F5** | ★ Johns Hopkins | `READY TO APPROVE` | Enabled + ack | Happy-path approve |
| **F6** | Towson (return) | `APPROVE WITH RISK` | Enabled + ack | Risk-path approve |

### 1.1 F3 questions resolved in Detail

| F3 question (deferred) | Detail section that resolves |
|------------------------|------------------------------|
| Can I approve this request? | **VerdictBand** — sentence + Approve enabled/disabled |
| Why? | **VerdictBand channels** + **Suggested** + **Policy lens** |
| What happens if I approve? | **Consequence preview** + **Impact table** |
| Per-row headroom (triage) | **Consequence bar** + **Capacity lens** (expand) |
| Policy sequence (header) | **F4** verdict + **Open Hopkins** + **Policy lens** |
| Which row to open | — (resolved in F3; Detail is single-request) |
| Hold / decline outcome | **Action availability** only — **consequence in F7** |

### 1.2 Decisions enabled (not enabled in F3)

| Decision | Frames | Surface |
|----------|--------|---------|
| **Approve** (commit yes) | F5 · F6 | VerdictBand + Footer |
| **Approve blocked** (defer) | F4 | Disabled Approve + Open Hopkins |
| **Hold** (temporary posture) | F5 · F6 · F4 | VerdictBand + Footer |
| **Decline** (commit no) | F5 · F6 · F4 | VerdictBand + Footer |
| **Modify** (partial approval intent) | F5 · F6 | VerdictBand — opens sub-panel |
| **Review another first** | F4 | Open Johns Hopkins → |
| **Return to compare** | All | Back to compare → F3 |

---

## 2. Full modal anatomy

### 2.1 Shell (shared F3/F4/F5/F6 — Constitution §A §21)

```
DialogOverlay [50%]
└── DialogContent [1216 × min(920, 80vh), flex column, overflow hidden]
    ├── VerdictBand [sticky top, z=10, shrink-0, px=32, min-h=64, border-b, bg-background]
    ├── ContinueBanner [conditional F5 load after F4→Hopkins — dismissible, shrink-0]
    ├── DetailHeader [shrink-0, px=32, pt=16, pb=16, border-b]
    ├── DetailBody [flex-1, overflow-y auto, px=32]
    │   ├── SuggestedSection [expanded]
    │   ├── ConsequencePreview [expanded — F4 greyed]
    │   ├── ImpactTable [expanded]
    │   ├── AckCheckbox [conditional F5/F6 — below Impact, above lenses]
    │   ├── ThreeLensAccordion [collapsed default]
    │   │   ├── CapacityLens
    │   │   ├── PolicyLens
    │   │   └── OperationsLens
    │   ├── SubmissionAccordion [collapsed]
    │   └── AuditAccordion [collapsed]
    ├── ModifyPanel [conditional inline — replaces top of body or overlays]
    ├── ReasonPicker [conditional Hold/Decline — replaces Footer]
    ├── ObjectNavigation [shrink-0, 48px — cluster context]
    └── DetailFooter [shrink-0, px=32, py=16, border-t — duplicate actions]
```

### 2.2 Scroll and sticky rules

| Region | Behavior |
|--------|----------|
| VerdictBand | **Sticky** — always visible while body scrolls |
| DetailHeader | Scrolls away (verdict is commitment anchor) |
| Ack | Visible above fold on F5/F6 at 900px viewport — target pre-scroll |
| Lenses / Submission / Audit | Below fold by default — collapsed |
| Footer actions | Duplicate VerdictBand — reachable without scroll-back |

### 2.3 Master traceability — modal regions

| Region | F3 question resolved | Decision enabled | Constitution |
|--------|---------------------|------------------|--------------|
| VerdictBand | Can I approve? · Why (channels)? | Approve · Hold · Decline · Modify | §A §11 · §A §17 · §B approve only Detail |
| ContinueBanner | Who first? (reminder) | Review another first | §A §15 navigation not commit |
| DetailHeader | — (identity context) | Back to compare | §A §21 scroll preserved |
| Suggested | Why? (plain language) | Interprets verdict | §A §14 approve-path optimize |
| Consequence | What if I approve? (capacity) | Informs approve/decline intent | §A §6 active-day |
| Impact | What if I approve? (peers) | Informs ack + approve | §B effect verbs |
| Ack | Impact internalized? | Gates Approve F5/F6 | §D A8 |
| Lenses | Why? (evidence) | None — expand only | §B no duplicate math · §C collapsed |
| Submission / Audit | — | None | §B audit-only ID · §C hidden default |
| ObjectNavigation | — | Switch request in set | §A §21 |
| Footer | Can I approve? (reachability) | Same as band | §A §11 |
| ReasonPicker | — | Confirm hold/decline | §A §13 negative intent |
| ModifyPanel | What if partial approve? | Modified approve | Partial flow |

---

## 3. VerdictBand anatomy

**Component:** `VerdictBand` · **Position:** Top of modal · **Sticky:** yes

### 3.1 Structure

```
VerdictBand [VERTICAL gap=8px, px=32, py=16]
├── DecisionSentence [16px semibold, ALL CAPS optional F4/F5/F6]
├── ThreeChannelLine [12px horizontal wrap, gap=16]
│   ├── CapacityChannel
│   ├── PolicyChannel
│   └── OpsChannel
├── ActionRow [horizontal gap=8]
│   ├── Approve [primary]
│   ├── Modify [secondary]
│   ├── Hold [secondary]
│   └── Decline [destructive outline]
├── BlockerLink [F4 only — 14px violet]
└── AckCheckbox [F5/F6 when impact — may duplicate body position; band OR body, not both in wireframe — **body placement below Impact**]
```

**Wireframe rule:** Ack lives **below Impact table** in body (not in band) for F5/F6 — band Approve disabled until ack checked.

### 3.2 Variant matrix

| Element | F4 Towson | F5 Hopkins | F6 Towson |
|---------|-----------|------------|-----------|
| DecisionSentence | `DECIDE JOHNS HOPKINS FIRST` | `READY TO APPROVE` | `APPROVE WITH RISK` |
| Capacity | `Capacity ✓ 0 left on busiest Wed` | same | same |
| Policy | `Policy ⚠ sequence` | `Policy ✓` | `Policy ✓` |
| Ops | `Ops ✓` | `Ops ✓` | `Ops ✓` |
| Approve | **Disabled** + tooltip | Enabled | Enabled |
| Tooltip | `Decide Johns Hopkins first` | — | — |
| BlockerLink | `Open Johns Hopkins →` | — | — |
| Ack in body | No | **Yes** | **Yes** |

### 3.3 Channel glyphs (frozen)

| Glyph | Meaning |
|-------|---------|
| ✓ | Pass |
| ⚠ | Risk / sequence / caution |
| ✕ | Blocked |
| ? | Confirmation needed (fixture: not used F5) |

### 3.4 Traceability

| Element | F3 resolved | Decision | Constitution |
|---------|-------------|----------|--------------|
| DecisionSentence | Can I approve? | Commit posture | §A §17 separate from status |
| Capacity channel | How tight? (header ratio expanded) | Approve enablement | §A §17 capacity lens |
| Policy channel | Who first? / sequence | F4 block | §A §17 policy lens |
| Ops channel | — (F3 N/A) | F5 pass | §A §17 ops lens |
| Approve | Can I approve? | **Approve** | §A §11 · §B not in F3 |
| Modify | — | Partial approval | Partial flow |
| Hold / Decline | — (outcome F7) | Hold / Decline | §A §13 workspace |
| BlockerLink | Who first? | Open Hopkins | §A §10 sequence |
| Disabled Approve | Sequence from F3 | Defer commit | §D A6 |

### 3.5 Acceptance — VerdictBand

- [ ] Readable without scrolling (first paint)
- [ ] Three channels always separate — never merged badge
- [ ] F4 Approve disabled with tooltip — not hidden
- [ ] Actions duplicated in Footer

---

## 4. DetailHeader anatomy

```
DetailHeader
├── BackLink [← Back to compare]  (if from cluster)
├── Eyebrow [Review request · Step 2 of 2 · {n} of {m} in compare]
├── Title [24px] ★ Johns Hopkins University  (or Towson / Duke)
├── Subtitle [14px] Program · OT · [Status pill]
└── Meta [12px tabular] Dates · Slots — NO Request ID
```

### 4.1 Fixture copy

| Frame | Title | Subtitle | Meta |
|-------|-------|----------|------|
| F4 | `Towson University` | `Master of Occupational Therapy (OT) · OT` · `Pending` | `3 slots · Sep 4 – Dec 18, 2026` |
| F5 | `★ Johns Hopkins University` | `Master of Occupational Therapy (OT) · OT` · `Review` | `1 slot · Sep 8 – Nov 28, 2026` |
| F6 | `Towson University` | same as F4 | same as F4 |

### 4.2 Traceability

| Element | F3 resolved | Decision | Constitution |
|---------|-------------|----------|--------------|
| Back to compare | Which row set? | Return F3 | §A §21 |
| Step 2 of 2 | Compare done | Commit now | §A §20 |
| Title school | Row choice from F3 | Identity | §C F3 showed names |
| Status pill | Row status from F3 | Request status only | §A §18 ≠ posture |
| No Request ID | — | — | §B audit only |

---

## 5. Suggested Action treatment

### 5.1 Structure

```
SuggestedSection [expanded, py=16]
├── SectionLabel [11px uppercase muted] "Suggested"
└── Narrative [14px, max 2 lines]
```

### 5.2 Fixture copy

| Frame | Narrative |
|-------|-----------|
| F4 | `Open Johns Hopkins first, then return to this request.` |
| F5 | `Approve — no other partner blocks this request.` |
| F6 | `Approve with risk — 0 left on busiest Wed; Duke would block.` |

### 5.3 Rules

- Does **not** duplicate DecisionSentence verbatim
- Does **not** replace Impact table
- F6 **must** name downstream school (Duke)
- F4 links via BlockerLink — not inline approve in Suggested

### 5.4 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Suggested | Why? (plain language after triage) | Guides Approve / Open Hopkins | §A §14 · not second verdict |

---

## 6. Consequence Preview anatomy

### 6.1 Structure (F5/F6)

```
ConsequencePreview [expanded, py=16]
├── SectionLabel [11px uppercase] "Consequence if you approve"
├── DayLabel [14px semibold] "Wed Oct 15"
├── BeforeAfterBar [full width, h=8, rounded track]
│   └── Fill [width % = after/cap]
├── RatioLabels [11px tabular] "9/10 → 10/10"
└── CapNote [12px muted] "Busiest day in this commitment window"
```

### 6.2 Structure (F4)

```
ConsequencePreview [expanded, py=16]
├── SectionLabel "Consequence if you approve"
└── GreyedCopy [14px muted]
    "Unavailable until sequence resolved — open Johns Hopkins first."
```
**No fake bar or numbers on F4.**

### 6.3 Fixture values

| Frame | Before → After | Bar |
|-------|----------------|-----|
| F5 | `9/10 → 10/10` | 90% → 100% amber→red |
| F6 | `10/10 → 10/10` | 100% (no change — already full) |
| F4 | N/A | Hidden / explanation only |

### 6.4 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Consequence | Headroom per row → day-level commit | Approve / Decline capacity reasoning | §A §6 · §B no mental math |
| Busiest day label | Header `54/10` grain | — | §A §19 |
| F4 greyed | Sequence blocks preview | Open Hopkins | §A §17 policy |

### 6.5 Visibility target

- F5/F6: visible **before scroll** on 900px viewport (with VerdictBand + Suggested + Impact header)

---

## 7. Impact section anatomy

### 7.1 Structure

```
ImpactTable [expanded, py=16]
├── SectionTitle [14px semibold] "If you approve, these change"
└── Table [full width]
    ├── HeaderRow [36px, 11px uppercase muted]
    │   School | Slots | Status | Effect
    └── DataRows [36px min each]
```

### 7.2 Effect column verbs (frozen)

| Effect | Emphasis | Meaning |
|--------|----------|---------|
| `Would block` | semibold destructive | Peer cannot approve after this |
| `Would tighten` | semibold amber | Peer headroom → 0 |
| `No change` | muted | No peer effect |
| `Decide first` | semibold violet | F4 only — sequence |

**Forbidden:** competitor jargon · pool keys · engine IDs

### 7.3 Fixture rows

**F5 Hopkins**

| School | Slots | Status | Effect |
|--------|-------|--------|--------|
| Towson | 3 | Pending | Would tighten |
| Duke | 2 | Pending | Would block |
| Villanova | 2 | Approved | No change |

**F6 Towson**

| School | Slots | Status | Effect |
|--------|-------|--------|--------|
| Duke | 2 | Pending | Would block |
| Johns Hopkins | 1 | Approved | No change |

**F4 Towson**

| School | Slots | Status | Effect |
|--------|-------|--------|--------|
| Johns Hopkins | 1 | Review | Decide first |

### 7.4 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Impact table | Who competes? → named effects | Approve + **ack** | §A §14 · §B effect verbs |
| ≥2 rows F5/F6 | Competition line expanded | Decline strategy (peer benefit in F7) | §C F3 hide · Detail show |

---

## 8. Acknowledgement behavior

### 8.1 Placement

```
[below Impact table, above collapsed lenses]
☐ I understand the impact above
```

### 8.2 Rules

| Condition | Ack required |
|-----------|--------------|
| F5 — Impact rows with Would block/tighten | **Yes** |
| F6 — Approve with risk | **Yes** |
| F4 — Decide first | **No** |
| Ready + all No change only | No (not fixture) |

### 8.3 Interaction

| State | Approve (band + footer) |
|-------|-------------------------|
| Ack unchecked | Disabled |
| Ack checked | Enabled |
| Hold / Decline | Always enabled — no ack |

### 8.4 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Ack | Impact deferred from F3 | **Approve** commit gate | §D A8 |

### 8.5 Research instrumentation

- Log time-to-check vs Impact dwell time
- Debrief: recall one Effect row — A8 / Top-5 #5

---

## 9. Capacity lens (collapsed default)

### 9.1 Trigger

```
▸ Capacity    Capacity ✓ 0 left on busiest Wed   [glyph echo from band]
```

### 9.2 Panel content (expanded)

| Field | F5 fixture value |
|-------|------------------|
| Busiest day | `Wed Oct 15` |
| Load | `9/10 approved · 1 pending pressure` |
| Headroom if approved | `0 left if you approve` |
| Schedule lane | `Fri · Day · BH · OT` |
| Offering cap | `10 slots on active days` |

### 9.3 Rules

- **No** second "Available capacity" discipline grid
- Numbers **must match** Consequence preview
- **No** sidebar `8/10`

### 9.4 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Capacity lens | How tight? evidence | Supports approve dispute | §B no duplicate · §C collapsed |

---

## 10. Policy lens (collapsed default)

### 10.1 Panel content

**F4**

| Field | Copy |
|-------|------|
| Rules in play | `Partner obligation — Gold sequence` |
| | `Shared Wednesdays with Johns Hopkins` |
| Verdict | `Sequence required before Towson` |

**F5/F6**

| Field | Copy |
|-------|------|
| Rules in play | `Gold partner · shared Wednesdays` |
| Fairness | `Gold partner · 4 days in queue` (F5) |

### 10.2 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Policy lens | Who first? · sequence line | F4 block rationale | §A §17 · §B no catalog |

---

## 11. Operations lens (collapsed default)

### 11.1 Panel content

| Field | F5/F6 fixture |
|-------|---------------|
| Status | `Ops confirmed` |
| Unit | `Behavioral Health 4E` |

**F4:** `Ops confirmed` — does not block sequence.

### 11.2 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Ops lens | — | F5 happy path | §A §17 third channel |

---

## 12. Submission section (collapsed default)

### 12.1 Panel content (expand only)

| Field | Example |
|-------|---------|
| School | (from row) |
| Program | OT |
| Dates | requested duration |
| Slots | n |
| Location | Behavioral Health |
| Notes | placeholder |
| Attachments | placeholder |

### 12.2 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Submission | — | None pre-commit | §C hidden · §B not above Impact |

---

## 13. Audit section (collapsed default)

### 13.1 Panel content

| Field | Fixture |
|-------|---------|
| Request ID | `R-1041` / `R-1042` / `R-1043` monospace |
| History | mock timeline |
| Comments | placeholder |

### 13.2 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Audit | — | Post-hoc reference | §B Request ID audit only |

**Trigger row shows ID microcopy right-aligned in collapsed summary (11px mono) — optional; expand for full history.

---

## 14. ObjectNavigation

```
[◀]  2 of 6  [▶]
```
- Prev/Next within `navigationIds` from F3
- Does not replace Back to compare
- Muted bar — must not compete with VerdictBand

### Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Object nav | Row set context | Switch request | §A §21 — de-emphasized |

---

## 15. Approve flow

### 15.1 F5 Hopkins (happy path)

```
Land F5
→ Read VerdictBand (<3s): READY · channels · Approve enabled
→ Read Suggested + Consequence 9/10→10/10
→ Read Impact (Towson tighten, Duke block)
→ Check ack (deliberate)
→ Click Approve (band or footer)
→ F7 Approve outcome modal
→ [Review Towson next] or Close → F8
```

### 15.2 F6 Towson (risk path)

```
Land F6 (after F5 approve + return)
→ Verdict: APPROVE WITH RISK
→ Consequence 10/10→10/10
→ Impact: Duke Would block
→ Ack → Approve → F7
```

### 15.3 Traceability

| Step | F3 resolved | Decision | Constitution |
|------|-------------|----------|--------------|
| Full flow | All deferred commit questions | **Approve** | §A §11 · §A §14 |

---

## 16. Hold flow

### 16.1 Interaction

```
Click Hold (band or footer)
→ ReasonPicker replaces Footer [inline, same modal]
    Reasons: Ops | Interview | Info needed | Other
    Optional note [textarea]
    [Confirm hold] [Cancel]
→ Confirm → F7 Hold outcome
→ F3 or F1 per F7 CTA
```

### 16.2 Rules

- Hold **always available** — including F4
- No approve from hold picker
- **No** hold consequence preview in Detail — F7 completes (§A §15)

### 16.3 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Hold | — | **Hold** posture | §A §13 · negative in F7 |

---

## 17. Decline flow

### 17.1 Interaction

```
Click Decline
→ ReasonPicker
    Reasons: Capacity | Eligibility | Other
    Optional note
    [Confirm decline] [Cancel]
→ Confirm → F7 Decline outcome
```

### 17.2 Rules

- Available all frames F4/F5/F6
- Confirm required — no one-click
- Inverse impact in **F7** — not Detail

### 17.3 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Decline | — | **Decline** commit | §A §13 · §A §15 |

---

## 18. Partial approval flow (Modify)

### 18.1 Interaction

```
Click Modify
→ ModifyPanel [inline, top of DetailBody or overlay]
    Slots stepper [1–3]
    Date trim chips [e.g. Sep–Oct only]
    Weekday adjust [read-only v0]
    Live mini-consequence [same bar component]
    [Approve modified] [Cancel]
```

### 18.2 F6 use case

- Towson 3→1 slots — bar may show headroom recovered (prototype optional)
- **Primary path F6:** Approve with risk — Modify secondary

### 18.3 Rules

- Modify always enabled (including F4 — but approve still blocked until sequence)
- Modified approve uses same ack rules
- Preview uses same Consequence component

### 18.4 Traceability

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Modify | — | Partial **Approve** | §A §11 commit variants |

---

## 19. F4-specific: Review another request first

```
F4 Towson
→ Click Open Johns Hopkins →
→ F7-Continue banner on F5 load (8s dismiss)
    "Continuing review · Towson unchanged · Johns Hopkins is next"
→ F5 Hopkins Detail
```

| | F3 | Decision | Constitution |
|--|-----|----------|--------------|
| Open Hopkins | Who first? | Navigation — not commit | §B banner not blocking modal |

---

## 20. ASCII wireframe — F5 (primary)

```
┌──────────────────────────── Modal 1216 ────────────────────────────────────────────────┐
│ READY TO APPROVE                                                          [sticky]  │
│ Capacity ✓ 0 left on busiest Wed | Policy ✓ | Ops ✓                                 │
│ [Approve] [Modify] [Hold] [Decline]                                                 │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ← Back to compare                                                                   │
│ Review request · Step 2 of 2 · 1 of 3 in compare                                      │
│ ★ Johns Hopkins University                                                          │
│ Master of Occupational Therapy (OT) · OT · [Review] · 1 slot · Sep 8 – Nov 28, 2026  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ SUGGESTED                                                                           │
│ Approve — no other partner blocks this request.                                     │
│                                                                                     │
│ CONSEQUENCE IF YOU APPROVE                                                          │
│ Wed Oct 15   [█████████░]  9/10 → 10/10                                             │
│ Busiest day in this commitment window                                               │
│                                                                                     │
│ IF YOU APPROVE, THESE CHANGE                                                        │
│ School          Slots  Status     Effect                                            │
│ Towson            3    Pending    Would tighten                                     │
│ Duke              2    Pending    Would block                                       │
│ Villanova         2    Approved   No change                                         │
│                                                                                     │
│ ☐ I understand the impact above                                                     │
│ ▸ Capacity   ▸ Policy   ▸ Operations   ▸ Submission   ▸ Audit                       │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [◀]  1 of 3  [▶]                                                                    │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ [← Back]                         [Approve] [Modify] [Hold] [Decline]              │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 21. Figma frame inventory

| ID | Frame | State |
|----|-------|-------|
| F4-001 | Towson · Decide first · disabled Approve | Primary F4 |
| F4-002 | Hold reason picker on F4 | Secondary |
| F5-001 | Hopkins · Ready · ack unchecked | Primary F5 |
| F5-002 | Hopkins · ack checked | Secondary |
| F5-003 | Continue banner after F4→F5 | Secondary |
| F6-001 | Towson · Approve with risk | Primary F6 |
| F6-002 | Modify panel open | Secondary |
| F5-004 | Decline reason picker | Secondary |
| F5-005 | Policy lens expanded | Reference |
| F5-006 | Audit expanded (ID visible) | Reference |

---

## 22. Acceptance criteria (wireframe sign-off)

- [ ] VerdictBand answers Can I approve in &lt;3s without scroll (F5/F6)
- [ ] F4 disabled Approve + tooltip + Open Hopkins
- [ ] Three channels never merged
- [ ] Consequence + Impact above lenses/submission/audit
- [ ] Ack gates F5/F6 approve when impact present
- [ ] Hold/Decline available all variants — no Detail negative preview
- [ ] Request ID audit-only
- [ ] No compare table in Detail
- [ ] Same shell dimensions as F3
- [ ] Effect verbs exact: Would block · Would tighten · No change
- [ ] F4 consequence greyed — no fake numbers

---

## 23. Top 5 usability assumptions (Detail)

| # | Assumption | Code | Pass |
|---|------------|------|------|
| **1** | **VerdictBand** answers Can I approve? in &lt;3s without scrolling | A5 | ≥5/6 state posture from band alone |
| **2** | **F4 disabled Approve** read as sequence block — not broken UI | A6 | ≥5/6 · Open Hopkins unaided ≥4/6 |
| **3** | **Consequence + Impact** believed — users approve with correct peer prediction | A7 | ≥4/6 predict Duke effect post-F5 |
| **4** | **Ack** is deliberate — users recall ≥1 Impact row | A8 | ≥4/6 recall · ack not &lt;3s blind |
| **5** | Users do **not** require hold/decline consequence in Detail — F7 suffices | A9 | ≥4/6 F7 hold/decline comprehension |

---

## 24. Top 5 failure modes (Detail)

| # | Mode | Observable | Frame |
|---|------|------------|-------|
| **1** | **VerdictBand skipped** — scroll to lenses/audit first | Opens Capacity lens before stating posture | F5/F6 |
| **2** | **F4 broken affordance** | Repeated Approve clicks · "bug" language | F4 |
| **3** | **Redundant copy distrust** — band vs Suggested vs Consequence | "Which one is true?" | F5 |
| **4** | **Blind ack** — check without reading Impact | Zero recall Duke/Towson | F5/F6 |
| **5** | **Hold/decline confusion** — return to Detail seeking outcome | Back-nav after F7 expecting Detail preview | F5/F6 |

---

## 25. Top 5 trust risks (Detail)

| # | Risk | Trigger |
|---|------|---------|
| **1** | **Band Capacity ✓** conflicts with **Would block** in Impact | User thinks system contradicts itself |
| **2** | **Lens expand** shows numbers that differ from Consequence | Capacity lens vs bar mismatch |
| **3** | **F6 APPROVE WITH RISK** feels like system forcing bad approve | Risk sentence + enabled Approve |
| **4** | **Disabled Approve** without visible Open Hopkins | Trust collapse on F4 |
| **5** | **Request ID in audit** discovered late — "hidden agenda" | Audit expand after distrust |

---

## 26. Top 5 decision-confidence risks (Detail)

| # | Risk | Decision affected |
|---|------|-------------------|
| **1** | User commits **approve** without peer model | Wrong Duke expectation |
| **2** | User **declines** thinking it helps peers — no Detail inverse | Strategic decline without F7 |
| **3** | User **holds** thinking capacity frees | Operational mistake |
| **4** | User **modifies** without reading mini-consequence | Partial over-commit |
| **5** | User **abandons** at F4 — never reaches F5 | Sequence policy blocks flow |

---

## 27. Root cause diagnostic matrix

**If users fail in F4/F5/F6, isolate cause using task behavior + prior frame success.**

### 27.1 Diagnostic table

| Observable failure in Detail | F1 OK? | F3 OK? | Detail-only? | Likely root cause |
|------------------------------|--------|--------|--------------|-------------------|
| Wrong busiest-day paraphrase at commit | No | No | No | **F1 failure** (ratio literacy A1) |
| Cannot name competitors at approve | No | No | No | **F1+F3 failure** (competition A2/A4) |
| Opened Towson first — recovered on F4 | Yes | Partial | — | **F3 failure** (sequence A3/A4) — not Detail if F4 works |
| F4 "broken" — never finds Open Hopkins | Yes | Yes | Yes | **Detail failure** (A6 affordance) |
| VerdictBand ignored — lens hunting | Yes | Yes | Yes | **Detail failure** (A5 hierarchy) |
| Approve correct but wrong Duke prediction | Yes | Yes | Yes | **Detail failure** (A7 Impact trust) |
| Blind ack · zero recall | Yes | Yes | Yes | **Detail failure** (A8) |
| Post-hold/decline confusion after F7 | Yes | Yes | No | **Not Detail** — F7/F8 (A9) |
| Skipped F3 entirely from F1 | Yes | No | — | **F3 failure** / workflow |
| "Why compare step?" — approve hunt on F3 | — | — | — | **Operating model failure** (layer acceptance) |
| Ratio OK on F1/F3 but wrong at Detail consequence | Yes | Yes | Yes | **Detail failure** (consequence belief) |
| All frames fail same ratio error | No | No | No | **Operating model failure** (capacity grain concept) |
| Engine numbers ≠ wireframe in session | — | — | — | **Prototype fidelity** — tag separately, not model failure |

### 27.2 Decision tree (facilitator)

```
Detail task failed?
├─ Failed F1 T8 ratio paraphrase? ──────────────► F1 / operating model (capacity grain)
├─ Failed F3 competitor/sequence questions? ────► F3 failure
├─ Skipped F3? ─────────────────────────────────► F3 failure / workflow
├─ F4: Approve "broken" / no Open Hopkins? ──────► Detail failure (F4)
├─ F5: VerdictBand not used / lens first? ──────► Detail failure (hierarchy)
├─ F5: Approve OK but wrong peer prediction? ───► Detail failure (Impact)
├─ F5: Blind ack? ──────────────────────────────► Detail failure (A8)
├─ Hold/decline OK but confused after close? ───► F7/F8 (not Detail)
└─ Rejects compare concept entirely? ───────────► Operating model failure
```

### 27.3 Answer: If users fail in F4/F5/F6, likely cause?

**There is no single default cause.** Detail is the highest-risk surface but **inherits** failures from upstream:

| Cause | When it is primary |
|-------|-------------------|
| **F1 failure** | Ratio/grain wrong **before** F3 and **at** Detail commit — same paraphrase error throughout |
| **F3 failure** | Wrong row opened · sequence ignored · competitors unnamed — but **F4/F5 UI works** when reached correctly |
| **Detail failure** | F1/F3 probes pass · failure is VerdictBand · F4 affordance · Impact/ack · consequence belief |
| **Operating model failure** | User rejects linked-decision / two-step compare / busiest-day concept across **all** layers |

**Most common mixed pattern in testing (hypothesis):**

1. **F3 failure** → wrong entry (Towson first) → **F4 Detail** appears to fail (A6)  
   → *Diagnose:* sequence miss = F3; broken UI = Detail  
2. **F1 operating model** → ratio literacy → **Detail** consequence distrusted even when layout correct  
   → *Diagnose:* operating model + F1, not VerdictBand layout alone

**Detail-only failure** is confirmed only when:
- F1 T8 pass AND F3 T2/T3 pass AND
- Failure is band/impact/ack/F4-specific

---

## 28. F3 → Detail handoff map

| F3 provides | Detail resolves |
|-------------|-----------------|
| Row choice (Hopkins/Towson) | Frame variant F4/F5/F6 |
| `54/10 · Busiest Wed` | Consequence bar + Capacity lens |
| Sequence line | F4 verdict + Policy lens |
| Per-row headroom | Impact Effect + ack |
| `3 schools competing` | Impact rows |
| No approve | VerdictBand Approve |

---

## 29. Prototype alignment notes

| Wireframe | Prototype | Note |
|-----------|-----------|------|
| Ack below Impact | In band in early prototype | Wireframe: body placement |
| Lens panel bodies | Empty details stubs | Wireframe requires expand content |
| Modify panel | Button only | F6-002 frame required for optional path |
| F7-Continue banner | On F5 after F4 | Wired in usability dataset |

---

*Next frame: F7/F8 Outcome + Refresh mid-fi spec*
