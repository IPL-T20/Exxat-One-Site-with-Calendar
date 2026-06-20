# F7 / F8 — Outcome + Refresh · Mid-Fidelity Wireframe Specification

**Frame IDs:** F7 (Outcome confirmation) · F8 (Calendar refresh / environmental truth)  
**Cognitive role:** Outcome + Context Refresh — *What did I do? What changed? What now? Did it land?*  
**Constitution:** §A §12, 15 · §B (all outcomes · no re-decide) · §C F7/F8 visible · §D A9, A10  
**Entry:** Detail commit action (Approve / Hold / Decline) · Continue is navigation-only  
**Exit:** Next CTA → F3/F5 · View on calendar / Close → F8 · F1 behind  
**Fixture:** Hopkins R-1041 · Towson R-1042 · Duke R-1043 · MedStar BH OT Oct 2026

**Closure posture:** F7/F8 complete the Decision Workspace — negative and deferral confidence lives here, not Detail.

**Mid-fidelity intent:** Validate Outcome + Refresh layer before full prototype assembly.

---

## 1. Purpose

| Dimension | Specification |
|-----------|---------------|
| **F7 purpose** | Authoritative post-commitment closure — name outcome, summarize consequence, communicate peer impact, route next action |
| **F8 purpose** | Environmental proof — calendar reflects (or explicitly preserves) decision state; user re-orients without losing context |
| **Primary question** | *Did my decision land, what changed, and what should I do next?* |
| **Not answered here** | Can I approve? (Detail) · Why linked? (F3) · Where is pressure? (F1) |
| **Detail questions deferred TO F7** | What happens if I hold? · What happens if I decline? · What happens if I defer? (partial — continue) |

### 1.1 F4/F5/F6 → F7 handoff

| Detail provides | F7 completes |
|-----------------|--------------|
| Commit intent (button + reason) | Outcome confirmation |
| Approve consequence preview | Post-approve summary |
| Impact table (approve path) | Post-approve peer state |
| Hold/decline action only | Hold/decline consequence + inverse impact |
| — | Calendar delta line |
| — | Next recommended action |

---

## 2. F7 anatomy (modal outcomes)

### 2.1 Shell — Approve · Hold · Decline

**Component:** `OutcomeModal`  
**Dimensions:** 720px width · auto height · max 80vh · px 32 · py 24  
**Intentionally smaller than Detail (1216)** — closure, not re-decision

```
OutcomeModal [720 × auto]
├── OutcomeHeader
│   ├── Icon + OutcomeType title
│   └── School + reason chip (hold/decline)
├── ConsequenceSummary
│   └── Hold anti-confusion line (hold only)
├── ImpactBlock
│   └── Impact rows (variant title)
├── CalendarDeltaLine
├── ActionRow
│   ├── PrimaryCTA (next)
│   └── Secondary [View on calendar] [Close]
└── RequestIdFooter [11px mono — audit only]
```

### 2.2 F7-Continue (defer — not modal)

**Component:** `ContinueBanner`  
**Surface:** Dismissible strip on Detail load (F5 after F4 Open Hopkins)  
**Not blocking** — Constitution §B navigation-only

```
ContinueBanner [full width, shrink-0, border-b, violet bg tint]
├── Icon ↪ + "Continuing review"
├── Subline: Towson unchanged · Johns Hopkins is next
└── [Dismiss]
```

### 2.3 Master traceability — F7 regions

| Region | Detail deferred | Decision workspace role | Constitution |
|--------|-----------------|----------------------|--------------|
| OutcomeHeader | Hold/decline/approve outcome | Confirms commit landed | §A §12 · §A §15 |
| ConsequenceSummary | Negative path preview | Names capacity truth | §A §15 F7 completes |
| ImpactBlock | Decline inverse · hold status-quo | Peer effects post-commit | §A §13 |
| CalendarDeltaLine | — | F8 preview | §C F7 delta |
| PrimaryCTA | Next row from F3 | Continue work | §A §20 |
| View on calendar | — | F8 entry | §A §12 |
| RequestIdFooter | Audit | Reference only | §B audit only |
| ContinueBanner | Defer consequence | Defer without commit | §B banner not modal |

**Forbidden in F7:** Lenses · re-Approve/Hold/Decline · submission grid · compare table

---

## 3. F8 anatomy (calendar refresh)

### 3.1 F8 is not a separate full-screen frame

F8 = **F1 Month View** after modal stack closes + **environmental deltas** + **ephemeral annotation**.

```
F8 = F1 Month [unchanged shell]
├── Cluster card deltas (post-outcome)
├── KPI deltas (optional)
├── F8AnnotationToast [bottom-left, 6s]
├── Cluster highlight pulse [2s optional]
└── PrototypeFrameIndicator [F8]
```

### 3.2 Global F8 rules

| Rule | Spec |
|------|------|
| Refetch / state update | Approve · Hold · Decline only — **not** Continue |
| Scroll/zoom | Preserved from pre-modal |
| Selection | Same cluster highlighted 2s |
| Modal stack | All closed — calendar fully visible |
| Animation | 300ms on changed elements only |

### 3.3 Master traceability — F8

| Element | F7 handoff | Validates | Constitution |
|---------|------------|-----------|--------------|
| Cluster ratio update | calendarDelta line | Outcome landed | §C F8 posture/ratio |
| Posture rail change | approve/hold/decline | Decision visible | §A §18 |
| Row removal (decline) | decline impact | Peer queue truth | §C F8 |
| Unchanged ratio (hold) | hold summary | Status-quo proof | §A §15 |
| Annotation toast | calendarDelta | Lightweight confirm | §D A10 |
| No mutation (continue) | banner only | Defer honest | §A §15 |

---

## 4. Outcome: Approve

**Trigger:** F5 or F6 · ack + Confirm approve  
**Variants:** F7-Approve-Hopkins · F7-Approve-Towson

### 4.1 Confirmation treatment

| Property | Hopkins (F5) | Towson (F6) |
|----------|--------------|-------------|
| Icon | ✓ green | ✓ green |
| Title | `Approved` | `Approved` |
| Subtitle | `Johns Hopkins University` | `Towson University` |
| Tone | Subtle positive — not celebratory-only | Same |
| Modal | Blocking 720px | Blocking 720px |

| Detail deferred | Workspace role | Constitution |
|-----------------|----------------|--------------|
| Commit confirmed | Approve closure | §A §15 all outcomes parallel |

### 4.2 Consequence summary

| | Hopkins | Towson |
|--|---------|--------|
| Lead | `Wed Oct 15 is now full.` | `Wed Oct 15 remains full · 0 headroom.` |
| Detail | `9/10 → 10/10 on busiest day in this window.` | `10/10 on busiest day in this window.` |

### 4.3 Impact communication

**Title:** `What changed`

| Hopkins rows | Towson rows |
|--------------|-------------|
| Towson (3) → Would tighten | Duke (2) → Would still block |
| Duke (2) → Would block | Johns Hopkins (1) → No change |
| Villanova (2) → No change | — |

*Post-approve posture labels — reflect new cluster state, not hypothetical.*

### 4.4 Calendar refresh behavior (F8)

| Element | Hopkins approve | Towson approve |
|---------|-----------------|----------------|
| Cluster ratio | Updated ↑ (e.g. 55/10) | Full pressure maintained |
| Wed Oct 15 cell | `10/10` | `10/10` |
| Hopkins object | Approved green fill | — |
| Cluster posture rail | Risk amber (0 headroom) | Risk amber |
| Need-decision count | −1 | −1 |
| F8 annotation | `Hopkins approved · Wed Oct 15 full` | `Towson approved · Wed Oct 15 full` |

**Prototype note (V5):** Full object mutation may be annotation-only in v0 — wireframe shows target F8 state.

### 4.5 Context preservation behavior

| Context | Preserved |
|---------|-----------|
| Month zoom | Yes |
| Scroll position | Yes |
| Scope filters | Yes |
| Cluster selection | Highlight pulse 2s on same cluster |
| F3 scroll (if Next → compare) | Restored on return |

### 4.6 Next recommended action

| Variant | Primary CTA | Action |
|---------|-------------|--------|
| Hopkins | `Review Towson next →` | Open F3 or F6 Towson Detail |
| Towson | `Review Duke next →` | Open F3 row 3 or Detail |
| Last in queue | `View on calendar` | F8 only |

### 4.7 Return-to-calendar behavior

| Control | Behavior |
|---------|----------|
| Close | Dismiss F7 → F8 visible · annotation 6s |
| View on calendar | Dismiss all modals → F8 · cluster in view |
| Review next → | F7 closes → next Detail or F3 per routing |

---

## 5. Outcome: Hold

**Trigger:** Hold + reason + Confirm hold (F4/F5/F6)

### 5.1 Confirmation treatment

| Property | Value |
|----------|-------|
| Icon | ⏸ blue |
| Title | `On hold` |
| Subtitle | `Towson University · Ops` (reason chip) |
| Modal | Blocking 720px |

### 5.2 Consequence summary

| Line | Copy |
|------|------|
| Lead | `No capacity change.` |
| Detail | `Request stays in queue — competitors unchanged.` |
| Required anti-confusion | `Hold does not free slots or advance other schools.` |

| Detail deferred | Constitution |
|-----------------|--------------|
| Hold outcome entirely | §A §15 negative in F7 |

### 5.3 Impact communication

**Title:** `What stayed the same`

| Row | Effect |
|-----|--------|
| Wed Oct 15 | `9/10 (unchanged)` |
| Johns Hopkins (1) | `Still recommended first` or `No change` if approved |
| Duke (2) | `Unchanged` |
| Cluster | `4 need decision` |

### 5.4 Calendar refresh behavior (F8)

| Element | Delta |
|---------|-------|
| Towson object | Hold blue posture rail 3px · Pending fill unchanged |
| Cluster ratio | **Unchanged** |
| Need-decision count | **Unchanged** |
| Optional chip | `1 on hold` muted on cluster |
| F8 annotation | `Towson on hold · no capacity change` |

### 5.5 Context preservation behavior

| Context | Preserved |
|---------|-----------|
| All F1 scroll/zoom | Yes |
| Row in F3 compare | Remains with Hold chip |
| Detail state | Exited — hold committed |

### 5.6 Next recommended action

| Context | Primary CTA |
|---------|-------------|
| Hopkins not approved | `Review Johns Hopkins →` |
| Hopkins approved | `Return to compare →` |

### 5.7 Return-to-calendar behavior

- Default: F3 compare (scroll preserved) or Close → F8
- F3 row shows **Hold** indicator
- User may open other rows without re-holding

---

## 6. Outcome: Decline

**Trigger:** Decline + reason + Confirm decline (F5/F6 primary path)

### 6.1 Confirmation treatment

| Property | Value |
|----------|-------|
| Icon | ✕ red outline (not filled destructive) |
| Title | `Declined` |
| Subtitle | `Towson University · Capacity` |
| Modal | Blocking 720px |

### 6.2 Consequence summary

| Line | Copy |
|------|------|
| Lead | `3 slots released from this request.` |
| Detail | `No change to approved placements on Wed Oct 15.` |

### 6.3 Impact communication

**Title:** `What changed for others`

| Row | Effect |
|-----|--------|
| Duke (2) | `Headroom improved` |
| Johns Hopkins (1) | `Still recommended first` |
| Villanova (2) | `No change` |

*Inverse of Detail Impact — completes strategic decline confidence.*

### 6.4 Calendar refresh behavior (F8)

| Element | Delta |
|---------|-------|
| Declined row | Removed from F3 · struck-through ghost optional 1 session |
| Cluster ratio | Decreases (e.g. 54/10 → 51/10) |
| Need-decision | `4` → `3` |
| School count | `3 sch` → `2 sch` |
| Wed Oct 15 | `9/10` unchanged |
| F8 annotation | `Towson declined · 3 slots released` |

### 6.5 Context preservation behavior

| Context | Preserved |
|---------|-----------|
| F1 scroll/zoom | Yes |
| F3 scroll | Yes — declined row collapses out |
| Remaining compare set | Renumbers |

### 6.6 Next recommended action

| Context | Primary CTA |
|---------|-------------|
| Sequence active | `Review Duke next →` |
| Default | `Return to compare →` |

### 6.7 Return-to-calendar behavior

- F3: declined row removed · animation optional
- F8: cluster card shows reduced pressure
- Declined school not in cluster pile (v0)

---

## 7. Outcome: Continue with recommended request

**Trigger:** F4 `Open Johns Hopkins →` · Object nav · Back to compare without commit  
**Surface:** **F7-Continue banner** — not blocking modal

### 7.1 Confirmation treatment

| Property | Value |
|----------|-------|
| Surface | `ContinueBanner` on F5 Detail load |
| Icon | ↪ violet |
| Title line | `Continuing review` |
| Subline | `Towson unchanged · Johns Hopkins is next` |
| Auto-dismiss | 8s |
| Modal | **None** |

| Detail deferred | Constitution |
|-----------------|--------------|
| Defer is not commit | §B banner only |

### 7.2 Consequence summary

| Copy | |
|------|--|
| Inline | `Towson remains Pending — no capacity or status change.` |
| Sequence | `Sequence requires Johns Hopkins before Towson can be approved.` |

*Shown in banner subline + optional F3 eyebrow append on back: `Towson deferred · no change`*

### 7.3 Impact communication

**Title (banner context):** `Unchanged`

| Item | State |
|------|-------|
| Towson | Pending · Decide first |
| Wed Oct 15 | `9/10 (unchanged)` |
| Cluster | `4 need decision` |

*No F7 modal Impact block — brevity for navigation outcome.*

### 7.4 Calendar refresh behavior (F8)

| Element | Delta |
|---------|-------|
| All objects | **No mutation** |
| Optional | Violet ↪ pulse on cluster 2s |
| F8 annotation | None — or `Reviewing Hopkins · Towson deferred` if banner dismissed |
| Refetch | **None** |

### 7.5 Context preservation behavior

| Context | Preserved |
|---------|-----------|
| F3 scroll | Yes if returned via Back |
| Compare set | Full — Towson still row 2 |
| Object nav position | Updated to Hopkins |
| Modal stack | Detail → Detail (F4→F5) |

### 7.6 Next recommended action

| CTA | Behavior |
|-----|----------|
| Dismiss | User already on F5 — implicit |
| (implicit) | Complete Hopkins approve path |

### 7.7 Return-to-calendar behavior

- **Back to compare** from F5 → F3 with `Towson deferred` strip
- No F7 modal interrupt
- Calendar unchanged until commit

---

## 8. Outcome comparison matrix

| Dimension | Approve | Hold | Decline | Continue |
|-----------|---------|------|---------|----------|
| **Surface** | Modal 720 | Modal 720 | Modal 720 | Banner |
| **Blocks** | Yes | Yes | Yes | No |
| **Consequence** | Capacity consumed | Status quo | Slots released | Status quo |
| **Impact title** | What changed | What stayed the same | What changed for others | Unchanged (inline) |
| **F8 ratio** | Updates ↑ | Unchanged | Updates ↓ | Unchanged |
| **F8 rail** | Risk/resolved | Blue hold | Removed/amber | ↪ pulse optional |
| **Primary CTA** | Review next | Review blocker/compare | Review next | Dismiss |
| **Request ID** | Footer mono | Footer mono | Footer mono | — |

---

## 9. F8AnnotationToast anatomy

```
F8AnnotationToast [fixed bottom-left, max-w-md, 6s auto-dismiss]
├── Approve tone label
├── Hold tone label
├── Decline tone label
└── text [fixture copy per outcome]
```

| Outcome | Annotation copy |
|---------|-----------------|
| Approve Hopkins | `Hopkins approved · Wed Oct 15 full` |
| Approve Towson | `Towson approved · Wed Oct 15 full` |
| Hold | `Towson on hold · no capacity change` |
| Decline | `Towson declined · 3 slots released` |
| Continue | *(none)* |

**Role:** Lightweight environmental confirm when full card mutation unavailable (V5).

---

## 10. ASCII wireframes

### 10.1 F7 Decline (reference)

```
┌──────────────────── Outcome 720 ────────────────────┐
│ ✕  Declined                                         │
│    Towson University · Capacity                       │
│                                                     │
│ 3 slots released from this request.                 │
│ No change to approved placements on Wed Oct 15.     │
│                                                     │
│ WHAT CHANGED FOR OTHERS                            │
│ Duke (2)              Headroom improved             │
│ Johns Hopkins (1)     Still recommended first       │
│ Villanova (2)         No change                     │
│                                                     │
│ Calendar will show 3 need decision · ratio 51/10    │
│                                                     │
│ [Review Duke next →]     [View on calendar] [Close] │
│ R-1042                                              │
└─────────────────────────────────────────────────────┘
```

### 10.2 F8 after approve (behind closed modal)

```
┌──────────────────────── F1 Month ────────────────────────────────────────┐
│ KPI · Toolbar · DateHeader (unchanged)                                    │
│   OT row: cluster card [Risk rail] [ratio updated] [highlight pulse]      │
│                                                                           │
│ ┌─────────────────────────────────────┐                                   │
│ │ Hopkins approved · Wed Oct 15 full  │  ← F8 toast 6s                    │
│ └─────────────────────────────────────┘                                   │
│                                                          [F8]             │
└───────────────────────────────────────────────────────────────────────────┘
```

### 10.3 Continue banner on F5

```
┌──────────────────────── Detail 1216 ─────────────────────────────────────┐
│ READY TO APPROVE ...                                                      │
├──────────────────────────────────────────────────────────────────────────┤
│ ↪ Continuing review · Towson unchanged · Johns Hopkins is next  [Dismiss]│
├──────────────────────────────────────────────────────────────────────────┤
│ (F5 Detail body)                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 11. Figma frame inventory

| ID | Frame |
|----|-------|
| F7-001 | Approve Hopkins | Primary |
| F7-002 | Approve Towson |
| F7-003 | Hold Towson |
| F7-004 | Decline Towson | Primary negative |
| F7-005 | Continue banner on F5 | Defer |
| F8-001 | F1 post-approve Hopkins |
| F8-002 | F1 post-hold |
| F8-003 | F1 post-decline |
| F8-004 | F1 post-continue (unchanged + pulse) |
| F8-005 | F1 + annotation toast detail |

---

## 12. Acceptance criteria

- [ ] Four outcome types structurally parallel (approve/hold/decline modal + continue banner)
- [ ] Hold status-quo line explicit
- [ ] Decline inverse impact present
- [ ] No re-decision controls in F7
- [ ] Request ID footer only — not header
- [ ] Calendar delta line on all F7 modals
- [ ] F8 preserves scroll/zoom
- [ ] F8 annotation matches F7 calendarDelta
- [ ] Continue does not trigger F7 blocking modal
- [ ] Constitution §A §15 negative path in F7 not Detail

---

## 13. Top 5 usability assumptions (F7/F8)

| # | Assumption | Code | Pass signal |
|---|------------|------|-------------|
| **1** | **F7 hold** communicates no capacity change without Detail preview | A9 | ≥5/6 state unchanged after hold |
| **2** | **F7 decline** communicates peer benefit (inverse impact) | A9 | ≥4/6 name Duke headroom improved |
| **3** | Users **do not return to Detail** asking what happened | A9 | ≥4/6 no Detail back-nav post-F7 |
| **4** | **F8 annotation + delta line** sufficient when card mutation partial (V5) | A10 | ≥4/6 F8 matches F7 without explanation |
| **5** | **Continue banner** sufficient for defer — no F7 modal required | P2 | ≥5/6 know Towson still pending |

---

## 14. Top 5 failure modes (F7/F8)

| # | Mode | Observable |
|---|------|------------|
| **1** | **F7 skipped mentally** — users close immediately to hunt calendar | Zero recall of impact block |
| **2** | **F8 unchanged** — users say "nothing happened" (V5) | Trust break despite F7 |
| **3** | **Hold misread as resolve** — blue rail looks "done" | Need-decision confusion |
| **4** | **Decline benefit missed** — users skip "What changed for others" | Strategic decline undervalued |
| **5** | **Next CTA ignored** — users lost after Close | Re-open wrong cluster |

---

## 15. Top 5 trust risks (F7/F8)

| # | Risk | Trigger |
|---|------|---------|
| **1** | F7 copy contradicts Detail Impact | Post-approve labels differ from pre-approve |
| **2** | F8 ratio doesn't match F7 calendarDelta | Annotation says 51/10 · card shows 54/10 |
| **3** | Hold "no change" disbelieved without visual | Rail changes but ratio same — looks inconsistent |
| **4** | Approve-only celebration tone on F7-Approve | Users think hold/decline are errors |
| **5** | Continue banner dismissed unread | Defer mistaken for abandon |

---

## 16. Top 5 outcome-confidence risks (F7/F8)

| # | Risk | Outcome affected |
|---|------|------------------|
| **1** | User cannot defend **hold** to partner | Hold |
| **2** | User cannot explain **who benefited** from decline | Decline |
| **3** | User unsure **Wed Oct 15** state after approve | Approve |
| **4** | User loses **compare context** after Close | All |
| **5** | User thinks **defer = commit** | Continue |

---

## 17. Does F7/F8 complete the Decision Workspace model?

### 17.1 Validation matrix

| Outcome | Detail sufficient alone? | F7/F8 completes? | Confident without Detail add? |
|---------|-------------------------|----------------|------------------------------|
| **Approve** | Yes (consequence + impact + ack) | F7 confirms + F8 proves | **Yes** |
| **Hold** | No — action only in Detail | F7 status-quo + F8 rail | **Yes** if F7 hold copy read |
| **Decline** | No — action only in Detail | F7 inverse impact + F8 removal | **Yes** if F7 decline read |
| **Defer** | Partial (F4 navigation) | Banner + unchanged F8 | **Yes** if banner + F3 strip |

### 17.2 Answer

**Yes — F7/F8 successfully complete the Decision Workspace model** for Round 1 validation, subject to:

1. **F7 modals** carry parallel anatomy for approve / hold / decline  
2. **Continue** uses banner — not weak second-class defer  
3. **F8** provides at minimum **annotation + preserved context**; full card mutation is target state (V5)

Users can confidently **approve, hold, decline, and defer** without additional decision information inside Detail **when:**

- Approve: Detail ack + F7 confirm (redundant closure acceptable)  
- Hold: F7 explicit status-quo lines  
- Decline: F7 inverse impact block  
- Defer: Continue banner + F3 deferred strip + unchanged F8  

### 17.3 If validation fails — minimum missing information

| Gap (if A9/A10 fail) | Minimum addition | Where it belongs | **Not** Detail |
|----------------------|------------------|------------------|----------------|
| Hold still confuses capacity | One line: `No change to Wed Oct 15 (9/10)` in F7 | **F7 Hold** — already spec'd | Do not add hold preview to Detail |
| Decline peer benefit missed | Bold first row: `Duke — Headroom improved` | **F7 Decline** impact | Do not add decline Impact to Detail |
| F8 distrusted | Cluster highlight + ratio delta on card | **F8** visual | Do not add post-commit to Detail |
| Defer unclear | F3 eyebrow `Towson deferred · no change` on back | **F3 strip** | Do not add inaction SLA to Detail |
| Approve-only product perception | Hold/Decline modal parity in facilitator script | **Research** | Not UI architecture change |

**Constitution constraint:** Negative-path consequence stays in **F7/F8** until S5 evidence says otherwise (Evidence Review Framework §Amendment path).

### 17.4 Decision Workspace vs Approval Workspace — final check

| Question | F1 | F3 | Detail | F7/F8 |
|----------|----|----|--------|-------|
| Where is pressure? | ✓ | | | F8 refresh |
| Who competes / who first? | partial | ✓ | | |
| Can I approve? Why? What if approve? | | | ✓ | F7 confirm |
| What if hold / decline / defer? | | | action only | **✓ F7/F8** |
| Did it land? | | | | **✓ F8** |

**Verdict:** End-to-end **Decision Workspace** — not Approval Workspace — **if F7/F8 built to this spec**.

---

## 18. End-to-end closure diagram

```
Detail commit
    ├─ Approve ──► F7 Approve modal ──► F8 mutate + toast ──► [Next] or F1
    ├─ Hold ─────► F7 Hold modal ────► F8 rail only ────────► F3 or F1
    ├─ Decline ──► F7 Decline modal ──► F8 remove + ratio ──► F3 or F1
    └─ Defer ────► Continue banner ──► F8 unchanged ────────► F5/F3
```

---

## 19. Prototype alignment (V5)

| Wireframe target | Prototype v0 | Risk |
|------------------|--------------|------|
| F8 card mutation | Annotation + frame badge | A10 |
| F8 ratio delta | Static card | Log in session |
| F3 declined row removal | Filter on reopen | Partial |
| Hold rail on card | State map only in F3 filter | F8 visual gap |

**Wireframe is target for full assembly** — prototype may ship V5 gaps for Round 1 with facilitator script citing F7 as source of truth.

---

*End of F7/F8 Outcome + Refresh mid-fi spec · Full 8-frame wireframe set complete*
